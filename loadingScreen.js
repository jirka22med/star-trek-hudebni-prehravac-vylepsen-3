/* ============================================
   LOADING SCREEN - ECO VARIANTA A (FADE-IN)
   Jen CSS animace, minimální JavaScript
   ============================================ */

(function() {
    'use strict';
    
    // Konfigurace
    const CONFIG = {
        LOAD_DURATION: 20000,        // 20 sekund celkové načítání
        UPDATE_INTERVAL: 50,         // Aktualizace každých 50ms (plynulý progress)
        MIN_DISPLAY_TIME: 2000,      // Minimální zobrazení 2 sekundy
        FADE_OUT_DURATION: 500       // Fade out animace 0.5s
    };
    
    // Stav aplikace
    let startTime = null;
    let progressInterval = null;
    let isReady = false;
    
    // DOM elementy (načteme až po DOMContentLoaded)
    let loadingScreen = null;
    let progressFill = null;
    let progressText = null;
    
    /**
     * Inicializace loading screenu
     */
    function initLoadingScreen() {
        // Vytvoření HTML struktury
        createLoadingHTML();
        
        // Získání DOM elementů
        loadingScreen = document.getElementById('loading-screen');
        progressFill = document.getElementById('loading-progress-fill');
        progressText = document.getElementById('loading-progress-text');
        
        if (!loadingScreen || !progressFill || !progressText) {
            console.error('Loading screen: Nepodařilo se načíst DOM elementy');
            return;
        }
        
        // Spuštění načítání
        startLoading();
        
        // Čekání na připravenost aplikace
        waitForAppReady();
    }
    
    /**
     * Vytvoření HTML struktury loading screenu
     */
    function createLoadingHTML() {
        const html = `
            <div id="loading-screen"  >
                <div class="loading-template"  >
                    <div class="loading-welcome">
                        <h2>VÍTEJTE</h2>
                        <h3>VÍCE ADMIRÁLE JIŘÍKU</h3>
                    </div>
                    
                    <div class="loading-info">
                        <p><strong>STAR TREK HUDEBNÍ</strong></p>
                        <p><strong>PŘEHRÁVAČ SE</strong></p>
                        <p><strong>PRÁVĚ NAČÍTÁ</strong></p>
                        <p class="highlight">ZA 20 SEKUND</p>
                        <p><strong>BUDE PŘIPRAVEN</strong></p>
                    </div>
                    
                    <div class="loading-progress-section">
                        <div class="loading-progress-label">PROGRESS BAR</div>
                        <div class="loading-progress-container">
                            <div id="loading-progress-fill" class="loading-progress-fill"></div>
                            <div id="loading-progress-text" class="loading-progress-text">0%</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Vložení HTML na začátek body
        document.body.insertAdjacentHTML('afterbegin', html);
    }
    
    /**
     * Spuštění načítání
     */
    function startLoading() {
        startTime = Date.now();
        
        // Interval pro aktualizaci progress baru
        progressInterval = setInterval(updateProgress, CONFIG.UPDATE_INTERVAL);
    }
    
    /**
     * Aktualizace progress baru
     */
    function updateProgress() {
        const elapsed = Date.now() - startTime;
        let progress = Math.min((elapsed / CONFIG.LOAD_DURATION) * 100, 100);
        
        // Zaokrouhlení na celá čísla
        progress = Math.floor(progress);
        
        // Aktualizace UI
        progressFill.style.width = progress + '%';
        progressText.textContent = progress + '%';
        
        // Kontrola dokončení
        if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Kontrola minimální doby zobrazení
            const minTimeElapsed = elapsed >= CONFIG.MIN_DISPLAY_TIME;
            
            if (isReady && minTimeElapsed) {
                hideLoadingScreen();
            } else if (!isReady) {
                // Počkáme na připravenost aplikace
                waitForCompletion();
            } else {
                // Počkáme na minimální dobu zobrazení
                setTimeout(hideLoadingScreen, CONFIG.MIN_DISPLAY_TIME - elapsed);
            }
        }
    }
    
    /**
     * Čekání na připravenost aplikace
     */
    function waitForAppReady() {
        // Kontrola, zda jsou načteny klíčové skripty
        const checkInterval = setInterval(() => {
            // Kontrola existence klíčových objektů/funkcí z tvého přehrávače
            const scriptsReady = typeof window.tracks !== 'undefined' &&
                                typeof window.loadAudioData !== 'undefined';
            
            // Kontrola DOM ready
            const domReady = document.readyState === 'complete';
            
            if (scriptsReady && domReady) {
                isReady = true;
                clearInterval(checkInterval);
            }
        }, 100);
    }
    
    /**
     * Čekání na dokončení (když je progress 100%, ale app není ready)
     */
    function waitForCompletion() {
        const waitInterval = setInterval(() => {
            if (isReady) {
                clearInterval(waitInterval);
                hideLoadingScreen();
            }
        }, 100);
    }
    
    /**
     * Skrytí loading screenu
     */
    function hideLoadingScreen() {
        if (!loadingScreen) return;
        
        // Přidání třídy pro fade-out
        loadingScreen.classList.add('hidden');
        
        // Odstranění z DOM po dokončení animace
        setTimeout(() => {
            if (loadingScreen && loadingScreen.parentNode) {
                loadingScreen.parentNode.removeChild(loadingScreen);
            }
        }, CONFIG.FADE_OUT_DURATION);
    }
    
    /**
     * Public API pro manuální skrytí (pro debugging)
     */
    window.hideLoadingScreen = function() {
        isReady = true;
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        hideLoadingScreen();
    };
    
    // Inicializace při načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoadingScreen);
    } else {
        // DOM už je načten
        initLoadingScreen();
    }
    
})();



