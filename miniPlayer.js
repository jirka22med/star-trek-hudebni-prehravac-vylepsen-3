/**
 * miniPlayer.js v2.1 - IN-MEMORY (bez localStorage) + DebugManager
 * Plovoucí mini přehrávač s 3 režimy + sekundární tlačítka
 * Autor: Admirál Claude pro Více Admirála Jiříka
 */

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_MINI = false;

class MiniPlayer {
    constructor() {
        this.isMinimized = false;
        this.isDragging = false;
        this.isResizing = false;
        this.isPinned = false;
        this.currentMode = 'floating';
        this.popupWindow = null;
        this.popupSyncInterval = null;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        
        this.defaultWidth = 320;
        this.defaultHeight = 180;
        this.minWidth = 250;
        this.minHeight = 140;
        this.maxWidth = 500;
        this.maxHeight = 300;
        
        this.miniPlayerContainer = null;
        this.toggleButton = null;
        
        this.init();
    }
    
    init() {
        window.DebugManager?.log('miniplayer', 'MiniPlayer: Inicializace v2.1 (DebugManager)...');
        
        this.createMiniPlayer();
        this.createToggleButton();
        this.attachEventListeners();
        this.setDefaultPosition();
        
        window.DebugManager?.log('miniplayer', 'MiniPlayer: Inicializace dokončena');
    }
    
    createMiniPlayer() {
        this.miniPlayerContainer = document.createElement('div');
        this.miniPlayerContainer.id = 'mini-player-container';
        this.miniPlayerContainer.className = 'mini-player-container hidden';
        
        this.miniPlayerContainer.style.cssText = `
            position: fixed;
            z-index: 999999;
            right: 20px;
            bottom: 20px;
            width: 320px;
            height: 180px;
            background: #1a1a2e;
            border: 2px solid #0f3460;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
        `;
        
        this.miniPlayerContainer.innerHTML = `
            <div class="mini-player-header" style="background: #0f3460; padding: 8px; display: flex; justify-content: space-between; align-items: center; cursor: move; border-radius: 6px 6px 0 0;">
                <div class="mini-player-drag-handle" title="Přetáhnout" style="flex: 1; cursor: grab; user-select: none;">
                    <span class="drag-icon">⋮⋮</span>
                </div>
                <div class="mini-player-title" id="mini-track-title" style="flex: 1; text-align: center; color: #fff; font-weight: bold; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Star Trek Player</div>
                <div class="mini-player-controls-header" style="display: flex; gap: 5px; align-items: center;">
                    <select class="mini-mode-select" id="mini-mode-select" title="Vybrat režim" style="padding: 4px; font-size: 11px; background: #16213e; color: #fff; border: 1px solid #0f3460; border-radius: 3px; cursor: pointer;">
                        <option value="floating">🖼️ Float</option>
                        <option value="pip">📺 PiP</option>
                        <option value="popup">🪟 Pop</option>
                    </select>
                    <button class="mini-header-btn" id="mini-pin-btn" title="Připnout/Odepnout" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 14px; padding: 0;">📌</button>
                    <button class="mini-header-btn" id="mini-close-btn" title="Zavřít" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 14px; font-weight: bold; padding: 0;">✖</button>
                </div>
            </div>
            
            <div class="mini-player-body" style="flex: 1; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; color: #fff; overflow: hidden;">
                <div class="mini-player-info">
                    <div class="mini-time-display" style="text-align: center; font-size: 12px; margin-bottom: 8px;">
                        <span id="mini-current-time">00:00</span>
                        <span class="time-separator"> / </span>
                        <span id="mini-duration">00:00</span>
                    </div>
                </div>
                
                <div class="mini-progress-container" style="margin-bottom: 8px;">
                    <input type="range" id="mini-progress-bar" min="0" max="100" value="0" step="0.1" style="width: 100%; cursor: pointer; accent-color: #0f3460;">
                </div>
                
                <div class="mini-controls" style="display: flex; justify-content: center; gap: 8px; margin-bottom: 8px;">
                    <button class="mini-control-btn" id="mini-prev-btn" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px; padding: 0;">⏮</button>
                    <button class="mini-control-btn mini-play-btn" id="mini-play-btn" style="background: none; border: none; color: #4ade80; cursor: pointer; font-size: 18px; font-weight: bold; padding: 0;">▶</button>
                    <button class="mini-control-btn mini-pause-btn" id="mini-pause-btn" style="background: none; border: none; color: #f97316; cursor: pointer; font-size: 18px; font-weight: bold; padding: 0; display: none;">⏸</button>
                    <button class="mini-control-btn" id="mini-next-btn" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px; padding: 0;">⏭</button>
                </div>
                
                <div class="mini-volume-control" style="display: flex; align-items: center; gap: 6px; justify-content: center;">
                    <span class="mini-volume-icon" id="mini-volume-icon" style="font-size: 14px;">🔊</span>
                    <input type="range" id="mini-volume-slider" min="0" max="100" value="50" step="1" style="width: 60px; cursor: pointer; accent-color: #0f3460;">
                    <span class="mini-volume-value" id="mini-volume-value" style="font-size: 11px; min-width: 30px;">50%</span>
                </div>
            </div>
            
            <div class="mini-player-resize-handle" style="position: absolute; bottom: 0; right: 0; width: 16px; height: 16px; background: linear-gradient(135deg, transparent 50%, #0f3460 50%); cursor: nwse-resize; border-radius: 0 0 6px 0;"></div>
        `;
        
        document.body.appendChild(this.miniPlayerContainer);
    }
    
    createToggleButton() {
        const controlsDiv = document.querySelector('#control-panel .controls');
        
        if (!controlsDiv) {
            console.error('MiniPlayer: Controls div nenalezen!');
            return;
        }
        
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'toggle-mini-player';
        this.toggleButton.className = 'control-button';
        this.toggleButton.title = 'Mini přehrávač (N)';
        this.toggleButton.textContent = '🖼️';
        
        controlsDiv.appendChild(this.toggleButton);
    }
    
    attachEventListeners() {
        this.toggleButton?.addEventListener('click', () => this.toggle());
        
        const closeBtn = document.getElementById('mini-close-btn');
        closeBtn?.addEventListener('click', () => this.close());
        
        const pinBtn = document.getElementById('mini-pin-btn');
        pinBtn?.addEventListener('click', () => this.togglePin());
        
        // PRIMÁRNÍ: Select dropdown
        const modeSelect = document.getElementById('mini-mode-select');
        modeSelect?.addEventListener('change', (e) => this.switchMode(e.target.value));
        
        // SEKUNDÁRNÍ: Jednotlivá tlačítka (backup)
        const modeFloatBtn = document.getElementById('mini-mode-float');
        const modePipBtn = document.getElementById('mini-mode-pip');
        const modePopupBtn = document.getElementById('mini-mode-popup');
        
        if (modeFloatBtn) {
            modeFloatBtn.addEventListener('click', () => this.switchMode('floating'));
        }
        if (modePipBtn) {
            modePipBtn.addEventListener('click', () => this.switchMode('pip'));
        }
        if (modePopupBtn) {
            modePopupBtn.addEventListener('click', () => this.switchMode('popup'));
        }
        
        const dragHandle = this.miniPlayerContainer.querySelector('.mini-player-drag-handle');
        dragHandle?.addEventListener('mousedown', (e) => this.startDrag(e));
        dragHandle?.addEventListener('mouseup', () => this.bringToFront());
        
        const resizeHandle = this.miniPlayerContainer.querySelector('.mini-player-resize-handle');
        resizeHandle?.addEventListener('mousedown', (e) => this.startResize(e));
        
        this.miniPlayerContainer?.addEventListener('mousedown', () => this.bringToFront());
        
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.stopDragResize());
        
        document.getElementById('mini-play-btn')?.addEventListener('click', () => this.play());
        document.getElementById('mini-pause-btn')?.addEventListener('click', () => this.pause());
        document.getElementById('mini-prev-btn')?.addEventListener('click', () => this.prevTrack());
        document.getElementById('mini-next-btn')?.addEventListener('click', () => this.nextTrack());
        
        const volumeSlider = document.getElementById('mini-volume-slider');
        volumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        const progressBar = document.getElementById('mini-progress-bar');
        progressBar?.addEventListener('input', (e) => this.seek(e.target.value));
        
        this.syncWithMainPlayer();
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    bringToFront() {
        if (this.miniPlayerContainer && this.currentMode === 'floating') {
            this.miniPlayerContainer.style.zIndex = '999999';
        }
    }
    
    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        
        window.DebugManager?.log('miniplayer', `MiniPlayer: Přepínám do režimu: ${mode}`);
        
        // Aktualizuj select, pokud existuje
        const modeSelect = document.getElementById('mini-mode-select');
        if (modeSelect) {
            modeSelect.value = mode;
        }
        
        switch(mode) {
            case 'floating':
                this.closePipOrPopup();
                this.miniPlayerContainer?.classList.remove('hidden');
                window.showNotification?.('Přepnutí na Floating režim 🖼️', 'info', 2000);
                break;
            case 'pip':
                this.activatePiP();
                break;
            case 'popup':
                this.openPopupWindow();
                break;
        }
    }
    
    async activatePiP() {
        try {
            const mainVideo = document.getElementById('audioPlayer');
            
            if (!mainVideo) {
                throw new Error('Hlavní audio player nenalezen');
            }
            
            if (mainVideo.tagName === 'AUDIO') {
                let pipVideo = document.getElementById('pip-video-element');
                if (!pipVideo) {
                    pipVideo = document.createElement('video');
                    pipVideo.id = 'pip-video-element';
                    pipVideo.style.display = 'none';
                    pipVideo.width = 320;
                    pipVideo.height = 180;
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 180;
                    const ctx = canvas.getContext('2d');
                    
                    // Načtení statického pozadí z GitHub (CORS podporován!)
                    const bgImage = new Image();
                    bgImage.crossOrigin = 'anonymous';
                    bgImage.src = 'https://raw.githubusercontent.com/jirka22med/star-trek-assets/main/image_4k6.jpg';
                    
                    bgImage.onerror = () => {
                        console.error('❌ GitHub obrázek se nepodařilo načíst, používám fallback');
                        ctx.fillStyle = '#0a0e27';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    };
                    
                    bgImage.onload = () => {
                        window.DebugManager?.log('miniplayer', '✅ GitHub obrázek úspěšně načten!');
                    };
                    
                    const animateCanvas = () => {
                        // Vykreslení statického pozadí z GitHubu
                        if (bgImage.complete && bgImage.naturalWidth > 0) {
                            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
                        } else {
                            // Fallback zatímco se načítá
                            ctx.fillStyle = '#0a0e27';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        
                        // Tmavý overlay pro lepší čitelnost textu
                        ctx.fillStyle = 'rgba(10, 14, 39, 0.5)';
                        ctx.fillRect(0, 0, 320, 180);
                        
                        // Logo a název v horní části
                        ctx.fillStyle = '#4ade80';
                        ctx.font = 'bold 15px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('🖖 STAR TREK', 160, 45);
                        
                        // Header s názvem skladby
                        ctx.fillStyle = 'rgba(15, 52, 96, 0.9)';
                        ctx.fillRect(0, 0, 320, 30);
                        
                        const trackTitle = document.getElementById('trackTitle');
                        if (trackTitle) {
                            ctx.fillStyle = '#fff';
                            ctx.font = '15px Arial';
                            ctx.textAlign = 'center';
                            const text = trackTitle.textContent.substring(0, 30);
                            ctx.fillText(text, 160, 25);
                        }
                        
                        // Progress bar
                        const audioPlayer = document.getElementById('audioPlayer');
                        if (audioPlayer && audioPlayer.duration) {
                            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 300;
                            ctx.fillStyle = '#4ade80';
                            ctx.fillRect(10, 170, progress, 4);
                            ctx.strokeStyle = '#0f3460';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(10, 170, 300, 4);
                        }
                        
                        requestAnimationFrame(animateCanvas);
                    };
                    
                    animateCanvas();
                    
                    pipVideo.srcObject = canvas.captureStream(24);
                    pipVideo.play();
                    
                    document.body.appendChild(pipVideo);
                }
                
                await pipVideo.requestPictureInPicture();
                this.miniPlayerContainer?.classList.add('hidden');
                window.showNotification?.('Picture-in-Picture aktivován! 🖖 (GitHub hosting)', 'info', 3000);
                
                window.DebugManager?.log('miniplayer', 'PiP: Aktivován s GitHub pozadím - CORS podporován! 🖖');
                
            } else if (mainVideo.tagName === 'VIDEO') {
                await mainVideo.requestPictureInPicture();
                this.miniPlayerContainer?.classList.add('hidden');
                window.showNotification?.('Picture-in-Picture aktivován 📺', 'info', 2000);
            }
            
        } catch (error) {
            window.DebugManager?.log('miniplayer', 'PiP chyba:', error);
            
            let message = 'PiP není podporován!';
            if (error.message.includes('requestPictureInPicture')) {
                message = 'Tvůj prohlížeč nepodporuje PiP. Použij Chrome, Edge nebo Safari.';
            }
            
            window.showNotification?.(message, 'error', 3000);
            
            document.getElementById('mini-mode-select').value = 'floating';
            this.currentMode = 'floating';
            this.miniPlayerContainer?.classList.remove('hidden');
        }
    }
    
    openPopupWindow() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.focus();
            return;
        }
        
        const width = 360;
        const height = 280;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        this.popupWindow = window.open('', 'MiniPlayerPopup', 
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,menubar=no,toolbar=no,status=no,alwaysRaised=yes`);
        
        if (!this.popupWindow) {
            window.showNotification?.('Popup byl zablokován! Povolte popupy.', 'error', 3000);
            document.getElementById('mini-mode-select').value = 'floating';
            this.currentMode = 'floating';
            return;
        }
        
        this.popupWindow.focus();
        
        this.popupWindow.document.title = 'Star Trek Mini Player';
        this.popupWindow.document.body.innerHTML = `
            <div style="padding: 15px; font-family: Arial, sans-serif; background: #1a1a2e; color: #fff; height: 100%; overflow: hidden; margin: 0;">
                <h3 style="margin: 0 0 12px 0; text-align: center; color: #4ade80;">🖖 Star Trek Player</h3>
                <div id="popup-controls" style="display: flex; gap: 6px; margin-bottom: 12px;">
                    <button onclick="window.opener.miniPlayerInstance.prevTrack()" style="flex: 1; padding: 8px; background: #0f3460; color: #fff; border: 1px solid #0f3460; border-radius: 4px; cursor: pointer; font-weight: bold;">⏮</button>
                    <button onclick="window.opener.miniPlayerInstance.play()" style="flex: 1; padding: 8px; background: #4ade80; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">▶</button>
                    <button onclick="window.opener.miniPlayerInstance.pause()" style="flex: 1; padding: 8px; background: #f97316; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">⏸</button>
                    <button onclick="window.opener.miniPlayerInstance.nextTrack()" style="flex: 1; padding: 8px; background: #0f3460; color: #fff; border: 1px solid #0f3460; border-radius: 4px; cursor: pointer; font-weight: bold;">⏭</button>
                </div>
                <div style="margin-bottom: 12px; border: 1px solid #0f3460; padding: 10px; border-radius: 4px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 12px;">Volume:</label>
                    <input type="range" id="popup-volume" min="0" max="100" value="50" onchange="window.opener.miniPlayerInstance.setVolume(this.value); document.getElementById('volume-val').textContent = this.value + '%';" 
                           style="width: 100%; cursor: pointer; accent-color: #4ade80;">
                    <div style="text-align: center; font-size: 11px; margin-top: 4px;"><span id="volume-val">50%</span></div>
                </div>
                <div style="font-size: 11px; text-align: center; background: #0f3460; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
                    <p id="popup-track" style="margin: 4px 0; font-weight: bold;">🎵 Žádná skladba</p>
                    <p id="popup-time" style="margin: 4px 0; color: #4ade80;">00:00 / 00:00</p>
                </div>
                <button onclick="window.opener.miniPlayerInstance.closePopup()" style="width: 100%; padding: 10px; background: #dc3545; color: #fff; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">Zavřít</button>
            </div>
        `;
        
        this.miniPlayerContainer?.classList.add('hidden');
        window.showNotification?.('Popup okno otevřeno 🪟', 'info', 2000);
        
        this.popupSyncInterval = setInterval(() => {
            if (this.popupWindow && !this.popupWindow.closed) {
                const trackTitle = document.getElementById('trackTitle');
                if (trackTitle) {
                    this.popupWindow.document.getElementById('popup-track').textContent = '🎵 ' + trackTitle.textContent;
                }
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    const time = `${this.formatTime(audioPlayer.currentTime)} / ${this.formatTime(audioPlayer.duration || 0)}`;
                    this.popupWindow.document.getElementById('popup-time').textContent = time;
                }
            } else {
                clearInterval(this.popupSyncInterval);
            }
        }, 500);
    }
    
    closePopup() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
        }
        this.popupWindow = null;
        if (this.popupSyncInterval) clearInterval(this.popupSyncInterval);
        
        document.getElementById('mini-mode-select').value = 'floating';
        this.currentMode = 'floating';
        this.miniPlayerContainer?.classList.remove('hidden');
        window.showNotification?.('Popup zavřeno, zpět na Floating 🖼️', 'info', 2000);
    }
    
    closePipOrPopup() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
            this.popupWindow = null;
        }
        if (this.popupSyncInterval) clearInterval(this.popupSyncInterval);
        
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(err => {
                window.DebugManager?.log('miniplayer', 'Chyba při ukončení PiP:', err);
            });
        }
    }
    
    syncWithMainPlayer() {
        const audioPlayer = document.getElementById('audioPlayer');
        const trackTitle = document.getElementById('trackTitle');
        
        if (!audioPlayer) {
            console.error('MiniPlayer: Audio player nenalezen!');
            return;
        }
        
        audioPlayer.addEventListener('timeupdate', () => {
            if (this.isMinimized) {
                this.updateTime();
                this.updateProgress();
            }
        });
        
        if (trackTitle) {
            const observer = new MutationObserver(() => {
                if (this.isMinimized && trackTitle) {
                    const miniTitle = document.getElementById('mini-track-title');
                    if (miniTitle) {
                        miniTitle.textContent = trackTitle.textContent;
                    }
                }
            });
            observer.observe(trackTitle, { childList: true, characterData: true, subtree: true });
        }
        
        audioPlayer.addEventListener('play', () => this.updatePlayPauseButtons(true));
        audioPlayer.addEventListener('pause', () => this.updatePlayPauseButtons(false));
    }
    
    toggle() {
        if (this.isMinimized) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isMinimized = true;
        this.miniPlayerContainer?.classList.remove('hidden');
        this.toggleButton?.classList.add('active');
        this.bringToFront();
        
        this.updateTime();
        this.updateProgress();
        this.updateTrackTitle();
        this.updatePlayPauseButtons();
        this.updateVolumeIcon();
        
        window.showNotification?.('Mini přehrávač aktivován! 🖼️', 'info', 2000);
    }
    
    close() {
        this.isMinimized = false;
        this.miniPlayerContainer?.classList.add('hidden');
        this.toggleButton?.classList.remove('active');
        this.closePipOrPopup();
    }
    
    togglePin() {
        this.isPinned = !this.isPinned;
        const pinBtn = document.getElementById('mini-pin-btn');
        
        if (this.isPinned) {
            this.miniPlayerContainer?.classList.add('pinned');
            if (pinBtn) pinBtn.textContent = '📍';
            window.showNotification?.('Mini přehrávač připnut! 📍', 'info', 2000);
        } else {
            this.miniPlayerContainer?.classList.remove('pinned');
            if (pinBtn) pinBtn.textContent = '📌';
            window.showNotification?.('Mini přehrávač odepnut! 📌', 'info', 2000);
        }
    }
    
    startDrag(e) {
        if (this.isPinned || this.currentMode !== 'floating') return;
        
        e.preventDefault();
        this.isDragging = true;
        
        const rect = this.miniPlayerContainer.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        this.miniPlayerContainer.style.left = `${rect.left}px`;
        this.miniPlayerContainer.style.top = `${rect.top}px`;
        this.miniPlayerContainer.style.right = 'auto';
        this.miniPlayerContainer.style.bottom = 'auto';
        
        this.miniPlayerContainer.style.cursor = 'grabbing';
        this.miniPlayerContainer.style.transition = 'none';
        
        document.body.style.userSelect = 'none';
        document.body.style.pointerEvents = 'none';
        this.miniPlayerContainer.style.pointerEvents = 'auto';
    }
    
    startResize(e) {
        if (this.currentMode !== 'floating') return;
        
        e.preventDefault();
        this.isResizing = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = this.miniPlayerContainer.offsetWidth;
        this.startHeight = this.miniPlayerContainer.offsetHeight;
    }
    
    onMouseMove(e) {
        if (this.isDragging) {
            const newX = e.clientX - this.startX;
            const newY = e.clientY - this.startY;
            
            const maxX = window.innerWidth - this.miniPlayerContainer.offsetWidth;
            const maxY = window.innerHeight - this.miniPlayerContainer.offsetHeight;
            
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));
            
            this.miniPlayerContainer.style.left = `${constrainedX}px`;
            this.miniPlayerContainer.style.top = `${constrainedY}px`;
            this.miniPlayerContainer.style.right = 'auto';
            this.miniPlayerContainer.style.bottom = 'auto';
        }
        
        if (this.isResizing) {
            const deltaX = e.clientX - this.startX;
            const deltaY = e.clientY - this.startY;
            
            let newWidth = this.startWidth + deltaX;
            let newHeight = this.startHeight + deltaY;
            
            newWidth = Math.max(this.minWidth, Math.min(newWidth, this.maxWidth));
            newHeight = Math.max(this.minHeight, Math.min(newHeight, this.maxHeight));
            
            this.miniPlayerContainer.style.width = `${newWidth}px`;
            this.miniPlayerContainer.style.height = `${newHeight}px`;
        }
    }
    
    stopDragResize() {
        if (this.isDragging || this.isResizing) {
            this.isDragging = false;
            this.isResizing = false;
            this.miniPlayerContainer.style.cursor = '';
            document.body.style.userSelect = '';
            document.body.style.pointerEvents = '';
        }
    }
    
    play() {
        const playBtn = document.getElementById('play-button');
        playBtn?.click();
    }
    
    pause() {
        const pauseBtn = document.getElementById('pause-button');
        pauseBtn?.click();
    }
    
    prevTrack() {
        const prevBtn = document.getElementById('prev-button');
        prevBtn?.click();
    }
    
    nextTrack() {
        const nextBtn = document.getElementById('next-button');
        nextBtn?.click();
    }
    
    seek(value) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer && audioPlayer.duration) {
            audioPlayer.currentTime = (audioPlayer.duration * value) / 100;
        }
    }
    
    setVolume(value) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.volume = Math.pow(value / 100, 3);
            const volumeSlider = document.getElementById('mini-volume-slider');
            if (volumeSlider) volumeSlider.value = value;
            this.updateVolumeIcon();
        }
    }
    
    updateTime() {
        const audioPlayer = document.getElementById('audioPlayer');
        const miniCurrentTime = document.getElementById('mini-current-time');
        const miniDuration = document.getElementById('mini-duration');
        
        if (audioPlayer && miniCurrentTime && miniDuration) {
            miniCurrentTime.textContent = this.formatTime(audioPlayer.currentTime);
            miniDuration.textContent = this.formatTime(audioPlayer.duration || 0);
        }
    }
    
    updateProgress() {
        const audioPlayer = document.getElementById('audioPlayer');
        const miniProgressBar = document.getElementById('mini-progress-bar');
        
        if (audioPlayer && miniProgressBar && audioPlayer.duration) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            miniProgressBar.value = progress;
        }
    }
    
    updateTrackTitle() {
        const trackTitle = document.getElementById('trackTitle');
        const miniTitle = document.getElementById('mini-track-title');
        
        if (trackTitle && miniTitle) {
            miniTitle.textContent = trackTitle.textContent;
        }
    }
    
    updatePlayPauseButtons(isPlaying = null) {
        const audioPlayer = document.getElementById('audioPlayer');
        const miniPlayBtn = document.getElementById('mini-play-btn');
        const miniPauseBtn = document.getElementById('mini-pause-btn');
        
        if (!miniPlayBtn || !miniPauseBtn) return;
        
        const playing = isPlaying !== null ? isPlaying : (audioPlayer && !audioPlayer.paused);
        
        if (playing) {
            miniPlayBtn.style.display = 'none';
            miniPauseBtn.style.display = 'block';
        } else {
            miniPlayBtn.style.display = 'block';
            miniPauseBtn.style.display = 'none';
        }
    }
    
    updateVolumeIcon() {
        const audioPlayer = document.getElementById('audioPlayer');
        const miniVolumeIcon = document.getElementById('mini-volume-icon');
        const volumeSlider = document.getElementById('mini-volume-slider');
        const volumeValue = document.getElementById('mini-volume-value');
        
        if (!audioPlayer || !miniVolumeIcon || !volumeSlider || !volumeValue) return;
        
        const sliderVal = Math.round(parseFloat(volumeSlider.value));
        volumeValue.textContent = `${sliderVal}%`;
        
        if (audioPlayer.muted || audioPlayer.volume === 0) {
            miniVolumeIcon.textContent = '🔇';
        } else if (sliderVal <= 33) {
            miniVolumeIcon.textContent = '🔈';
        } else if (sliderVal <= 66) {
            miniVolumeIcon.textContent = '🔉';
        } else {
            miniVolumeIcon.textContent = '🔊';
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    handleKeyPress(e) {
        if (!this.isMinimized) return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        
        if (e.code === 'KeyN' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            this.close();
        }
        
        if (e.code === 'KeyP' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            this.togglePin();
        }
    }
    
    setDefaultPosition() {
        this.miniPlayerContainer.style.right = '20px';
        this.miniPlayerContainer.style.bottom = '20px';
        this.miniPlayerContainer.style.width = `${this.defaultWidth}px`;
        this.miniPlayerContainer.style.height = `${this.defaultHeight}px`;
    }
}

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.miniPlayerInstance = new MiniPlayer();
        window.DebugManager?.log('miniplayer', 'MiniPlayer: Instance vytvořena - verze 2.1 (in-memory) + sekundární tlačítka');
    }, 200);
});

// Export pro případné ruční volání
window.MiniPlayer = MiniPlayer;