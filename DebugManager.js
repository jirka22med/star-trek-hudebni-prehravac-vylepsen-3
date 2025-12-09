/**
 * 🖖 CENTRÁLNÍ DEBUG KONZOLE V4.0 - STAR TREK LCARS
 * Autor: Admirál Claude.AI pro více admirála Jiříka
 * Verze: 4.0 (Robustní - přímé Firebase API)
 * Popis: Funguje i když window.db neexistuje!
 */

(function() {
    'use strict';

    // --- Konfigurace modulů ---
    const MODULES_CONFIG = {
        'main': { name: 'Jádro (script.js)', default: false, color: '#FF9900' },
        'firebase': { name: 'Cloud Firestore', default: false, color: '#FFCC00' },
        'sync': { name: 'Synchronizace', default: false, color: '#CC9900' },
        'autofade': { name: 'Auto-Fade Modul', default: false, color: '#00CCFF' },
        'preloader': { name: 'Přednačítání', default: true, color: '#0099FF' },
        'playlist': { name: 'Načítání Playlistu', default: false, color: '#0066FF' },
        'buttons': { name: 'Viditelnost Tlačítek', default: false, color: '#CC33FF' },
        'notifications': { name: 'Notifikace Fix', default: false, color: '#FF33CC' },
        'interface': { name: 'Správa Rozhraní', default: false, color: '#FF66CC' },
        'search': { name: 'Vyhledávač', default: false, color: '#FF99CC' },
        'miniplayer': { name: 'Mini Player', default: false, color: '#9933CC' },
        'bookmarks': { name: 'Záložky', default: false, color: '#CC66FF' },
        'voice': { name: 'Hlasové Ovládání', default: false, color: '#33FF33' },
        'bluetooth': { name: 'Bluetooth Monitor', default: false, color: '#33CC33' },
        'wake': { name: 'Wake Lock (Spánek)', default: false, color: '#339933' },
        'playlistManager': { name: 'Správce Playlistu', default: false, color: '#66FF66' },
        'playlistSettings': { name: 'Nastavení Playlistu', default: false, color: '#99FF99' }
    };

    // --- Stavová paměť ---
    let debugState = {};
    let isOverlayVisible = false;
    let cloudSaveTimeout = null;
    let firestoreDB = null;
    let isCloudReady = false;
    let isInitialized = false;

    // --- INICIALIZACE (ROBUSTNÍ PŘÍSTUP) ---
    async function initialize() {
        console.log("%c🖖 DebugManager V4.0: Startuji...", "color: #FF9900; font-size: 14px; font-weight: bold");
        
        // Nejdřív načteme výchozí hodnoty
        resetToDefaults();
        isInitialized = true; // UI je hned funkční
        
        // Pak zkusíme připojit cloud (na pozadí)
        await attemptCloudConnection();
        
        console.log("%c🖖 DebugManager V4.0 připraven! ✅", "color: #00FF00; font-weight: bold; font-size: 14px");
        console.log("%c   Klávesa: Ctrl+Shift+D | Tlačítko: #debug-manager-button", "color: #FFCC00; font-size: 12px");
    }

    // --- POKUS O PŘIPOJENÍ K CLOUDU ---
    async function attemptCloudConnection() {
        console.log("%c🖖 Firebase: Pokus o připojení...", "color: #00CCFF");
        
        let attempts = 0;
        const maxAttempts = 30; // 30 sekund max
        
        while (attempts < maxAttempts) {
            // Kontrola 1: Je Firebase inicializován?
            if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
                if (attempts === 0) {
                    console.log("%c🖖 Firebase: Čekám na inicializaci Firebase SDK...", "color: #FFCC00");
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                continue;
            }
            
            // Kontrola 2: Zkusíme získat Firestore instanci
            try {
                if (!firestoreDB) {
                    firestoreDB = firebase.firestore();
                    console.log("%c🖖 Firebase: ✅ Firestore instance vytvořena!", "color: #00FF00");
                }
                
                // Kontrola 3: Test připojení - zkusíme načíst dokument
                console.log("%c🖖 Firebase: Testuji připojení k Firestore...", "color: #00CCFF");
                const testDoc = await firestoreDB.collection('audioPlayerSettings').doc('debugConfig').get();
                
                console.log("%c🖖 Firebase: ✅ Připojení úspěšné!", "color: #00FF00");
                isCloudReady = true;
                updateConnectionStatus(true, "Online");
                
                // Načteme konfiguraci z cloudu
                await loadFromCloud();
                
                return true;
                
            } catch (error) {
                console.warn("%c🖖 Firebase: Chyba při testování:", "color: #FF6600", error.message);
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
        }
        
        // Timeout - cloud není dostupný
        console.warn("%c🖖 Firebase: ⚠️ Cloud nedostupný po " + attempts + "s - pracuji offline", "color: #FF6600");
        updateConnectionStatus(false, "Offline");
        return false;
    }

    // --- NAČTENÍ Z CLOUDU ---
    async function loadFromCloud() {
        if (!firestoreDB) {
            console.warn("%c🖖 Cloud: Firestore nedostupný, přeskakuji načítání", "color: #FF6600");
            return;
        }
        
        try {
            console.log("%c🖖 Cloud: 📥 Načítám konfiguraci...", "color: #00CCFF");
            
            const doc = await firestoreDB.collection('audioPlayerSettings').doc('debugConfig').get();
            
            if (doc.exists) {
                const cloudData = doc.data();
                console.log("%c🖖 Cloud: ✅ Konfigurace načtena", "color: #00FF00", cloudData);
                applyConfig(cloudData);
                // Po načtení z cloudu aktualizujeme checkboxy (pokud je UI otevřené)
                updateCheckboxes();
            } else {
                console.log("%c🖖 Cloud: ℹ️ Dokument neexistuje, vytvářím nový", "color: #FFCC00");
                await saveToCloud(true);
            }
        } catch (error) {
            console.error("%c🖖 Cloud: ❌ Chyba načítání:", "color: #FF0000", error);
            updateConnectionStatus(false, "Chyba čtení");
        }
    }

    // --- ULOŽENÍ DO CLOUDU ---
    async function saveToCloud(immediate = false) {
        if (!isCloudReady || !firestoreDB) {
            console.log("%c🖖 Cloud: Offline, ukládání přeskočeno", "color: #999");
            return;
        }

        if (!immediate) {
            if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
            cloudSaveTimeout = setTimeout(() => performCloudSave(), 2000);
        } else {
            await performCloudSave();
        }
    }

    async function performCloudSave() {
        try {
            console.log("%c🖖 Cloud: 📤 Ukládám...", "color: #00CCFF");
            
            await firestoreDB.collection('audioPlayerSettings').doc('debugConfig').set(debugState, { merge: true });
            
            console.log("%c🖖 Cloud: ✅ Uloženo", "color: #00FF00");
            log('firebase', '☁️ Konfigurace uložena do cloudu');
            updateConnectionStatus(true, "Uloženo");
            
            setTimeout(() => {
                if (isCloudReady) updateConnectionStatus(true, "Online");
            }, 2000);
        } catch (error) {
            console.error("%c🖖 Cloud: ❌ Chyba ukládání:", "color: #FF0000", error);
            updateConnectionStatus(false, "Chyba zápisu");
        }
    }

    // --- POMOCNÉ FUNKCE ---
    function applyConfig(loadedConfig) {
        Object.keys(MODULES_CONFIG).forEach(key => {
            debugState[key] = loadedConfig[key] !== undefined ? loadedConfig[key] : MODULES_CONFIG[key].default;
        });
        updateCheckboxes();
    }

    function resetToDefaults() {
        Object.keys(MODULES_CONFIG).forEach(key => {
            debugState[key] = MODULES_CONFIG[key].default;
        });
    }

    function log(moduleKey, ...args) {
        if (!debugState[moduleKey]) return;

        const config = MODULES_CONFIG[moduleKey];
        const prefix = `[${config ? config.name : moduleKey}]`;
        const color = config ? config.color : '#FFFFFF';

        console.log(
            `%c${prefix}`, 
            `color: ${color}; font-weight: bold; background: #222; padding: 2px 5px; border-radius: 3px;`, 
            ...args
        );
    }

    // --- UI FUNKCE ---
    function toggleInterface() {
        if (!isInitialized) {
            console.warn("🖖 DebugManager: Ještě se inicializuje, zkuste za chvíli");
            return;
        }

        const existingOverlay = document.getElementById('debug-manager-overlay');
        if (existingOverlay) {
            isOverlayVisible = !isOverlayVisible;
            existingOverlay.style.display = isOverlayVisible ? 'flex' : 'none';
            if (isOverlayVisible) {
                updateCheckboxes();
                updateConnectionStatus(isCloudReady, isCloudReady ? "Online" : "Offline");
            }
        } else {
            createOverlay();
            isOverlayVisible = true;
        }
    }

    function updateConnectionStatus(connected, text) {
        const statusEl = document.getElementById('dm-cloud-status');
        if (statusEl) {
            const icon = connected ? '☁️' : (text === 'Offline' ? '📴' : '⚠️');
            statusEl.innerHTML = `${icon} ${text}`;
            statusEl.style.color = connected ? '#00FF00' : '#FF6600';
            statusEl.title = connected ? "Cloud synchronizace aktivní" : "Pracuji offline";
        }
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'debug-manager-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.95); z-index: 99999;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(5px);
            font-family: 'Orbitron', 'Courier New', monospace;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
            border: 3px solid #FF9900;
            border-radius: 15px;
            width: 850px;
            max-width: 95%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 30px rgba(255, 153, 0, 0.5), inset 0 0 20px rgba(255, 153, 0, 0.1);
        `;

        // Header
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <h2 style="margin: 0; color: #FF9900; text-shadow: 0 0 10px rgba(255, 153, 0, 0.5);">🛠️ DIAGNOSTIKA</h2>
                    <span id="dm-cloud-status" style="font-size: 12px; color: #666; background: #222; padding: 4px 8px; border-radius: 4px;">⏳ Init...</span>
                    <span style="font-size: 10px; color: #666;">V4.0</span>
                </div>
                <button id="dm-close" style="background: none; border: none; color: #FF9900; font-size: 28px; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#FFCC00'" onmouseout="this.style.color='#FF9900'">✖</button>
            </div>
            <div style="height: 2px; background: linear-gradient(90deg, #FF9900, transparent); margin: 15px 0;"></div>
        `;
        header.style.padding = '20px';
        panel.appendChild(header);

        // Grid modulů
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 12px;
            padding: 0 20px 20px 20px;
            overflow-y: auto;
            max-height: calc(90vh - 200px);
        `;

        Object.keys(MODULES_CONFIG).forEach(key => {
            const config = MODULES_CONFIG[key];
            const item = document.createElement('div');
            item.style.cssText = `
                background: linear-gradient(135deg, #222 0%, #1a1a1a 100%);
                padding: 12px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                border-left: 4px solid ${config.color};
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            `;
            
            item.onmouseenter = function() {
                this.style.background = `linear-gradient(135deg, #2a2a2a 0%, #222 100%)`;
                this.style.transform = 'translateX(5px)';
                this.style.boxShadow = `0 2px 10px ${config.color}40`;
            };
            item.onmouseleave = function() {
                this.style.background = 'linear-gradient(135deg, #222 0%, #1a1a1a 100%)';
                this.style.transform = 'translateX(0)';
                this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            };
            
            item.innerHTML = `
                <input type="checkbox" id="dm-check-${key}" style="margin-right: 12px; transform: scale(1.5); cursor: pointer;">
                <label for="dm-check-${key}" style="color: #EEE; cursor: pointer; user-select: none; font-size: 13px; flex: 1;">${config.name}</label>
            `;
            
            item.onclick = (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = document.getElementById(`dm-check-${key}`);
                    checkbox.checked = !checkbox.checked;
                    updateState(key, checkbox.checked);
                }
            };
            
            const checkbox = item.querySelector('input');
            checkbox.onclick = (e) => {
                e.stopPropagation();
                updateState(key, e.target.checked);
            };

            grid.appendChild(item);
        });

        panel.appendChild(grid);

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 20px;
            border-top: 2px solid #333;
            display: flex;
            gap: 10px;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(180deg, transparent 0%, #0a0a0a 100%);
        `;
        
        const cloudInfo = isCloudReady 
            ? '<span style="color: #00FF00; font-size: 11px;">☁️ Cloud Firestore</span>' 
            : '<span style="color: #FF6600; font-size: 11px;">📴 Pouze runtime (bez persistence)</span>';
        
        footer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                ${cloudInfo}
                <button id="dm-save-now" style="padding: 6px 12px; background: #0099FF; color: #000; border: none; cursor: pointer; font-weight: bold; border-radius: 5px; font-size: 11px; transition: all 0.2s;" ${!isCloudReady ? 'disabled' : ''}>💾 Uložit teď</button>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="dm-enable-all" style="padding: 10px 18px; background: #FF9900; color: #000; border: none; cursor: pointer; font-weight: bold; border-radius: 5px; transition: all 0.2s;">Vše zapnout</button>
                <button id="dm-disable-all" style="padding: 10px 18px; background: #555; color: #FFF; border: none; cursor: pointer; font-weight: bold; border-radius: 5px; transition: all 0.2s;">Vše vypnout</button>
            </div>
        `;
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('dm-close').onclick = toggleInterface;
        document.getElementById('dm-enable-all').onclick = () => setAll(true);
        document.getElementById('dm-disable-all').onclick = () => setAll(false);
        
        // Tlačítko "Uložit teď"
        const saveBtn = document.getElementById('dm-save-now');
        if (saveBtn && isCloudReady) {
            saveBtn.onclick = async () => {
                saveBtn.disabled = true;
                saveBtn.textContent = '⏳ Ukládám...';
                saveBtn.style.background = '#666';
                
                await saveToCloud(true);
                
                saveBtn.textContent = '✅ Uloženo!';
                saveBtn.style.background = '#00FF00';
                
                setTimeout(() => {
                    saveBtn.textContent = '💾 Uložit teď';
                    saveBtn.style.background = '#0099FF';
                    saveBtn.disabled = false;
                }, 2000);
            };
        }
        
        // Hover effects pro buttony
        ['dm-enable-all', 'dm-disable-all', 'dm-save-now'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn && !btn.disabled) {
                btn.onmouseenter = function() { 
                    this.style.transform = 'scale(1.05)'; 
                    this.style.boxShadow = '0 4px 15px rgba(255, 153, 0, 0.4)';
                };
                btn.onmouseleave = function() { 
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = 'none';
                };
            }
        });
        
        updateConnectionStatus(isCloudReady, isCloudReady ? "Online" : "Offline");
    }

    function updateCheckboxes() {
        Object.keys(MODULES_CONFIG).forEach(key => {
            const cb = document.getElementById(`dm-check-${key}`);
            if (cb) cb.checked = !!debugState[key];
        });
    }

    function updateState(key, value) {
        debugState[key] = value;
        saveToCloud(); // Auto-save s debouncing
        
        // Okamžitá vizuální zpětná vazba
        const checkbox = document.getElementById(`dm-check-${key}`);
        if (checkbox) {
            checkbox.checked = value;
        }
        
        if (value) {
            log('main', `✅ Modul ${MODULES_CONFIG[key].name} AKTIVOVÁN`);
        } else {
            log('main', `❌ Modul ${MODULES_CONFIG[key].name} DEAKTIVOVÁN`);
        }
    }

    function setAll(value) {
        Object.keys(MODULES_CONFIG).forEach(key => debugState[key] = value);
        saveToCloud();
        updateCheckboxes();
        log('main', value ? '✅ Všechny moduly ZAPNUTY' : '❌ Všechny moduly VYPNUTY');
    }

    // --- EVENT LISTENERS ---
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
            e.preventDefault();
            toggleInterface();
        }
    });

    function attachButtonListener() {
        const debugButton = document.getElementById('debug-manager-button');
        if (debugButton) {
            debugButton.addEventListener('click', (e) => {
                e.preventDefault();
                toggleInterface();
            });
            log('main', '✅ Debug tlačítko připojeno');
        }
    }

    // --- SPUŠTĚNÍ ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initialize();
            setTimeout(attachButtonListener, 100);
        });
    } else {
        initialize();
        setTimeout(attachButtonListener, 100);
    }

    // --- EXPORT ---
    window.DebugManager = {
        log: log,
        toggleUI: toggleInterface,
        getState: () => ({...debugState}),
        isEnabled: (key) => !!debugState[key],
        forceCloudSync: () => saveToCloud(true),
        isReady: () => isInitialized,
        isCloudConnected: () => isCloudReady,
        getFirestoreInstance: () => firestoreDB,
        BUTTON_ID: 'debug-manager-button'
    };

})();