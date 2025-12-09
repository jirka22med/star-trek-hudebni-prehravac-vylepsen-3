/**
 * 🖖 STAR TREK VOICE CONTROL - PRODUCTION READY EDITION
 * Více admirál Jiřík & Admirál Claude.AI
 * "Press V to command!" - Smart PTT system
 * Verze: 2.1 (DebugManager Integration)
 * * 🔧 OPRAVY V2.0:
 * - ✅ Volume slider locking během PTT
 * - ✅ Touch event duplicity fix
 * - ✅ Bezpečnější media stream handling
 * - ✅ Okamžitá reakce na volume příkazy
 * - ✅ Error recovery improvements
 */

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager (klíč 'voice')
// const DEBUG_VOICE = false;

class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isPTTActive = false;
        this.isEnabled = false;
        
        // Audio management
        this.listeningVolume = 0.1; // 10% při naslouchání
        this.savedSliderValue = 0.5; // Pamatujeme si pozici slideru
        
        // Settings
        this.confidence = 0.7;
        this.language = 'cs-CZ';
        this.voiceResponses = true;
        this.responseVoice = null;
        
        // Audio device management
        this.audioDevices = [];
        this.selectedMicrophoneId = null;
        this.mediaStream = null;
        
        // UI elements
        this.toggleBtn = null;
        this.statusIndicator = null;
        this.pttObserver = null;
        
        // ✅ OPRAVA: Touch event tracking
        this.touchProcessedButtons = new WeakSet();
        
        // Commands
        this.commands = new Map();
        
        this.init();
    }

    async init() {
        window.DebugManager?.log('voice', "🎤 VoiceController PTT: Inicializace (Production v2.1)");
        
        if (!this.checkBrowserSupport()) {
            this.showNotification("Váš prohlížeč nepodporuje rozpoznávání řeči", 'error');
            return;
        }
        
        await this.detectAudioDevices();
        
        this.setupCommands();
        this.setupRecognition();
        this.createUI();
        this.attachEventListeners();
        this.injectStyles();
        await this.loadSettings();
        
        window.DebugManager?.log('voice', "🎤 PTT systém připraven (v2.1)!");
    }

    checkBrowserSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    async detectAudioDevices() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.audioDevices = devices.filter(device => device.kind === 'audioinput');
            
            stream.getTracks().forEach(track => track.stop());
            
            if (window.DebugManager?.isEnabled('voice')) {
                window.DebugManager.log('voice', "🎤 Detekovaná audio zařízení:");
                this.audioDevices.forEach((device, index) => {
                    window.DebugManager.log('voice', `  ${index + 1}. ${device.label || 'Neznámý mikrofon'} (${device.deviceId.substring(0, 20)}...)`);
                });
            }
            
            const externalMic = this.audioDevices.find(device => {
                const label = device.label.toLowerCase();
                return label.includes('jbl') || 
                       label.includes('quantum') || 
                       label.includes('usb') || 
                       label.includes('wireless') ||
                       label.includes('headset') ||
                       label.includes('dongle');
            });
            
            if (externalMic) {
                this.selectedMicrophoneId = externalMic.deviceId;
                window.DebugManager?.log('voice', `🎧 Preferovaný mikrofon: ${externalMic.label}`);
                this.showNotification(`🎧 Detekován: ${externalMic.label}`, 'success', 4000);
            } else {
                this.selectedMicrophoneId = this.audioDevices[0]?.deviceId || null;
                window.DebugManager?.log('voice', `🎤 Použit výchozí mikrofon`);
            }
            
        } catch (error) {
            console.warn("🎤 Nelze získat audio zařízení:", error);
            this.audioDevices = [];
        }
    }

    setupCommands() {
        const commands = [
            // Základní ovládání
            { patterns: ['přehrát', 'play', 'spustit'], action: 'play', description: 'Spustí přehrávání' },
            { patterns: ['pauza', 'pause', 'stop'], action: 'pause', description: 'Pozastaví přehrávání' },
            { patterns: ['další', 'next', 'skip'], action: 'next', description: 'Další skladba' },
            { patterns: ['předchozí', 'previous', 'back'], action: 'previous', description: 'Předchozí skladba' },
            { patterns: ['restart', 'znovu'], action: 'restart', description: 'Restart skladby' },
            
            // Hlasitost
            { patterns: ['hlasitost nahoru', 'volume up', 'hlasněji'], action: 'volumeUp', description: 'Zvýší hlasitost' },
            { patterns: ['hlasitost dolů', 'volume down', 'tišeji'], action: 'volumeDown', description: 'Sníží hlasitost' },
            { patterns: ['ztlumit', 'mute'], action: 'mute', description: 'Ztlumí zvuk' },
            { patterns: ['hlasitost maximum', 'full volume'], action: 'volumeMax', description: 'Maximální hlasitost' },
            { patterns: ['hlasitost minimum', 'minimální hlasitost', 'ticho', 'ztišit úplně'], action: 'volumeMin', description: 'Nastaví hlasitost na 0' },
            { patterns: ['hlasitost', 'nastav', 'úroveň', 'dej to na'], action: 'setVolumeExact', description: 'Nastaví přesná procenta' },
            
            // Režimy
            { patterns: ['shuffle', 'náhodné'], action: 'toggleShuffle', description: 'Zapne/vypne shuffle' },
            { patterns: ['loop', 'opakování'], action: 'toggleLoop', description: 'Zapne/vypne opakování' },
            
            // Star Trek specifické
            { patterns: ['warp speed', 'warp'], action: 'warpSpeed', description: 'Rychlé přehrávání' },
            { patterns: ['impulse', 'normální rychlost'], action: 'normalSpeed', description: 'Normální rychlost' },
            { patterns: ['beam me up', 'random'], action: 'randomTrack', description: 'Náhodná skladba' },
            
            // Skladby
            { patterns: ['skladba', 'stopa', 'track', 'číslo', 'přehrát číslo'], action: 'playTrackNumber', description: 'Přehraje konkrétní číslo skladby' },
            
            // Nápověda / Manuál
            { patterns: ['manuál', 'nápověda', 'co umíš', 'pomoc'], action: 'openManual', description: 'Otevře manuál ovládání' },
            { patterns: ['zavřít manuál', 'zavřít', 'close'], action: 'closeManual', description: 'Zavře manuál' },
            
            // Diagnostika
            { patterns: ['test mikrofonu', 'microphone test', 'test mic'], action: 'testMicrophone', description: 'Test mikrofonu' },
            { patterns: ['seznam mikrofonů', 'list microphones', 'which microphone'], action: 'listMicrophones', description: 'Seznam dostupných mikrofonů' },
        ];

        commands.forEach(cmd => {
            cmd.patterns.forEach(pattern => {
                this.commands.set(pattern.toLowerCase(), {
                    action: cmd.action,
                    description: cmd.description
                });
            });
        });

        window.DebugManager?.log('voice', `🎤 Načteno ${this.commands.size} příkazů`);
    }

    setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.language;
        this.recognition.maxAlternatives = 3;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatusIndicator('listening');
            window.DebugManager?.log('voice', "🎤 Naslouchám...");
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.isPTTActive = false;
            this.updateStatusIndicator('inactive');
            this.restoreAudioVolume();
            this.releaseMediaStream();
            window.DebugManager?.log('voice', "🎤 Naslouchání ukončeno");
        };
        
        this.recognition.onerror = (event) => {
            window.DebugManager?.log('voice', "🎤 Chyba:", event.error);
            
            if (event.error === 'no-speech') {
                this.speak("Neslyšel jsem žádný příkaz");
            } else if (event.error === 'not-allowed') {
                this.showNotification("Přístup k mikrofonu byl odepřen", 'error');
                this.disable();
            }
            
            this.updateStatusIndicator('error');
            this.restoreAudioVolume();
        };
        
        this.recognition.onresult = (event) => {
            const results = event.results[0];
            const transcript = results[0].transcript.trim().toLowerCase();
            const confidence = results[0].confidence;
            
            window.DebugManager?.log('voice', "🎤 Rozpoznáno:", transcript, "Confidence:", confidence);
            
            if (confidence >= this.confidence || (confidence === 0 && transcript.length > 0)) {
                this.processCommand(transcript);
            } else {
                this.speak("Polib mi můj naleštěnej zadek!");
            }
        };

        if ('speechSynthesis' in window) {
            this.loadVoices();
            window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        const voices = speechSynthesis.getVoices();
        const preferredLangs = ['cs-CZ', 'sk-SK', 'en-US', 'en-GB'];
        
        for (const lang of preferredLangs) {
            const voice = voices.find(v => v.lang.startsWith(lang));
            if (voice) {
                this.responseVoice = voice;
                break;
            }
        }
        
        if (!this.responseVoice && voices.length > 0) {
            this.responseVoice = voices[0];
        }
    }

    processCommand(transcript) {
        let matchedCommand = null;
        let bestMatch = '';
        
        for (const [pattern, command] of this.commands) {
            if (transcript.includes(pattern)) {
                if (pattern.length > bestMatch.length) {
                    bestMatch = pattern;
                    matchedCommand = command;
                }
            }
        }
        
        if (matchedCommand) {
            this.updateStatusIndicator('processing');
            this.executeCommand(matchedCommand, transcript);
        } else {
            this.speak("Polib mi můj naleštěnej zadek!");
        }
    }

    executeCommand(command, transcript) {
        window.DebugManager?.log('voice', "🎤 Vykonávám:", command.action);
        
        const audioPlayer = document.getElementById('audioPlayer');
        
        switch (command.action) {
            case 'play':
                document.getElementById('play-button')?.click();
                this.speak("Spouštím přehrávání");
                break;
                
            case 'pause':
                document.getElementById('pause-button')?.click();
                this.speak("Pozastavuji");
                break;
                
            case 'next':
                document.getElementById('next-button')?.click();
                this.speak("Další skladba");
                break;
                
            case 'previous':
                document.getElementById('prev-button')?.click();
                this.speak("Předchozí skladba");
                break;
                
            case 'restart':
                document.getElementById('reset-button')?.click();
                this.speak("Spouštím od začátku");
                break;
                
            case 'volumeUp':
                this.adjustVolume(0.1);
                this.speak("Zvyšuji hlasitost");
                break;
                
            case 'volumeDown':
                this.adjustVolume(-0.1);
                this.speak("Snižuji hlasitost");
                break;
                
            case 'volumeMax':
                this.setVolume(1.0);
                this.speak("Maximální hlasitost");
                break;
                
            case 'volumeMin':
                this.setVolume(0);
                this.speak("Hlasitost na minimu");
                break;
                
            case 'setVolumeExact':
                const match = transcript.match(/(\d+)/);
                if (match) {
                    let vol = parseInt(match[0], 10);
                    if (vol > 100) vol = 100;
                    if (vol < 0) vol = 0;
                    this.setVolume(vol / 100);
                    this.speak(`Provádím. Hlasitost ${vol} procent.`);
                } else {
                    this.speak("Nerozuměl jsem číslu. Zopakujte prosím.");
                }
                break;
                
            case 'mute':
                document.getElementById('mute-button')?.click();
                this.speak("Ztlumeno");
                break;
                
            case 'toggleShuffle':
                document.getElementById('shuffle-button')?.click();
                const shuffleActive = document.getElementById('shuffle-button')?.classList.contains('active');
                this.speak(shuffleActive ? "Náhodné přehrávání zapnuto" : "Náhodné přehrávání vypnuto");
                break;
                
            case 'toggleLoop':
                document.getElementById('loop-button')?.click();
                const loopActive = document.getElementById('loop-button')?.classList.contains('active');
                this.speak(loopActive ? "Opakování zapnuto" : "Opakování vypnuto");
                break;
                
            case 'warpSpeed':
                if (audioPlayer) audioPlayer.playbackRate = 1.5;
                this.speak("Warp rychlost aktivována");
                break;
                
            case 'normalSpeed':
                if (audioPlayer) audioPlayer.playbackRate = 1.0;
                this.speak("Impulse rychlost obnovena");
                break;
                
            case 'randomTrack':
                if (!document.getElementById('shuffle-button')?.classList.contains('active')) {
                    document.getElementById('shuffle-button')?.click();
                }
                document.getElementById('next-button')?.click();
                this.speak("Transportér aktivován");
                break;
                
            case 'playTrackNumber':
                const trackMatch = transcript.match(/(\d+)/);
                if (trackMatch) {
                    const trackNumber = parseInt(trackMatch[0], 10);
                    const trackIndex = trackNumber - 1;
                    const totalTracks = window.tracks ? window.tracks.length : 0;

                    if (trackIndex >= 0 && trackIndex < totalTracks) {
                        if (typeof window.playTrack === 'function') {
                            window.playTrack(trackIndex);
                            this.speak(`Přehrávám skladbu číslo ${trackNumber}.`);
                        } else {
                            console.warn("Funkce playTrack nenalezena v globálním rozsahu.");
                            this.speak("Nemohu spojit komunikační kanál s přehrávačem.");
                        }
                    } else {
                        this.speak(`Skladba číslo ${trackNumber} neexistuje. Playlist má ${totalTracks} skladeb.`);
                    }
                } else {
                    this.speak("Nerozuměl jsem číslu skladby.");
                }
                break;
                
            case 'getCurrentTrack':
                const trackTitle = document.getElementById('trackTitle')?.textContent;
                this.speak(trackTitle ? `Aktuálně hraje: ${trackTitle}` : "Žádná skladba není spuštěna");
                break;
                
            case 'getStatus':
                this.generateStatusReport();
                break;
                
            case 'testMicrophone':
                this.testMicrophone();
                break;
                
            case 'listMicrophones':
                this.listAvailableMicrophones();
                break;
                
            case 'openManual':
                this.showHelp();
                break;

            case 'closeManual':
                const modal = document.getElementById('voice-help-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    this.speak("Manuál zavřen.");
                }
                break;
        }
        
        this.showCommandFeedback(command.action, transcript);
    }

    // =================================================================
    // 🛠️ OPRAVENÁ LOGIKA HLASITOSTI (Verze 2.0)
    // =================================================================

    adjustVolume(delta) {
        const volumeSlider = document.getElementById('volume-slider');
        if (!volumeSlider) return;
        
        const currentVal = this.savedSliderValue;
        const newVal = Math.max(0, Math.min(1, currentVal + delta));
        
        volumeSlider.value = newVal;
        this.savedSliderValue = newVal;

        // ✅ Okamžitý signál do script.js
        volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        
        window.DebugManager?.log('voice', `🎤 Slider změněn na: ${newVal} (Signál odeslán)`);
    }

    setVolume(volume) {
        const volumeSlider = document.getElementById('volume-slider');
        if (!volumeSlider) return;
        
        const newVal = Math.max(0, Math.min(1, volume));
        
        volumeSlider.value = newVal;
        this.savedSliderValue = newVal;

        // ✅ Okamžitý signál do script.js
        volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        
        window.DebugManager?.log('voice', `🎤 Slider nastaven na: ${newVal} (Signál odeslán)`);
    }

    // =================================================================
    // 📊 AUDIO DUCKING - S LOCKINGEM SLIDERU
    // =================================================================

    saveAndDuckAudio() {
        const audioPlayer = document.getElementById('audioPlayer');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (!audioPlayer || !volumeSlider) return;
        
        // ✅ OPRAVA: Zamkneme slider během naslouchání
        this.savedSliderValue = parseFloat(volumeSlider.value);
        volumeSlider.disabled = true;
        volumeSlider.style.opacity = '0.5';
        volumeSlider.style.cursor = 'not-allowed';
        
        // Ztlumíme fyzicky přehrávač
        audioPlayer.volume = this.listeningVolume;
        
        window.DebugManager?.log('voice', `🎤 Audio ztlumeno (Slider zamčen na: ${this.savedSliderValue})`);
    }

    restoreAudioVolume() {
        const audioPlayer = document.getElementById('audioPlayer');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (!audioPlayer || !volumeSlider) return;
        
        // ✅ OPRAVA: Odemkneme slider
        volumeSlider.disabled = false;
        volumeSlider.style.opacity = '1';
        volumeSlider.style.cursor = 'pointer';
        
        volumeSlider.value = this.savedSliderValue;
        volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        
        window.DebugManager?.log('voice', `🎤 Audio obnoveno, slider: ${this.savedSliderValue}`);
    }

    generateStatusReport() {
        const audioPlayer = document.getElementById('audioPlayer');
        const trackTitle = document.getElementById('trackTitle')?.textContent || "Neznámá";
        const isPlaying = audioPlayer && !audioPlayer.paused;
        const volume = document.getElementById('volume-slider')?.value * 100 || 0;
        
        const report = `Status report: Přehrávač je ${isPlaying ? 'aktivní' : 'v pohotovosti'}. Aktuální skladba: ${trackTitle}. Hlasitost: ${Math.round(volume)} procent.`;
        
        this.speak(report);
    }

    speak(text) {
        if (!this.voiceResponses || !('speechSynthesis' in window)) return;
        
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.responseVoice;
        utterance.volume = 0.8;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        window.DebugManager?.log('voice', "🤖 Bender mluví:", text);
        
        speechSynthesis.speak(utterance);
    }

    showCommandFeedback(action, transcript) {
        if (this.statusIndicator) {
            this.statusIndicator.classList.add('command-executed');
            setTimeout(() => {
                this.statusIndicator?.classList.remove('command-executed');
            }, 1000);
        }
        
        this.showNotification(`🎤 "${transcript}"`, 'info', 2000);
    }

    // ⚡ PTT CORE FUNCTIONALITY
    async activateListening() {
        if (this.isListening || !this.isEnabled) return;
        
        this.isPTTActive = true;
        
        try {
            await this.acquireMediaStream();
        } catch (error) {
            console.error("🎤 Chyba při získávání audio streamu:", error);
            this.showNotification("Nelze získat přístup k mikrofonu", 'error');
            this.restoreAudioVolume();
            return;
        }
        
        this.saveAndDuckAudio();
        
        try {
            this.recognition.start();
            window.DebugManager?.log('voice', "🎤 PTT aktivováno");
        } catch (error) {
            console.error("🎤 Chyba při spuštění:", error);
            this.restoreAudioVolume();
            this.releaseMediaStream();
        }
    }

    async acquireMediaStream() {
        this.releaseMediaStream();
        
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
            }
        };
        
        if (this.selectedMicrophoneId) {
            constraints.audio.deviceId = { exact: this.selectedMicrophoneId };
        }
        
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (window.DebugManager?.isEnabled('voice')) {
                const track = this.mediaStream.getAudioTracks()[0];
                window.DebugManager.log('voice', "🎤 Audio stream získán:");
                window.DebugManager.log('voice', `  Label: ${track.label}`);
                window.DebugManager.log('voice', `  Settings:`, track.getSettings());
            }
            
        } catch (error) {
            if (error.name === 'OverconstrainedError' && this.selectedMicrophoneId) {
                console.warn("🎤 Vybraný mikrofon nedostupný, použit výchozí");
                this.selectedMicrophoneId = null;
                constraints.audio.deviceId = undefined;
                this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            } else {
                throw error;
            }
        }
    }

    releaseMediaStream() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    createUI() {
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'voice-control-toggle';
        this.toggleBtn.className = 'control-button voice-control-toggle';
        this.toggleBtn.title = 'Hlasové ovládání PTT (Stiskni V)';
        this.toggleBtn.innerHTML = '🎤';
        
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'voice-status-indicator';
        this.toggleBtn.appendChild(this.statusIndicator);
        
        const controlsDiv = document.querySelector('#control-panel .controls');
        if (controlsDiv) {
            controlsDiv.appendChild(this.toggleBtn);
        }

        this.attachPTTTriggers();
    }

    // ✅ OPRAVA: Touch event duplicity fix
    attachPTTTriggers() {
        const pttButtons = document.querySelectorAll('.voice-ptt-trigger');
        
        pttButtons.forEach(btn => {
            if (btn.dataset.voicePttAttached) return;
            
            btn.dataset.voicePttAttached = 'true';
            
            // Touch handler s anti-duplicate
            btn.addEventListener('touchstart', async (e) => {
                e.preventDefault(); // Zabráníme click eventu
                
                if (this.touchProcessedButtons.has(btn)) return;
                this.touchProcessedButtons.add(btn);
                
                setTimeout(() => {
                    this.touchProcessedButtons.delete(btn);
                }, 300);
                
                if (!this.isEnabled) {
                    this.enable();
                    return;
                }
                
                if (!this.isListening) {
                    this.activateListening();
                    btn.classList.add('ptt-active');
                } else {
                    btn.classList.remove('ptt-active');
                }
            }, { passive: false });
            
            // Click handler s touch detection
            btn.addEventListener('click', (e) => {
                if (this.touchProcessedButtons.has(btn)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.isEnabled) {
                    this.enable();
                    return;
                }
                
                if (!this.isListening) {
                    this.activateListening();
                    btn.classList.add('ptt-active');
                } else {
                    btn.classList.remove('ptt-active');
                }
            });
            
            window.DebugManager?.log('voice', "🎤 PTT trigger připojeno:", btn);
        });
        
        if (!this.pttObserver) {
            this.pttObserver = new MutationObserver(() => {
                this.attachPTTTriggers();
            });
            
            this.pttObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .voice-control-toggle {
                position: relative;
                transition: all 0.3s ease;
            }
            
            .voice-control-toggle.active {
                background: rgba(255, 193, 7, 0.2);
                color: #ffc107;
                box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
            }
            
            .voice-status-indicator {
                position: absolute;
                top: 2px;
                right: 2px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #666;
                transition: all 0.3s ease;
            }
            
            .voice-status-indicator.listening {
                background: #28a745;
                animation: voicePulse 1s ease-in-out infinite;
            }
            
            .voice-status-indicator.processing {
                background: #ffc107;
                animation: voiceProcessing 0.5s ease-in-out infinite alternate;
            }
            
            .voice-status-indicator.error {
                background: #dc3545;
                animation: voiceError 0.2s ease-in-out 3;
            }
            
            .voice-status-indicator.command-executed {
                background: #00d4ff;
                animation: voiceSuccess 0.3s ease-in-out;
            }
            
            .voice-ptt-trigger {
                cursor: pointer;
                user-select: none;
                transition: all 0.2s ease;
                -webkit-tap-highlight-color: transparent;
            }
            
            .voice-ptt-trigger.ptt-active {
                background: rgba(255, 193, 7, 0.3) !important;
                box-shadow: 0 0 15px rgba(255, 193, 7, 0.6) !important;
                transform: scale(1.05);
            }
            
            .voice-ptt-trigger:active {
                transform: scale(0.95);
            }
            
            @keyframes voicePulse {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.3); }
            }
            
            @keyframes voiceProcessing {
                0% { opacity: 0.7; }
                100% { opacity: 1; }
            }
            
            @keyframes voiceError {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
            
            @keyframes voiceSuccess {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .voice-help-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex; justify-content: center; align-items: center;
                z-index: 9999; backdrop-filter: blur(5px);
                font-family: 'Segoe UI', sans-serif;
            }
            .voice-help-modal.hidden { display: none; }
            
            .voice-help-content {
                width: 600px; max-width: 95%; max-height: 85vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #ffc107; border-radius: 12px;
                box-shadow: 0 0 30px rgba(255, 193, 7, 0.4);
                display: flex; flex-direction: column; color: #fff;
            }
            
            .voice-help-header {
                background: linear-gradient(90deg, #ffc107, #ff9800); color: #000;
                padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;
            }
            .voice-help-header h3 { margin: 0; font-weight: bold; }
            
            .close-help { background: none; border: none; font-size: 24px; cursor: pointer; color: #000; font-weight: bold; }
            
            .commands-list-container { padding: 0; overflow-y: auto; flex: 1; }
            
            .command-row {
                border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 20px;
                display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;
            }
            .command-row:hover { background: rgba(255, 193, 7, 0.1); }
            
            .cmd-trigger { color: #ffc107; font-family: monospace; font-weight: bold; font-size: 1.1em; width: 55%; }
            .cmd-desc { color: #ccc; width: 45%; text-align: right; font-style: italic; }
            
            .voice-help-footer {
                padding: 10px; text-align: center; font-size: 12px; color: #888;
                background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);
            }
        `;
        
        document.head.appendChild(style);
    }

    attachEventListeners() {
        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.isEnabled) {
                this.enable();
            } else {
                this.activateListening();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'v' || e.key === 'V') {
                e.preventDefault();
                if (!this.isEnabled) {
                    this.enable();
                } else if (!this.isListening) {
                    this.activateListening();
                }
            }

            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggle();
            }
        });

        window.DebugManager?.log('voice', "🎤 Event listeners připojeny");
    }

    updateStatusIndicator(status = 'inactive') {
        if (!this.statusIndicator) return;
        
        this.statusIndicator.className = 'voice-status-indicator';
        
        if (status !== 'inactive') {
            this.statusIndicator.classList.add(status);
        }
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    async enable() {
        try {
            await this.detectAudioDevices();
            
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            if (this.selectedMicrophoneId) {
                constraints.audio.deviceId = { exact: this.selectedMicrophoneId };
            }
            
            const testStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const track = testStream.getAudioTracks()[0];
            const micLabel = track.label || 'Neznámý mikrofon';
            
            testStream.getTracks().forEach(t => t.stop());
            
            this.isEnabled = true;
            this.toggleBtn.classList.add('active');
            this.toggleBtn.title = `Hlasové ovládání AKTIVNÍ\n🎧 ${micLabel}\n(Stiskni V pro příkaz)`;
            
            this.saveSettings();
            this.showNotification(`🎤 Aktivováno: ${micLabel}`, 'success', 4000);
            this.speak("Hlasové ovládání aktivováno. Stiskněte V pro příkaz.");
            
            window.DebugManager?.log('voice', "🎤 Systém aktivován s mikrofonem:", micLabel);
            
        } catch (error) {
            console.error("🎤 Chyba při aktivaci:", error);
            this.showNotification("Nelze aktivovat mikrofon: " + error.message, 'error');
        }
    }

    disable() {
        this.isEnabled = false;
        
        if (this.isListening) {
            this.recognition.stop();
        }
        
        this.releaseMediaStream();
        
        this.toggleBtn.classList.remove('active');
        this.toggleBtn.title = 'Hlasové ovládání (Stiskni V)';
        this.updateStatusIndicator('inactive');
        
        this.saveSettings();
        this.showNotification("🎤 Hlasové ovládání deaktivováno", 'info');
        
        window.DebugManager?.log('voice', "🎤 Systém deaktivován");
    }

    showNotification(message, type = 'info', duration = 3000) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type, duration);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    async testMicrophone() {
        this.speak("Spouštím test mikrofonu");
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: this.selectedMicrophoneId ? { exact: this.selectedMicrophoneId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            const track = stream.getAudioTracks()[0];
            const settings = track.getSettings();
            
            const message = `
                🎧 Aktivní mikrofon: ${track.label}
                📊 Sample rate: ${settings.sampleRate}Hz
                📊 Kanály: ${settings.channelCount}
                ✅ Echo cancellation: ${settings.echoCancellation ? 'Ano' : 'Ne'}
                ✅ Noise suppression: ${settings.noiseSuppression ? 'Ano' : 'Ne'}
            `.trim().replace(/\s+/g, ' ');
            
            this.showNotification(message, 'info', 8000);
            this.speak(`Mikrofon funguje. Používám ${track.label}`);
            
            stream.getTracks().forEach(t => t.stop());
            
        } catch (error) {
            this.showNotification(`❌ Test mikrofonu selhal: ${error.message}`, 'error');
            this.speak("Test mikrofonu selhal");
        }
    }

    listAvailableMicrophones() {
        if (this.audioDevices.length === 0) {
            this.speak("Žádné mikrofony nebyly detekovány");
            this.showNotification("⚠️ Žádné audio zařízení", 'warn');
            return;
        }
        
        let message = `🎤 Dostupné mikrofony (${this.audioDevices.length}):\n`;
        
        this.audioDevices.forEach((device, index) => {
            const isCurrent = device.deviceId === this.selectedMicrophoneId;
            const prefix = isCurrent ? '✅' : '  ';
            message += `${prefix} ${index + 1}. ${device.label || 'Neznámý mikrofon'}\n`;
        });
        
        this.showNotification(message, 'info', 10000);
        
        const currentMic = this.audioDevices.find(d => d.deviceId === this.selectedMicrophoneId);
        this.speak(`Detekováno ${this.audioDevices.length} mikrofonů. Aktuálně používám ${currentMic?.label || 'výchozí mikrofon'}`);
    }

    showHelp() {
        if (!document.getElementById('voice-help-modal')) {
            this.createHelpModal();
        }
        this.updateHelpContent();
        const modal = document.getElementById('voice-help-modal');
        modal.classList.remove('hidden');
        this.speak("Tady to máš černé na bílém, ty masová nádhero!");
    }

    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'voice-help-modal';
        modal.className = 'voice-help-modal hidden';
        
        modal.innerHTML = `
            <div class="voice-help-content">
                <div class="voice-help-header">
                    <h3>🤖 Benderův Manuál Příkazů</h3>
                    <button class="close-help">✕</button>
                </div>
                <div class="commands-list-container">
                    <div id="generated-commands-list"></div>
                </div>
                <div class="voice-help-footer">
                    Pro zavření řekni "Zavřít manuál" nebo klikni na křížek.
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.close-help');
        closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); });
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }

    updateHelpContent() {
        const listContainer = document.getElementById('generated-commands-list');
        if (!listContainer) return;
        
        const groupedCommands = new Map();
        for (const [pattern, command] of this.commands) {
            if (!groupedCommands.has(command.action)) {
                groupedCommands.set(command.action, { description: command.description, patterns: [] });
            }
            groupedCommands.get(command.action).patterns.push(pattern);
        }
        
        let html = '';
        for (const [action, data] of groupedCommands) {
            const mainPatterns = data.patterns.slice(0, 3).map(p => `"${p}"`).join(', ');
            html += `
                <div class="command-row">
                    <div class="cmd-trigger">${mainPatterns}</div>
                    <div class="cmd-desc">${data.description}</div>
                </div>
            `;
        }
        listContainer.innerHTML = html;
    }

    async saveSettings() {
        const settings = {
            isEnabled: this.isEnabled,
            voiceResponses: this.voiceResponses,
            confidence: this.confidence,
            language: this.language,
            timestamp: Date.now()
        };

        localStorage.setItem('voiceControlSettings', JSON.stringify(settings));

        window.DebugManager?.log('voice', "🎤 Nastavení uloženo");
    }

    async loadSettings() {
        const savedSettings = localStorage.getItem('voiceControlSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.isEnabled = settings.isEnabled ?? false;
                this.voiceResponses = settings.voiceResponses ?? true;
                this.confidence = settings.confidence ?? 0.7;
                this.language = settings.language ?? 'cs-CZ';
                
                if (this.isEnabled) {
                    this.toggleBtn.classList.add('active');
                }
                
                window.DebugManager?.log('voice', "🎤 Nastavení načteno");
            } catch (error) {
                console.error("🎤 Chyba při načítání nastavení:", error);
            }
        }
    }
}

// =========================================================================
// 📱 MOBILNÍ WRAPPER
// =========================================================================

const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function setupMobileVoiceControl() {
    window.DebugManager?.log('voice', "📱 Mobilní režim: Aktivuji Android protokoly");

    setTimeout(() => {
        const triggerButtons = document.querySelectorAll('.voice-control-toggle, .voice-ptt-trigger, #voice-control-toggle');
        
        triggerButtons.forEach(btn => {
            btn.addEventListener('touchstart', async (e) => {
                if (window.voiceController && window.voiceController.isListening) return;

                window.DebugManager?.log('voice', "📱 Touch start detekován - Vynucuji start mikrofonu");

                if (window.voiceController) {
                    try {
                        window.voiceController.recognition.start();
                        window.voiceController.isListening = true;
                        window.voiceController.updateStatusIndicator('listening');
                        window.voiceController.speak("Poslouchám");
                    } catch (err) {
                        if (err.name !== 'InvalidStateError') {
                            console.error("📱 Chyba mobilního startu:", err);
                        }
                    }
                }
            }, { passive: true });
        });
        
    }, 2000);
}

// =========================================================================
// 🚀 GLOBÁLNÍ INICIALIZACE
// =========================================================================
let voiceController;

const initVoiceApp = () => {
    voiceController = new VoiceController();
    window.voiceController = voiceController;

    if (isMobileDevice) {
        setupMobileVoiceControl();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVoiceApp);
} else {
    initVoiceApp();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceController;
}