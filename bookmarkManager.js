/**
 * 🖖 STAR TREK AUDIO BOOKMARKS MODULE
 * Více admirál Jiřík & Admirál Claude.AI
 * Časové navigační souřadnice pro precizní skoky v trackách
 * Verze: 1.1 (DebugManager Integration)
 */
//1. voiceControl.js - "Computer, engage!"

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_BOOKMARK = false; 

class BookmarkManager {
    constructor() {
        this.bookmarks = new Map(); // trackTitle -> Array of bookmarks
        this.currentTrackBookmarks = [];
        this.isVisible = false;
        this.maxBookmarksPerTrack = 10;
        
        // DOM elements budou vytvořeny dynamicky
        this.container = null;
        this.bookmarksList = null;
        this.addBookmarkBtn = null;
        this.toggleBtn = null;
        
        this.init();
    }

    async init() {
        window.DebugManager?.log('bookmarks', "🔖 BookmarkManager: Inicializace modulu");
        
        await this.loadBookmarksData();
        this.createUI();
        this.attachEventListeners();
        this.injectStyles();
        
        // Připojení k hlavnímu audio playeru
        this.connectToAudioPlayer();
    }

    createUI() {
        // Toggle button do control panelu
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'bookmark-toggle';
        this.toggleBtn.className = 'control-button bookmark-toggle';
        this.toggleBtn.title = 'Záložky v trackách (Ctrl+B)';
        this.toggleBtn.innerHTML = '🔖';
        
        // Přidání do control panelu
        const controlsDiv = document.querySelector('#control-panel .controls');
        if (controlsDiv) {
            controlsDiv.appendChild(this.toggleBtn);
        } else {
            console.warn("BookmarkManager: Control panel nenalezen");
        }

        // Hlavní container pro bookmarky
        this.container = document.createElement('div');
        this.container.id = 'bookmark-container';
        this.container.className = 'bookmark-container hidden';
        
        this.container.innerHTML = `
            <div class="bookmark-header">
                <h3>🔖 Audio Záložky</h3>
                <div class="bookmark-controls">
                    <button id="add-bookmark" class="bookmark-btn add-btn" title="Přidat záložku (Ctrl+M)">
                        ➕ Přidat
                    </button>
                    <button id="clear-bookmarks" class="bookmark-btn clear-btn" title="Smazat všechny záložky">
                        🗑️ Vymazat
                    </button>
                </div>
            </div>
            <div class="bookmark-current-track">
                <span id="bookmark-track-title">Žádný track</span>
                <span id="bookmark-count">0/10</span>
            </div>
            <div id="bookmarks-list" class="bookmarks-list">
                <div class="bookmark-placeholder">
                    Zatím žádné záložky.<br>
                    Klikněte na ➕ Přidat během přehrávání.
                </div>
            </div>
            <div class="bookmark-timeline" id="bookmark-timeline">
                <div class="timeline-progress" id="timeline-progress"></div>
                <div class="timeline-markers" id="timeline-markers"></div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Cachování DOM elementů
        this.bookmarksList = document.getElementById('bookmarks-list');
        this.addBookmarkBtn = document.getElementById('add-bookmark');
        this.clearBookmarksBtn = document.getElementById('clear-bookmarks');
        this.timelineMarkers = document.getElementById('timeline-markers');
        this.timelineProgress = document.getElementById('timeline-progress');
        this.trackTitleSpan = document.getElementById('bookmark-track-title');
        this.bookmarkCountSpan = document.getElementById('bookmark-count');
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .bookmark-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 450px;
                max-width: 90vw;
                max-height: 80vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #00d4ff;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
                backdrop-filter: blur(10px);
                z-index: 1000;
                overflow: hidden;
                font-family: 'Orbitron', monospace;
            }

            .bookmark-container.hidden {
                display: none;
            }

            .bookmark-header {
                background: linear-gradient(90deg, #00d4ff 0%, #0066cc 100%);
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #000;
            }

            .bookmark-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: bold;
            }

            .bookmark-controls {
                display: flex;
                gap: 8px;
            }

            .bookmark-btn {
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: #fff;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .bookmark-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-1px);
            }

            .bookmark-current-track {
                background: rgba(0, 212, 255, 0.1);
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
                color: #00d4ff;
            }

            .bookmark-current-track span:first-child {
                font-weight: bold;
                max-width: 300px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .bookmarks-list {
                max-height: 300px;
                overflow-y: auto;
                padding: 8px;
            }

            .bookmark-placeholder {
                text-align: center;
                color: #666;
                padding: 40px 20px;
                font-style: italic;
            }

            .bookmark-item {
                background: rgba(0, 212, 255, 0.05);
                border: 1px solid rgba(0, 212, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .bookmark-item:hover {
                background: rgba(0, 212, 255, 0.15);
                border-color: #00d4ff;
                transform: translateX(4px);
            }

            .bookmark-info {
                flex: 1;
            }

            .bookmark-time {
                color: #00d4ff;
                font-weight: bold;
                font-size: 14px;
            }

            .bookmark-name {
                color: #ccc;
                font-size: 12px;
                margin-top: 2px;
            }

            .bookmark-actions {
                display: flex;
                gap: 8px;
            }

            .bookmark-action {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: color 0.2s ease;
            }

            .bookmark-action:hover {
                color: #00d4ff;
            }

            .bookmark-timeline {
                height: 60px;
                background: rgba(0, 0, 0, 0.3);
                margin: 8px;
                border-radius: 8px;
                position: relative;
                overflow: hidden;
                cursor: pointer;
            }

            .timeline-progress {
                height: 100%;
                background: linear-gradient(90deg, #00d4ff 0%, #0066cc 100%);
                width: 0%;
                transition: width 0.1s ease;
                opacity: 0.3;
            }

            .timeline-markers {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .timeline-marker {
                position: absolute;
                top: 0;
                width: 3px;
                height: 100%;
                background: #00d4ff;
                border-radius: 1px;
                box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
                animation: markerPulse 2s ease-in-out infinite;
            }

            @keyframes markerPulse {
                0%, 100% { opacity: 0.7; transform: scaleY(1); }
                50% { opacity: 1; transform: scaleY(1.1); }
            }

            .control-button.bookmark-toggle {
                position: relative;
            }

            .control-button.bookmark-toggle.active {
                background: rgba(0, 212, 255, 0.2);
                color: #00d4ff;
                box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
            }

            .control-button.bookmark-toggle.has-bookmarks::after {
                content: '';
                position: absolute;
                top: 2px;
                right: 2px;
                width: 6px;
                height: 6px;
                background: #ff4444;
                border-radius: 50%;
                animation: bookmarkNotify 1.5s ease-in-out infinite;
            }

            @keyframes bookmarkNotify {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }

            /* Mobile responsivita */
            @media (max-width: 768px) {
                .bookmark-container {
                    width: 95vw;
                    max-height: 85vh;
                }
                
                .bookmark-header {
                    padding: 10px 12px;
                }
                
                .bookmark-btn {
                    padding: 4px 8px;
                    font-size: 11px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    attachEventListeners() {
        // Toggle zobrazení bookmarků
        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Přidání nové záložky
        this.addBookmarkBtn.addEventListener('click', () => {
            this.addCurrentBookmark();
        });

        // Smazání všech záložek aktuálního tracku
        this.clearBookmarksBtn.addEventListener('click', () => {
            this.clearCurrentTrackBookmarks();
        });

        // Klik na timeline pro skok na pozici
        const timeline = document.getElementById('bookmark-timeline');
        if (timeline) {
            timeline.addEventListener('click', (e) => {
                this.handleTimelineClick(e);
            });
        }

        // Klávesové zkratky
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                this.toggle();
            }
            
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.addCurrentBookmark();
            }

            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Klik mimo container pro zavření
        document.addEventListener('click', (e) => {
            if (this.isVisible && 
                !this.container.contains(e.target) && 
                e.target !== this.toggleBtn) {
                this.hide();
            }
        });

        // Sledování změny tracku
        document.addEventListener('audioTrackChanged', (e) => {
            window.DebugManager?.log('bookmarks', "🔖 Track changed:", e.detail);
            this.updateCurrentTrack();
        });
    }

    connectToAudioPlayer() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) {
            console.warn("BookmarkManager: Audio player nenalezen");
            return;
        }

        // Update timeline progress
        audioPlayer.addEventListener('timeupdate', () => {
            this.updateTimelineProgress();
        });

        // Update na loadedmetadata
        audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateCurrentTrack();
        });
    }

    updateTimelineProgress() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer || !this.timelineProgress) return;

        const progress = audioPlayer.duration > 0 
            ? (audioPlayer.currentTime / audioPlayer.duration) * 100 
            : 0;
        
        this.timelineProgress.style.width = `${progress}%`;
    }

    updateCurrentTrack() {
        const trackTitleElement = document.getElementById('trackTitle');
        const currentTrackTitle = trackTitleElement ? trackTitleElement.textContent : 'Unknown';
        
        this.currentTrackBookmarks = this.bookmarks.get(currentTrackTitle) || [];
        
        if (this.trackTitleSpan) {
            this.trackTitleSpan.textContent = currentTrackTitle;
        }
        
        this.updateBookmarksList();
        this.updateTimelineMarkers();
        this.updateToggleButton();
    }

    addCurrentBookmark() {
        const audioPlayer = document.getElementById('audioPlayer');
        const trackTitleElement = document.getElementById('trackTitle');
        
        if (!audioPlayer || !trackTitleElement) {
            this.showNotification("Nepodařilo se získat informace o tracku", 'error');
            return;
        }

        const currentTime = audioPlayer.currentTime;
        const trackTitle = trackTitleElement.textContent;
        
        if (currentTime === 0) {
            this.showNotification("Spusťte přehrávání pro vytvoření záložky", 'warn');
            return;
        }

        if (this.currentTrackBookmarks.length >= this.maxBookmarksPerTrack) {
            this.showNotification(`Maximum ${this.maxBookmarksPerTrack} záložek na track`, 'warn');
            return;
        }

        // Prompt pro název záložky
        const bookmarkName = prompt(
            `🔖 Název záložky pro pozici ${this.formatTime(currentTime)}:`,
            `Záložka ${this.currentTrackBookmarks.length + 1}`
        );
        
        if (bookmarkName === null) return; // Cancel

        const bookmark = {
            id: Date.now(),
            name: bookmarkName.trim() || `Záložka ${this.currentTrackBookmarks.length + 1}`,
            time: currentTime,
            createdAt: new Date().toISOString()
        };

        // Kontrola duplicitní pozice (tolerance 2 sekundy)
        const duplicate = this.currentTrackBookmarks.find(
            b => Math.abs(b.time - currentTime) < 2
        );
        
        if (duplicate) {
            const overwrite = confirm(
                `Záložka "${duplicate.name}" už existuje na podobné pozici.\nPřepsat?`
            );
            if (overwrite) {
                this.removeBookmark(trackTitle, duplicate.id);
            } else {
                return;
            }
        }

        this.currentTrackBookmarks.push(bookmark);
        this.currentTrackBookmarks.sort((a, b) => a.time - b.time);
        
        this.bookmarks.set(trackTitle, this.currentTrackBookmarks);
        
        this.updateBookmarksList();
        this.updateTimelineMarkers();
        this.updateToggleButton();
        this.saveBookmarksData();

        this.showNotification(`✅ Záložka "${bookmark.name}" přidána`, 'success');
        
        window.DebugManager?.log('bookmarks', "🔖 Bookmark added:", bookmark, "to track:", trackTitle);
    }

    removeBookmark(trackTitle, bookmarkId) {
        const trackBookmarks = this.bookmarks.get(trackTitle) || [];
        const updatedBookmarks = trackBookmarks.filter(b => b.id !== bookmarkId);
        
        if (updatedBookmarks.length === 0) {
            this.bookmarks.delete(trackTitle);
        } else {
            this.bookmarks.set(trackTitle, updatedBookmarks);
        }
        
        if (trackTitle === (document.getElementById('trackTitle')?.textContent || '')) {
            this.currentTrackBookmarks = updatedBookmarks;
            this.updateBookmarksList();
            this.updateTimelineMarkers();
        }
        
        this.updateToggleButton();
        this.saveBookmarksData();
    }

    jumpToBookmark(time) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) return;

        audioPlayer.currentTime = time;
        this.showNotification(`⏭️ Skok na ${this.formatTime(time)}`, 'info');
        
        window.DebugManager?.log('bookmarks', "🔖 Jumped to bookmark at:", time);
    }

    clearCurrentTrackBookmarks() {
        const trackTitle = document.getElementById('trackTitle')?.textContent;
        if (!trackTitle) return;

        const count = this.currentTrackBookmarks.length;
        if (count === 0) {
            this.showNotification("Žádné záložky k smazání", 'info');
            return;
        }

        if (confirm(`Opravdu smazat všech ${count} záložek z tohoto tracku?`)) {
            this.bookmarks.delete(trackTitle);
            this.currentTrackBookmarks = [];
            
            this.updateBookmarksList();
            this.updateTimelineMarkers();
            this.updateToggleButton();
            this.saveBookmarksData();
            
            this.showNotification(`🗑️ Smazáno ${count} záložek`, 'info');
        }
    }

    updateBookmarksList() {
        if (!this.bookmarksList) return;

        this.bookmarksList.innerHTML = '';
        
        if (this.currentTrackBookmarks.length === 0) {
            this.bookmarksList.innerHTML = `
                <div class="bookmark-placeholder">
                    Zatím žádné záložky.<br>
                    Klikněte na ➕ Přidat během přehrávání.
                </div>
            `;
        } else {
            this.currentTrackBookmarks.forEach(bookmark => {
                const item = document.createElement('div');
                item.className = 'bookmark-item';
                item.innerHTML = `
                    <div class="bookmark-info">
                        <div class="bookmark-time">${this.formatTime(bookmark.time)}</div>
                        <div class="bookmark-name">${bookmark.name}</div>
                    </div>
                    <div class="bookmark-actions">
                        <button class="bookmark-action" onclick="bookmarkManager.jumpToBookmark(${bookmark.time})" title="Přehrát od této pozice">
                            ▶️
                        </button>
                        <button class="bookmark-action" onclick="bookmarkManager.editBookmark('${bookmark.id}')" title="Upravit název">
                            ✏️
                        </button>
                        <button class="bookmark-action" onclick="bookmarkManager.removeBookmark('${document.getElementById('trackTitle')?.textContent}', ${bookmark.id})" title="Smazat záložku">
                            🗑️
                        </button>
                    </div>
                `;
                this.bookmarksList.appendChild(item);
            });
        }

        // Update counter
        if (this.bookmarkCountSpan) {
            this.bookmarkCountSpan.textContent = 
                `${this.currentTrackBookmarks.length}/${this.maxBookmarksPerTrack}`;
        }
    }

    updateTimelineMarkers() {
        if (!this.timelineMarkers) return;

        this.timelineMarkers.innerHTML = '';
        
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer || !audioPlayer.duration) return;

        this.currentTrackBookmarks.forEach(bookmark => {
            const position = (bookmark.time / audioPlayer.duration) * 100;
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.style.left = `${position}%`;
            marker.title = `${bookmark.name} - ${this.formatTime(bookmark.time)}`;
            
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                this.jumpToBookmark(bookmark.time);
            });
            
            this.timelineMarkers.appendChild(marker);
        });
    }

    handleTimelineClick(e) {
        const timeline = e.currentTarget;
        const rect = timeline.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer || !audioPlayer.duration) return;
        
        const targetTime = percentage * audioPlayer.duration;
        this.jumpToBookmark(targetTime);
    }

    editBookmark(bookmarkId) {
        const trackTitle = document.getElementById('trackTitle')?.textContent;
        if (!trackTitle) return;

        const bookmark = this.currentTrackBookmarks.find(b => b.id == bookmarkId);
        if (!bookmark) return;

        const newName = prompt(`Upravit název záložky:`, bookmark.name);
        if (newName === null || newName.trim() === bookmark.name) return;

        bookmark.name = newName.trim() || bookmark.name;
        this.bookmarks.set(trackTitle, this.currentTrackBookmarks);
        
        this.updateBookmarksList();
        this.saveBookmarksData();
        
        this.showNotification(`✏️ Záložka přejmenována`, 'success');
    }

    updateToggleButton() {
        if (!this.toggleBtn) return;
        
        const hasAnyBookmarks = this.bookmarks.size > 0;
        
        this.toggleBtn.classList.toggle('has-bookmarks', hasAnyBookmarks);
        this.toggleBtn.title = hasAnyBookmarks 
            ? `Záložky v trackách (${this.bookmarks.size} tracků) - Ctrl+B`
            : 'Záložky v trackách - Ctrl+B';
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (!this.container) return;
        
        this.updateCurrentTrack();
        this.container.classList.remove('hidden');
        this.toggleBtn.classList.add('active');
        this.isVisible = true;
        
        window.DebugManager?.log('bookmarks', "🔖 Bookmark manager shown");
    }

    hide() {
        if (!this.container) return;
        
        this.container.classList.add('hidden');
        this.toggleBtn.classList.remove('active');
        this.isVisible = false;
        
        window.DebugManager?.log('bookmarks', "🔖 Bookmark manager hidden");
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Data persistence
    async saveBookmarksData() {
        const data = {
            bookmarks: Array.from(this.bookmarks.entries()),
            timestamp: Date.now()
        };

        // LocalStorage backup
        localStorage.setItem('audioBookmarks', JSON.stringify(data));

        // Firestore save (if available)
        try {
            if (typeof window.saveBookmarksToFirestore === 'function') {
                await window.saveBookmarksToFirestore(data);
            }
        } catch (error) {
            console.warn("BookmarkManager: Firestore save failed:", error);
        }

        window.DebugManager?.log('bookmarks', "🔖 Bookmarks saved:", data);
    }

    async loadBookmarksData() {
        try {
            // Try Firestore first
            if (typeof window.loadBookmarksFromFirestore === 'function') {
                const firestoreData = await window.loadBookmarksFromFirestore();
                if (firestoreData?.bookmarks) {
                    this.bookmarks = new Map(firestoreData.bookmarks);
                    window.DebugManager?.log('bookmarks', "🔖 Bookmarks loaded from Firestore");
                    return;
                }
            }
        } catch (error) {
            console.warn("BookmarkManager: Firestore load failed:", error);
        }

        // Fallback to localStorage
        const savedData = localStorage.getItem('audioBookmarks');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.bookmarks) {
                    this.bookmarks = new Map(data.bookmarks);
                    window.DebugManager?.log('bookmarks', "🔖 Bookmarks loaded from localStorage");
                }
            } catch (error) {
                console.error("BookmarkManager: Failed to parse saved bookmarks:", error);
            }
        }
    }

    // Export/Import functions for advanced users
    exportBookmarks() {
        const data = {
            bookmarks: Array.from(this.bookmarks.entries()),
            timestamp: Date.now(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `star-trek-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('📁 Záložky exportovány', 'success');
    }

    importBookmarks(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.bookmarks && Array.isArray(data.bookmarks)) {
                    const importedCount = data.bookmarks.length;
                    this.bookmarks = new Map(data.bookmarks);
                    this.updateCurrentTrack();
                    this.updateToggleButton();
                    this.saveBookmarksData();
                    
                    this.showNotification(
                        `📁 Importováno ${importedCount} záložkových skupin`, 
                        'success'
                    );
                } else {
                    throw new Error('Neplatný formát souboru');
                }
            } catch (error) {
                this.showNotification('❌ Chyba při importu: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // API pro externí použití
    getBookmarksForTrack(trackTitle) {
        return this.bookmarks.get(trackTitle) || [];
    }

    getAllBookmarks() {
        return Array.from(this.bookmarks.entries());
    }

    getTotalBookmarksCount() {
        let total = 0;
        this.bookmarks.forEach(trackBookmarks => {
            total += trackBookmarks.length;
        });
        return total;
    }
}

// Globální inicializace
let bookmarkManager;

// Auto-inicializace po DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bookmarkManager = new BookmarkManager();
        window.bookmarkManager = bookmarkManager; // Global access
    });
} else {
    bookmarkManager = new BookmarkManager();
    window.bookmarkManager = bookmarkManager;
}

// Export pro ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarkManager;
}