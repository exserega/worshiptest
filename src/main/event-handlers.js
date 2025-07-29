/**
 * ===================================================================
 * EVENT HANDLERS MODULE
 * ===================================================================
 * Модуль для обработчиков событий - связывает UI элементы с функциями
 * 
 * Функции:
 * - setupEventListeners() - настройка всех обработчиков событий
 * - setupUIEventHandlers() - обработчики UI элементов
 * - setupSearchEventHandlers() - обработчики поиска
 * - setupModalEventHandlers() - обработчики модальных окон
 * - setupKeyboardEventHandlers() - обработчики клавиатуры
 */

// Импорты
import * as controller from './controller.js';
import { 
    startAddingSongs as startAddingSongsModule,
    closeAddSongsOverlay as closeAddSongsOverlayModule,
    filterAndDisplaySongs as filterAndDisplaySongsModule
} from '../core/index.js';
import { showMobileSongPreview } from '../core/index.js';
import * as ui from '../../ui.js';
import * as state from '../../state.js';

// ====================================
// MAIN SETUP FUNCTION
// ====================================

/**
 * Настраивает все обработчики событий приложения
 */
export function setupEventListeners() {
    console.log('🎮 [EventHandlers] setupEventListeners START');
    
    // Основные UI обработчики
    setupUIEventHandlers();
    
    // Обработчики поиска
    setupSearchEventHandlers();
    
    // Обработчики модальных окон
    setupModalEventHandlers();
    
    // Обработчики клавиатуры
    setupKeyboardEventHandlers();
    
    // Обработчики сетлистов
    setupSetlistEventHandlers();
    
    // Обработчики песен
    setupSongEventHandlers();
    
    console.log('🎮 [EventHandlers] setupEventListeners COMPLETED');
}

// ====================================
// UI EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики основных UI элементов
 */
function setupUIEventHandlers() {
    console.log('🎨 [EventHandlers] setupUIEventHandlers');
    
    // Кнопки масштабирования
    if (ui.zoomInButton) {
        ui.zoomInButton.addEventListener('click', () => {
            if (typeof window.increaseFontSize === 'function') {
                window.increaseFontSize();
            }
        });
    }
    
    if (ui.zoomOutButton) {
        ui.zoomOutButton.addEventListener('click', () => {
            if (typeof window.decreaseFontSize === 'function') {
                window.decreaseFontSize();
            }
        });
    }
    
    // Кнопка разделения текста
    if (ui.splitTextButton) {
        ui.splitTextButton.addEventListener('click', () => {
            if (typeof window.splitTextIntoColumns === 'function') {
                window.splitTextIntoColumns();
            }
        });
    }
    
    // Кнопка переключения аккордов
    if (ui.toggleChordsButton) {
        ui.toggleChordsButton.addEventListener('click', () => {
            if (typeof window.toggleChords === 'function') {
                window.toggleChords();
            }
        });
    }
    
    // Кнопка "только аккорды"
    if (ui.chordsOnlyButton) {
        ui.chordsOnlyButton.addEventListener('click', () => {
            if (typeof window.showChordsOnly === 'function') {
                window.showChordsOnly();
            }
        });
    }
    
    // Переключение темы
    if (ui.themeToggleButton) {
        ui.themeToggleButton.addEventListener('click', () => {
            if (typeof window.toggleTheme === 'function') {
                window.toggleTheme();
            }
        });
    }
    
    // Селекторы инструментов
    if (ui.sheetSelect) {
        ui.sheetSelect.addEventListener('change', () => {
            console.log('🎵 [EventHandlers] Sheet selector changed:', ui.sheetSelect.value);
            // Очищаем поиск и обновляем список песен
            if (ui.searchInput) ui.searchInput.value = '';
            if (ui.searchResults) ui.searchResults.innerHTML = '';
            if (typeof ui.populateSongSelect === 'function') {
                ui.populateSongSelect();
            }
        });
    }
    
    if (ui.songSelect) {
        ui.songSelect.addEventListener('change', () => {
            console.log('🎵 [EventHandlers] Song selector changed:', ui.songSelect.value);
            const songId = ui.songSelect.value;
            if (songId && window.state && window.state.allSongs) {
                const songData = window.state.allSongs.find(s => s.id === songId);
                console.log('🎵 [EventHandlers] Found song data:', songData?.name);
                if (songData && typeof ui.displaySongDetails === 'function') {
                    ui.displaySongDetails(songData);
                }
            }
        });
    }
    
    if (ui.keySelect) {
        ui.keySelect.addEventListener('change', () => {
            console.log('🎵 [EventHandlers] Key selector changed:', ui.keySelect.value);
            const songId = ui.keySelect.dataset.songId;
            if (songId && window.state && window.state.allSongs) {
                const songData = window.state.allSongs.find(s => s.id === songId);
                if (songData && typeof ui.displaySongDetails === 'function') {
                    const newKey = ui.keySelect.value;
                    ui.displaySongDetails(songData, newKey);
                }
            }
        });
    }
}

// ====================================
// SEARCH EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики поиска
 */
function setupSearchEventHandlers() {
    console.log('🔍 [EventHandlers] setupSearchEventHandlers');
    
    // Основной поиск с debounce
    if (ui.searchInput) {
        // Простая debounce функция
        let searchTimeout;
        
        ui.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (typeof window.handleMainSearch === 'function') {
                    window.handleMainSearch();
                }
            }, 150); // Задержка 150мс
        });
        
        ui.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (ui.searchResults) {
                    ui.searchResults.innerHTML = '';
                }
            }, 200);
        });
    }
    
    // Поиск в overlay добавления песен
    if (ui.songSearchInput) {
        ui.songSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const currentCategory = ui.categoryFilter ? ui.categoryFilter.value : '';
            const showAddedOnly = ui.showAddedOnly ? ui.showAddedOnly.classList.contains('active') : false;
            
            // Используем модульную функцию
            filterAndDisplaySongsModule(searchTerm, currentCategory, showAddedOnly);
        });
    }
    
    // Очистка поиска
    if (ui.clearSearch) {
        ui.clearSearch.addEventListener('click', () => {
            if (ui.songSearchInput) {
                ui.songSearchInput.value = '';
                ui.songSearchInput.dispatchEvent(new Event('input'));
            }
        });
    }
    
    // Фильтр категорий
    if (ui.categoryFilter) {
        ui.categoryFilter.addEventListener('change', (e) => {
            const searchTerm = ui.songSearchInput ? ui.songSearchInput.value.trim() : '';
            const currentCategory = e.target.value;
            const showAddedOnly = ui.showAddedOnly ? ui.showAddedOnly.classList.contains('active') : false;
            
            filterAndDisplaySongsModule(searchTerm, currentCategory, showAddedOnly);
        });
    }
    
    // Показать только добавленные
    if (ui.showAddedOnly) {
        ui.showAddedOnly.addEventListener('click', () => {
            ui.showAddedOnly.classList.toggle('active');
            
            const searchTerm = ui.songSearchInput ? ui.songSearchInput.value.trim() : '';
            const currentCategory = ui.categoryFilter ? ui.categoryFilter.value : '';
            const showAddedOnly = ui.showAddedOnly.classList.contains('active');
            
            filterAndDisplaySongsModule(searchTerm, currentCategory, showAddedOnly);
        });
    }
}

// ====================================
// MODAL EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики модальных окон
 */
function setupModalEventHandlers() {
    console.log('🎭 [EventHandlers] setupModalEventHandlers');
    
    // Модальное окно создания сетлиста
    if (ui.createNewSetlistHeaderBtn) {
        ui.createNewSetlistHeaderBtn.addEventListener('click', () => {
            if (ui.createSetlistModal) {
                ui.createSetlistModal.classList.add('show');
            }
        });
    }
    
    if (ui.closeCreateModal) {
        ui.closeCreateModal.addEventListener('click', () => {
            if (ui.createSetlistModal) {
                ui.createSetlistModal.classList.remove('show');
            }
        });
    }
    
    if (ui.cancelCreateSetlist) {
        ui.cancelCreateSetlist.addEventListener('click', () => {
            if (ui.createSetlistModal) {
                ui.createSetlistModal.classList.remove('show');
            }
        });
    }
    
    if (ui.createSetlistButton) {
        ui.createSetlistButton.addEventListener('click', async () => {
            const name = ui.newSetlistNameInput ? ui.newSetlistNameInput.value.trim() : '';
            await controller.handleCreateSetlist(name);
            
            if (ui.createSetlistModal) {
                ui.createSetlistModal.classList.remove('show');
            }
        });
    }
    
    // Закрытие модального окна по клику вне области
    if (ui.createSetlistModal) {
        ui.createSetlistModal.addEventListener('click', (e) => {
            if (e.target === ui.createSetlistModal) {
                ui.createSetlistModal.classList.remove('show');
            }
        });
    }
    
    // Модальное окно подтверждения добавления песен
    if (ui.closeConfirmModal) {
        ui.closeConfirmModal.addEventListener('click', () => {
            if (ui.addSongsConfirmModal) {
                ui.addSongsConfirmModal.classList.remove('show');
            }
        });
    }
    
    if (ui.skipAddSongs) {
        ui.skipAddSongs.addEventListener('click', () => {
            if (ui.addSongsConfirmModal) {
                ui.addSongsConfirmModal.classList.remove('show');
            }
        });
    }
    
    if (ui.startAddSongs) {
        ui.startAddSongs.addEventListener('click', () => {
            startAddingSongsModule('create');
        });
    }
    
    // Модальное окно заметок
    if (ui.saveNoteButton) {
        ui.saveNoteButton.addEventListener('click', async () => {
            const songId = ui.notesSongId ? ui.notesSongId.value : '';
            const note = ui.notesTextarea ? ui.notesTextarea.value : '';
            await controller.handleSaveNote(songId, note);
        });
    }
    
    if (ui.cancelNoteButton) {
        ui.cancelNoteButton.addEventListener('click', () => {
            if (ui.notesModal) {
                ui.notesModal.classList.remove('show');
            }
        });
    }
    
    if (ui.closeNoteModalX) {
        ui.closeNoteModalX.addEventListener('click', () => {
            if (ui.notesModal) {
                ui.notesModal.classList.remove('show');
            }
        });
    }
    
    // Overlay добавления песен
    if (ui.closeAddSongs) {
        ui.closeAddSongs.addEventListener('click', () => {
            closeAddSongsOverlayModule();
        });
    }
    
    if (ui.finishAddingSongs) {
        ui.finishAddingSongs.addEventListener('click', () => {
            controller.finishAddingSongs();
        });
    }
}

// ====================================
// KEYBOARD EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики клавиатуры
 */
function setupKeyboardEventHandlers() {
    console.log('⌨️ [EventHandlers] setupKeyboardEventHandlers');
    
    // Enter для создания сетлиста
    if (ui.newSetlistNameInput) {
        ui.newSetlistNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (ui.createSetlistButton) {
                    ui.createSetlistButton.click();
                }
            }
        });
    }
    
    // Escape для закрытия модальных окон
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Закрываем модальное окно заметок
            if (ui.notesModal && ui.notesModal.classList.contains('visible')) {
                ui.notesModal.classList.remove('show');
            }
            
            // Закрываем редактор песен
            if (ui.songEditorOverlay && ui.songEditorOverlay.classList.contains('show')) {
                ui.songEditorOverlay.classList.remove('show');
            }
        }
    });
}

// ====================================
// SETLIST EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики сетлистов
 */
function setupSetlistEventHandlers() {
    console.log('🎵 [EventHandlers] setupSetlistEventHandlers');
    
    // Dropdown сетлистов
    if (ui.setlistDropdownBtn) {
        ui.setlistDropdownBtn.addEventListener('click', async () => {
            await controller.refreshSetlists();
            
            if (ui.setlistDropdown) {
                ui.setlistDropdown.classList.toggle('show');
            }
        });
    }
    
    // Закрытие dropdown по клику вне области
    document.addEventListener('click', (e) => {
        if (ui.setlistDropdown && 
            !ui.setlistDropdownBtn?.contains(e.target) && 
            !ui.setlistDropdown.contains(e.target)) {
            ui.setlistDropdown.classList.remove('show');
        }
    });
    
    // Переключение панелей - ПРЯМАЯ ЛОГИКА БЕЗ WINDOW ФУНКЦИЙ
    if (ui.toggleSetlistsButton) {
        ui.toggleSetlistsButton.addEventListener('click', async () => {
            console.log('📋 [EventHandlers] Setlists button clicked');
            const isAlreadyOpen = ui.setlistsPanel.classList.contains('open');
            ui.closeAllSidePanels();
            if (!isAlreadyOpen) {
                ui.toggleSetlistsButton.classList.add('loading');
                try {
                    ui.setlistsPanel.classList.add('open');
                    // Прямой вызов API и UI функций
                    const setlists = await api.loadSetlists();
                    console.log('📋 [EventHandlers] Loaded setlists:', setlists.length);
                    if (window.state && typeof window.state.setSetlists === 'function') {
                        window.state.setSetlists(setlists);
                    }
                    if (typeof ui.renderSetlists === 'function') {
                        ui.renderSetlists(setlists, 
                            window.handleSetlistSelect || function(setlist) {
                                console.log('📋 Setlist selected:', setlist.name);
                                if (window.state) window.state.setCurrentSetlistId(setlist.id);
                                if (ui.displaySelectedSetlist) {
                                    ui.displaySelectedSetlist(setlist, 
                                        window.handleFavoriteOrRepertoireSelect,
                                        window.handleRemoveSongFromSetlist
                                    );
                                }
                            },
                            window.handleSetlistDelete || async function(setlistId, setlistName) {
                                console.log('📋 Delete setlist:', setlistName);
                                if (confirm(`Удалить сет-лист "${setlistName}"?`)) {
                                    try {
                                        await api.deleteSetlist(setlistId);
                                        ui.toggleSetlistsButton.click(); // Refresh panel
                                    } catch (error) {
                                        console.error('Ошибка удаления:', error);
                                        alert('Не удалось удалить сет-лист');
                                    }
                                }
                            }
                        );
                        
                        // КРИТИЧЕСКИ ВАЖНО: Показываем dropdown с сетлистами!
                        const dropdown = document.getElementById('setlist-dropdown-menu');
                        if (dropdown) {
                            dropdown.classList.add('show');
                            console.log('📋 [EventHandlers] Dropdown показан для отображения сетлистов');
                        } else {
                            console.error('📋 [EventHandlers] setlist-dropdown-menu не найден!');
                        }
                    }
                } catch (error) {
                    console.error('Ошибка загрузки сет-листов:', error);
                } finally {
                    ui.toggleSetlistsButton.classList.remove('loading');
                }
            }
        });
        console.log('📋 [EventHandlers] Setlists panel handler attached');
    }
    
    // Панель "Мои" - ПРЯМАЯ ЛОГИКА
    if (ui.toggleMyListButton) {
        ui.toggleMyListButton.addEventListener('click', async () => {
            console.log('⭐ [EventHandlers] My List button clicked');
            const isAlreadyOpen = ui.myListPanel.classList.contains('open');
            ui.closeAllSidePanels();
            if (!isAlreadyOpen) {
                ui.toggleMyListButton.classList.add('loading');
                try {
                    ui.myListPanel.classList.add('open');
                    if (window.state && window.state.allSongs && window.state.favorites) {
                        const favoriteSongs = window.state.allSongs.filter(song => 
                            window.state.favorites.some(fav => fav.songId === song.id)
                        ).map(song => {
                            const fav = window.state.favorites.find(f => f.songId === song.id);
                            return { ...song, preferredKey: fav.preferredKey };
                        });
                        console.log('⭐ [EventHandlers] Rendering favorites:', favoriteSongs.length);
                        ui.renderFavorites(favoriteSongs, 
                            window.handleFavoriteOrRepertoireSelect,
                            async function(songId) {
                                if(confirm("Удалить песню из 'Моих'?")) {
                                    try {
                                        await api.removeFromFavorites(songId);
                                        ui.toggleMyListButton.click(); // Refresh panel
                                    } catch (error) {
                                        console.error('Ошибка удаления из избранного:', error);
                                        alert('Не удалось удалить песню из списка');
                                    }
                                }
                            }
                        );
                    } else {
                        console.log('⭐ [EventHandlers] No favorites data available');
                    }
                } catch (error) {
                    console.error('Ошибка загрузки избранных:', error);
                } finally {
                    ui.toggleMyListButton.classList.remove('loading');
                }
            }
        });
        console.log('⭐ [EventHandlers] My List panel handler attached');
    }
    
    // Панель "Репертуар" - ПРЯМАЯ ЛОГИКА
    if (ui.toggleRepertoireButton) {
        ui.toggleRepertoireButton.addEventListener('click', async () => {
            console.log('🎭 [EventHandlers] Repertoire button clicked');
            const isAlreadyOpen = ui.repertoirePanel.classList.contains('open');
            ui.closeAllSidePanels();
            if (!isAlreadyOpen) {
                ui.toggleRepertoireButton.classList.add('loading');
                try {
                    ui.repertoirePanel.classList.add('open');
                    console.log('🎭 [EventHandlers] Loading repertoire...');
                    api.loadRepertoire(
                        window.state ? window.state.currentVocalistId : null, 
                        window.handleRepertoireUpdate || function(data) {
                            console.log('🎭 Repertoire loaded:', data);
                            if (data.error) {
                                console.error('🎭 Repertoire error:', data.error);
                                if (window.state && typeof window.state.setCurrentRepertoireSongsData === 'function') {
                                    window.state.setCurrentRepertoireSongsData([]);
                                }
                            } else {
                                console.log('🎭 Repertoire data loaded:', data.data?.length || 0);
                                if (window.state && typeof window.state.setCurrentRepertoireSongsData === 'function') {
                                    window.state.setCurrentRepertoireSongsData(data.data || []);
                                }
                            }
                            if (typeof ui.renderRepertoire === 'function') {
                                ui.renderRepertoire(window.handleFavoriteOrRepertoireSelect);
                            }
                        }
                    );
                } catch (error) {
                    console.error('Ошибка загрузки репертуара:', error);
                } finally {
                    ui.toggleRepertoireButton.classList.remove('loading');
                }
            }
        });
        console.log('🎭 [EventHandlers] Repertoire panel handler attached');
    }
    
    // ОБРАБОТЧИК DROPDOWN СЕТЛИСТОВ - КРИТИЧЕСКИ ВАЖНО!
    const setlistDropdownBtn = document.getElementById('setlist-dropdown-btn');
    if (setlistDropdownBtn) {
        setlistDropdownBtn.addEventListener('click', () => {
            console.log('📋 [EventHandlers] Dropdown button clicked');
            const dropdown = document.getElementById('setlist-dropdown-menu');
            if (dropdown) {
                dropdown.classList.toggle('show');
                console.log('📋 [EventHandlers] Dropdown toggled:', dropdown.classList.contains('show'));
            }
        });
        console.log('📋 [EventHandlers] Dropdown button handler attached');
    } else {
        console.error('📋 [EventHandlers] setlist-dropdown-btn не найден!');
    }
    
    // Селектор вокалистов
    if (ui.vocalistSelect) {
        ui.vocalistSelect.addEventListener('change', (e) => {
            if (typeof window.handleVocalistChange === 'function') {
                window.handleVocalistChange(e.target.value);
            }
        });
    }
}

// ====================================
// SONG EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики песен
 */
function setupSongEventHandlers() {
    console.log('🎼 [EventHandlers] setupSongEventHandlers');
    
    // Кнопка добавления песни в сетлист
    if (ui.addToSetlistButton) {
        ui.addToSetlistButton.addEventListener('click', async () => {
            if (typeof window.handleAddSongToSetlist === 'function') {
                await window.handleAddSongToSetlist();
            }
        });
    }
    
    // Кнопка добавления в репертуар
    if (ui.repertoireButton) {
        ui.repertoireButton.addEventListener('click', async () => {
            const currentSong = state.currentSong;
            if (currentSong) {
                await controller.handleAddToRepertoire(currentSong);
            }
        });
    }
    
    // Кнопка избранного
    if (ui.favoriteButton) {
        ui.favoriteButton.addEventListener('click', async () => {
            const currentSong = state.currentSong;
            if (currentSong) {
                controller.handleFavoriteOrRepertoireSelect(currentSong);
            }
        });
    }
    
    // Редактор песен
    if (ui.editSongButton) {
        ui.editSongButton.addEventListener('click', () => {
            if (ui.songEditorOverlay) {
                ui.songEditorOverlay.classList.add('show');
            }
        });
    }
    
    if (ui.saveEditButton) {
        ui.saveEditButton.addEventListener('click', async () => {
            if (typeof window.handleSaveEdit === 'function') {
                await window.handleSaveEdit();
            }
        });
    }
    
    if (ui.cancelEditButton) {
        ui.cancelEditButton.addEventListener('click', () => {
            if (ui.songEditorOverlay) {
                ui.songEditorOverlay.classList.remove('show');
            }
        });
    }
    
    if (ui.closeEditorButton) {
        ui.closeEditorButton.addEventListener('click', () => {
            if (ui.songEditorOverlay) {
                ui.songEditorOverlay.classList.remove('show');
            }
        });
    }
    
    if (ui.revertToOriginalButton) {
        ui.revertToOriginalButton.addEventListener('click', async () => {
            if (typeof window.handleRevertToOriginal === 'function') {
                await window.handleRevertToOriginal();
            }
        });
    }
}

// ====================================
// PRESENTATION EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики презентации
 */
function setupPresentationEventHandlers() {
    console.log('📽️ [EventHandlers] setupPresentationEventHandlers');
    
    if (ui.presentationCloseBtn) {
        ui.presentationCloseBtn.addEventListener('click', () => {
            if (typeof window.closePresentationMode === 'function') {
                window.closePresentationMode();
            }
        });
    }
    
    if (ui.presPrevBtn) {
        ui.presPrevBtn.addEventListener('click', () => {
            if (typeof window.previousSlide === 'function') {
                window.previousSlide();
            }
        });
    }
    
    if (ui.presNextBtn) {
        ui.presNextBtn.addEventListener('click', () => {
            if (typeof window.nextSlide === 'function') {
                window.nextSlide();
            }
        });
    }
    
    if (ui.presSplitTextBtn) {
        ui.presSplitTextBtn.addEventListener('click', () => {
            if (typeof window.togglePresentationSplit === 'function') {
                window.togglePresentationSplit();
            }
        });
    }
}

// ====================================
// TOUCH EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики touch событий
 */
function setupTouchEventHandlers() {
    console.log('👆 [EventHandlers] setupTouchEventHandlers');
    
    // Swipe to close для панелей
    const panels = document.querySelectorAll('.swipe-panel');
    panels.forEach(panel => {
        let startY = 0;
        
        panel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        panel.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const deltaY = startY - endY;
            
            // Swipe up to close
            if (deltaY > 50) {
                panel.classList.remove('show');
            }
        });
    });
}

// ====================================
// MODULE METADATA
// ====================================

export const metadata = {
    name: 'EventHandlers',
    version: '1.0.0',
    description: 'Модуль для обработчиков событий приложения',
    functions: [
        'setupEventListeners',
        'setupUIEventHandlers',
        'setupSearchEventHandlers',
        'setupModalEventHandlers',
        'setupKeyboardEventHandlers',
        'setupSetlistEventHandlers',
        'setupSongEventHandlers',
        'setupPresentationEventHandlers',
        'setupTouchEventHandlers'
    ]
};