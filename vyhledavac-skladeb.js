/**
 * 🖖 STAR TREK MUSIC PLAYER - VYHLEDÁVACÍ MODUL 🚀
 * Autonomní modul pro vyhledávání skladeb v playlistu
 * Vytvořeno pro více admirála Jiříka
 * Verze: 1.1 (DebugManager Integration)
 */

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_SEARCH = false;

// --- Konfigurace modulu ---
const SEARCH_CONFIG = {
    minSearchLength: 2, // Minimální délka hledaného textu
    searchDelay: 300, // Debounce delay v ms
    highlightClass: 'search-highlight',
    noResultsMessage: '🔍 Žádné výsledky nenalezeny',
    searchingMessage: '🔎 Vyhledávám...'
};

// --- Globální proměnné modulu ---
let searchTimeout = null;
let searchContainer = null;
let searchInput = null;
let searchResults = null;
let searchCounter = null;
let clearSearchButton = null;
let isSearchActive = false;

/**
 * Inicializace vyhledávacího modulu
 * Automaticky najde a napojí se na HTML container
 */
function initSearchModule() {
    if (window.DebugManager?.isEnabled('search')) {
        window.DebugManager.log('search', '🔍 initSearchModule: Spouštím inicializaci vyhledávače...');
        window.DebugManager.log('search', '📊 window.favorites:', window.favorites ? `${window.favorites.length} skladeb` : 'neexistuje');
        window.DebugManager.log('search', '📊 window.tracks:', window.tracks ? `${window.tracks.length} skladeb` : 'neexistuje');
    }

    // Najdi hlavní container
    searchContainer = document.getElementById('search-container');
    if (!searchContainer) {
        console.error('❌ initSearchModule: Element #search-container nenalezen!');
        return false;
    }

    // Najdi všechny potřebné elementy
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');
    searchCounter = document.getElementById('search-counter');
    clearSearchButton = document.getElementById('clear-search');

    if (!searchInput || !searchResults) {
        console.error('❌ initSearchModule: Chybí základní HTML elementy pro vyhledávání!');
        return false;
    }

    // Připoj event listenery
    attachSearchEventListeners();

    if (window.DebugManager?.isEnabled('search')) {
        window.DebugManager.log('search', '✅ initSearchModule: Vyhledávač úspěšně inicializován!');
        window.DebugManager.log('search', '✅ Oblíbené skladby dostupné:', window.favorites && Array.isArray(window.favorites) ? 'ANO (' + window.favorites.length + ')' : 'NE');
    }
    return true;
}

/**
 * Připojení event listenerů pro vyhledávání
 */
function attachSearchEventListeners() {
    // Hlavní input pro vyhledávání
    searchInput.addEventListener('input', handleSearchInput);
    
    // Vyčištění vyhledávání
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', clearSearch);
    }

    // Klávesové zkratky
    searchInput.addEventListener('keydown', handleSearchKeyboard);

    // Focus a blur efekty
    searchInput.addEventListener('focus', () => {
        searchContainer.classList.add('search-active');
    });

    searchInput.addEventListener('blur', () => {
        // Oddálené odstranění třídy, aby kliknutí na výsledek fungovalo
        setTimeout(() => {
            if (!searchInput.value) {
                searchContainer.classList.remove('search-active');
            }
        }, 200);
    });

    window.DebugManager?.log('search', '✅ Event listenery pro vyhledávání připojeny');
}

/**
 * Obsluha vstupu do search inputu (s debounce)
 */
function handleSearchInput(e) {
    const searchQuery = e.target.value.trim();

    // Zobraz/skryj tlačítko pro vyčištění
    if (clearSearchButton) {
        clearSearchButton.style.display = searchQuery ? 'block' : 'none';
    }

    // Pokud je input prázdný, vyčisti výsledky
    if (!searchQuery) {
        clearSearchResults();
        return;
    }

    // Debounce - počkej na dokončení psaní
    if (searchTimeout) clearTimeout(searchTimeout);

    // Zobraz "Vyhledávám..."
    if (searchQuery.length >= SEARCH_CONFIG.minSearchLength) {
        showSearchingState();
    }

    searchTimeout = setTimeout(() => {
        performSearch(searchQuery);
    }, SEARCH_CONFIG.searchDelay);
}

/**
 * Zobrazení stavu "Vyhledávám..."
 */
function showSearchingState() {
    if (!searchResults) return;
    searchResults.innerHTML = `
        <div class="search-status searching">
            ${SEARCH_CONFIG.searchingMessage}
        </div>
    `;
    searchResults.style.display = 'block';
}

/**
 * Hlavní funkce pro vyhledávání v playlistu
 */
function performSearch(query) {
    window.DebugManager?.log('search', `🔍 performSearch: Hledám "${query}"`);

    // Kontrola, zda existuje playlist
    if (!window.tracks || !Array.isArray(window.tracks) || window.tracks.length === 0) {
        showNoResults('Playlist je prázdný');
        return;
    }

    // Minimální délka hledání
    if (query.length < SEARCH_CONFIG.minSearchLength) {
        showNoResults(`Zadejte alespoň ${SEARCH_CONFIG.minSearchLength} znaky`);
        return;
    }

    // Normalizace query (lowercase, odstranění diakritiky)
    const normalizedQuery = normalizeString(query);

    // Vyhledávání v playlistu
    const results = window.tracks
        .map((track, index) => ({
            track,
            originalIndex: index,
            normalizedTitle: normalizeString(track.title)
        }))
        .filter(item => item.normalizedTitle.includes(normalizedQuery))
        .map(item => ({
            ...item.track,
            originalIndex: item.originalIndex
        }));

    window.DebugManager?.log('search', `✅ performSearch: Nalezeno ${results.length} výsledků`);

    // Zobrazení výsledků
    displaySearchResults(results, query);
}

/**
 * Normalizace řetězce (lowercase + odstranění diakritiky)
 */
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Zobrazení výsledků vyhledávání
 */
function displaySearchResults(results, originalQuery) {
    if (!searchResults) return;

    // Pokud nejsou žádné výsledky
    if (results.length === 0) {
        showNoResults();
        return;
    }

    // Aktualizace počítadla
    updateSearchCounter(results.length);

    // Vyčištění starých výsledků
    searchResults.innerHTML = '';

    // Vytvoření fragmentu pro lepší výkon
    const fragment = document.createDocumentFragment();

    results.forEach(track => {
        const resultItem = createSearchResultItem(track, originalQuery);
        fragment.appendChild(resultItem);
    });

    searchResults.appendChild(fragment);
    searchResults.style.display = 'block';
    isSearchActive = true;

    // Přidej listener pro změny v oblíbených
    observeFavoritesChanges();

    window.DebugManager?.log('search', `✅ displaySearchResults: Zobrazeno ${results.length} výsledků`);
}

/**
 * Sledování změn v oblíbených skladbách - VYLEPŠENÁ VERZE
 */
function observeFavoritesChanges() {
    // Pokud už máme observer, nepřidávej další
    if (window.searchFavoritesObserver) return;

    window.DebugManager?.log('search', '👁️ Spouštím observer pro sledování změn v oblíbených...');

    // Vytvoř interval pro kontrolu změn
    window.searchFavoritesObserver = setInterval(() => {
        if (!isSearchActive || !searchResults) {
            clearInterval(window.searchFavoritesObserver);
            window.searchFavoritesObserver = null;
            window.DebugManager?.log('search', '⏹️ Observer zastaven (vyhledávání neaktivní)');
            return;
        }

        // Zkontroluj, zda existuje window.favorites
        if (!window.favorites || !Array.isArray(window.favorites)) {
            if (window.DebugManager?.isEnabled('search')) {
                console.warn('⚠️ window.favorites není dostupné nebo není pole');
            }
            return;
        }

        // Aktualizuj všechny hvězdičky podle aktuálního stavu
        const buttons = searchResults.querySelectorAll('.search-favorite-button');
        buttons.forEach(button => {
            const trackTitle = button.dataset.trackTitle;
            if (trackTitle) {
                updateFavoriteButtonState(button, trackTitle);
            }
        });
    }, 500); // Kontrola každých 500ms
    
    window.DebugManager?.log('search', '✅ Observer pro oblíbené aktivován');
}

/**
 * Vytvoření položky výsledku vyhledávání
 */
function createSearchResultItem(track, query) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.dataset.originalIndex = track.originalIndex;
    item.dataset.trackTitle = track.title; // Pro pozdější identifikaci

    // Zvýraznění hledaného textu
    const highlightedTitle = highlightSearchTerm(track.title, query);

    // Ikona pro přehrávání
    const playIcon = document.createElement('span');
    playIcon.className = 'search-play-icon';
    playIcon.textContent = '▶️';

    // Název skladby
    const titleSpan = document.createElement('span');
    titleSpan.className = 'search-result-title';
    titleSpan.innerHTML = highlightedTitle;

    // Tlačítko pro přidání do oblíbených
    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'search-favorite-button';
    favoriteButton.title = 'Přidat/Odebrat z oblíbených';
    favoriteButton.dataset.trackTitle = track.title;
    
    // Zkontroluj aktuální stav oblíbených
    updateFavoriteButtonState(favoriteButton, track.title);

    // Event listener pro oblíbené
    favoriteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (typeof window.toggleFavorite === 'function') {
            await window.toggleFavorite(track.title);
            // Aktualizuj všechny hvězdičky pro tuto skladbu
            updateAllFavoriteButtons(track.title);
            
            // Aktualizuj i playlist, pokud je viditelný
            if (typeof window.populatePlaylist === 'function' && window.tracks) {
                window.populatePlaylist(window.tracks);
            }
        }
    });

    // Sestavení položky
    item.appendChild(playIcon);
    item.appendChild(titleSpan);
    item.appendChild(favoriteButton);

    // Event listener pro přehrání skladby
    item.addEventListener('click', () => {
        playTrackFromSearch(track.originalIndex);
    });

    return item;
}

/**
 * Aktualizace stavu tlačítka oblíbených (bez animací) - VYLEPŠENÁ VERZE
 */
function updateFavoriteButtonState(button, trackTitle) {
    if (!button || !trackTitle) return;
    
    // Kontrola existence a validity window.favorites
    if (!window.favorites) {
        if (window.DebugManager?.isEnabled('search')) {
            console.warn(`updateFavoriteButtonState: window.favorites neexistuje`);
        }
        button.textContent = '☆'; // Default - neoblíbená
        return;
    }
    
    if (!Array.isArray(window.favorites)) {
        if (window.DebugManager?.isEnabled('search')) {
            console.warn(`updateFavoriteButtonState: window.favorites není pole, type: ${typeof window.favorites}`);
        }
        button.textContent = '☆';
        return;
    }
    
    const isFavorite = window.favorites.includes(trackTitle);
    button.textContent = isFavorite ? '⭐' : '☆';
    
    window.DebugManager?.log('search', `updateFavoriteButtonState: "${trackTitle}" -> ${isFavorite ? 'oblíbená ⭐' : 'neoblíbená ☆'} (celkem oblíbených: ${window.favorites.length})`);
}

/**
 * Aktualizace všech tlačítek oblíbených pro konkrétní skladbu
 */
function updateAllFavoriteButtons(trackTitle) {
    if (!searchResults) return;
    
    const buttons = searchResults.querySelectorAll('.search-favorite-button');
    buttons.forEach(button => {
        if (button.dataset.trackTitle === trackTitle) {
            updateFavoriteButtonState(button, trackTitle);
        }
    });
    
    window.DebugManager?.log('search', `updateAllFavoriteButtons: Aktualizováno pro "${trackTitle}"`);
}

/**
 * Zvýraznění hledaného textu v názvu
 */
function highlightSearchTerm(text, query) {
    if (!query) return text;

    const normalizedText = normalizeString(text);
    const normalizedQuery = normalizeString(query);
    const startIndex = normalizedText.indexOf(normalizedQuery);

    if (startIndex === -1) return text;

    const endIndex = startIndex + query.length;
    const beforeMatch = text.substring(0, startIndex);
    const match = text.substring(startIndex, endIndex);
    const afterMatch = text.substring(endIndex);

    return `${beforeMatch}<mark class="${SEARCH_CONFIG.highlightClass}">${match}</mark>${afterMatch}`;
}

/**
 * Přehrání skladby z výsledků vyhledávání
 */
function playTrackFromSearch(originalIndex) {
    window.DebugManager?.log('search', `🎵 playTrackFromSearch: Přehrávám skladbu na indexu ${originalIndex}`);

    // Zkontroluj, zda existuje globální funkce playTrack
    if (typeof window.playTrack === 'function') {
        window.playTrack(originalIndex);
        
        // Zobraz notifikaci
        if (typeof window.showNotification === 'function') {
            const trackTitle = window.tracks[originalIndex]?.title || 'Neznámá skladba';
            window.showNotification(`🎵 Přehrávám: ${trackTitle}`, 'info', 2000);
        }

        // Vyčisti vyhledávání po přehrání
        setTimeout(() => {
            clearSearch();
        }, 500);
    } else {
        console.error('❌ playTrackFromSearch: Funkce window.playTrack neexistuje!');
        if (typeof window.showNotification === 'function') {
            window.showNotification('Chyba: Nelze přehrát skladbu', 'error');
        }
    }
}

/**
 * Zobrazení hlášky "Žádné výsledky"
 */
function showNoResults(customMessage = null) {
    if (!searchResults) return;

    const message = customMessage || SEARCH_CONFIG.noResultsMessage;

    searchResults.innerHTML = `
        <div class="search-status no-results">
            ${message}
        </div>
    `;
    searchResults.style.display = 'block';
    updateSearchCounter(0);
}

/**
 * Aktualizace počítadla výsledků
 */
function updateSearchCounter(count) {
    if (!searchCounter) return;

    if (count > 0) {
        searchCounter.textContent = `Nalezeno: ${count}`;
        searchCounter.style.display = 'block';
    } else {
        searchCounter.style.display = 'none';
    }
}

/**
 * Vyčištění vyhledávání
 */
function clearSearch() {
    window.DebugManager?.log('search', '🧹 clearSearch: Čistím vyhledávání');

    if (searchInput) searchInput.value = '';
    clearSearchResults();
    
    if (clearSearchButton) clearSearchButton.style.display = 'none';
    if (searchContainer) searchContainer.classList.remove('search-active');
    
    // Zastaví observer pro oblíbené
    if (window.searchFavoritesObserver) {
        clearInterval(window.searchFavoritesObserver);
        window.searchFavoritesObserver = null;
    }
    
    searchInput?.focus();
}

/**
 * Vyčištění výsledků vyhledávání
 */
function clearSearchResults() {
    if (searchResults) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
    }
    if (searchCounter) {
        searchCounter.style.display = 'none';
    }
    isSearchActive = false;
}

/**
 * Obsluha klávesových zkratek pro vyhledávání
 */
function handleSearchKeyboard(e) {
    switch(e.key) {
        case 'Escape':
            clearSearch();
            searchInput?.blur();
            e.preventDefault();
            break;
        
        case 'Enter':
            // Přehraj první výsledek
            const firstResult = searchResults?.querySelector('.search-result-item');
            if (firstResult) {
                const index = parseInt(firstResult.dataset.originalIndex);
                playTrackFromSearch(index);
            }
            e.preventDefault();
            break;
        
        case 'ArrowDown':
            // Navigace šipkami ve výsledcích
            navigateSearchResults('down');
            e.preventDefault();
            break;
        
        case 'ArrowUp':
            navigateSearchResults('up');
            e.preventDefault();
            break;
    }
}

/**
 * Navigace šipkami ve výsledcích vyhledávání
 */
function navigateSearchResults(direction) {
    if (!searchResults) return;

    const items = Array.from(searchResults.querySelectorAll('.search-result-item'));
    if (items.length === 0) return;

    const currentActive = searchResults.querySelector('.search-result-item.keyboard-active');
    let newIndex = 0;

    if (currentActive) {
        const currentIndex = items.indexOf(currentActive);
        if (direction === 'down') {
            newIndex = (currentIndex + 1) % items.length;
        } else {
            newIndex = (currentIndex - 1 + items.length) % items.length;
        }
        currentActive.classList.remove('keyboard-active');
    }

    items[newIndex].classList.add('keyboard-active');
    items[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Globální klávesová zkratka pro aktivaci vyhledávání
 * Ctrl+F nebo Cmd+F
 */
document.addEventListener('keydown', (e) => {
    // Ctrl+F / Cmd+F
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Ctrl+K / Cmd+K (alternativní zkratka)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
});

/**
 * Export funkcí pro externí použití
 */
window.searchModule = {
    init: initSearchModule,
    search: performSearch,
    clear: clearSearch,
    isActive: () => isSearchActive
};

/**
 * Auto-inicializace při načtení DOMu
 * Počká na načtení favorites z Firestore
 */
async function waitForFavoritesAndInit() {
    window.DebugManager?.log('search', '🔍 Čekám na načtení oblíbených skladeb...');
    
    // Počkáme až se načtou oblíbené z Firestore
    let attempts = 0;
    const maxAttempts = 50; // 50 x 200ms = 10 sekund
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        // Zkontrolujeme, zda jsou oblíbené načtené
        if (window.favorites && Array.isArray(window.favorites)) {
            clearInterval(checkInterval);
            window.DebugManager?.log('search', `✅ Oblíbené načteny (${window.favorites.length} skladeb), inicializuji vyhledávač...`);
            initSearchModule();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (window.DebugManager?.isEnabled('search')) {
                console.warn('⚠️ Timeout při čekání na oblíbené, inicializuji vyhledávač bez nich...');
            }
            initSearchModule();
        }
    }, 200);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForFavoritesAndInit);
} else {
    waitForFavoritesAndInit();
}

// Logování inicializace
window.DebugManager?.log('search', '🖖 Star Trek Music Player - Vyhledávací modul načten');
window.DebugManager?.log('search', '📋 Použití: window.searchModule.init() nebo automaticky při DOMContentLoaded');