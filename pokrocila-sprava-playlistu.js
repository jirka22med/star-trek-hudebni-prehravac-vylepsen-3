/**
 * 🖖 POKROČILÁ SPRÁVA PLAYLISTU - PŘÍPOJNÝ MODUL
 * Více admirál Jiřík & Admirál Claude.AI
 * Rozšíření pro audioPlayer.js s modálním oknem pro správu playlistu
 * Verze: 1.1 (DebugManager Integration)
 */

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_PLAYLIST_MANAGER = false;

// --- Globální proměnné pro správu playlistu ---
let playlistManagerModal = null;
let playlistManagerButton = null;
let isPlaylistManagerInitialized = false;
let draggedTrackIndex = null;
let customTrackNames = JSON.parse(localStorage.getItem('customTrackNames') || '{}');

// --- Vytvoření modálního okna ---
function createPlaylistManagerModal() {
    if (playlistManagerModal) return;
    
    playlistManagerModal = document.createElement('div');
    playlistManagerModal.id = 'playlist-manager-modal';
    playlistManagerModal.className = 'playlist-modal-overlay';
    
    playlistManagerModal.innerHTML = `
        <div class="playlist-modal-content">
            <div class="playlist-modal-header">
                <h2>🖖 Pokročilá správa playlistu</h2>
                <button class="modal-close-button" id="close-playlist-manager">✕</button>
            </div>
            
            <div class="playlist-modal-body">
                <!-- Ovládací panel -->
                <div class="playlist-controls-panel">
                    <div class="control-group">
                        <button id="add-custom-track" class="playlist-action-btn">
                            🎵 Přidat skladbu
                        </button>
                        <button id="import-playlist" class="playlist-action-btn">
                            📥 Import M3U
                        </button>
                        <button id="export-playlist" class="playlist-action-btn">
                            📤 Export M3U
                        </button>
                    </div>
                    
                    <div class="control-group">
                        <button id="clear-custom-names" class="playlist-action-btn warning">
                            🗑️ Vymazat vlastní názvy
                        </button>
                        <button id="reset-playlist-order" class="playlist-action-btn warning">
                            ↩️ Obnovit pořadí
                        </button>
                    </div>
                    
                    <div class="playlist-stats">
                        <span id="playlist-count">Skladeb: 0</span>
                        <span id="favorites-count">Oblíbených: 0</span>
                    </div>
                </div>
                
                <!-- Seznam skladeb s pokročilými funkcemi -->
                <div class="advanced-playlist" id="advanced-playlist">
                    <div class="playlist-header">
                        <span class="track-number">#</span>
                        <span class="track-title">Název skladby</span>
                        <span class="track-actions">Akce</span>
                    </div>
                    <div class="playlist-tracks" id="advanced-tracks-list">
                        <!-- Zde budou skladby -->
                    </div>
                </div>
            </div>
            
            <div class="playlist-modal-footer">
                <button id="save-playlist-changes" class="playlist-save-btn">
                    💾 Uložit změny
                </button>
                <button id="cancel-playlist-changes" class="playlist-cancel-btn">
                    ❌ Zrušit
                </button>
            </div>
        </div>
        
        <!-- Formulář pro přidání skladby -->
        <div class="add-track-form" id="add-track-form" style="display: none;">
            <div class="form-content">
                <h3>➕ Přidat novou skladbu</h3>
                <div class="form-group">
                    <label for="track-title-input">Název skladby:</label>
                    <input type="text" id="track-title-input" placeholder="Zadejte název skladby" />
                </div>
                <div class="form-group">
                    <label for="track-url-input">URL adresa:</label>
                    <input type="url" id="track-url-input" placeholder="https://..." />
                </div>
                <div class="form-actions">
                    <button id="confirm-add-track" class="playlist-save-btn">✅ Přidat</button>
                    <button id="cancel-add-track" class="playlist-cancel-btn">❌ Zrušit</button>
                </div>
            </div>
        </div>
        
        <!-- Import file input (skrytý) -->
        <input type="file" id="import-file-input" accept=".m3u,.m3u8" style="display: none;" />
    `;
    
    document.body.appendChild(playlistManagerModal);
    
    // Přidání CSS stylů
    addPlaylistManagerStyles();
    
    window.DebugManager?.log('playlistManager', "PlaylistManager: Modální okno vytvořeno.");
}

// --- CSS styly pro modální okno ---
function addPlaylistManagerStyles() {
    const existingStyle = document.getElementById('playlist-manager-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'playlist-manager-styles';
    style.textContent = `
        /* === MODÁLNÍ OKNO SPRÁVY PLAYLISTU === */
        .playlist-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        }
        
        .playlist-modal-overlay.show {
            display: flex;
        }
        
        .playlist-modal-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            border: 2px solid #00d4ff;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 212, 255, 0.3);
            width: 90%;
            max-width: 900px;
            max-height: 85vh;
            overflow: hidden;
            animation: modalSlideIn 0.4s ease-out;
        }
        
        .playlist-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(90deg, #00d4ff, #0099cc);
            color: #000;
        }
        
        .playlist-modal-header h2 {
            margin: 0;
            font-size: 1.4em;
            font-weight: bold;
        }
        
        .modal-close-button {
            background: rgba(0, 0, 0, 0.2);
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            color: #000;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .modal-close-button:hover {
            background: rgba(255, 0, 0, 0.7);
            color: white;
            transform: scale(1.1);
        }
        
        .playlist-modal-body {
            padding: 20px;
            max-height: 60vh;
            overflow-y: auto;
            color: white;
        }
        
        /* === OVLÁDACÍ PANEL === */
        .playlist-controls-panel {
            margin-bottom: 25px;
        }
        
        .control-group {
            display: flex;
            gap: 12px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .playlist-action-btn {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }
        
        .playlist-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
        }
        
        .playlist-action-btn.warning {
            background: linear-gradient(45deg, #ff6b35, #cc5522);
            color: white;
        }
        
        .playlist-action-btn.warning:hover {
            box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
        }
        
        .playlist-stats {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #00d4ff;
            font-weight: bold;
        }
        
        /* === POKROČILÝ PLAYLIST === */
        .advanced-playlist {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(0, 212, 255, 0.3);
        }
        
        .playlist-header {
            display: grid;
            grid-template-columns: 50px 1fr 200px;
            gap: 15px;
            padding: 12px 15px;
            background: rgba(0, 212, 255, 0.1);
            font-weight: bold;
            color: #00d4ff;
            border-bottom: 1px solid rgba(0, 212, 255, 0.3);
        }
        
        .playlist-tracks {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .advanced-track-item {
            display: grid;
            grid-template-columns: 50px 1fr 200px;
            gap: 15px;
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.2s;
            cursor: grab;
        }
        
        .advanced-track-item:hover {
            background: rgba(0, 212, 255, 0.1);
        }
        
        .advanced-track-item.active {
            background: rgba(0, 212, 255, 0.2);
            border-left: 4px solid #00d4ff;
        }
        
        .advanced-track-item.dragging {
            opacity: 0.5;
            cursor: grabbing;
        }
        
        .track-number {
            color: #888;
            font-weight: bold;
            text-align: center;
        }
        
        .track-title-container {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .track-title-display {
            font-weight: bold;
            color: white;
        }
        
        .track-title-edit {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00d4ff;
            border-radius: 5px;
            padding: 5px 8px;
            color: white;
            font-size: 14px;
        }
        
        .track-original-title {
            font-size: 12px;
            color: #888;
            font-style: italic;
        }
        
        .track-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .track-btn {
            background: rgba(0, 212, 255, 0.2);
            border: 1px solid #00d4ff;
            border-radius: 5px;
            padding: 5px 8px;
            color: #00d4ff;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 12px;
        }
        
        .track-btn:hover {
            background: #00d4ff;
            color: #000;
        }
        
        .track-btn.danger {
            border-color: #ff6b35;
            color: #ff6b35;
        }
        
        .track-btn.danger:hover {
            background: #ff6b35;
            color: white;
        }
        
        /* === FORMULÁŘ PŘIDÁNÍ SKLADBY === */
        .add-track-form {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #00d4ff;
            border-radius: 15px;
            padding: 25px;
            z-index: 10001;
            box-shadow: 0 20px 60px rgba(0, 212, 255, 0.4);
        }
        
        .form-content h3 {
            color: #00d4ff;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            color: white;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00d4ff;
            border-radius: 5px;
            color: white;
            font-size: 14px;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #00d4ff;
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
        }
        
        .form-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 20px;
        }
        
        /* === FOOTER === */
        .playlist-modal-footer {
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .playlist-save-btn, .playlist-cancel-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .playlist-save-btn {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
        }
        
        .playlist-save-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
        }
        
        .playlist-cancel-btn {
            background: linear-gradient(45deg, #dc3545, #c82333);
            color: white;
        }
        
        .playlist-cancel-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
        }
        
        /* === ANIMACE === */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-50px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* === RESPONSIVNÍ DESIGN === */
        @media (max-width: 768px) {
            .playlist-modal-content {
                width: 95%;
                max-height: 90vh;
            }
            
            .playlist-header,
            .advanced-track-item {
                grid-template-columns: 40px 1fr 120px;
                gap: 10px;
            }
            
            .control-group {
                flex-direction: column;
            }
            
            .playlist-action-btn {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
    window.DebugManager?.log('playlistManager', "PlaylistManager: Styly přidány.");
}

// --- Vytvoření tlačítka pro otevření správy playlistu ---
function createPlaylistManagerButton() {
    if (playlistManagerButton) return;
    
    playlistManagerButton = document.createElement('button');
    playlistManagerButton.id = 'playlist-manager-button';
    playlistManagerButton.className = 'control-button';
    playlistManagerButton.title = 'Pokročilá správa playlistu (Ctrl+P)';
    playlistManagerButton.innerHTML = '🎛️';
    
    // Přidání do control panelu
    const controlsDiv = document.querySelector('#control-panel');
    if (controlsDiv) {
        controlsDiv.appendChild(playlistManagerButton);
    } else {
        console.warn("PlaylistManager: Nenalezen element .controls pro tlačítko.");
    }
    
    window.DebugManager?.log('playlistManager', "PlaylistManager: Tlačítko vytvořeno.");
}

// --- Naplnění pokročilého playlistu ---
function populateAdvancedPlaylist() {
    const tracksList = document.getElementById('advanced-tracks-list');
    const playlistCount = document.getElementById('playlist-count');
    const favoritesCount = document.getElementById('favorites-count');
    
    if (!tracksList) return;
    
    tracksList.innerHTML = '';
    
    if (!window.tracks || window.tracks.length === 0) {
        tracksList.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">Žádné skladby v playlistu</div>';
        if (playlistCount) playlistCount.textContent = 'Skladeb: 0';
        return;
    }
    
    // Aktualizace statistik
    if (playlistCount) playlistCount.textContent = `Skladeb: ${window.tracks.length}`;
    if (favoritesCount && window.favorites) favoritesCount.textContent = `Oblíbených: ${window.favorites.length}`;
    
    window.tracks.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'advanced-track-item';
        trackItem.draggable = true;
        trackItem.dataset.trackIndex = index;
        
        // Kontrola, zda je skladba aktuálně přehrávaná
        const isActive = (index === window.currentTrackIndex && 
                         window.DOM && window.DOM.audioPlayer && !window.DOM.audioPlayer.paused);
        
        if (isActive) trackItem.classList.add('active');
        
        const customName = customTrackNames[track.src] || '';
        const displayTitle = customName || track.title;
        
        trackItem.innerHTML = `
            <div class="track-number">${index + 1}</div>
            <div class="track-title-container">
                <div class="track-title-display" onclick="editTrackTitle(${index})">${displayTitle}</div>
                ${customName ? `<div class="track-original-title">Původní: ${track.title}</div>` : ''}
            </div>
            <div class="track-actions">
                <button class="track-btn" onclick="playTrackFromManager(${index})" title="Přehrát">▶️</button>
                <button class="track-btn" onclick="editTrackTitle(${index})" title="Přejmenovat">✏️</button>
                <button class="track-btn" onclick="toggleFavoriteFromManager('${track.title}')" title="Oblíbené">
                    ${window.favorites && window.favorites.includes(track.title) ? '⭐' : '☆'}
                </button>
                <button class="track-btn danger" onclick="removeTrackFromManager(${index})" title="Smazat">🗑️</button>
            </div>
        `;
        
        // Drag & Drop události
        trackItem.addEventListener('dragstart', handleDragStart);
        trackItem.addEventListener('dragover', handleDragOver);
        trackItem.addEventListener('drop', handleDrop);
        trackItem.addEventListener('dragend', handleDragEnd);
        
        tracksList.appendChild(trackItem);
    });
}

// --- Drag & Drop funkce ---
function handleDragStart(e) {
    draggedTrackIndex = parseInt(e.target.dataset.trackIndex);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    window.DebugManager?.log('playlistManager', `Drag start: index ${draggedTrackIndex}`);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.target.closest('.advanced-track-item').dataset.trackIndex);
    
    if (draggedTrackIndex !== null && draggedTrackIndex !== targetIndex) {
        // Přesunutí skladby v poli
        const draggedTrack = window.tracks[draggedTrackIndex];
        window.tracks.splice(draggedTrackIndex, 1);
        window.tracks.splice(targetIndex, 0, draggedTrack);
        
        // Aktualizace indexu současné skladby
        if (window.currentTrackIndex === draggedTrackIndex) {
            window.currentTrackIndex = targetIndex;
        } else if (window.currentTrackIndex > draggedTrackIndex && window.currentTrackIndex <= targetIndex) {
            window.currentTrackIndex--;
        } else if (window.currentTrackIndex < draggedTrackIndex && window.currentTrackIndex >= targetIndex) {
            window.currentTrackIndex++;
        }
        
        populateAdvancedPlaylist();
        window.DebugManager?.log('playlistManager', `Track moved from ${draggedTrackIndex} to ${targetIndex}`);
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedTrackIndex = null;
}

// --- Funkce pro tlačítka v playlistu ---
window.playTrackFromManager = function(index) {
    if (window.playTrack) {
        window.playTrack(index);
        populateAdvancedPlaylist(); // Obnovit pro zvýraznění aktivní skladby
    }
};

window.editTrackTitle = function(index) {
    const trackItem = document.querySelector(`[data-track-index="${index}"]`);
    const titleDisplay = trackItem.querySelector('.track-title-display');
    const currentTitle = titleDisplay.textContent;
    const track = window.tracks[index];
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'track-title-edit';
    input.value = currentTitle;
    
    titleDisplay.replaceWith(input);
    input.focus();
    input.select();
    
    const saveEdit = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== track.title) {
            customTrackNames[track.src] = newTitle;
            localStorage.setItem('customTrackNames', JSON.stringify(customTrackNames));
        } else if (newTitle === track.title || !newTitle) {
            delete customTrackNames[track.src];
            localStorage.setItem('customTrackNames', JSON.stringify(customTrackNames));
        }
        populateAdvancedPlaylist();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            populateAdvancedPlaylist();
        }
    });
};

window.toggleFavoriteFromManager = function(trackTitle) {
    if (window.toggleFavorite) {
        window.toggleFavorite(trackTitle);
        setTimeout(() => populateAdvancedPlaylist(), 100); // Malé zpoždění pro aktualizaci
    }
};

window.removeTrackFromManager = function(index) {
    const track = window.tracks[index];
    if (confirm(`Opravdu chcete odstranit skladbu "${track.title}" z playlistu?`)) {
        window.tracks.splice(index, 1);
        
        // Úprava indexu aktuální skladby
        if (window.currentTrackIndex > index) {
            window.currentTrackIndex--;
        } else if (window.currentTrackIndex === index && window.tracks.length > 0) {
            window.currentTrackIndex = Math.min(window.currentTrackIndex, window.tracks.length - 1);
        }
        
        // Odstranit vlastní název, pokud existuje
        delete customTrackNames[track.src];
        localStorage.setItem('customTrackNames', JSON.stringify(customTrackNames));
        
        populateAdvancedPlaylist();
        window.showNotification(`Skladba "${track.title}" odstraněna z playlistu.`, 'info');
    }
};

// --- Funkce pro ovládací tlačítka ---
function addCustomTrack() {
    const addForm = document.getElementById('add-track-form');
    const titleInput = document.getElementById('track-title-input');
    const urlInput = document.getElementById('track-url-input');
    
    addForm.style.display = 'block';
    titleInput.focus();
    
    // Reset formuláře
    titleInput.value = '';
    urlInput.value = '';
}

function confirmAddTrack() {
    const titleInput = document.getElementById('track-title-input');
    const urlInput = document.getElementById('track-url-input');
    const addForm = document.getElementById('add-track-form');
    
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!title || !url) {
        window.showNotification('Vyplňte prosím všechna pole!', 'warn');
        return;
    }
    
    // Ověření URL
    try {
        new URL(url);
    } catch {
        window.showNotification('Neplatná URL adresa!', 'error');
        return;
    }
    
    // Přidání skladby
    const newTrack = { title, src: url };
    window.tracks.push(newTrack);
    
    addForm.style.display = 'none';
    populateAdvancedPlaylist();
    window.showNotification(`Skladba "${title}" byla přidána!`, 'info');
    
    window.DebugManager?.log('playlistManager', `Added track: ${title} - ${url}`);
}

function cancelAddTrack() {
    document.getElementById('add-track-form').style.display = 'none';
}

function exportPlaylistAsM3U() {
    if (!window.tracks || window.tracks.length === 0) {
        window.showNotification('Playlist je prázdný!', 'warn');
        return;
    }
    
    let m3uContent = '#EXTM3U\n';
    
    window.tracks.forEach(track => {
        const displayTitle = customTrackNames[track.src] || track.title;
        m3uContent += `#EXTINF:-1,${displayTitle}\n`;
        m3uContent += `${track.src}\n`;
    });
    
    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.m3u';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    window.showNotification('Playlist exportován jako M3U!', 'info');
}

function importPlaylistFromM3U() {
    const fileInput = document.getElementById('import-file-input');
    fileInput.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n');
        let currentTitle = '';
        let tracksAdded = 0;
        
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#EXTINF:')) {
                // Extrakce názvu z #EXTINF řádku
                const titleMatch = line.match(/,(.+)$/);
                currentTitle = titleMatch ? titleMatch[1] : 'Unknown';
            } else if (line && !line.startsWith('#') && line.includes('://')) {
                // URL řádek
                const newTrack = {
                    title: currentTitle || 'Unknown',
                    src: line
                };
                window.tracks.push(newTrack);
                tracksAdded++;
                currentTitle = '';
            }
        });
        
        if (tracksAdded > 0) {
            populateAdvancedPlaylist();
            window.showNotification(`Importováno ${tracksAdded} skladeb z M3U!`, 'info');
        } else {
            window.showNotification('Nepodařilo se načíst žádné skladby!', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function clearCustomNames() {
    if (confirm('Opravdu chcete vymazat všechny vlastní názvy skladeb?')) {
        customTrackNames = {};
        localStorage.setItem('customTrackNames', JSON.stringify(customTrackNames));
        populateAdvancedPlaylist();
        window.showNotification('Vlastní názvy skladeb vymazány!', 'info');
    }
}

function resetPlaylistOrder() {
    if (confirm('Opravdu chcete obnovit původní pořadí playlistu?')) {
        // Pokud máme originalTracks, použijeme je
        if (window.originalTracks && window.originalTracks.length > 0) {
            window.tracks = [...window.originalTracks];
        }
        window.currentTrackIndex = 0;
        populateAdvancedPlaylist();
        window.showNotification('Pořadí playlistu obnoveno!', 'info');
    }
}

// --- Hlavní funkce pro otevření/zavření správy playlistu ---
function openPlaylistManager() {
    if (!playlistManagerModal) {
        createPlaylistManagerModal();
        addPlaylistManagerEventListeners();
    }
    
    populateAdvancedPlaylist();
    playlistManagerModal.classList.add('show');
    
    window.DebugManager?.log('playlistManager', "PlaylistManager: Modální okno otevřeno.");
}

function closePlaylistManager() {
    if (playlistManagerModal) {
        playlistManagerModal.classList.remove('show');
    }
    
    // Skrytí formuláře pro přidání skladby
    const addForm = document.getElementById('add-track-form');
    if (addForm) addForm.style.display = 'none';
    
    window.DebugManager?.log('playlistManager', "PlaylistManager: Modální okno zavřeno.");
}

// --- Event Listeners pro modální okno ---
function addPlaylistManagerEventListeners() {
    // Zavření okna
    document.getElementById('close-playlist-manager')?.addEventListener('click', closePlaylistManager);
    document.getElementById('cancel-playlist-changes')?.addEventListener('click', closePlaylistManager);
    
    // Uložení změn
    document.getElementById('save-playlist-changes')?.addEventListener('click', async () => {
        // Uložení dat pomocí existujících funkcí
        if (window.debounceSaveAudioData) {
            await window.debounceSaveAudioData();
        }
        
        // Aktualizace hlavního playlistu
        if (window.populatePlaylist && window.currentPlaylist) {
            window.currentPlaylist = [...window.tracks];
            window.populatePlaylist(window.currentPlaylist);
        }
        
        window.showNotification('Změny playlistu uloženy!', 'info');
        closePlaylistManager();
    });
    
    // Ovládací tlačítka
    document.getElementById('add-custom-track')?.addEventListener('click', addCustomTrack);
    document.getElementById('import-playlist')?.addEventListener('click', importPlaylistFromM3U);
    document.getElementById('export-playlist')?.addEventListener('click', exportPlaylistAsM3U);
    document.getElementById('clear-custom-names')?.addEventListener('click', clearCustomNames);
    document.getElementById('reset-playlist-order')?.addEventListener('click', resetPlaylistOrder);
    
    // Formulář přidání skladby
    document.getElementById('confirm-add-track')?.addEventListener('click', confirmAddTrack);
    document.getElementById('cancel-add-track')?.addEventListener('click', cancelAddTrack);
    
    // Import souboru
    document.getElementById('import-file-input')?.addEventListener('change', handleFileImport);
    
    // Zavření při kliknutí mimo modální okno
    playlistManagerModal?.addEventListener('click', (e) => {
        if (e.target === playlistManagerModal) {
            closePlaylistManager();
        }
    });
    
    // Klávesové zkratky pro modální okno
    document.addEventListener('keydown', (e) => {
        if (playlistManagerModal && playlistManagerModal.classList.contains('show')) {
            if (e.key === 'Escape') {
                closePlaylistManager();
            }
        }
    });
    
    window.DebugManager?.log('playlistManager', "PlaylistManager: Event listeners přidány.");
}

// --- Klávesová zkratka pro otevření správy ---
function addGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+P pro otevření správy playlistu
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            openPlaylistManager();
        }
    });
}

// --- Integrace s existujícím systémem ---
function integrateWithExistingSystem() {
    // Čekáme na načtení hlavního systému
    const checkSystemReady = setInterval(() => {
        if (window.tracks && window.DOM && window.populatePlaylist) {
            clearInterval(checkSystemReady);
            
            // Načtení vlastních názvů
            customTrackNames = JSON.parse(localStorage.getItem('customTrackNames') || '{}');
            
            // Aplikace vlastních názvů na stávající playlist
            applyCustomNamesToMainPlaylist();
            
            window.DebugManager?.log('playlistManager', "PlaylistManager: Integrace s hlavním systémem dokončena.");
        }
    }, 100);
}

// --- Aplikace vlastních názvů na hlavní playlist ---
function applyCustomNamesToMainPlaylist() {
    // Přepíšeme původní populatePlaylist funkci
    const originalPopulatePlaylist = window.populatePlaylist;
    
    window.populatePlaylist = function(listToDisplay) {
        // Aplikujeme vlastní názvy před zobrazením
        const modifiedList = listToDisplay.map(track => ({
            ...track,
            title: customTrackNames[track.src] || track.title
        }));
        
        // Zavoláme původní funkci s upravenými názvy
        originalPopulatePlaylist.call(this, modifiedList);
    };
    
    // Aktualizujeme aktuální zobrazení
    if (window.currentPlaylist) {
        window.populatePlaylist(window.currentPlaylist);
    }
}

// --- Aktualizace názvu aktuální skladby ---
function updateCurrentTrackTitle() {
    if (window.DOM && window.DOM.trackTitle && window.tracks && window.currentTrackIndex >= 0) {
        const currentTrack = window.tracks[window.currentTrackIndex];
        if (currentTrack) {
            const displayTitle = customTrackNames[currentTrack.src] || currentTrack.title;
            window.DOM.trackTitle.textContent = displayTitle;
        }
    }
}

// --- Sledování změn aktuální skladby ---
function watchCurrentTrackChanges() {
    if (window.DOM && window.DOM.audioPlayer) {
        const audioPlayer = window.DOM.audioPlayer;
        
        // Poslouchej události změny skladby
        const originalPlay = window.playTrack;
        if (originalPlay) {
            window.playTrack = function(index) {
                originalPlay.call(this, index);
                setTimeout(updateCurrentTrackTitle, 100); // Malé zpoždění
            };
        }
        
        // Poslouchej události načtení metadat
        audioPlayer.addEventListener('loadedmetadata', updateCurrentTrackTitle);
        audioPlayer.addEventListener('play', updateCurrentTrackTitle);
    }
}

// --- Přidání HTML tlačítka do stránky ---
function addPlaylistManagerButtonToHTML() {
    // Najdeme hlavní playlist element
    const mainPlaylist = document.getElementById('playlist');
    if (!mainPlaylist) {
        console.warn("PlaylistManager: Hlavní playlist nenalezen.");
        return;
    }
    
    // Vytvoříme kontejner pro tlačítko, pokud neexistuje
    let buttonContainer = document.querySelector('.controls');
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'controls';
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            margin: 10px 0;
            gap: 10px;
        `; 
        
        // Vložíme kontejner před hlavní playlist
        mainPlaylist.parentNode.insertBefore(buttonContainer, mainPlaylist);
    }
    
    // Vytvoříme stylizované tlačítko
    const managerButton = document.createElement('button');
    managerButton.id = 'open-playlist-manager';
    managerButton.innerHTML = '🎛️ ';
    managerButton.title = 'Otevřít pokročilou správu playlistu (Ctrl+P)';
    managerButton.style.cssText = `
        background: linear-gradient(45deg, #00d4ff, #0099cc);
        border: none;
        border-radius: 10px;
        padding: 12px 20px;
        color: #000;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
    `;
    
    // Hover efekt
    managerButton.addEventListener('mouseenter', () => {
        managerButton.style.transform = 'translateY(-2px)';
        managerButton.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.5)';
    });
    
    managerButton.addEventListener('mouseleave', () => {
        managerButton.style.transform = 'translateY(0)';
        managerButton.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)';
    });
    
    // Event listener pro otevření
    managerButton.addEventListener('click', openPlaylistManager);
    
    buttonContainer.appendChild(managerButton);
    
    window.DebugManager?.log('playlistManager', "PlaylistManager: HTML tlačítko přidáno.");
}

// --- Hlavní inicializační funkce ---
function initializePlaylistManager() {
    if (isPlaylistManagerInitialized) return;
    
    window.DebugManager?.log('playlistManager', "PlaylistManager: Spouštím inicializaci...");
    
    // Čekáme na načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePlaylistManager);
        return;
    }
    
    // Přidáme HTML tlačítko
    addPlaylistManagerButtonToHTML();
    
    // Vytvoříme modální okno (ale nezobrazíme)
    createPlaylistManagerModal();
    addPlaylistManagerEventListeners();
    
    // Přidáme globální klávesové zkratky
    addGlobalKeyboardShortcuts();
    
    // Integrace s existujícím systémem
    integrateWithExistingSystem();
    
    // Sledování změn aktuální skladby
    watchCurrentTrackChanges();
    
    isPlaylistManagerInitialized = true;
    
    window.DebugManager?.log('playlistManager', "🖖 PlaylistManager: Inicializace dokončena! Admirále, pokročilá správa je připravena k použití!");
    
    // Zobrazíme notifikaci o úspěšné inicializaci
    setTimeout(() => {
        if (window.showNotification) {
            window.showNotification('🖖 Pokročilá správa playlistu aktivována! (Ctrl+P)', 'info', 4000);
        }
    }, 2000);
}

// --- Export funkcí pro globální použití ---
window.PlaylistManager = {
    init: initializePlaylistManager,
    open: openPlaylistManager,
    close: closePlaylistManager,
    isInitialized: () => isPlaylistManagerInitialized
};

// --- Automatická inicializace ---
// Spustíme inicializaci automaticky při načtení
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePlaylistManager);
    } else {
        // DOM je už načten, spustíme inicializaci s malým zpožděním
        setTimeout(initializePlaylistManager, 500);
    }
}

/**
 * 🖖 KONEC MODULU - POKROČILÁ SPRÁVA PLAYLISTU
 * * FUNKCE:
 * ✅ Modální okno s pokročilou správou
 * ✅ Drag & Drop pro změnu pořadí skladeb
 * ✅ Přejmenování skladeb (vlastní názvy)
 * ✅ Přidávání nových skladeb
 * ✅ Import/Export M3U playlistů
 * ✅ Rychlé ovládání oblíbených
 * ✅ Statistiky playlistu
 * ✅ Responzivní design
 * ✅ Klávesové zkratky (Ctrl+P)
 * ✅ Integrace s existujícím systémem
 * * Více admirále Jiříku, tvůj parťák na můstku je připraven! 🚀
 */