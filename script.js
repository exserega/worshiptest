// =====================================================================
// 🏛️ AGAPE WORSHIP APP - MAIN ENTRY POINT
// =====================================================================
// Главная точка входа приложения - чистый и модульный код
// Все функциональность вынесена в специализированные модули
// =====================================================================

// ====================================
// 📋 RESTRUCTURE STAGE INDICATOR
// ====================================
// console.log('🎉 AGAPE WORSHIP - MODULAR ARCHITECTURE v2.0');

// ====================================
// 📦 CORE IMPORTS
// ====================================
import * as state from './js/state.js';
import * as api from './js/api.js';
import * as ui from './ui.js';
import logger from './src/utils/logger.js';
import { canManageEvents } from './src/modules/permissions/permissions.js';

// ====================================
// 🚀 MAIN INITIALIZATION IMPORT
// ====================================
import { initializeApp, onDOMContentLoaded } from './src/main/initialization.js';

// ====================================
// 🔗 GLOBAL COMPATIBILITY EXPORTS
// ====================================
// Экспортируем критически важные функции для обратной совместимости
// и динамических импортов из модулей

// Импорты для глобального доступа
import { 
    // Core functions
    eventBus,
    stateManager,
    
    // Search functions
    cleanLyricsForSearch,
    getHighlightedTextFragment,
    filterAndDisplaySongs as filterAndDisplaySongsModule,
    getNormalizedTitle,
    getNormalizedLyrics,
    getCleanedLyrics,
    
    // Setlist functions  
    startAddingSongs as startAddingSongsModule,
    closeAddSongsOverlay as closeAddSongsOverlayModule,
    addSongToSetlist as addSongToSetlistModule,
    
    // Modal functions
    showNotification as showNotificationModule,
    showSuccess as showSuccessModule,
    showError as showErrorModule,
    showWarning as showWarningModule,
    showConfirmDialog as showConfirmDialogModule,
    showToast as showToastModule,
    
    // Overlay functions
    showMobileSongPreview,
    hideMobileSongPreview
} from './src/core/index.js';

// ====================================
// 🌐 GLOBAL WINDOW EXPORTS
// ====================================
// Делаем функции доступными глобально для модулей и legacy кода

// Core state
window.eventBus = eventBus;
window.stateManager = stateManager;
window.state = state;
window.api = api;
window.ui = ui;

// Search functions
window.cleanLyricsForSearch = cleanLyricsForSearch;
window.getHighlightedTextFragment = getHighlightedTextFragment;
window.filterAndDisplaySongsModule = filterAndDisplaySongsModule;
window.getNormalizedTitle = getNormalizedTitle;
window.getNormalizedLyrics = getNormalizedLyrics;
window.getCleanedLyrics = getCleanedLyrics;

// Setlist functions
window.startAddingSongsModule = startAddingSongsModule;
window.closeAddSongsOverlayModule = closeAddSongsOverlayModule;
window.addSongToSetlistModule = addSongToSetlistModule;

// Modal functions  
window.showNotificationModule = showNotificationModule;
window.showSuccessModule = showSuccessModule;
window.showErrorModule = showErrorModule;
window.showWarningModule = showWarningModule;
window.showConfirmDialogModule = showConfirmDialogModule;
window.showToastModule = showToastModule;

// Overlay functions
window.showMobileSongPreview = showMobileSongPreview;
window.hideMobileSongPreview = hideMobileSongPreview;

// ====================================
// 🎛️ FEATURE FLAGS
// ====================================
// Флаги для переключения между старыми и новыми функциями
window.USE_MODULE_FUNCTIONS = false; // По умолчанию используем старые функции для совместимости

// ====================================
// 🔧 LEGACY FUNCTION STUBS
// ====================================
// Временные заглушки для функций, на которые ссылаются event handlers

// Font size functions
window.increaseFontSize = function() {
    logger.log('🔤 [Legacy] increaseFontSize called');
    if (window.state) {
        // Импортируем константы
        import('./js/constants.js').then(({ MAX_FONT_SIZE }) => {
            const newSize = Math.min(window.state.currentFontSize + 2, MAX_FONT_SIZE || 32);
            window.state.setCurrentFontSize(newSize);
            if (typeof ui.updateFontSize === 'function') {
                ui.updateFontSize();
            }
            // Сохраняем размер шрифта
            localStorage.setItem('songFontSize', newSize.toString());
            logger.log(`🔤 Font size increased to: ${newSize}px`);
        });
    }
};

window.decreaseFontSize = function() {
    logger.log('🔤 [Legacy] decreaseFontSize called');
    if (window.state) {
        // Импортируем константы
        import('./js/constants.js').then(({ MIN_FONT_SIZE }) => {
            const newSize = Math.max(MIN_FONT_SIZE || 4, window.state.currentFontSize - 2);
            window.state.setCurrentFontSize(newSize);
            if (typeof ui.updateFontSize === 'function') {
                ui.updateFontSize();
            }
            // Сохраняем размер шрифта
            localStorage.setItem('songFontSize', newSize.toString());
            logger.log(`🔤 Font size decreased to: ${newSize}px`);
        });
    }
};

// Theme toggle
window.toggleTheme = function() {
    console.log('🎨 [Legacy] toggleTheme called');
    const currentTheme = document.body.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    if (typeof ui.applyTheme === 'function') {
        ui.applyTheme(newTheme);
    }
};

// Text manipulation
window.splitTextIntoColumns = function() {
    console.log('📄 [Legacy] splitTextIntoColumns called');
    if (ui.songContent) {
        ui.songContent.classList.toggle('split-columns');
        if (typeof ui.updateSplitButton === 'function') {
            ui.updateSplitButton();
        }
    }
};

window.toggleChords = function() {
    logger.log('🎵 [Legacy] toggleChords called');
    if (window.state) {
        window.state.setAreChordsVisible(!window.state.areChordsVisible);
        if (ui.songContent) {
            ui.songContent.classList.toggle('chords-hidden', !window.state.areChordsVisible);
            ui.updateToggleChordsButton();
        }
    }
};

window.showChordsOnly = function() {
    logger.log('🎼 [Legacy] showChordsOnly called');
    if (window.state) {
        window.state.setIsChordsOnlyMode(!window.state.isChordsOnlyMode);
        if (ui.songContent) {
            ui.songContent.classList.toggle('chords-only-mode', window.state.isChordsOnlyMode);
            ui.updateChordsOnlyButton();
        }
    }
};

// ВОССТАНАВЛИВАЕМ поиск ОСТОРОЖНО - используем проверенную логику
window.handleMainSearch = function() {
    console.log('🔍 [Legacy] handleMainSearch called');
    
    if (!ui.searchInput) {
        console.log('🔍 [Legacy] No search input found');
        return;
    }
    
    const rawQuery = ui.searchInput.value.trim();
    console.log('🔍 [Legacy] Search query:', rawQuery);
    
    if (!rawQuery) {
        if (ui.searchResults) ui.searchResults.innerHTML = '';
        return;
    }
    
    // Простой поиск без Worker (безопасно)
    if (window.state && window.state.allSongs) {
        console.log('🔍 [Legacy] Searching in allSongs:', window.state.allSongs.length);
        
        const results = window.state.allSongs.filter(song => {
            const titleMatch = song.name.toLowerCase().includes(rawQuery.toLowerCase());
            const lyricsMatch = song['Текст и аккорды'] && 
                song['Текст и аккорды'].toLowerCase().includes(rawQuery.toLowerCase());
            return titleMatch || lyricsMatch;
        }).slice(0, 10); // Ограничиваем результаты
        
        console.log('🔍 [Legacy] Found results:', results.length);
        
        // Используем существующую функцию отображения
        if (typeof ui.displaySearchResults === 'function') {
            ui.displaySearchResults(results, (song) => {
                console.log('🔍 [Legacy] Search result selected:', song.name);
                ui.searchInput.value = song.name;
                if (ui.searchResults) ui.searchResults.innerHTML = '';

                // Новый путь (селекты удалены в новом UI): открываем песню напрямую
                if (typeof ui.displaySongDetails === 'function') {
                    const fullSongData = window.state?.allSongs?.find(s => s.id === song.id) || song;
                    ui.displaySongDetails(fullSongData);
                    return;
                }

                // Fallback на старые селекторы, если они все же присутствуют
                if (ui.sheetSelect && song.sheet) {
                    ui.sheetSelect.value = song.sheet;
                    ui.sheetSelect.dispatchEvent(new Event('change'));
                }
                if (ui.songSelect) {
                    ui.songSelect.value = song.id;
                    ui.songSelect.dispatchEvent(new Event('change'));
                }
            }, rawQuery);
        } else {
            console.log('🔍 [Legacy] ui.displaySearchResults not available');
        }
    } else {
        console.log('🔍 [Legacy] No songs data available');
    }
};

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ИЗ ОРИГИНАЛА - ТОЧНО КАК В РАБОЧЕМ КОДЕ
window.currentCreatedSetlistId = null;
window.currentCreatedSetlistName = '';
window.addedSongsToCurrentSetlist = new Map(); // Map для хранения песен с их тональностями

/** Показать/скрыть элементы управления песней */
window.toggleSongControls = function(show) {
    logger.log(`🎛️ [Legacy] toggleSongControls called with show=${show}`);
    
    if (show) {
        // Добавляем атрибут для показа элементов
        document.body.setAttribute('data-song-loaded', 'true');
    } else {
        // Удаляем атрибут для скрытия элементов
        document.body.removeAttribute('data-song-loaded');
    }
};

// Функция обновления счетчика добавленных песен
window.updateAddedSongsCount = function() {
    const count = window.addedSongsToCurrentSetlist.size;
    
    if (ui.addedSongsCount) {
        ui.addedSongsCount.textContent = count;
    }
    
    if (ui.addedSongsCountBadge) {
        ui.addedSongsCountBadge.textContent = count;
        ui.addedSongsCountBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    
    console.log('🔢 [Legacy] Updated counter to:', count);
};

// Функция заполнения фильтра категорий в overlay
window.populateCategoryFilter = function() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) {
        console.error('❌ [Legacy] category-filter не найден!');
        return;
    }
    
    categoryFilter.innerHTML = '<option value="">Все категории</option>';
    
    // Используем порядок категорий из constants
    const SONG_CATEGORIES_ORDER = window.SONG_CATEGORIES_ORDER || [
        'Поклонение', 'Прославление', 'Причастие', 
        'Крещение', 'Детские', 'Разное'
    ];
    
    // Сначала добавляем категории в заданном порядке
    SONG_CATEGORIES_ORDER.forEach(categoryName => {
        if (state.songsBySheet && state.songsBySheet[categoryName] && state.songsBySheet[categoryName].length > 0) {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categoryFilter.appendChild(option);
        }
    });
    
    // Затем добавляем остальные категории
    if (state.songsBySheet) {
        Object.keys(state.songsBySheet).forEach(categoryName => {
            if (!SONG_CATEGORIES_ORDER.includes(categoryName)) {
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                categoryFilter.appendChild(option);
            }
        });
    }
    
    console.log('📂 [Legacy] Категории в фильтре обновлены');
};

// ДОБАВЛЯЕМ НЕДОСТАЮЩУЮ ФУНКЦИЮ displaySongsGrid ИЗ ОРИГИНАЛА
window.displaySongsGrid = function(songs, searchTerm = '') {
    console.log('🎵 [Legacy] displaySongsGrid called with', songs.length, 'songs');
    
    if (!ui.songsGrid) {
        console.error('🎵 [Legacy] ui.songsGrid not found');
        return;
    }
    
    if (!songs || songs.length === 0) {
        ui.songsGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-music"></i>
                <p>Песни не найдены</p>
            </div>
        `;
        return;
    }
    
    ui.songsGrid.innerHTML = '';
    
    // Проверяем режим "Показать добавленные"
    const isShowingAddedOnly = ui.showAddedOnly && ui.showAddedOnly.classList.contains('active');
    
    songs.forEach(song => {
        // Проверяем добавлена ли песня (используем глобальную переменную)
        const isAdded = window.addedSongsToCurrentSetlist && window.addedSongsToCurrentSetlist.has(song.id);
        const addedKey = isAdded ? window.addedSongsToCurrentSetlist.get(song.id) : null;
        
        // Получаем правильную тональность из данных песни
        const originalKey = window.getSongKeyLocal ? window.getSongKeyLocal(song) : (song['Оригинальная тональность'] || 'C');
        
        // Проверяем, есть ли поиск по тексту
        let textFragment = '';
        if (searchTerm) {
            const normalizedQuery = window.normalizeSearchQuery ? window.normalizeSearchQuery(searchTerm) : searchTerm.toLowerCase();
            const titleMatch = song.name.toLowerCase().includes(normalizedQuery);
            
            // Если не найдено в названии, ищем в тексте
            if (!titleMatch) {
                const cleanedLyrics = song['Текст и аккорды'] || '';
                
                if (cleanedLyrics) {
                    textFragment = window.getHighlightedTextFragment ? 
                        window.getHighlightedTextFragment(cleanedLyrics, searchTerm, 80) : 
                        cleanedLyrics.substring(0, 80) + '...';
                }
            }
        }
        
        const songCard = document.createElement('div');
        songCard.className = `song-card ${isAdded ? 'added' : ''}`;
        songCard.innerHTML = `
            <div class="song-card-header">
                <div class="song-info">
                    <div class="song-title-row">
                        <h4 class="song-title">${song.name}</h4>
                        ${song.BPM && song.BPM !== 'NA' ? `<span class=\"song-bpm\"><i class=\"fas fa-tachometer-alt\"></i>${song.BPM}</span>` : ''}
                        ${isAdded && addedKey ? `<span class=\"song-added-key\">${addedKey}</span>` : ''}
                    </div>
                    <div class="song-category-label">${song.sheet || 'Без категории'}</div>
                    ${textFragment ? `<div class="song-text-fragment">${textFragment}</div>` : ''}
                </div>
                <button class="song-add-btn ${isAdded ? 'added' : ''}" data-song-id="${song.id}" aria-label="${isAdded ? (isShowingAddedOnly ? 'Удалить' : 'Добавлена') : 'Добавить'}">
                    <i class="fas fa-${isAdded ? (isShowingAddedOnly ? 'times' : 'check') : 'plus'}"></i>
                </button>
            </div>
        `;
        
        ui.songsGrid.appendChild(songCard);
    });
    
    console.log('🎵 [Legacy] displaySongsGrid completed, rendered', songs.length, 'songs');
};

// Обновление списка песен в overlay с сохранением текущих фильтров
window.refreshSongsDisplay = async function() {
    try {
        const searchInput = document.getElementById('song-search-input');
        const categorySelect = document.getElementById('category-filter');
        const showAddedOnlyBtn = document.getElementById('show-added-only');
        const searchTerm = (searchInput && searchInput.value) || '';
        const category = (categorySelect && categorySelect.value) || '';
        const showAddedOnly = !!(showAddedOnlyBtn && showAddedOnlyBtn.classList.contains('active'));

        if (typeof window.filterAndDisplaySongs === 'function') {
            await window.filterAndDisplaySongs(searchTerm, category, showAddedOnly);
        } else {
            const { filterAndDisplaySongs } = await import('./src/ui/search-manager.js');
            await filterAndDisplaySongs(searchTerm, category, showAddedOnly);
        }
    } catch (e) {
        console.error('❌ refreshSongsDisplay failed:', e);
    }
};

// УБРАЛИ toggleMyListPanel - логика теперь в обработчике событий

// УБРАЛИ toggleRepertoirePanel - логика теперь в обработчике событий

// ВОССТАНАВЛИВАЕМ ТОЧНО КАК В ОРИГИНАЛЕ
window.refreshSetlists = async function() {
    console.log('📋 [Legacy] refreshSetlists called');
    
    try {
        const setlists = await api.loadSetlists();
        console.log('📋 [Legacy] Loaded setlists:', setlists.length);
        
        // ТОЧНО КАК В ОРИГИНАЛЕ
        window.state.setSetlists(setlists);
        ui.renderSetlists(setlists, window.handleSetlistSelect, window.handleSetlistDelete);
        
    } catch (error) {
        console.error("📋 [Legacy] Ошибка при загрузке сет-листов:", error);
        ui.renderSetlists([], window.handleSetlistSelect, window.handleSetlistDelete); // Render empty list on error
    }
};

// ОРИГИНАЛЬНЫЕ ОБРАБОТЧИКИ ТОЧНО КАК БЫЛИ
window.handleSetlistSelect = function(setlist) {
    logger.log('📋 [Legacy] handleSetlistSelect:', setlist.name);
    window.state.setCurrentSetlistId(setlist.id);
    // ИСПРАВЛЕНО: Используем правильную функцию для установки названия
    window.state.setCurrentSetlistName(setlist.name);
    ui.displaySelectedSetlist(setlist, window.handleFavoriteOrRepertoireSelect, window.handleRemoveSongFromSetlist);
};

window.handleSetlistDelete = async function(setlistId, setlistName) {
    logger.log('📋 [Legacy] handleSetlistDelete:', setlistName);
    if (confirm(`Вы уверены, что хотите удалить сет-лист "${setlistName}"?`)) {
        try {
            const wasSelected = window.state.currentSetlistId === setlistId;

            await api.deleteSetlist(setlistId);
            await window.refreshSetlists(); // This re-renders the list

            if (wasSelected) {
                window.state.setCurrentSetlistId(null);
                ui.clearSetlistSelection();
            }
        } catch (error) {
            logger.error("Ошибка при удалении сет-листа:", error);
            alert("Не удалось удалить сет-лист.");
        }
    }
};

window.handleFavoriteOrRepertoireSelect = function(song) {
    logger.log('🎵 [Legacy] Song selected from panel:', song.name);
    
    if (!song || !song.id) return;
    
    // Используем новый метод отображения песни
    if (typeof ui.displaySongDetails === 'function') {
        // Ищем полные данные песни в state
        const fullSongData = window.state.allSongs?.find(s => s.id === song.id) || song;
        logger.log('🎵 [Legacy] Displaying song details for:', fullSongData.name);
        
        // Передаем также тональность, если она указана в песне из сет-листа
        // Приоритет: preferredKey из сетлиста, затем defaultKey
        const keyToSelect = song.preferredKey || song.keyToSelect || song.defaultKey || fullSongData.defaultKey;
        logger.log('🎵 [Legacy] Key to select:', keyToSelect, 'preferredKey:', song.preferredKey);
        ui.displaySongDetails(fullSongData, keyToSelect);
    }
    
    // Закрываем панели
    if (typeof ui.closeAllSidePanels === 'function') {
        ui.closeAllSidePanels();
    }
    
    // КРИТИЧЕСКИ ВАЖНО: Убираем анимацию загрузки с кнопки репертуара
    if (ui.toggleRepertoireButton) {
        ui.toggleRepertoireButton.classList.remove('loading');
        logger.log('🎭 [Legacy] Repertoire loading animation removed');
    }
};

window.handleRemoveSongFromSetlist = async function(songId, songName) {
    console.log('🗑️ [Legacy] handleRemoveSongFromSetlist:', songName);
    const setlistId = window.state.currentSetlistId;
    if (!setlistId) return;

    if (confirm(`Удалить песню "${songName}" из текущего сет-листа?`)) {
        try {
            await api.removeSongFromSetlist(setlistId, songId);

            // Refresh view
            const updatedSetlists = await api.loadSetlists();
            window.state.setSetlists(updatedSetlists);
            const updatedCurrentSetlist = updatedSetlists.find(s => s.id === setlistId);
            if (updatedCurrentSetlist) {
                window.state.setCurrentSetlistId(updatedCurrentSetlist.id); // Re-set state
                ui.displaySelectedSetlist(updatedCurrentSetlist, window.handleFavoriteOrRepertoireSelect, window.handleRemoveSongFromSetlist);
            } else {
                // This case handles if the setlist was somehow deleted in the process
                window.state.setCurrentSetlistId(null);
                ui.clearSetlistSelection();
            }
        } catch (error) {
            console.error("Ошибка при удалении песни из сет-листа:", error);
            alert("Не удалось удалить песню.");
        }
    }
};

window.handleRepertoireUpdate = function(data) {
    logger.log('🎭 [Legacy] handleRepertoireUpdate called:', data);
    
    if (data.error) {
        logger.error('🎭 [Legacy] Repertoire error:', data.error);
        if (window.state && typeof window.state.setCurrentRepertoireSongsData === 'function') {
            window.state.setCurrentRepertoireSongsData([]);
        }
    } else {
        logger.log('🎭 [Legacy] Repertoire data loaded:', data.data?.length || 0);
        logger.log('🎭 [Legacy] Repertoire songs:', data.data);
        if (window.state && typeof window.state.setCurrentRepertoireSongsData === 'function') {
            window.state.setCurrentRepertoireSongsData(data.data || []);
        }
    }
    
    // Отображаем репертуар
    if (typeof ui.renderRepertoire === 'function') {
        ui.renderRepertoire(window.handleFavoriteOrRepertoireSelect);
    }
    
    // Обновляем кнопку репертуара для текущей песни
    const currentSongId = ui.songSelect?.value;
    if (currentSongId && window.state && window.state.allSongs) {
        const currentSong = window.state.allSongs.find(s => s.id === currentSongId);
        if (currentSong && typeof ui.updateRepertoireButton === 'function') {
            ui.updateRepertoireButton(currentSong);
        }
    }
    
    // КРИТИЧЕСКИ ВАЖНО: Убираем анимацию загрузки после обновления данных
    if (ui.toggleRepertoireButton) {
                    ui.toggleRepertoireButton.classList.remove('loading');
            logger.log('🎭 [Legacy] Repertoire loading animation removed after data update');
    }
};

// КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ ДЛЯ РЕПЕРТУАРА - ОТСУТСТВОВАЛА!
window.handleVocalistChange = function(vocalistId) {
    console.log('🎭 [Legacy] handleVocalistChange called:', vocalistId);
    
    // Устанавливаем текущего вокалиста в state
    if (window.state && typeof window.state.setCurrentVocalistId === 'function') {
        window.state.setCurrentVocalistId(vocalistId);
        console.log('🎭 [Legacy] Current vocalist ID set:', vocalistId);
    }
    
    // Если выбран вокалист и панель репертуара открыта, обновляем данные
    if (vocalistId && ui.repertoirePanel && ui.repertoirePanel.classList.contains('open')) {
        console.log('🎭 [Legacy] Repertoire panel is open, reloading data...');
        
        // Показываем индикатор загрузки
        if (ui.toggleRepertoireButton) {
            ui.toggleRepertoireButton.classList.add('loading');
        }
        
        // Загружаем репертуар для нового вокалиста
        if (typeof api.loadRepertoire === 'function') {
            api.loadRepertoire(vocalistId, window.handleRepertoireUpdate);
        } else {
            console.error('🎭 [Legacy] api.loadRepertoire not found');
            if (ui.toggleRepertoireButton) {
                ui.toggleRepertoireButton.classList.remove('loading');
            }
        }
    } else if (!vocalistId) {
        // Если вокалист не выбран, очищаем репертуар
        console.log('🎭 [Legacy] No vocalist selected, clearing repertoire');
        if (window.state && typeof window.state.setCurrentRepertoireSongsData === 'function') {
            window.state.setCurrentRepertoireSongsData([]);
        }
        
        // Обновляем отображение если панель открыта
        if (ui.repertoirePanel && ui.repertoirePanel.classList.contains('open')) {
            if (typeof ui.renderRepertoire === 'function') {
                ui.renderRepertoire(window.handleFavoriteOrRepertoireSelect);
            }
        }
    }
};

// ====================================
// 🎵 SONG EDITOR HANDLERS
// ====================================

/**
 * Обработчик сохранения отредактированной песни
 */
window.handleSaveEdit = async function() {
    console.log('💾 [Legacy] handleSaveEdit called');
    
    try {
        // Получаем элементы редактора
        const editorTextarea = document.getElementById('song-edit-textarea');
        const currentSong = window.stateManager?.getCurrentSong?.() || window.currentSong;
        
        if (!editorTextarea || !currentSong) {
            console.error('❌ [Legacy] Editor elements or current song not found');
            return;
        }
        
        const songId = currentSong.id;
        const editedContent = editorTextarea.value;
        
        if (!songId) {
            console.error('❌ [Legacy] No song ID found');
            return;
        }
        
        console.log('💾 [Legacy] Saving song:', songId);
        
        // Сохраняем изменения через API
        if (typeof api.saveSongEdit === 'function') {
            await api.saveSongEdit(songId, editedContent);
            
            // Обновляем отображение песни если она сейчас выбрана
            const currentSelect = ui.songSelect?.value;
            if (currentSelect === songId) {
                // Обновляем песню в state
                const updatedSong = window.state.allSongs.find(s => s.id === songId);
                if (updatedSong) {
                    // Сохраняем оригинал если его еще нет
                    if (!updatedSong.originalContent) {
                        updatedSong.originalContent = updatedSong['Текст и аккорды'] || '';
                    }
                    
                    // Обновляем отредактированное содержимое
                    updatedSong['Текст и аккорды (edited)'] = editedContent;
                    updatedSong.hasWebEdits = true;
                    
                    // Перезагружаем отображение
                    const event = new Event('change');
                    ui.songSelect.dispatchEvent(event);
                }
            }
            
            // Закрываем редактор
            if (ui.songEditorOverlay) {
                ui.songEditorOverlay.classList.remove('visible');
            }
            
            // Показываем уведомление
            if (typeof ui.showModal === 'function') {
                ui.showModal('Изменения сохранены!', 'success');
            }
            
            console.log('✅ [Legacy] Song saved successfully');
        } else {
            console.error('❌ [Legacy] api.saveSongEdit not found');
        }
    } catch (error) {
        console.error('❌ [Legacy] Error saving song:', error);
        if (typeof ui.showModal === 'function') {
            ui.showModal('Ошибка при сохранении: ' + error.message, 'error');
        }
    }
};

/**
 * Обработчик отката к оригинальной версии песни
 */
window.handleRevertToOriginal = async function() {
    console.log('🔄 [Legacy] handleRevertToOriginal called');
    
    try {
        const currentSong = window.stateManager?.getCurrentSong?.() || window.currentSong;
        if (!currentSong) {
            console.error('❌ [Legacy] No current song found');
            return;
        }
        
        const songId = currentSong.id;
        if (!songId) {
            console.error('❌ [Legacy] No song ID found');
            return;
        }
        
        // Подтверждение действия
        const confirmRevert = confirm('Вы уверены, что хотите откатить все изменения к оригинальной версии из Google Таблицы?');
        if (!confirmRevert) {
            return;
        }
        
        console.log('🔄 [Legacy] Reverting song:', songId);
        
        // Откатываем через API
        if (typeof api.revertToOriginal === 'function') {
            await api.revertToOriginal(songId);
            
            // Обновляем песню в state
            const song = window.state.allSongs.find(s => s.id === songId);
            if (song) {
                // Восстанавливаем оригинальный текст
                const originalText = song.originalContent || song['Текст и аккорды'] || '';
                song['Текст и аккорды (edited)'] = '';
                song.hasWebEdits = false;
                
                // Обновляем текстовое поле редактора
                const editorTextarea = document.getElementById('song-edit-textarea');
                if (editorTextarea) {
                    editorTextarea.value = originalText;
                }
                
                // Если песня сейчас выбрана, обновляем отображение
                const currentSelect = ui.songSelect?.value;
                if (currentSelect === songId) {
                    const event = new Event('change');
                    ui.songSelect.dispatchEvent(event);
                }
            }
            
            // Показываем уведомление
            if (typeof ui.showModal === 'function') {
                ui.showModal('Песня откачена к оригинальной версии!', 'success');
            }
            
            console.log('✅ [Legacy] Song reverted successfully');
        } else {
            console.error('❌ [Legacy] api.revertToOriginal not found');
        }
    } catch (error) {
        console.error('❌ [Legacy] Error reverting song:', error);
        if (typeof ui.showModal === 'function') {
            ui.showModal('Ошибка при откате: ' + error.message, 'error');
        }
    }
};

// ====================================
// 🚀 APPLICATION STARTUP
// ====================================
// Единственная задача этого файла - запустить приложение!

console.log('🎯 [EntryPoint] script.js загружен - запуск инициализации...');

// Инициализация уже настроена в модуле initialization.js
// Она автоматически запустится при готовности DOM

// ====================================
// 📊 ENTRY POINT METADATA
// ====================================
export const metadata = {
    name: 'AgapeWorshipApp',
    version: '2.0.0',
    description: 'Главная точка входа приложения Agape Worship',
    architecture: 'Modular',
    modules: [
        'Core (Event Bus, State Manager, Utilities)',
        'UI (DOM, Search, Display, Utils, Overlays, Modals)',
        'API (Firebase operations)',
        'Main (Controller, Event Handlers, Initialization)'
    ],
    codeReduction: '2017 → ~100 строк (95% сокращение)',
    maintainability: 'Максимальная - каждый модуль < 500 строк',
    cursorEfficiency: 'Оптимизировано для AI-ассистентов'
};

// ФУНКЦИЯ УВЕДОМЛЕНИЙ - ИЗ РАБОЧЕГО КОДА
window.showNotification = function(message, type = 'info') {
    console.log('📢 [EntryPoint] showNotification:', message, type);
    console.log('📢 [EntryPoint] showNotificationModule type:', typeof showNotificationModule);
    console.log('📢 [EntryPoint] showNotificationModule:', showNotificationModule);
    
    // Используем импортированную модульную функцию - ИСПРАВЛЕНО!
    if (typeof showNotificationModule === 'function') {
        console.log('📢 [EntryPoint] Calling showNotificationModule...');
        showNotificationModule(message, type);
        return;
    }
    
    console.log('📢 [EntryPoint] Using fallback notification...');
    
    // Fallback - простое уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--bg-secondary, #1f2937);
        color: var(--text-primary, #e5e7eb);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 16px 24px;
        font-size: 0.95rem;
        z-index: 99999;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        transform: translateX(calc(100% + 40px));
        transition: transform 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
        min-width: 250px;
    `;
    
    document.body.appendChild(notification);
    
    // Добавляем цвета в зависимости от типа
    switch (type) {
        case 'success':
            notification.style.borderColor = '#10b981';
            notification.style.backgroundColor = '#065f46';
            notification.style.color = '#d1fae5';
            break;
        case 'error':
            notification.style.borderColor = '#ef4444';
            notification.style.backgroundColor = '#7f1d1d';
            notification.style.color = '#fee2e2';
            break;
        case 'warning':
            notification.style.borderColor = '#f59e0b';
            notification.style.backgroundColor = '#78350f';
            notification.style.color = '#fef3c7';
            break;
        case 'info':
        default:
            notification.style.borderColor = '#3b82f6';
            notification.style.backgroundColor = '#1e3a8a';
            notification.style.color = '#dbeafe';
            break;
    }
    
    console.log('📢 [EntryPoint] Fallback notification added to DOM');
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        console.log('📢 [EntryPoint] Fallback transform set to translateX(0)');
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Удаляем весь отладочный код

// ФУНКЦИЯ ДОБАВЛЕНИЯ ПЕСНИ В СЕТ-ЛИСТ
window.handleAddSongToSetlist = async function() {
    logger.log('📋 [EntryPoint] handleAddSongToSetlist called');
    logger.log('📋 [EntryPoint] window.currentSong:', window.currentSong);
    
    // Получаем текущую песню из глобального состояния
    let currentSong = window.currentSong;
    
    // Проверяем также stateManager
    if (!currentSong && window.stateManager && typeof window.stateManager.getCurrentSong === 'function') {
        currentSong = window.stateManager.getCurrentSong();
        logger.log('📋 [EntryPoint] Got song from stateManager:', currentSong);
    }
    
    if (!currentSong || !currentSong.id) {
        logger.error('❌ [EntryPoint] No current song found:', currentSong);
        window.showNotification('❌ Сначала выберите песню', 'error');
        return;
    }
    
    const songId = currentSong.id;
    
    // Получаем выбранную тональность
    const keySelect = ui.keySelect;
    logger.log('📋 [EntryPoint] keySelect element:', keySelect);
    logger.log('📋 [EntryPoint] keySelect value:', keySelect?.value);
    logger.log('📋 [EntryPoint] song keys:', currentSong.keys);
    
    const selectedKey = keySelect?.value || currentSong.keys?.[0] || 'C';
    
    logger.log('📋 [EntryPoint] Adding song to setlist:', currentSong.name, 'in key:', selectedKey);
    
    // Открываем overlay выбора сет-листа с тональностью
    if (typeof window.openSetlistSelector === 'function') {
        await window.openSetlistSelector(currentSong, selectedKey);
    } else {
        console.error('openSetlistSelector function not found');
        window.showNotification('❌ Ошибка: модуль выбора сет-листа не загружен', 'error');
    }
};

// ФУНКЦИЯ СОЗДАНИЯ СЕТЛИСТА - ТОЧНО КАК В РАБОЧЕМ КОДЕ
window.handleCreateSetlist = async function() {
    console.log('🎵 [EntryPoint] handleCreateSetlist called');
    const name = ui.newSetlistNameInput.value.trim();
    if (!name) {
        window.showNotification('❌ Название сет-листа не может быть пустым', 'error');
        return;
    }
    
    try {
        ui.createSetlistButton.disabled = true;
        ui.createSetlistButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Создание...</span>';
        
        const docRef = await api.createSetlist(name);
        // api.createSetlist возвращает строку ID, не объект - КАК В РАБОЧЕМ КОДЕ!
        window.currentCreatedSetlistId = docRef; // docRef это уже строка ID
        window.currentCreatedSetlistName = name;
        
        console.log('🎯 [DEBUG] Created setlist:', window.currentCreatedSetlistId, window.currentCreatedSetlistName);
        
        // Закрываем модал (функция должна быть в ui)
        if (typeof ui.closeCreateSetlistModal === 'function') {
            ui.closeCreateSetlistModal();
        } else if (ui.createSetlistModal) {
            ui.createSetlistModal.classList.remove('show');
            ui.newSetlistNameInput.value = '';
            window.addedSongsToCurrentSetlist.clear();
        }
        
        await window.refreshSetlists();
        
        if (ui.createdSetlistName) {
            ui.createdSetlistName.textContent = name;
        }
        
        window.showNotification('✅ Сет-лист создан успешно!', 'success');
        
    } catch (error) {
        console.error('Ошибка создания сет-листа:', error);
        window.showNotification('❌ Ошибка при создании сет-листа', 'error');
    } finally {
        ui.createSetlistButton.disabled = false;
        ui.createSetlistButton.innerHTML = '<i class="fas fa-arrow-right"></i><span>Продолжить</span>';
    }
};

console.log('✨ [EntryPoint] Agape Worship App v2.0 - Modular Architecture Ready!');

// ====================================
// 📅 SETLIST TO EVENT INTEGRATION
// ====================================

/**
 * Добавляет сет-лист в календарь событий
 * @param {string} setlistId - ID сет-листа для добавления
 */
window.addSetlistToCalendar = async function(setlistId) {
    try {
        // Проверяем права доступа
        if (!canManageEvents()) {
            window.showNotification('❌ У вас нет прав для управления событиями', 'error');
            return;
        }
        
        // Получаем информацию о сет-листе
        const setlists = state.setlists || [];
        const setlist = setlists.find(s => s.id === setlistId);
        
        if (!setlist) {
            window.showNotification('❌ Сет-лист не найден', 'error');
            return;
        }
        
        // Динамически импортируем модуль модального окна
        const { getDatePickerModal } = await import('./src/modules/integration/datePickerModal.js');
        const datePickerModal = getDatePickerModal();
        
        // Открываем модальное окно выбора даты
        datePickerModal.open(setlist, async (selectedDate, setlistData) => {
            logger.log('📅 Выбрана дата:', selectedDate, 'для сет-листа:', setlistData.name);
            
            let events = [];
            
            // Проверяем события на выбранную дату
            try {
                logger.log('📅 Начинаем проверку событий...');
                const { checkEventsOnDate, getEventsDescription } = await import('./src/modules/integration/eventChecker.js');
                logger.log('📅 Модуль eventChecker загружен');
                
                events = await checkEventsOnDate(selectedDate);
                logger.log('📅 Результат проверки:', events);
                
                // Показываем информацию о найденных событиях
                const description = getEventsDescription(events);
                window.showNotification(`📅 ${description}`, 'info');
                
                // Обрабатываем результат
                if (events.length === 0) {
                    // Нет событий - предлагаем создать новое
                    logger.log('📅 На дату нет событий, предлагаем создать новое');
                    await handleCreateNewEvent(selectedDate, setlistData);
                } else if (events.length === 1) {
                    // Одно событие - показываем выбор действия
                    const event = events[0];
                    logger.log('📅 Найдено одно событие:', event.name, 'Сет-лист:', event.setlistId ? 'есть' : 'нет');
                    await handleSingleEvent(event, setlistData, selectedDate);
                } else {
                    // Несколько событий - показываем выбор
                    logger.log('📅 Найдено несколько событий, показываем выбор');
                    await handleMultipleEvents(events, selectedDate, setlistData);
                }
            } catch (error) {
                logger.error('❌ Ошибка при проверке событий:', error);
                window.showNotification('❌ Ошибка при проверке событий', 'error');
            }
        });
        
    } catch (error) {
        logger.error('Ошибка при добавлении в календарь:', error);
        window.showNotification('❌ Произошла ошибка', 'error');
    }
    
    /**
     * Обработка случая, когда на дату нет событий
     */
    async function handleCreateNewEvent(selectedDate, setlistData) {
        logger.log('📅 Открываем создание нового события для даты:', selectedDate);
        logger.log('📋 Сет-лист:', setlistData);
        
        try {
            // Создаем новый экземпляр модального окна
            const EventCreationModal = (await import('./src/modules/events/eventCreationModal.js')).default;
            logger.log('✅ EventCreationModal импортирован');
            
            const newModal = new EventCreationModal();
            logger.log('✅ Экземпляр модального окна создан');
            
            // Открываем модальное окно с датой и предвыбранным сет-листом
            newModal.open(new Date(selectedDate), async (eventId) => {
                logger.log('✅ Событие создано:', eventId);
                // Сет-лист уже был выбран в модальном окне, не нужно его обновлять отдельно
            }, setlistData.id);
            
            logger.log('✅ Метод open() вызван');
            
        } catch (error) {
            logger.error('❌ Ошибка при открытии модального окна:', error);
            window.showNotification('❌ Ошибка при открытии окна создания события', 'error');
        }
    }
    
    /**
     * Обработка случая, когда найдено одно событие
     */
    async function handleSingleEvent(event, setlistData, selectedDate) {
        const { formatEventInfo } = await import('./src/modules/integration/eventChecker.js');
        const { getEventActionModal } = await import('./src/modules/integration/eventActionModal.js');
        
        const eventInfo = formatEventInfo(event);
        const modal = getEventActionModal();
        
        modal.open(eventInfo, setlistData, async (action, eventData, setlistData) => {
            if (action === 'replace') {
                logger.log('📅 Заменяем сет-лист в событии');
                await updateEventSetlist(eventData.id, setlistData.id, setlistData.name);
            } else if (action === 'create') {
                logger.log('📅 Создаем новое событие');
                await handleCreateNewEvent(selectedDate, setlistData);
            }
        });
    }
    
    /**
     * Обработка случая с несколькими событиями
     */
    async function handleMultipleEvents(events, selectedDate, setlistData) {
        logger.log('📅 Открываем выбор из нескольких событий');
        
        try {
            const { getEventSelectorModal } = await import('./src/modules/integration/eventSelectorModal.js');
            const selectorModal = getEventSelectorModal();
            
            selectorModal.open(events, selectedDate, setlistData, async (action, eventData, setlistData, selectedDate) => {
                if (action === 'create') {
                    // Создание нового события
                    logger.log('📅 Создаем новое событие вместо выбора из существующих');
                    await handleCreateNewEvent(selectedDate, setlistData);
                }
                // Обработка выбора события теперь происходит внутри eventSelectorModal
            });
            
        } catch (error) {
            logger.error('❌ Ошибка при открытии селектора событий:', error);
            window.showNotification('❌ Ошибка при выборе события', 'error');
        }
    }
    
    /**
     * Обновление сет-листа в событии
     */
    async function updateEventSetlist(eventId, setlistId, setlistName) {
        try {
            const { db } = await import('./firebase-init.js');
            
            // Обновляем событие
            await db.collection('events').doc(eventId).update({
                setlistId: setlistId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            window.showNotification(`✅ Сет-лист "${setlistName}" добавлен в событие`, 'success');
            logger.log('✅ Сет-лист обновлен в событии');
            
        } catch (error) {
            logger.error('❌ Ошибка при обновлении события:', error);
            window.showNotification('❌ Ошибка при обновлении события', 'error');
        }
    }
};

// ОБРАБОТЧИКИ ПАНЕЛЕЙ ТЕПЕРЬ В event-handlers.js - МОДУЛЬНО И ПРАВИЛЬНО!

// Обработчик для кнопки "Сохранить в архив"
document.addEventListener('DOMContentLoaded', () => {
    const saveToArchiveBtn = document.getElementById('save-to-archive-btn');
    if (saveToArchiveBtn) {
        saveToArchiveBtn.addEventListener('click', async () => {
            logger.log('📦 Клик по кнопке "Сохранить в архив"');
            
            // Получаем текущий выбранный сет-лист из state (как в кнопке календаря)
            const currentSetlistId = window.state?.currentSetlistId;
            const currentSetlist = window.state?.setlists?.find(s => s.id === currentSetlistId);
            
            if (!currentSetlist) {
                window.showNotification('Сначала выберите сет-лист', 'warning');
                return;
            }
            
            logger.log('📦 Текущий сет-лист:', currentSetlist);
            
            try {
                // Динамически импортируем модуль
                const { getArchiveSaveModal } = await import('./src/modules/archive/archiveSaveModal.js');
                const modal = getArchiveSaveModal();
                
                // Открываем модальное окно
                modal.open(currentSetlist, (archiveId) => {
                    window.showNotification('✅ Сет-лист сохранен в архив', 'success');
                    logger.log('✅ Сет-лист сохранен в архив с ID:', archiveId);
                });
                
            } catch (error) {
                logger.error('❌ Ошибка при открытии модального окна:', error);
                window.showNotification('Ошибка при сохранении в архив', 'error');
            }
        });
    }
});