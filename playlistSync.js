// playlistSync.js
// 🖖 Hvězdná flotila - Inteligentní synchronizace playlistu
// Více admirál Jiřík & Admirál Claude.AI
// KOMPLETNÍ MODUL - žádná logika v HTML!
// Verze: 1.1 (DebugManager Integration)

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_SYNC = false; 

window.DebugManager?.log('sync', "🖖 playlistSync.js: Modul synchronizace playlistu načten.");

// === HLAVNÍ SYNCHRONIZAČNÍ MANAGER ===
window.PlaylistSyncManager = {
    
    // Konfigurace
    config: {
        autoSyncOnLoad: true,
        showNotifications: true,
        compareMethod: 'hash',
        buttonId: 'playlist-sync-button', // ID tlačítka v HTML
        autoInitButton: true // Automaticky inicializovat tlačítko
    },

    // Reference na tlačítko
    button: null,
    statusIndicator: null,
    syncIcon: null,

    // Generuje hash z playlistu pro rychlé porovnání
    generatePlaylistHash: function(tracks) {
        if (!Array.isArray(tracks) || tracks.length === 0) return 'empty';
        
        try {
            const playlistString = tracks.map(track => 
                `${track.title}|${track.src}`
            ).sort().join('||');
            
            let hash = 0;
            for (let i = 0; i < playlistString.length; i++) {
                const char = playlistString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            
            return Math.abs(hash).toString(16);
        } catch (error) {
            console.error("playlistSync.js: Chyba při generování hash:", error);
            return 'error';
        }
    },

    // Porovná lokální playlist s cloudovým
    comparePlaylistWithCloud: async function() {
        window.DebugManager?.log('sync', "playlistSync.js: Porovnávám lokální playlist s cloudem...");
        
        if (!window.tracks || !Array.isArray(window.tracks)) {
            console.error("playlistSync.js: window.tracks není dostupný!");
            return { error: "Lokální playlist není dostupný" };
        }

        try {
            const cloudPlaylist = await window.loadPlaylistFromFirestore?.();
            
            if (!cloudPlaylist) {
                window.DebugManager?.log('sync', "playlistSync.js: Cloud playlist je prázdný.");
                return {
                    identical: false,
                    reason: 'cloud_empty',
                    localCount: window.tracks.length,
                    cloudCount: 0,
                    recommendation: 'upload'
                };
            }

            const localHash = this.generatePlaylistHash(window.tracks);
            const cloudHash = this.generatePlaylistHash(cloudPlaylist);
            
            window.DebugManager?.log('sync', `playlistSync.js: Hash porovnání - Lokální: ${localHash}, Cloud: ${cloudHash}`);
            window.DebugManager?.log('sync', `playlistSync.js: Počet skladeb - Lokální: ${window.tracks.length}, Cloud: ${cloudPlaylist.length}`);
            
            const result = {
                identical: localHash === cloudHash,
                localHash: localHash,
                cloudHash: cloudHash,
                localCount: window.tracks.length,
                cloudCount: cloudPlaylist.length,
                localTracks: window.tracks,
                cloudTracks: cloudPlaylist
            };

            if (!result.identical) {
                result.differences = this.findDifferences(window.tracks, cloudPlaylist);
                result.recommendation = this.recommendAction(result.differences);
                
                window.DebugManager?.log('sync', "playlistSync.js: ⚠️ DETEKOVÁN ROZDÍL!");
                window.DebugManager?.log('sync', `  - Přidáno: ${result.differences.added.length} skladeb`);
                window.DebugManager?.log('sync', `  - Odebráno: ${result.differences.removed.length} skladeb`);
                window.DebugManager?.log('sync', `  - Změněno: ${result.differences.modified.length} skladeb`);
            }

            window.DebugManager?.log('sync', "playlistSync.js: Výsledek porovnání:", result);

            return result;

        } catch (error) {
            console.error("playlistSync.js: Chyba při porovnávání:", error);
            return { error: error.message };
        }
    },

    // Najde rozdíly mezi dvěma playlisty
    findDifferences: function(localTracks, cloudTracks) {
        const differences = {
            added: [],
            removed: [],
            modified: [],
            countChange: localTracks.length - cloudTracks.length
        };

        const localMap = new Map(localTracks.map(t => [t.title, t.src]));
        const cloudMap = new Map(cloudTracks.map(t => [t.title, t.src]));

        localTracks.forEach(track => {
            if (!cloudMap.has(track.title)) {
                differences.added.push(track.title);
            } else if (cloudMap.get(track.title) !== track.src) {
                differences.modified.push(track.title);
            }
        });

        cloudTracks.forEach(track => {
            if (!localMap.has(track.title)) {
                differences.removed.push(track.title);
            }
        });

        return differences;
    },

    // Doporučí akci na základě rozdílů
    recommendAction: function(differences) {
        if (differences.added.length > 0 || differences.modified.length > 0) {
            return 'upload';
        }
        if (differences.removed.length > 0 && differences.added.length === 0) {
            return 'download';
        }
        if (differences.countChange !== 0) {
            return 'upload';
        }
        return 'manual';
    },

    // Synchronizuje lokální playlist do cloudu
    syncLocalToCloud: async function(force = false) {
        window.DebugManager?.log('sync', "playlistSync.js: Spouštím synchronizaci lokálního playlistu do cloudu...");

        if (!window.tracks || !Array.isArray(window.tracks)) {
            const error = "Lokální playlist není dostupný!";
            console.error("playlistSync.js:", error);
            if (this.config.showNotifications && window.showNotification) {
                window.showNotification(error, 'error');
            }
            return { success: false, error: error };
        }

        try {
            if (!force) {
                const comparison = await this.comparePlaylistWithCloud();
                
                if (comparison.error) {
                    throw new Error(comparison.error);
                }

                if (comparison.identical) {
                    const message = "✅ Playlist je již synchronizovaný!";
                    window.DebugManager?.log('sync', "playlistSync.js:", message);
                    if (this.config.showNotifications && window.showNotification) {
                        window.showNotification(message, 'info', 3000);
                    }
                    return { 
                        success: true, 
                        action: 'none', 
                        message: message,
                        tracksCount: window.tracks.length 
                    };
                }

                if (comparison.differences) {
                    window.DebugManager?.log('sync', "playlistSync.js: Zjištěné rozdíly:", comparison.differences);
                }
            }

            window.DebugManager?.log('sync', `playlistSync.js: Nahrávám ${window.tracks.length} skladeb do cloudu...`);
            
            const uploadResult = await window.savePlaylistToFirestore?.(window.tracks);
            
            if (!uploadResult) {
                throw new Error("Funkce savePlaylistToFirestore není dostupná nebo selhala");
            }

            localStorage.setItem('currentPlaylist', JSON.stringify(window.tracks));
            localStorage.setItem('playlistLastSync', new Date().toISOString());
            localStorage.setItem('playlistHash', this.generatePlaylistHash(window.tracks));

            const successMessage = `🖖 Playlist synchronizován! (${window.tracks.length} skladeb)`;
            window.DebugManager?.log('sync', "playlistSync.js:", successMessage);
            
            if (this.config.showNotifications && window.showNotification) {
                window.showNotification(successMessage, 'info', 4000);
            }

            return {
                success: true,
                action: 'uploaded',
                message: successMessage,
                tracksCount: window.tracks.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const errorMessage = `Chyba při synchronizaci: ${error.message}`;
            console.error("playlistSync.js:", errorMessage, error);
            
            if (this.config.showNotifications && window.showNotification) {
                window.showNotification(errorMessage, 'error', 5000);
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    // Stáhne playlist z cloudu
    syncCloudToLocal: async function() {
        window.DebugManager?.log('sync', "playlistSync.js: Stahování playlistu z cloudu...");

        try {
            const cloudPlaylist = await window.loadPlaylistFromFirestore?.();
            
            if (!cloudPlaylist || cloudPlaylist.length === 0) {
                throw new Error("Cloud playlist je prázdný");
            }

            window.tracks = [...cloudPlaylist];
            localStorage.setItem('currentPlaylist', JSON.stringify(cloudPlaylist));
            localStorage.setItem('playlistLastSync', new Date().toISOString());
            localStorage.setItem('playlistHash', this.generatePlaylistHash(cloudPlaylist));

            const successMessage = `🖖 Playlist stažen z cloudu! (${cloudPlaylist.length} skladeb)`;
            window.DebugManager?.log('sync', "playlistSync.js:", successMessage);
            
            if (this.config.showNotifications && window.showNotification) {
                window.showNotification(successMessage, 'info', 4000);
            }

            if (window.populatePlaylist && typeof window.populatePlaylist === 'function') {
                window.populatePlaylist(window.tracks);
            }

            return {
                success: true,
                action: 'downloaded',
                message: successMessage,
                tracksCount: cloudPlaylist.length
            };

        } catch (error) {
            const errorMessage = `Chyba při stahování: ${error.message}`;
            console.error("playlistSync.js:", errorMessage, error);
            
            if (this.config.showNotifications && window.showNotification) {
                window.showNotification(errorMessage, 'error', 5000);
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    // Automatická kontrola při načtení
    autoCheckOnLoad: async function() {
        if (!this.config.autoSyncOnLoad) {
            window.DebugManager?.log('sync', "playlistSync.js: Automatická kontrola vypnuta.");
            return;
        }

        window.DebugManager?.log('sync', "playlistSync.js: Spouštím automatickou kontrolu playlistu...");

        await this.waitForFirebase();

        try {
            const comparison = await this.comparePlaylistWithCloud();

            if (comparison.error) {
                // Toto je varování, ale necháme ho v logu (uživatel to vidí na tlačítku)
                window.DebugManager?.log('sync', "playlistSync.js: Nelze porovnat playlist:", comparison.error);
                this.updateButtonStatus('warning');
                return;
            }

            if (comparison.identical) {
                window.DebugManager?.log('sync', "playlistSync.js: ✅ Playlist je synchronizovaný.");
                this.updateButtonStatus('ok');
                return;
            }

            // Důležité info, ale v tichém režimu skryté
            window.DebugManager?.log('sync', "playlistSync.js: ⚠️ Playlist se liší od cloudové verze!");
            this.updateButtonStatus('warning');
            
            if (comparison.differences) {
                window.DebugManager?.log('sync', "playlistSync.js: Rozdíly:", comparison.differences);
            }

            if (this.config.showNotifications && window.showNotification) {
                const diff = comparison.differences;
                const changes = [];
                if (diff.added.length > 0) changes.push(`+${diff.added.length} nových`);
                if (diff.removed.length > 0) changes.push(`-${diff.removed.length} odebraných`);
                if (diff.modified.length > 0) changes.push(`~${diff.modified.length} změněných`);
                
                window.showNotification(
                    `⚠️ Playlist se liší od cloudu! (${changes.join(', ')})`, 
                    'warn', 
                    6000
                );
            }

        } catch (error) {
            console.error("playlistSync.js: Chyba při automatické kontrole:", error);
            this.updateButtonStatus('error');
        }
    },

    // Počká na inicializaci Firebase
    waitForFirebase: function(timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const checkFirebase = setInterval(() => {
                if (window.db || (typeof firebase !== 'undefined' && firebase.apps?.length > 0)) {
                    clearInterval(checkFirebase);
                    window.DebugManager?.log('sync', "playlistSync.js: Firebase je připraveno.");
                    resolve(true);
                }
                
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkFirebase);
                    console.warn("playlistSync.js: Firebase timeout.");
                    resolve(false);
                }
            }, 500);
        });
    },

    // Zobrazí status synchronizace
    getStatus: async function() {
        try {
            const comparison = await this.comparePlaylistWithCloud();
            const lastSync = localStorage.getItem('playlistLastSync');
            const localHash = localStorage.getItem('playlistHash');

            return {
                synchronized: comparison.identical || false,
                localCount: window.tracks?.length || 0,
                cloudCount: comparison.cloudCount || 0,
                lastSync: lastSync ? new Date(lastSync) : null,
                localHash: localHash || 'unknown',
                currentHash: this.generatePlaylistHash(window.tracks || []),
                differences: comparison.differences || null
            };
        } catch (error) {
            return { error: error.message };
        }
    },

    // Export funkce pro ruční použití
    forceSync: async function() {
        window.DebugManager?.log('sync', "playlistSync.js: Vynucená synchronizace...");
        return await this.syncLocalToCloud(true);
    },

    // === SPRÁVA TLAČÍTKA (KOMPLETNÍ LOGIKA) ===

    // Inicializuje tlačítko
    initButton: function() {
        window.DebugManager?.log('sync', "playlistSync.js: Inicializuji synchronizační tlačítko...");

        // Najdeme tlačítko v DOM
        this.button = document.getElementById(this.config.buttonId);
        
        if (!this.button) {
            window.DebugManager?.log('sync', `playlistSync.js: Tlačítko s ID '${this.config.buttonId}' nenalezeno!`);
            return false;
        }

        window.DebugManager?.log('sync', "playlistSync.js: Tlačítko nalezeno, připojuji funkčnost...");

        // Připojíme event listener
        this.button.addEventListener('click', () => this.handleButtonClick());

        // Klávesová zkratka (Ctrl+Shift+S)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
                e.preventDefault();
                this.handleButtonClick();
            }
        });

        // Automatická kontrola stavu
        setTimeout(() => this.checkButtonStatus(), 4000);

        window.DebugManager?.log('sync', "playlistSync.js: Tlačítko inicializováno! (Zkratka: Ctrl+Shift+S)");
        return true;
    },

    // Handler pro kliknutí na tlačítko
    handleButtonClick: async function() {
        window.DebugManager?.log('sync', "🖖 Spouštím synchronizaci playlistu z tlačítka...");
        
        this.updateButtonState('syncing', 'Synchronizuji...');
        
        try {
            if (!window.PlaylistSyncManager || typeof window.syncPlaylist !== 'function') {
                throw new Error("PlaylistSyncManager není načten!");
            }

            const result = await window.syncPlaylist();

            if (result.success) {
                this.updateButtonState('success', `✅ ${result.message || 'Playlist synchronizován!'}`);
                this.updateButtonStatus('ok');
                window.DebugManager?.log('sync', "🖖 Synchronizace úspěšná:", result);
            } else {
                throw new Error(result.error || 'Neznámá chyba při synchronizaci');
            }

        } catch (error) {
            console.error("🖖 Chyba při synchronizaci:", error);
            this.updateButtonState('error', `❌ ${error.message}`);
            this.updateButtonStatus('error');
        }
    },

    // Aktualizuje vizuální stav tlačítka
    updateButtonState: function(state, message = '') {
        if (!this.button) return;

        this.button.classList.remove('syncing', 'success', 'error');
        
        if (state === 'syncing') {
            this.button.classList.add('syncing');
            this.button.disabled = true;
            if (message) this.button.setAttribute('title', message);
        } else if (state === 'success') {
            this.button.classList.add('success');
            this.button.disabled = false;
            if (message) this.button.setAttribute('title', message);
            setTimeout(() => {
                this.button.classList.remove('success');
                this.button.setAttribute('title', 'Synchronizovat playlist do cloudu (Ctrl+Shift+S)');
            }, 3000);
        } else if (state === 'error') {
            this.button.classList.add('error');
            this.button.disabled = false;
            if (message) this.button.setAttribute('title', message);
            setTimeout(() => {
                this.button.classList.remove('error');
                this.button.setAttribute('title', 'Synchronizovat playlist do cloudu (Ctrl+Shift+S)');
            }, 5000);
        } else {
            this.button.disabled = false;
            if (message) this.button.setAttribute('title', message);
        }
    },

    // Aktualizuje status indikátor (pokud existuje)
    updateButtonStatus: function(status) {
        if (!this.button) return;

        this.button.classList.remove('status-ok', 'status-warning', 'status-error');
        
        if (status === 'warning') {
            this.button.classList.add('status-warning');
        } else if (status === 'error') {
            this.button.classList.add('status-error');
        } else if (status === 'ok') {
            this.button.classList.add('status-ok');
        }
    },

    // Zkontroluje status a aktualizuje tlačítko
    checkButtonStatus: async function() {
        if (!this.button) return;

        try {
            let attempts = 0;
            const maxAttempts = 20;
            
            while (!window.PlaylistSyncManager && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }

            if (!window.PlaylistSyncManager) {
                console.warn("PlaylistSyncManager se nepodařilo načíst.");
                this.updateButtonStatus('warning');
                return;
            }

            const status = await window.checkPlaylistSync();
            
            if (status.error) {
                window.DebugManager?.log('sync', "Nelze zkontrolovat status:", status.error);
                this.updateButtonStatus('warning');
            } else if (!status.synchronized) {
                window.DebugManager?.log('sync', "⚠️ Playlist není synchronizován!");
                this.updateButtonStatus('warning');
                this.updateButtonState('idle', '⚠️ Playlist vyžaduje synchronizaci');
            } else {
                window.DebugManager?.log('sync', "✅ Playlist je synchronizován.");
                this.updateButtonStatus('ok');
            }

        } catch (error) {
            console.error("Chyba při kontrole status:", error);
            this.updateButtonStatus('warning');
        }
    }
};

// === AUTOMATICKÁ INICIALIZACE ===
if (typeof window !== 'undefined') {
    // Automatická kontrola playlistu po načtení
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.PlaylistSyncManager.autoCheckOnLoad();
                
                // Inicializujeme tlačítko, pokud je autoInit zapnutý
                if (window.PlaylistSyncManager.config.autoInitButton) {
                    window.PlaylistSyncManager.initButton();
                }
            }, 3000);
        });
    } else {
        setTimeout(() => {
            window.PlaylistSyncManager.autoCheckOnLoad();
            
            if (window.PlaylistSyncManager.config.autoInitButton) {
                window.PlaylistSyncManager.initButton();
            }
        }, 3000);
    }
}

// === EXPORT ZKRÁCENÝCH ALIASŮ ===
window.syncPlaylist = () => window.PlaylistSyncManager.syncLocalToCloud();
window.checkPlaylistSync = () => window.PlaylistSyncManager.getStatus();
window.forcePlaylistSync = () => window.PlaylistSyncManager.forceSync();

window.DebugManager?.log('sync', "🖖 playlistSync.js: Modul KOMPLETNĚ připraven!");