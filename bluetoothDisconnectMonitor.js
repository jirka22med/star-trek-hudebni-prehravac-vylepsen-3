/**
 * 🖖 AUDIO CONNECTION MONITOR - OPTIMIZED + FULL LOGGING + USB DONGLE DETECTION
 * ===========================
 * Autor: Admirál Claude.AI & Admirál Jarda pro více admirála Jiříka
 * Účel: Detekce PŘIPOJENÍ i ODPOJENÍ (Bluetooth, USB Dongle 2.4GHz, Jack)
 * Verze: 1.1 (DebugManager Integration)
 * Aktualizace: Plná integrace s centrálním diagnostickým panelem
 */

// =========================================================================
// 🔒 IIFE - IZOLACE CELÉHO MODULU (žádné konflikty s jinými skripty)
// =========================================================================
(function() {
    'use strict';
    
    // =========================================================================
    // 🎛️ LOGOVÁNÍ - NYNÍ ŘÍZENO PŘES DebugManager
    // =========================================================================
    
    // Pomocné funkce pro logování (používají se místo console.log)
    function debugLog(...args) {
        // Pokud existuje DebugManager, použij ho
        if (window.DebugManager) {
            window.DebugManager.log('bluetooth', ...args);
        } 
        // Fallback (pokud by DebugManager nebyl načten - jen pro vývoj)
        // else { console.log('[AudioMonitor-Fallback]', ...args); }
    }

    function debugWarn(...args) {
        // Varování chceme vidět i v DebugManageru, ale raději i v konzoli jako varování
        if (window.DebugManager && window.DebugManager.isEnabled('bluetooth')) {
            console.warn('[AudioMonitor]', ...args);
        }
    }

    function debugError(...args) {
        // Chyby vypisujeme VŽDY (bez ohledu na DebugManager), je to kritické
        console.error('[AudioMonitor]', ...args);
    }

    // =========================================================================

    class AudioMonitor {
        constructor() {
            debugLog('🚀 [AudioMonitor] Inicializace třídy...');
            this.audioDevices = new Map();
            this.bluetoothDevices = new Set();
            this.dongleDevices = new Set();  // 📡 NOVÁ KATEGORIE: USB DONGLE 2.4GHz
            this.jackDevices = new Set();
            this.isMonitoring = false;
            this.checkInterval = null;
            
            // --- NOVÁ KONFIGURACE INTERVALŮ (Úspora energie) ---
            this.INTERVALS = {
                ACTIVE: 2000,      // Okno je aktivní + hraje hudba (Vysoká priorita)
                BACKGROUND: 5000,  // Okno je na pozadí (Šetří baterii)
                IDLE: 10000        // Hudba nehraje (Není důvod skenovat agresivně)
            };
            
            debugLog('⚙️ [AudioMonitor] Nastavené intervaly:', this.INTERVALS);
            
            if (document.readyState === 'loading') {
                debugLog('⏳ [AudioMonitor] Čekám na DOMContentLoaded...');
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                debugLog('✅ [AudioMonitor] DOM již načten, spouštím initialize()');
                this.initialize();
            }
        }

        async initialize() {
            debugLog('🔧 [AudioMonitor] initialize() spuštěna');
            
            if (!this.checkBrowserSupport()) {
                debugError('❌ [AudioMonitor] Prohlížeč nepodporuje Media Devices API!');
                return;
            }
            
            debugLog('✅ [AudioMonitor] Prohlížeč podporuje Media Devices API');
            
            await this.scanAudioDevices(true); // První scan
            debugLog('📡 [AudioMonitor] První scan zařízení dokončen');
            
            this.startMonitoring();            // Spuštění s novou logikou
            debugLog('🎯 [AudioMonitor] Monitoring spuštěn');
            
            this.setupEventListeners();
            debugLog('🎧 [AudioMonitor] Event listenery nastaveny');
        }

        checkBrowserSupport() {
            const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
            debugLog('🔍 [AudioMonitor] Kontrola podpory prohlížeče:', isSupported ? '✅ Podporováno' : '❌ Nepodporováno');
            return isSupported;
        }

        async scanAudioDevices(isFirstRun = false) {
            debugLog(`🔎 [AudioMonitor] scanAudioDevices() - První běh: ${isFirstRun}`);
            
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                debugLog(`📋 [AudioMonitor] Nalezeno ${devices.length} celkových zařízení`);
                
                const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
                debugLog(`🎵 [AudioMonitor] Nalezeno ${audioOutputs.length} audio výstupů`);
                
                const newDevices = new Map();
                const newBluetoothDevices = new Set();
                const newDongleDevices = new Set();  // 📡 USB DONGLE
                const newJackDevices = new Set();
                
                audioOutputs.forEach(device => {
                    const isDongle = this.isDongleDevice(device);
                    const isBluetooth = !isDongle && this.isBluetoothDevice(device);
                    const isJack = !isDongle && !isBluetooth && this.isJackDevice(device);
                    
                    const deviceInfo = {
                        id: device.deviceId,
                        label: device.label || 'Neznámé zařízení',
                        kind: device.kind,
                        isBluetooth: isBluetooth,
                        isDongle: isDongle,      // 📡 NOVÉ
                        isJack: isJack
                    };
                    
                    debugLog(`  ├─ 🎧 [Device] ${deviceInfo.label}`);
                    debugLog(`  │   ├─ ID: ${deviceInfo.id.substring(0, 20)}...`);
                    debugLog(`  │   ├─ Bluetooth: ${deviceInfo.isBluetooth ? '✅' : '❌'}`);
                    debugLog(`  │   ├─ USB Dongle 2.4GHz: ${deviceInfo.isDongle ? '✅' : '❌'}`);
                    debugLog(`  │   └─ Jack: ${deviceInfo.isJack ? '✅' : '❌'}`);
                    
                    newDevices.set(device.deviceId, deviceInfo);
                    
                    if (deviceInfo.isBluetooth) newBluetoothDevices.add(device.deviceId);
                    if (deviceInfo.isDongle) newDongleDevices.add(device.deviceId);
                    if (deviceInfo.isJack) newJackDevices.add(device.deviceId);
                });

                debugLog(`📊 [AudioMonitor] Souhrn: BT=${newBluetoothDevices.size}, Dongle=${newDongleDevices.size}, Jack=${newJackDevices.size}`);

                if (!isFirstRun && this.isMonitoring) {
                    debugLog('🔄 [AudioMonitor] Kontrolujem změny v zařízeních...');
                    this.detectDisconnectedDevices(newBluetoothDevices, newDongleDevices, newJackDevices);
                    this.detectNewDevices(newDevices, newBluetoothDevices, newDongleDevices, newJackDevices);
                }

                this.audioDevices = newDevices;
                this.bluetoothDevices = newBluetoothDevices;
                this.dongleDevices = newDongleDevices;  // 📡 Uložení
                this.jackDevices = newJackDevices;
                
                debugLog('✅ [AudioMonitor] scanAudioDevices() dokončen');
                
            } catch (error) {
                debugError('❌ [AudioMonitor] Chyba při skenování zařízení:', error);
            }
        }

        /**
         * 📡 NOVÁ DETEKCE: USB DONGLE 2.4GHz (JBL Quantum a další herní headsety)
         * PRIORITA #1 - kontroluje se PRVNÍ
         */
        isDongleDevice(device) {
            const label = (device.label || '').toLowerCase();
            
            // Specifické klíčové slova pro USB Dongle / 2.4GHz bezdrátové headsety
            const dongleKeywords = [
                'quantum',          // JBL Quantum 350/400/800
                'dongle',           // Obecný dongle
                'usb audio',        // USB audio zařízení (často dongle)
                '2.4ghz',           // Přímý odkaz na 2.4GHz
                'wireless usb',     // Bezdrátové USB
                'hyperx cloud',     // HyperX Cloud Flight/Alpha Wireless
                'steelseries arctis', // SteelSeries Arctis 7/9/Pro Wireless
                'corsair void',     // Corsair Void RGB/Pro Wireless
                'logitech g',       // Logitech G533/G733/G935
                'razer',            // Razer Kraken/Nari Ultimate
                'roccat',           // Roccat Elo 7.1 Air
                'astro',            // Astro A50/A20
                'turtle beach'      // Turtle Beach Stealth
            ];
            
            const isDongle = dongleKeywords.some(keyword => label.includes(keyword));
            
            if (isDongle) {
                debugLog(`  └─ 📡 [Detection] "${device.label}" = USB DONGLE 2.4GHz`);
            }
            
            return isDongle;
        }

        /**
         * Detekce klasického Bluetooth
         * KONTROLUJE SE AŽ PO DONGLE (aby Dongle měl přednost)
         */
        isBluetoothDevice(device) {
            const label = (device.label || '').toLowerCase();
            
            const bluetoothKeywords = [
                'bluetooth', 'bt', 'airpods', 'buds', 'headset', 
                'sony', 'bose', 'beats', 'galaxy', 'xiaomi', 'jabra', 'sennheiser'
            ];
            
            const isBT = bluetoothKeywords.some(keyword => label.includes(keyword));
            
            if (isBT) {
                debugLog(`  └─ 📶 [Detection] "${device.label}" = Bluetooth`);
            }
            return isBT;
        }

        /**
         * Detekce Jack / Analog
         * KONTROLUJE SE JAKO POSLEDNÍ (default fallback)
         */
        isJackDevice(device) {
            const label = (device.label || '').toLowerCase();
            
            const jackKeywords = [
                'headphones', 'headphone', 'earphones', 'earbuds', 'speakers', 'speaker', 
                'lineout', 'analog', 'wired', 'built-in', 'internal', 'realtek', 
                'conexant', 'creative', '3.5mm', 'jack', 'aux', 'high definition audio'
            ];
            
            const isJack = label.includes('default') || label.includes('built-in') || 
                           jackKeywords.some(keyword => label.includes(keyword));
            
            if (isJack) {
                debugLog(`  └─ 🔌 [Detection] "${device.label}" = Jack/Analog`);
            }
            return isJack;
        }

        detectDisconnectedDevices(currentBluetooth, currentDongle, currentJack) {
            debugLog('🔍 [AudioMonitor] detectDisconnectedDevices() - Hledám odpojená zařízení...');
            
            const disconnectedBluetooth = [...this.bluetoothDevices].filter(id => !currentBluetooth.has(id));
            const disconnectedDongle = [...this.dongleDevices].filter(id => !currentDongle.has(id));
            const disconnectedJack = [...this.jackDevices].filter(id => !currentJack.has(id));

            debugLog(`  ├─ Odpojeno BT: ${disconnectedBluetooth.length}`);
            debugLog(`  ├─ Odpojeno Dongle: ${disconnectedDongle.length}`);
            debugLog(`  └─ Odpojeno Jack: ${disconnectedJack.length}`);

            if (disconnectedBluetooth.length > 0 || disconnectedDongle.length > 0 || disconnectedJack.length > 0) {
                debugWarn('⚠️ [AudioMonitor] Detekováno odpojení zařízení!');
                this.handleAudioDisconnection(disconnectedBluetooth, disconnectedDongle, disconnectedJack);
            } else {
                debugLog('✅ [AudioMonitor] Žádné odpojené zařízení');
            }
        }

        detectNewDevices(newDevicesMap, newBluetooth, newDongle, newJack) {
            debugLog('🔍 [AudioMonitor] detectNewDevices() - Hledám nová zařízení...');
            
            const connectedBluetoothIds = [...newBluetooth].filter(id => !this.bluetoothDevices.has(id));
            const connectedDongleIds = [...newDongle].filter(id => !this.dongleDevices.has(id));
            const connectedJackIds = [...newJack].filter(id => !this.jackDevices.has(id));

            debugLog(`  ├─ Nové BT: ${connectedBluetoothIds.length}`);
            debugLog(`  ├─ Nové Dongle: ${connectedDongleIds.length}`);
            debugLog(`  └─ Nové Jack: ${connectedJackIds.length}`);

            if (connectedBluetoothIds.length > 0 || connectedDongleIds.length > 0 || connectedJackIds.length > 0) {
                debugLog('🟢 [AudioMonitor] Detekováno nové zařízení!');
                
                const btNames = connectedBluetoothIds.map(id => newDevicesMap.get(id)?.label || 'Bluetooth zařízení');
                const dongleNames = connectedDongleIds.map(id => newDevicesMap.get(id)?.label || 'USB Dongle 2.4GHz');
                const jackNames = connectedJackIds.map(id => newDevicesMap.get(id)?.label || 'Kabelové zařízení');

                debugLog('  ├─ BT názvy:', btNames);
                debugLog('  ├─ Dongle názvy:', dongleNames);
                debugLog('  └─ Jack názvy:', jackNames);

                this.handleAudioConnection(btNames, dongleNames, jackNames);
            } else {
                debugLog('✅ [AudioMonitor] Žádné nové zařízení');
            }
        }

        handleAudioDisconnection(disconnectedBluetooth, disconnectedDongle, disconnectedJack) {
            debugLog('🔴 [AudioMonitor] handleAudioDisconnection() - Zpracovávám odpojení...');
            
            const names = [
                ...disconnectedBluetooth.map(id => this.audioDevices.get(id)?.label || 'Bluetooth Headset'),
                ...disconnectedDongle.map(id => this.audioDevices.get(id)?.label || 'USB Dongle 2.4GHz'),
                ...disconnectedJack.map(id => this.audioDevices.get(id)?.label || 'Jack')
            ];

            debugLog('  └─ Odpojená zařízení:', names);

            this.stopAudioPlayback();
            this.showCustomNotification(`🔴 Odpojeno: ${names.join(', ')}`, 'warning');
        }

        handleAudioConnection(btNames, dongleNames, jackNames) {
            debugLog('🟢 [AudioMonitor] handleAudioConnection() - Zpracovávám připojení...');
            
            const names = [...btNames, ...dongleNames, ...jackNames];
            const message = `🟢 Připojeno: ${names.join(', ')}`;
            
            debugLog('  └─ Připojená zařízení:', names);
            
            this.showCustomNotification(message, 'success');
            
            document.dispatchEvent(new CustomEvent('audioConnected', {
                detail: { names: names, timestamp: Date.now() }
            }));
            
            debugLog('📡 [AudioMonitor] Event "audioConnected" vyslán');
        }

        stopAudioPlayback() {
            debugLog('⏸️ [AudioMonitor] stopAudioPlayback() - Zastavuji přehrávání...');
            
            try {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer && !audioPlayer.paused) {
                    audioPlayer.pause();
                    debugLog('  └─ ✅ Audio player pozastaven');
                } else {
                    debugLog('  └─ ℹ️ Audio player již byl pozastaven nebo neexistuje');
                }

                const playBtn = document.getElementById('play-button');
                const pauseBtn = document.getElementById('pause-button');
                if (playBtn) playBtn.classList.remove('active');
                if (pauseBtn) pauseBtn.classList.add('active');
                debugLog('  └─ ✅ Tlačítka přehrávače aktualizována');

                document.dispatchEvent(new CustomEvent('audioDisconnected', {
                    detail: { reason: 'Device removed', timestamp: Date.now() }
                }));
                
                debugLog('📡 [AudioMonitor] Event "audioDisconnected" vyslán');
            } catch (e) {
                debugError('❌ [AudioMonitor] Chyba při zastavování přehrávání:', e);
            }
        }

        // Původní notifikace - ZACHOVÁNO
        showCustomNotification(message, type = 'warning') {
            debugLog(`💬 [AudioMonitor] Zobrazuji notifikaci: "${message}" (typ: ${type})`);
            
            let notification = document.getElementById('audio-monitor-notification');
            const bgColor = type === 'success' ? '#2ecc71' : '#ff6b35';

            if (!notification) {
                debugLog('  └─ ℹ️ Vytvářím nový element notifikace');
                notification = document.createElement('div');
                notification.id = 'audio-monitor-notification';
                notification.style.cssText = `
                    position: fixed; top: 20px; right: 20px;
                    color: white; padding: 12px 20px; border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000;
                    font-family: 'Orbitron', monospace; font-size: 14px;
                    max-width: 350px; opacity: 0; transform: translateX(100%);
                    transition: all 0.3s ease;
                `;
                document.body.appendChild(notification);
            }

            notification.style.background = bgColor;
            notification.textContent = message;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 10);

            if (this.hideTimeout) clearTimeout(this.hideTimeout);
            this.hideTimeout = setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => { notification.style.display = 'none'; }, 300);
            }, 4000);
            
            debugLog('  └─ ✅ Notifikace zobrazena');
        }

        // --- NOVÁ LOGIKA PRO ÚSPORU ENERGIE (start/stop/update) ---

        startMonitoring() {
            debugLog('▶️ [AudioMonitor] startMonitoring()');
            
            if (this.isMonitoring) {
                debugLog('  └─ ⚠️ Monitoring již běží');
                return;
            }
            
            this.isMonitoring = true;
            debugLog('  └─ ✅ Monitoring AKTIVOVÁN');
            
            this.updateInterval(); // Spustí chytrý interval
        }

        stopMonitoring() {
            debugLog('⏹️ [AudioMonitor] stopMonitoring()');
            
            if (!this.isMonitoring) {
                debugLog('  └─ ⚠️ Monitoring již byl zastaven');
                return;
            }
            
            this.isMonitoring = false;
            if (this.checkInterval) clearInterval(this.checkInterval);
            
            debugLog('  └─ ✅ Monitoring DEAKTIVOVÁN');
        }

        // Funkce pro dynamickou změnu rychlosti skenování
        updateInterval() {
            debugLog('🔄 [AudioMonitor] updateInterval() - Aktualizuji interval skenování...');
            
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                debugLog('  ├─ ⏹️ Starý interval vymazán');
            }
            
            if (!this.isMonitoring) {
                debugLog('  └─ ⚠️ Monitoring není aktivní, interval nebude nastaven');
                return;
            }
            
            let intervalTime = this.INTERVALS.ACTIVE; // Default 2000ms
            let intervalName = 'ACTIVE';
            
            // 1. Pokud je stránka skrytá (jiný tab/minimalizováno) -> 5000ms
            if (document.hidden) {
                intervalTime = this.INTERVALS.BACKGROUND;
                intervalName = 'BACKGROUND';
            }
            // 2. Pokud je stránka vidět, ale nic NEHRAJE -> 10000ms (Největší úspora)
            else {
                const player = document.getElementById('audioPlayer');
                if (player && player.paused) {
                    intervalTime = this.INTERVALS.IDLE;
                    intervalName = 'IDLE';
                }
            }

            debugLog(`  ├─ 📊 Zvolený režim: ${intervalName} (${intervalTime}ms)`);
            
            this.checkInterval = setInterval(() => this.scanAudioDevices(), intervalTime);
            
            debugLog('  └─ ✅ Nový interval nastaven');
        }

        setupEventListeners() {
            debugLog('🎧 [AudioMonitor] setupEventListeners() - Nastavuji event listenery...');
            
            // Okamžitá reakce na systémovou změnu (připojení/odpojení HW)
            if (navigator.mediaDevices.addEventListener) {
                navigator.mediaDevices.addEventListener('devicechange', () => {
                    debugLog('🔔 [Event] devicechange - Detekována změna v zařízeních');
                    this.scanAudioDevices(); // Okamžitý scan
                });
                debugLog('  ├─ ✅ Listener "devicechange" nastaven');
            }
            
            // Změna intervalu při přepnutí tabu (šetří baterii)
            document.addEventListener('visibilitychange', () => {
                debugLog(`🔔 [Event] visibilitychange - Viditelnost: ${document.hidden ? 'Skryto' : 'Viditelné'}`);
                this.updateInterval();
            });
            debugLog('  ├─ ✅ Listener "visibilitychange" nastaven');
            
            // Změna intervalu podle stavu přehrávače (Player events)
            const player = document.getElementById('audioPlayer');
            if (player) {
                player.addEventListener('play', () => {
                    debugLog('🔔 [Event] Audio player - PLAY');
                    this.updateInterval();
                });
                
                player.addEventListener('pause', () => {
                    debugLog('🔔 [Event] Audio player - PAUSE');
                    this.updateInterval();
                });
                
                debugLog('  ├─ ✅ Listenery na audio player nastaveny');
            } else {
                debugWarn('  ├─ ⚠️ Audio player nenalezen (#audioPlayer)');
            }
            
            window.addEventListener('beforeunload', () => {
                debugLog('🔔 [Event] beforeunload - Vypínám monitoring');
                this.stopMonitoring();
            });
            debugLog('  ├─ ✅ Listener "beforeunload" nastaven');
            
            debugLog('  └─ ✅ Všechny event listenery nastaveny');
        }
    }

    // =========================================================================
    // 🎧 OVLÁDÁNÍ TLAČÍTKA BLUETOOTH MONITORU (Logic Add-on)
    // =========================================================================
    function setupBluetoothMonitorButton() {
        debugLog('🎛️ [Button Setup] setupBluetoothMonitorButton() spuštěna');
        
        // Počkáme chvilku, než se načte DOM a instance monitoru
        setTimeout(() => {
            debugLog('  ├─ ⏳ Hledám tlačítko a instanci monitoru...');
            
            const monitorBtn = document.getElementById('bluetooth-monitor-toggle');
            // Musíme zajistit, že pracujeme s globální proměnnou definovanou níže
            const monitor = window.audioMonitor; 

            if (monitorBtn && monitor) {
                debugLog('  ├─ ✅ Tlačítko nalezeno:', monitorBtn);
                debugLog('  ├─ ✅ Instance monitoru nalezena');
                
                // 1. Nastavení výchozího vzhledu + INLINE STYLY (zelená/červená)
                if (monitor.isMonitoring) {
                    monitorBtn.classList.add('active');
                    monitorBtn.style.backgroundColor = '#2ecc71'; // Zelená = AKTIVNÍ
                    monitorBtn.style.color = 'white';
                    monitorBtn.style.border = '2px solid #27ae60';
                    debugLog('  ├─ 🟢 Tlačítko nastaveno jako AKTIVNÍ (zelená)');
                } else {
                    monitorBtn.classList.remove('active');
                    monitorBtn.style.backgroundColor = '#e74c3c'; // Červená = VYPNUTO
                    monitorBtn.style.color = 'white';
                    monitorBtn.style.border = '2px solid #c0392b';
                    debugLog('  ├─ 🔴 Tlačítko nastaveno jako NEAKTIVNÍ (červená)');
                }

                // 2. Click Event
                monitorBtn.addEventListener('click', (e) => {
                    debugLog('🖱️ [Button] Kliknuto na tlačítko monitoru');
                    e.preventDefault();
                    e.stopPropagation();

                    if (monitor.isMonitoring) {
                        // VYPNOUT
                        debugLog('  ├─ 🔴 Vypínám monitor...');
                        monitor.stopMonitoring();
                        monitorBtn.classList.remove('active');
                        monitorBtn.style.backgroundColor = '#e74c3c'; // Červená
                        monitorBtn.style.border = '2px solid #c0392b';
                        
                        if (monitor.showCustomNotification) {
                            monitor.showCustomNotification("🎧 Monitor: DEAKTIVOVÁN", 'warning');
                        } else if (window.showNotification) {
                            window.showNotification("🎧 Monitor: DEAKTIVOVÁN", 'info');
                        }
                        debugLog('  └─ ✅ Monitor vypnut');
                    } else {
                        // ZAPNOUT
                        debugLog('  ├─ 🟢 Zapínám monitor...');
                        monitor.startMonitoring();
                        monitorBtn.classList.add('active');
                        monitorBtn.style.backgroundColor = '#2ecc71'; // Zelená
                        monitorBtn.style.border = '2px solid #27ae60';
                        
                        if (monitor.showCustomNotification) {
                            monitor.showCustomNotification("🎧 Monitor: AKTIVOVÁN", 'success');
                        } else if (window.showNotification) {
                            window.showNotification("🎧 Monitor: AKTIVOVÁN", 'success');
                        }
                        debugLog('  └─ ✅ Monitor zapnut');
                    }
                });
                
                debugLog('  └─ ✅ Tlačítko Bluetooth Monitoru připojeno.');
            } else {
                if (!monitorBtn) debugError('  └─ ❌ Tlačítko #bluetooth-monitor-toggle nenalezeno!');
                if (!monitor) debugError('  └─ ❌ Instance audioMonitor nenalezena!');
            }
        }, 1500); // Bezpečné zpoždění
    }

    // Spuštění logiky tlačítka po načtení
    if (document.readyState === 'loading') {
        debugLog('⏳ [Init] Čekám na DOMContentLoaded pro setup tlačítka');
        document.addEventListener('DOMContentLoaded', setupBluetoothMonitorButton);
    } else {
        debugLog('✅ [Init] DOM již načten, spouštím setup tlačítka');
        setupBluetoothMonitorButton();
    }

    // Inicializace monitoru a export do window
    let audioMonitor = null;
    document.addEventListener('DOMContentLoaded', () => {
        debugLog('🚀 [Init] DOMContentLoaded - Vytvářím instanci AudioMonitor');
        audioMonitor = new AudioMonitor();
        window.audioMonitor = audioMonitor; // Globální přístup
        debugLog('✅ Audio Monitor (JBL Quantum Edice + USB Dongle + Úspora + Full Logging + IIFE) - Aktivní');
    });

    // Export pro Node.js (pokud je potřeba)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AudioMonitor;
    }

})(); // KONEC IIFE - Vše je izolované