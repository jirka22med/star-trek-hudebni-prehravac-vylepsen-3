/**
 * 🖖 STAR TREK AUDIO SMART PRELOADER v3.0 🚀
 * Inteligentní přednahrávání pomocí nativního HTML5 Audio
 * Využívá browser cache místo vlastní paměti
 * PERFEKTNÍ pro Dropbox!
 * Verze: 3.1 (DebugManager Integration)
 */

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_PRELOAD = true;

class SmartAudioPreloader {
    constructor() {
        this.preloadedElements = new Map(); // Map<src, Audio>
        this.isPreloading = false;
        this.isEnabled = true;
        this.currentPreloadSrc = null;
        
        // Použití DebugManager pro úvodní banner (pokud je modul povolen)
        if (window.DebugManager && window.DebugManager.isEnabled('preloader')) {
            window.DebugManager.log('preloader', '🖖========================================');
            window.DebugManager.log('preloader', '🚀 Smart Audio Preloader v3.1 inicializován');
            window.DebugManager.log('preloader', '💡 Využívá nativní HTML5 audio preload');
            window.DebugManager.log('preloader', '📦 Browser si sám spravuje cache');
            window.DebugManager.log('preloader', '✅ Žádné rate limiting problémy!');
            window.DebugManager.log('preloader', '🖖========================================');
        }
    }

    /**
     * Přednahraje pouze DALŠÍ skladbu pomocí HTML5 Audio
     */
    async preloadAroundCurrent(tracks, currentIndex, isShuffled = false, shuffledIndices = []) {
        if (!this.isEnabled || !tracks?.length) return;
        
        if (this.isPreloading) {
            window.DebugManager?.log('preloader', '⏸️  Preload již běží, přeskakuji...');
            return;
        }
        
        this.isPreloading = true;
        
        try {
            // Určíme další skladbu
            let nextIndex;
            if (isShuffled && shuffledIndices?.length > 0) {
                nextIndex = shuffledIndices[shuffledIndices.length - 1];
            } else {
                nextIndex = (currentIndex + 1) % tracks.length;
            }
            
            const nextTrack = tracks[nextIndex];
            
            if (!nextTrack?.src) {
                window.DebugManager?.log('preloader', '⚠️  Další skladba nemá platné URL');
                return;
            }
            
            window.DebugManager?.log('preloader', `\n🎯 Přednahrávám další skladbu:`);
            window.DebugManager?.log('preloader', `   📍 Index: ${nextIndex}`);
            window.DebugManager?.log('preloader', `   🎵 Název: "${nextTrack.title}"`);
            
            // Už je přednahraná?
            if (this.preloadedElements.has(nextTrack.src)) {
                window.DebugManager?.log('preloader', `   ✅ Již přednahráno`);
                return;
            }
            
            // Vyčistíme staré přednahrané skladby (kromě aktuální)
            this._cleanupOldPreloads(tracks[currentIndex]?.src);
            
            // Vytvoříme nový skrytý audio element
            window.DebugManager?.log('preloader', `   🔽 Spouštím nativní HTML5 preload...`);
            const audio = new Audio();
            
            // Event listeners pro monitoring
            audio.addEventListener('canplaythrough', () => {
                window.DebugManager?.log('preloader', `   ✅ Skladba připravena k přehrání!`);
                window.DebugManager?.log('preloader', `   💾 Uloženo v browser cache`);
                
                // Dispatch event pro UI
                window.dispatchEvent(new CustomEvent('track-preloaded', { 
                    detail: { 
                        src: nextTrack.src, 
                        title: nextTrack.title, 
                        index: nextIndex 
                    } 
                }));
            }, { once: true });
            
            audio.addEventListener('error', (e) => {
                console.warn(`   ⚠️  Nepodařilo se přednahrát: ${e.message || 'neznámá chyba'}`);
                console.warn(`   💡 Skladba bude přehrána přímo (bez cache)`);
                this.preloadedElements.delete(nextTrack.src);
            }, { once: true });
            
            audio.addEventListener('progress', () => {
                if (audio.buffered.length > 0) {
                    const buffered = audio.buffered.end(0);
                    const duration = audio.duration || 1;
                    const percent = Math.round((buffered / duration) * 100);
                    
                    if (percent % 25 === 0 && percent > 0) { // Log každých 25%
                        window.DebugManager?.log('preloader', `   ⏳ Nahrávání: ${percent}%`);
                    }
                }
            });
            
            // Nastavíme preload a src
            audio.preload = 'auto'; // Browser si řídí stahování sám
            audio.src = nextTrack.src;
            
            // Uložíme do mapy
            this.preloadedElements.set(nextTrack.src, audio);
            this.currentPreloadSrc = nextTrack.src;
            
            window.DebugManager?.log('preloader', `   📡 Požadavek odeslán browseru`);
            
        } catch (error) {
            console.error('💥 Chyba při přednahrávání:', error);
        } finally {
            this.isPreloading = false;
        }
    }

    /**
     * Vyčistí staré přednahrané skladby
     */
    _cleanupOldPreloads(currentSrc) {
        const toDelete = [];
        
        for (const [src, audio] of this.preloadedElements.entries()) {
            // Nemaž aktuálně hrající nebo právě přednahrávanou
            if (src !== currentSrc && src !== this.currentPreloadSrc) {
                toDelete.push(src);
                
                // Uvolni paměť
                audio.src = '';
                audio.load();
            }
        }
        
        toDelete.forEach(src => {
            const audio = this.preloadedElements.get(src);
            window.DebugManager?.log('preloader', `   🗑️  Uvolňuji: ${src.substring(0, 50)}...`);
            this.preloadedElements.delete(src);
        });
        
        if (toDelete.length > 0) {
            window.DebugManager?.log('preloader', `   🧹 Vyčištěno ${toDelete.length} starých přednahrání`);
        }
    }

    /**
     * Zkontroluje, zda je skladba přednahraná
     */
    isCached(src) {
        const audio = this.preloadedElements.get(src);
        if (!audio) return false;
        
        // Kontrola, zda je ready
        return audio.readyState >= 3; // HAVE_FUTURE_DATA nebo víc
    }

    /**
     * Získá přednahraný audio element (pro použití v playeru)
     */
    getPreloaded(src) {
        return this.preloadedElements.get(src) || null;
    }

    /**
     * Vypne/zapne preloading
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        window.DebugManager?.log('preloader', `🔧 Smart Preloading ${enabled ? '✅ ZAPNUT' : '⏸️  VYPNUT'}`);
        
        if (!enabled) {
            this.clearAll();
        }
    }

    /**
     * Vyčistí všechny přednahrané skladby
     */
    clearAll() {
        window.DebugManager?.log('preloader', `🗑️  Čistím všechny přednahrané skladby...`);
        
        for (const [src, audio] of this.preloadedElements.entries()) {
            audio.src = '';
            audio.load();
        }
        
        this.preloadedElements.clear();
        this.currentPreloadSrc = null;
        window.DebugManager?.log('preloader', `   ✅ Vyčištěno!`);
    }

    /**
     * Statistiky
     */
    getStats() {
        let readyCount = 0;
        let loadingCount = 0;
        
        for (const audio of this.preloadedElements.values()) {
            if (audio.readyState >= 3) {
                readyCount++;
            } else {
                loadingCount++;
            }
        }
        
        return {
            total: this.preloadedElements.size,
            ready: readyCount,
            loading: loadingCount,
            enabled: this.isEnabled
        };
    }

    /**
     * Debug info
     */
    logStats() {
        window.DebugManager?.log('preloader', '\n📊 ===== SMART PRELOADER STATISTIKY =====');
        const stats = this.getStats();
        
        window.DebugManager?.log('preloader', '📦 Celkem přednahráno:', stats.total);
        window.DebugManager?.log('preloader', '✅ Připraveno k přehrání:', stats.ready);
        window.DebugManager?.log('preloader', '⏳ Stále se nahrává:', stats.loading);
        window.DebugManager?.log('preloader', '🔧 Stav:', stats.enabled ? 'ZAPNUTO' : 'VYPNUTO');
        
        if (this.preloadedElements.size > 0) {
            window.DebugManager?.log('preloader', '\n📋 Seznam přednahraných:');
            let i = 1;
            for (const [src, audio] of this.preloadedElements.entries()) {
                const readyState = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][audio.readyState] || 'UNKNOWN';
                window.DebugManager?.log('preloader', `   ${i}. ${src.substring(0, 50)}...`);
                window.DebugManager?.log('preloader', `      Stav: ${readyState} (${audio.readyState})`);
                
                if (audio.buffered.length > 0) {
                    const buffered = audio.buffered.end(0);
                    const duration = audio.duration || 0;
                    const percent = duration > 0 ? Math.round((buffered / duration) * 100) : 0;
                    window.DebugManager?.log('preloader', `      Nahráno: ${percent}%`);
                }
                i++;
            }
        }
        
        window.DebugManager?.log('preloader', '=========================================\n');
    }
}

// 🚀 Export globální instance
window.audioPreloader = new SmartAudioPreloader();

// 🖖 Helper pro zpětnou kompatibilitu
window.preloadTracks = async (tracks, currentIndex, isShuffled, shuffledIndices) => {
    if (window.audioPreloader) {
        await window.audioPreloader.preloadAroundCurrent(tracks, currentIndex, isShuffled, shuffledIndices);
    }
};

// Dummy metody pro kompatibilitu se starým kódem
window.audioPreloader.createObjectURL = () => null;
window.audioPreloader.setDelay = () => window.DebugManager?.log('preloader', '💡 Smart Preloader nepoužívá delay');
window.audioPreloader.clearCache = () => window.audioPreloader.clearAll();

window.DebugManager?.log('preloader', '🖖 Smart Audio Preloader v3.1 nahrán!');
window.DebugManager?.log('preloader', '💡 Příkazy:');
window.DebugManager?.log('preloader', '   window.audioPreloader.logStats() - zobraz statistiky');
window.DebugManager?.log('preloader', '   window.audioPreloader.setEnabled(false) - vypni preloading');
window.DebugManager?.log('preloader', '   window.audioPreloader.clearAll() - vymaž všechny přednahrané');
window.DebugManager?.log('preloader', '\n⚡ ŽÁDNÉ rate limiting! Browser si řídí stahování sám!');