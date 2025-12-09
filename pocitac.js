/**
 * 🖖 STAR TREK WAKE WORD WATCHER - PRODUCTION READY EDITION
 * =====================================================
 * Soubor: pocitac.js (OPRAVENÁ VERZE)
 * Účel: Hlídka "Počítači" + Ignorování dlouhých keců (Word Limiter)
 * Verze: 2.1 (DebugManager Integration)
 * * 🔧 OPRAVY V2.0:
 * - ✅ Memory leak fix v Phantom Loop (reusable buffer)
 * - ✅ Bezpečný handover protocol (čekání na skutečné ukončení)
 * - ✅ Anti-Pause listener leak fix (bind metoda)
 * - ✅ Stop místo Abort (stabilnější na Androidu)
 * - ✅ Battery optimization (30 FPS místo 60)
 */

(function() {
    'use strict';

    // 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager pod klíčem 'wake'
    // const DEBUG_WAKE = false;

    class WakeWordWatcher {
        constructor() {
            this.recognition = null;
            this.isWatching = false;
            this.isBenderActive = false;
            
            // 🛡️ AUDIO SHIELDS
            this.audioContext = null;
            this.dummyAnalyzer = null;
            this.micStream = null;
            this.keepAliveOscillator = null;
            this.phantomLoopActive = false;
            
            // ✅ OPRAVA: Reusable buffer pro Phantom Loop
            this.phantomDataBuffer = null;
            
            // ⚙️ NASTAVENÍ FILTRU
            this.keywords = /počítač|computer|haló|příkaz|poslouchej|bender/i;
            this.maxWordCount = 6; 
            
            // ✅ OPRAVA: Timeout handler pro Word Limiter
            this.abortTimeout = null;
            
            // ✅ OPRAVA: Bind Anti-Pause handler jednou
            this.antiPauseHandler = this.handleAudioPause.bind(this);

            this.init();
        }

        init() {
            if (!this.checkBrowserSupport()) return;
            this.setupRecognition();
            this.createUIToggle();
            window.DebugManager?.log('wake', "🤖 Hlídka: Systém připraven (Production v2.1).");
        }

        checkBrowserSupport() {
            return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        }

        setupRecognition() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;      
            this.recognition.interimResults = true;  
            this.recognition.lang = 'cs-CZ';         
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => {
                if (this.isBenderActive) return;

                // ✅ Clear předchozí abort timeout
                if (this.abortTimeout) {
                    clearTimeout(this.abortTimeout);
                    this.abortTimeout = null;
                }

                const lastResultIndex = event.results.length - 1;
                const transcript = event.results[lastResultIndex][0].transcript.trim();
                const isFinal = event.results[lastResultIndex].isFinal;

                // 1. Rychlá kontrola hesla
                if (this.keywords.test(transcript)) {
                    window.DebugManager?.log('wake', `🤖 Hlídka ZACHYTILA HESLO: "${transcript}"`);
                    this.triggerMainSystem();
                    return;
                }

                // 2. POJISTKA PROTI KECÁNÍ (Word Limiter) - OPRAVENÁ VERZE
                const wordCount = transcript.split(/\s+/).length;

                // Debug vypisujeme jen pokud je zapnutý v manageru
                // if (wordCount > 2) window.DebugManager?.log('wake', `🤖 Hlídka monitoring (${wordCount} slov): "${transcript.substring(0, 30)}..."`);

                // ✅ OPRAVA: Stop místo Abort + Grace period
                if (wordCount > this.maxWordCount && isFinal) {
                    window.DebugManager?.log('wake', "✂️ Hlídka: Příliš dlouhý text bez hesla -> Scheduled reset");
                    
                    this.abortTimeout = setTimeout(() => {
                        if (!this.isBenderActive && this.isWatching) {
                            this.recognition.stop(); // STOP místo ABORT
                        }
                    }, 500); // Grace period 500ms
                }
            };

            this.recognition.onend = () => {
                // ✅ Clear timeout při ukončení
                if (this.abortTimeout) {
                    clearTimeout(this.abortTimeout);
                    this.abortTimeout = null;
                }
                
                if (this.isWatching && !this.isBenderActive) {
                    try { this.recognition.start(); } catch (e) {}
                }
            };

            this.recognition.onerror = (event) => {
                // ✅ Clear timeout při chybě
                if (this.abortTimeout) {
                    clearTimeout(this.abortTimeout);
                    this.abortTimeout = null;
                }
                
                if (event.error === 'aborted' || event.error === 'no-speech') return;
                
                // Logování chyby přes DebugManager
                window.DebugManager?.log('wake', "🤖 Hlídka error:", event.error);
            };
        }

        // =================================================================
        // 🛡️ AKTIVACE AUDIO SHIELDS - OPTIMALIZOVANÁ VERZE
        // =================================================================

        async activateAudioShields() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;

                if (!this.audioContext) this.audioContext = new AudioContext();
                if (this.audioContext.state === 'suspended') await this.audioContext.resume();

                // 1. TICHÝ OSCILÁTOR
                if (!this.keepAliveOscillator) {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = 0.01; 
                    gain.gain.value = 0.001;    
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.start();
                    this.keepAliveOscillator = osc;
                }

                // 2. PHANTOM LOOP - OPTIMALIZOVANÁ VERZE
                if (!this.micStream) {
                    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = this.audioContext.createMediaStreamSource(this.micStream);
                    this.dummyAnalyzer = this.audioContext.createAnalyser();
                    this.dummyAnalyzer.fftSize = 256; 
                    
                    // ✅ OPRAVA: Vytvoř reusable buffer JEDNOU
                    this.phantomDataBuffer = new Uint8Array(this.dummyAnalyzer.frequencyBinCount);
                    
                    source.connect(this.dummyAnalyzer);
                    this.phantomLoopActive = true;
                    this.runPhantomLoop();
                }
            } catch (e) {
                console.warn("🛡️ Hlídka: Nelze aktivovat štíty:", e);
            }
            this.setupAntiPause();
        }

        // ✅ OPRAVA: Battery-friendly Phantom Loop (30 FPS)
        runPhantomLoop() {
            if (!this.phantomLoopActive || !this.dummyAnalyzer) return;
            
            // ♻️ Reuse buffer místo vytváření nového
            this.dummyAnalyzer.getByteFrequencyData(this.phantomDataBuffer);
            
            // 🔋 BATTERY SAVING: 30 FPS místo 60
            setTimeout(() => {
                requestAnimationFrame(() => this.runPhantomLoop());
            }, 33); // ~30 FPS
        }

        // ✅ OPRAVA: Anti-Pause bez memory leaku
        handleAudioPause(event) {
            const audioPlayer = event.target;
            if (this.isWatching && !this.isBenderActive) {
                // Toto varování ponecháme, je důležité vědět, že systém zasáhl
                console.warn("🛡️ Hlídka: Pokus o vypnutí hudby zablokován.");
                event.preventDefault();
                audioPlayer.play().catch(() => {});
            }
        }

        setupAntiPause() {
            const audioPlayer = document.getElementById('audioPlayer');
            if (!audioPlayer) return;
            
            // ✅ Remove před přidáním (čisté removeEventListener funguje správně)
            audioPlayer.removeEventListener('pause', this.antiPauseHandler);
            
            if (!audioPlayer.paused) {
                audioPlayer.addEventListener('pause', this.antiPauseHandler);
            }
        }

        deactivateAudioShields() {
            this.phantomLoopActive = false;
            
            // ✅ Clear reusable buffer
            this.phantomDataBuffer = null;
            
            if (this.keepAliveOscillator) {
                try { 
                    this.keepAliveOscillator.stop(); 
                    this.keepAliveOscillator.disconnect(); 
                } catch(e){}
                this.keepAliveOscillator = null;
            }
            if (this.micStream) {
                this.micStream.getTracks().forEach(track => track.stop());
                this.micStream = null;
            }
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer) {
                audioPlayer.removeEventListener('pause', this.antiPauseHandler);
            }
        }

        // =================================================================
        // 🚀 ŘÍZENÍ - BEZPEČNÝ HANDOVER PROTOCOL
        // =================================================================

        // ✅ OPRAVA: Pomocná metoda pro čekání na skutečné ukončení
        waitForRecognitionStop() {
            return new Promise((resolve) => {
                if (!this.isWatching) {
                    resolve();
                    return;
                }
                
                const checkInterval = setInterval(() => {
                    // Čekáme, až recognition skutečně skončí
                    try {
                        // Pokud můžeme zavolat start, znamená to, že už není aktivní
                        this.recognition.start();
                        this.recognition.stop(); // Ihned zastavíme test
                        clearInterval(checkInterval);
                        resolve();
                    } catch (e) {
                        // Pokud vyhodí InvalidStateError, stále běží
                        if (e.name !== 'InvalidStateError') {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }
                }, 50);
                
                // Safety timeout
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 1000);
            });
        }

        // ✅ OPRAVA: Bezpečný handover bez race condition
        async triggerMainSystem() {
            if (this.isBenderActive) return;
            
            window.DebugManager?.log('wake', "🤖 Hlídka: HESLO PŘIJATO.");
            this.isBenderActive = true;
            
            // 1. Zastavíme rozpoznávání (STOP místo ABORT)
            this.recognition.stop();
            
            // 2. Počkáme na skutečné ukončení
            await this.waitForRecognitionStop();
            
            // 3. Teprve pak předáme řízení
            if (window.voiceController) {
                // Malý buffer pro jistotu (Android needs this)
                setTimeout(() => {
                    window.voiceController.activateListening();
                    this.monitorMainSystem();
                }, 100);
            } else {
                // Fallback
                this.isBenderActive = false;
                if (this.isWatching) this.startWatching();
            }
        }

        monitorMainSystem() {
            const checkTimer = setInterval(() => {
                if (window.voiceController && !window.voiceController.isListening) {
                    clearInterval(checkTimer);
                    window.DebugManager?.log('wake', "🤖 Hlídka: Bender skončil. Obnovuji stráž.");
                    this.isBenderActive = false;
                    if (this.isWatching) this.startWatching();
                }
            }, 1000);
        }

        startWatching() {
            if (this.isWatching && !this.isBenderActive) {
                try { this.recognition.start(); } catch(e){}
                return;
            }
            this.isWatching = true;
            this.updateUI(true);
            this.activateAudioShields();
            try {
                this.recognition.start();
                window.DebugManager?.log('wake', "🤖 Hlídka: AKTIVNÍ (v2.1)");
            } catch (e) { }
        }

        stopWatching() {
            this.isWatching = false;
            this.updateUI(false);
            this.deactivateAudioShields();
            
            // ✅ Clear timeout při manuálním vypnutí
            if (this.abortTimeout) {
                clearTimeout(this.abortTimeout);
                this.abortTimeout = null;
            }
            
            this.recognition.stop();
            window.DebugManager?.log('wake', "🤖 Hlídka: DEAKTIVOVÁNA");
        }

        // --- UI ---
        createUIToggle() {
            setTimeout(() => {
                const controls = document.querySelector('.controls');
                if (!controls || document.getElementById('wake-word-toggle')) return;
                const btn = document.createElement('button');
                btn.id = 'wake-word-toggle';
                btn.className = 'control-button';
                btn.innerHTML = '👁️'; 
                btn.title = 'Hlídka (Auto-Start)';
                btn.onclick = () => {
                    if (this.isWatching) this.stopWatching();
                    else this.startWatching();
                };
                controls.appendChild(btn);
                this.toggleBtn = btn;
            }, 2000);
        }

        updateUI(isActive) {
            if (!this.toggleBtn) return;
            if (isActive) {
                this.toggleBtn.classList.add('active');
                this.toggleBtn.style.border = '2px solid #00d4ff'; 
                this.toggleBtn.style.color = '#00d4ff';
            } else {
                this.toggleBtn.classList.remove('active');
                this.toggleBtn.style.border = '';
                this.toggleBtn.style.color = '';
            }
        }
    }

    window.wakeWordWatcher = new WakeWordWatcher();

})();