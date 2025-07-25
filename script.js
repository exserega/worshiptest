// =====================================================================
// Agape Worship App - script.js (Главный файл - точка входа)
// =====================================================================

import * as state from './state.js';
import { MIN_FONT_SIZE, SWIPE_THRESHOLD, SWIPE_VERTICAL_LIMIT } from './constants.js';
import * as api from './api.js';
import * as songsApi from './src/js/api/songs.js';
import * as core from './core.js';
import * as ui from './ui.js';
import * as metronomeUI from './metronome.js';
import searchWorkerManager from './src/js/workers/workerManager.js';

// --- UTILITY FUNCTIONS ---

/** Проверка мобильного устройства */
function isMobileDevice() {
    return window.innerWidth <= 768;
}

/** Универсальная функция для получения тональности песни из разных возможных полей */
function getSongKey(song) {
    // Проверяем различные возможные поля для тональности
    // В порядке приоритета: русские названия, затем английские
    const key = song['Оригинальная тональность'] || 
                song['Тональность'] || 
                song['originalKey'] || 
                song['key'] || 
                song.originalKey || 
                song.key || 
                'C'; // Fallback по умолчанию
    
    // ВРЕМЕННЫЙ ЛОГ ДЛЯ ОТЛАДКИ
    if (Math.random() < 0.05) { // 5% песен для отладки
        console.log('=== getSongKey DEBUG ===');
        console.log('song.name:', song.name);
        console.log('Available keys:', Object.keys(song).filter(k => k.toLowerCase().includes('тональ') || k.toLowerCase().includes('key')));
        console.log('song["Оригинальная тональность"]:', song['Оригинальная тональность']);
        console.log('song["Тональность"]:', song['Тональность']);
        console.log('song.key:', song.key);
        console.log('song.originalKey:', song.originalKey);
        console.log('Resolved key:', key);
    }
    
    return key;
}

/**
 * Поиск для dropdown в overlay (глобальная функция)
 */
async function performOverlayDropdownSearch(searchTerm) {
    try {
        // Используем Web Worker для поиска если доступен
        if (window.searchWorkerManager && typeof window.searchWorkerManager.overlaySearch === 'function') {
            const { results } = await window.searchWorkerManager.overlaySearch(searchTerm, state.allSongs, {
                enablePrioritySearch: true
            });
            
            const allResults = [
                ...results.exactResults.map(r => r.song),
                ...results.fuzzyResults.map(r => r.song)
            ];
            
            showOverlaySearchResults(allResults, searchTerm);
        } else {
            // Fallback: обычный поиск
            const query = normalizeSearchQuery(searchTerm);
            let matchingSongs = state.allSongs.filter(song => {
                const titleMatch = getNormalizedTitle(song).includes(query);
                const lyricsMatch = getNormalizedLyrics(song).includes(query);
                return titleMatch || lyricsMatch;
            });
            
            // Применяем smart sorting
            matchingSongs.sort((a, b) => {
                const aNormalizedTitle = getNormalizedTitle(a);
                const bNormalizedTitle = getNormalizedTitle(b);
                const aTitleMatch = aNormalizedTitle.includes(query);
                const bTitleMatch = bNormalizedTitle.includes(query);
                const aTitleStartsWith = aNormalizedTitle.startsWith(query);
                const bTitleStartsWith = bNormalizedTitle.startsWith(query);
                
                if (aTitleStartsWith && !bTitleStartsWith) return -1;
                if (!aTitleStartsWith && bTitleStartsWith) return 1;
                if (aTitleMatch && !aTitleStartsWith && (!bTitleMatch || bTitleStartsWith)) return -1;
                if (bTitleMatch && !bTitleStartsWith && (!aTitleMatch || aTitleStartsWith)) return 1;
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                
                return 0;
            });
            
            showOverlaySearchResults(matchingSongs.slice(0, 10), searchTerm); // Ограничиваем до 10 результатов
        }
    } catch (error) {
        console.error('❌ Ошибка поиска в dropdown:', error);
        showOverlaySearchResults([], searchTerm);
    }
}

/**
 * Показ результатов поиска в dropdown overlay
 */
function showOverlaySearchResults(results, query) {
    const dropdown = document.getElementById('overlay-search-results');
    const container = dropdown.querySelector('.search-results-container');
    
    if (!dropdown || !container) {
        console.error('❌ Не найдены элементы dropdown поиска');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    if (!results || results.length === 0) {
        // Показываем сообщение "ничего не найдено"
        container.innerHTML = `
            <div class="overlay-search-no-results">
                <i class="fas fa-search"></i>
                Ничего не найдено по запросу "${query}"
            </div>
        `;
    } else {
        // Добавляем результаты
        results.forEach(song => {
            const resultElement = createOverlaySearchResultElement(song, query);
            container.appendChild(resultElement);
        });
    }
    
    // Показываем dropdown
    dropdown.style.display = 'block';
    
    console.log(`🔍 Показано ${results.length} результатов поиска в dropdown`);
}

/**
 * Скрытие dropdown результатов поиска
 */
function hideOverlaySearchResults() {
    const dropdown = document.getElementById('overlay-search-results');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

/**
 * Создание элемента результата поиска для dropdown (как в главном меню)
 */
function createOverlaySearchResultElement(song, query) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'search-result'; // Используем тот же класс что и в главном меню
    
    // Нормализуем запрос для проверки
    const normalizedQuery = normalizeSearchQuery(query);
    
    // Проверяем, найдено ли в названии или тексте
    const normalizedTitle = normalizeTextForSearch(song.name || '');
    const titleMatch = normalizedTitle.includes(normalizedQuery);
    
    const lyrics = song.hasWebEdits 
        ? (song['Текст и аккорды (edited)'] || '') 
        : (song['Текст и аккорды'] || '');
    
    // Убираем аккорды для более точного поиска
    const cleanedLyrics = lyrics.replace(/\[[^\]]*\]/g, ' ');
    const normalizedLyrics = normalizeTextForSearch(cleanedLyrics);
    const lyricsMatch = !titleMatch && normalizedLyrics.includes(normalizedQuery);
    
    // Формируем HTML для результата (КАК В ГЛАВНОМ МЕНЮ - БЕЗ КАТЕГОРИИ И БЕЗ ПОДСВЕТКИ В НАЗВАНИИ!)
    let resultHTML = `
        <div class="search-result-title">${song.name}</div>
    `;
    
    // Если найдено в тексте песни, показываем фрагмент С ПОДСВЕТКОЙ
    if (lyricsMatch && query) {
        const fragment = getHighlightedTextFragment(cleanedLyrics, query, 60);
        if (fragment) {
            resultHTML += `<div class="search-result-fragment">${fragment}</div>`;
        }
    }
    
    resultDiv.innerHTML = resultHTML;
    
    // Добавляем обработчик клика
    resultDiv.addEventListener('click', () => {
        console.log('🎵 Клик на результат поиска:', song.name);
        
        // Скрываем dropdown
        hideOverlaySearchResults();
        
        // Очищаем поле поиска
        const searchInput = document.getElementById('song-search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur(); // Скрываем клавиатуру на мобильных
        }
        
        // Скрываем кнопку очистки
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        
        // Открываем preview песни (мобильный overlay или модальное окно)
        if (isMobileDevice()) {
            showMobileSongPreview(song);
        } else {
            showKeySelectionModal(song);
        }
    });
    
    return resultDiv;
}



// --- HANDLERS ---

/** Обработчик выбора песни из репертуара или "Моего списка" */
function handleFavoriteOrRepertoireSelect(song) {
    if (!song || !song.id) return;
    ui.sheetSelect.value = song.sheet;
    ui.populateSongSelect();
    ui.songSelect.value = song.id;
    ui.displaySongDetails(song, song.preferredKey);
    ui.closeAllSidePanels();
}

/** Обработчик загрузки репертуара */
function handleRepertoireUpdate({ data, error }) {
    if (error) {
        state.setCurrentRepertoireSongsData([]);
    } else {
        state.setCurrentRepertoireSongsData(data);
    }
    ui.renderRepertoire(handleFavoriteOrRepertoireSelect);
    
    // Обновляем состояние кнопки репертуара для текущей песни
    const currentSongId = ui.songSelect.value;
    if (currentSongId) {
        const currentSong = state.allSongs.find(s => s.id === currentSongId);
        if (currentSong) {
            ui.updateRepertoireButton(currentSong);
        }
    }
}

/** Обработчик сохранения заметки */
async function handleSaveNote() {
    const songDocId = ui.notesModal.dataset.songdocid;
    const newNoteText = ui.noteEditTextarea.value.trim();

    if (!state.currentSetlistId || !songDocId) {
        alert("Ошибка: Не удалось определить сет-лист или песню для сохранения заметки.");
        return;
    }

    ui.saveNoteButton.disabled = true;
    ui.saveNoteButton.textContent = 'Сохранение...';
    try {
        await api.saveNoteForSongInSetlist(state.currentSetlistId, songDocId, newNoteText);
        closeNotesModal();
    } catch (error) {
        alert("Не удалось сохранить заметку. Попробуйте еще раз.");
    } finally {
        if(ui.saveNoteButton) { // Check if element still exists
            ui.saveNoteButton.disabled = false;
            ui.saveNoteButton.textContent = 'Сохранить';
        }
    }
}

function closeNotesModal() {
    ui.notesModal.classList.remove('visible');
    setTimeout(() => {
        ui.notesModal.style.display = 'none';
        if (ui.noteEditTextarea) ui.noteEditTextarea.value = '';
        if (ui.notesModal) delete ui.notesModal.dataset.songdocid;
    }, 300);
}

// --- SETLIST HANDLERS ---

// Функция закрытия модального окна создания сет-листа
// Переменные для системы создания сет-листов
let currentCreatedSetlistId = null;
let currentCreatedSetlistName = '';
let addedSongsToCurrentSetlist = new Set();

// Переменные для выбора тональности
let currentSongForKey = null;
let currentSelectedKey = 'C';

function closeCreateSetlistModal() {
    ui.createSetlistModal.classList.remove('show');
    ui.newSetlistNameInput.value = '';
    if (ui.nameCharCount) {
        ui.nameCharCount.textContent = '0';
    }
}

function closeAddSongsConfirmModal() {
    if (ui.addSongsConfirmModal) {
        ui.addSongsConfirmModal.classList.remove('show');
    }
}

function closeAddSongsOverlay() {
    if (ui.addSongsOverlay) {
        ui.addSongsOverlay.classList.remove('show');
    }
    // Сброс состояния
    addedSongsToCurrentSetlist.clear();
    if (ui.addedSongsCount) {
        ui.addedSongsCount.textContent = '0';
    }
    if (ui.songSearchInput) {
        ui.songSearchInput.value = '';
    }
    if (ui.categoryFilter) {
        ui.categoryFilter.value = '';
    }
    if (ui.showAddedOnly) {
        ui.showAddedOnly.classList.remove('active');
    }
}

function closeKeySelectionModal() {
    if (ui.keySelectionModal) {
        ui.keySelectionModal.classList.remove('show');
    }
    currentSongForKey = null;
    currentSelectedKey = 'C';
}

function showKeySelectionModal(song) {
    console.log('=== showKeySelectionModal START ===');
    console.log('song:', song);
    
    if (!ui.keySelectionModal) {
        console.error('keySelectionModal not found!');
        return;
    }
    
    currentSongForKey = song;
    const originalSongKey = getSongKey(song);
    currentSelectedKey = originalSongKey;
    
    console.log('Set currentSongForKey:', currentSongForKey);
    console.log('Set currentSelectedKey:', currentSelectedKey);
    
    // Заполняем информацию о песне
    if (ui.keySongName) {
        ui.keySongName.textContent = song.name;
    }
    
    // Устанавливаем оригинальную тональность в селектор и бейдж
    const keySelector = document.getElementById('key-selector');
    const originalKeyBadge = document.getElementById('original-key-badge');
    
    if (keySelector) {
        keySelector.value = originalSongKey;
        // Добавляем обработчик изменения тональности
        keySelector.onchange = (e) => {
            currentSelectedKey = e.target.value;
            updateSongTextInModal(song, currentSelectedKey);
        };
    }
    
    if (originalKeyBadge) {
        originalKeyBadge.textContent = `Оригинал: ${originalSongKey}`;
    }
    
    // Отображаем текст песни
    updateSongTextInModal(song, currentSelectedKey);
    
    // ДОБАВЛЯЕМ ОБРАБОТЧИК СОБЫТИЯ ПРЯМО ЗДЕСЬ
    const confirmBtn = document.getElementById('confirm-key-selection');
    console.log('Found confirm button:', confirmBtn);
    
    if (confirmBtn) {
        // Удаляем старые обработчики
        confirmBtn.removeEventListener('click', confirmAddSongWithKey);
        
        // Добавляем новый обработчик
        confirmBtn.addEventListener('click', (e) => {
            console.log('=== CONFIRM BUTTON CLICKED IN MODAL ===');
            console.log('Event:', e);
            e.preventDefault();
            e.stopPropagation();
            confirmAddSongWithKey();
        });
        
        // Дополнительные обработчики для диагностики
        confirmBtn.addEventListener('mousedown', (e) => {
            console.log('=== CONFIRM BUTTON MOUSEDOWN ===', e);
        });
        
        confirmBtn.addEventListener('mouseup', (e) => {
            console.log('=== CONFIRM BUTTON MOUSEUP ===', e);
        });
        
        confirmBtn.addEventListener('touchstart', (e) => {
            console.log('=== CONFIRM BUTTON TOUCHSTART ===', e);
        });
        
        confirmBtn.addEventListener('touchend', (e) => {
            console.log('=== CONFIRM BUTTON TOUCHEND ===', e);
        });
        console.log('Event listener added to confirm button');
    } else {
        console.error('Confirm button not found!');
    }
    
    // Показываем модальное окно
    ui.keySelectionModal.classList.add('show');
    console.log('Modal shown with class "show"');
    console.log('=== showKeySelectionModal END ===');
}

/**
 * Обновление текста песни в modal с транспонированием
 */
function updateSongTextInModal(song, selectedKey) {
    const songTextDisplay = document.getElementById('song-text-display');
    if (!songTextDisplay) return;
    
    // Получаем текст песни
    let songText = song.hasWebEdits 
        ? (song['Текст и аккорды (edited)'] || song['Текст и аккорды'] || '') 
        : (song['Текст и аккорды'] || '');
    
    if (!songText) {
        songTextDisplay.innerHTML = `
            <div class="loading-text">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Текст песни не найден</p>
            </div>
        `;
        return;
    }
    
    // Транспонируем аккорды если нужно
    const originalKey = getSongKey(song);
    if (selectedKey !== originalKey) {
        songText = transposeChords(songText, originalKey, selectedKey);
    }
    
    // Форматируем аккорды для отображения
    const formattedText = formatChordsInText(songText);
    
    songTextDisplay.innerHTML = formattedText;
    
    console.log(`📝 Текст песни обновлен (${originalKey} → ${selectedKey})`);
}

/**
 * Простая функция транспонирования аккордов
 */
function transposeChords(text, fromKey, toKey) {
    // Если тональности одинаковые, возвращаем оригинальный текст
    if (fromKey === toKey) {
        return text;
    }
    
    // Карта аккордов для транспонирования
    const chordMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const fromIndex = chordMap.indexOf(fromKey);
    const toIndex = chordMap.indexOf(toKey);
    
    if (fromIndex === -1 || toIndex === -1) {
        console.warn(`Неизвестная тональность: ${fromKey} → ${toKey}`);
        return text;
    }
    
    const semitones = (toIndex - fromIndex + 12) % 12;
    
    // Транспонируем аккорды в квадратных скобках
    return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
        const transposedChord = transposeChord(chord.trim(), semitones);
        return `[${transposedChord}]`;
    });
}

/**
 * Транспонирование одного аккорда
 */
function transposeChord(chord, semitones) {
    const chordMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Находим основную ноту аккорда
    let rootNote = '';
    let suffix = '';
    
    if (chord.length >= 2 && chord[1] === '#') {
        rootNote = chord.substring(0, 2);
        suffix = chord.substring(2);
    } else {
        rootNote = chord[0];
        suffix = chord.substring(1);
    }
    
    const rootIndex = chordMap.indexOf(rootNote);
    if (rootIndex === -1) {
        return chord; // Если не найден, возвращаем как есть
    }
    
    const newRootIndex = (rootIndex + semitones) % 12;
    const newRootNote = chordMap[newRootIndex];
    
    return newRootNote + suffix;
}

/**
 * Форматирование аккордов в тексте для отображения
 */
function formatChordsInText(text) {
    // Заменяем аккорды в квадратных скобках на span с классом chord
    return text.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>');
}

function updateKeyButtons() {
    const keyButtons = document.querySelectorAll('.key-btn');
    keyButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.key === currentSelectedKey) {
            btn.classList.add('selected');
        }
    });
    
    // Блок "Выбранная тональность" удален за ненадобностью
}

async function handleCreateSetlist() {
    const name = ui.newSetlistNameInput.value.trim();
    if (!name) {
        showNotification('❌ Название сет-листа не может быть пустым', 'error');
        return;
    }
    
    try {
        ui.createSetlistButton.disabled = true;
        ui.createSetlistButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Создание...</span>';
        
        const docRef = await api.createSetlist(name);
        currentCreatedSetlistId = docRef.id;
        currentCreatedSetlistName = name;
        
        closeCreateSetlistModal();
        await refreshSetlists();
        
        // Показываем модальное окно подтверждения добавления песен
        if (ui.createdSetlistName) {
            ui.createdSetlistName.textContent = name;
        }
        if (ui.addSongsConfirmModal) {
            ui.addSongsConfirmModal.classList.add('show');
        }
        
        showNotification('✅ Сет-лист создан успешно!', 'success');
    } catch (error) {
        console.error("Ошибка при создании сет-листа:", error);
        showNotification('❌ Не удалось создать сет-лист', 'error');
    } finally {
        ui.createSetlistButton.disabled = false;
        ui.createSetlistButton.innerHTML = '<i class="fas fa-arrow-right"></i><span>Продолжить</span>';
    }
}

// Универсальная функция для запуска overlay добавления песен
async function startAddingSongs(mode = 'create', targetSetlistId = null, targetSetlistName = '') {
    console.log('=== startAddingSongs START ===');
    console.log('Mode:', mode);
    console.log('targetSetlistId:', targetSetlistId);
    console.log('targetSetlistName:', targetSetlistName);
    
    closeAddSongsConfirmModal();
    
    // Определяем целевой setlist в зависимости от режима
    let activeSetlistId, activeSetlistName;
    
    if (mode === 'create') {
        // Режим создания нового списка
        activeSetlistId = currentCreatedSetlistId;
        activeSetlistName = currentCreatedSetlistName;
        console.log('CREATE mode - using currentCreated:', activeSetlistId, activeSetlistName);
    } else if (mode === 'edit') {
        // Режим редактирования существующего списка
        activeSetlistId = targetSetlistId || state.currentSetlistId;
        activeSetlistName = targetSetlistName || state.currentSetlistName;
        console.log('EDIT mode - using current:', activeSetlistId, activeSetlistName);
    }
    
    // Сохраняем активные данные для использования в других функциях
    window.activeOverlayMode = mode;
    window.activeSetlistId = activeSetlistId;
    window.activeSetlistName = activeSetlistName;
    
    // Очищаем и инициализируем состояние
    addedSongsToCurrentSetlist.clear();
    if (ui.addedSongsCount) {
        ui.addedSongsCount.textContent = '0';
    }
    
    // Показываем полноэкранный оверлей
    if (ui.targetSetlistName) {
        ui.targetSetlistName.textContent = activeSetlistName;
    }
    if (ui.addSongsOverlay) {
        ui.addSongsOverlay.classList.add('show');
    }
    
    console.log('Overlay shown, addedSongsToCurrentSetlist cleared');
    
    // Загружаем все песни если еще не загружены
    if (state.allSongs.length === 0) {
        try {
            await songsApi.loadAllSongsFromFirestore();
        } catch (error) {
            console.error('Ошибка загрузки песен:', error);
            showNotification('❌ Ошибка загрузки песен', 'error');
        }
    }
    
    // Заполняем фильтр категорий
    populateCategoryFilter();
    
    // Отображаем все песни
    displaySongsGrid(state.allSongs, '');
}

function populateCategoryFilter() {
    if (!ui.categoryFilter) return;
    
    ui.categoryFilter.innerHTML = '<option value="">Все категории</option>';
    
    const categories = [...new Set(state.allSongs.map(song => song.sheet).filter(Boolean))];
    categories.sort();
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        ui.categoryFilter.appendChild(option);
    });
}

function displaySongsGrid(songs, searchTerm = '') {
    if (!ui.songsGrid) return;
    
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
    
    songs.forEach(song => {
        const isAdded = addedSongsToCurrentSetlist.has(song.id);
        
        // Получаем правильную тональность из данных песни
        const originalKey = getSongKey(song);
        
        // Проверяем, есть ли поиск по тексту
        let textFragment = '';
        if (searchTerm) {
            const normalizedQuery = normalizeSearchQuery(searchTerm);
            const titleMatch = getNormalizedTitle(song).includes(normalizedQuery);
            
            // Если не найдено в названии, ищем в тексте
            if (!titleMatch) {
                const cleanedLyrics = getCleanedLyrics(song);
                
                if (cleanedLyrics) {
                    textFragment = getHighlightedTextFragment(cleanedLyrics, searchTerm, 80);
                }
            }
        }
        
        const songCard = document.createElement('div');
        songCard.className = `song-card ${isAdded ? 'added' : ''}`;
        songCard.innerHTML = `
            <div class="song-card-header">
                <div>
                    <h4 class="song-title">${song.name}</h4>
                    <div class="song-category">${song.sheet || 'Без категории'}</div>
                    <div class="song-key-display">
                        Тональность: <span class="song-key-badge">${originalKey}</span>
                    </div>
                    ${textFragment ? `<div class="song-text-fragment">${textFragment}</div>` : ''}
                </div>
                <button class="song-add-btn ${isAdded ? 'added' : ''}" data-song-id="${song.id}">
                    <i class="fas fa-${isAdded ? 'check' : 'plus'}"></i>
                    <span>${isAdded ? 'Добавлена' : 'Добавить'}</span>
                </button>
            </div>
        `;
        
        const addBtn = songCard.querySelector('.song-add-btn');
        addBtn.addEventListener('click', (e) => {
            console.log('=== Song add button clicked ===');
            console.log('song:', song);
            console.log('isAdded:', isAdded);
            console.log('currentCreatedSetlistId:', currentCreatedSetlistId);
            console.log('window.activeSetlistId:', window.activeSetlistId);
            console.log('window.activeOverlayMode:', window.activeOverlayMode);
            
            e.stopPropagation();
            if (isAdded) {
                // Если песня уже добавлена, удаляем её
                console.log('Removing song from setlist...');
                removeSongFromSetlist(song);
            } else {
                // Проверяем что у нас есть активный сет-лист (в любом режиме)
                const activeSetlistId = window.activeSetlistId || currentCreatedSetlistId;
                if (!activeSetlistId) {
                    console.error('No active setlist! activeSetlistId is null');
                    console.log('window.activeSetlistId:', window.activeSetlistId);
                    console.log('currentCreatedSetlistId:', currentCreatedSetlistId);
                    console.log('activeOverlayMode:', window.activeOverlayMode);
                    showNotification('❌ Сначала выберите сет-лист', 'error');
                    return;
                }
                
                // На мобильных устройствах показываем полноэкранный overlay
                if (isMobileDevice()) {
                    console.log('📱 Показ мобильного overlay для песни...');
                    showMobileSongPreview(song);
                } else {
                    // На десктопе показываем модальное окно выбора тональности
                    console.log('🖥️ Показ модального окна выбора тональности...');
                    showKeySelectionModal(song);
                }
                
                // Дополнительная проверка после показа модального окна
                setTimeout(() => {
                    const confirmBtn = document.getElementById('confirm-key-selection');
                    console.log('Confirm button after modal shown:', confirmBtn);
                    console.log('Modal visible:', ui.keySelectionModal?.classList.contains('show'));
                    
                    if (confirmBtn) {
                        console.log('Button rect:', confirmBtn.getBoundingClientRect());
                        console.log('Button parent:', confirmBtn.parentElement);
                        console.log('Button onclick:', confirmBtn.onclick);
                        console.log('Button addEventListener count:', confirmBtn.getEventListeners ? confirmBtn.getEventListeners() : 'Not available');
                        
                        // Проверяем что кнопка кликабельна
                        const rect = confirmBtn.getBoundingClientRect();
                        const elementAtPoint = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
                        console.log('Element at button center:', elementAtPoint);
                        console.log('Is same element?', elementAtPoint === confirmBtn || confirmBtn.contains(elementAtPoint));
                    }
                }, 100);
            }
        });
        
        ui.songsGrid.appendChild(songCard);
    });
}

async function addSongToSetlist(song, key) {
    console.log('=== addSongToSetlist START ===');
    console.log('song:', song);
    console.log('key:', key);
    
    // Используем активный setlist в зависимости от режима
    const targetSetlistId = window.activeSetlistId || currentCreatedSetlistId;
    console.log('targetSetlistId:', targetSetlistId);
    console.log('activeOverlayMode:', window.activeOverlayMode);
    
    try {
        console.log('Calling API addSongToSetlist...');
        const result = await api.addSongToSetlist(targetSetlistId, song.id, key);
        console.log('API result:', result);
        
        if (result.status === 'added') {
            console.log('Song added successfully, updating UI...');
            addedSongsToCurrentSetlist.add(song.id);
            console.log('addedSongsToCurrentSetlist size after add:', addedSongsToCurrentSetlist.size);
            
            showNotification(`➕ "${song.name}" добавлена в тональности ${key}`, 'success');
            
            // Обновляем счетчик
            if (ui.addedSongsCount) {
                ui.addedSongsCount.textContent = addedSongsToCurrentSetlist.size;
                console.log('Updated counter to:', addedSongsToCurrentSetlist.size);
            }
            
            // Обновляем отображение
            console.log('Refreshing songs display...');
            refreshSongsDisplay();
        } else if (result.status === 'duplicate_same') {
            console.log('Song already exists with same key');
            showNotification(`⚠️ "${song.name}" уже добавлена в сет-лист`, 'warning');
        } else if (result.status === 'duplicate_key') {
            console.log('Song already exists with different key:', result.existingKey);
            showNotification(`⚠️ "${song.name}" уже добавлена в тональности ${result.existingKey}`, 'warning');
        }
        
    } catch (error) {
        console.error('Ошибка при добавлении песни:', error);
        showNotification('❌ Ошибка при добавлении песни', 'error');
    }
    
    console.log('=== addSongToSetlist END ===');
}

async function removeSongFromSetlist(song) {
    try {
        // Используем активный setlist в зависимости от режима
        const targetSetlistId = window.activeSetlistId || currentCreatedSetlistId;
        await api.removeSongFromSetlist(targetSetlistId, song.id);
        addedSongsToCurrentSetlist.delete(song.id);
        showNotification(`➖ "${song.name}" удалена из сет-листа`, 'info');
        
        // Обновляем счетчик
        if (ui.addedSongsCount) {
            ui.addedSongsCount.textContent = addedSongsToCurrentSetlist.size;
        }
        
        // Обновляем отображение
        refreshSongsDisplay();
        
    } catch (error) {
        console.error('Ошибка при удалении песни:', error);
        showNotification('❌ Ошибка при удалении песни', 'error');
    }
}

function refreshSongsDisplay() {
    const currentSearch = ui.songSearchInput ? ui.songSearchInput.value.trim() : '';
    const currentCategory = ui.categoryFilter ? ui.categoryFilter.value : '';
    const showAddedOnly = ui.showAddedOnly ? ui.showAddedOnly.classList.contains('active') : false;
    
    filterAndDisplaySongs(currentSearch, currentCategory, showAddedOnly);
}

async function confirmAddSongWithKey() {
    console.log('=== confirmAddSongWithKey START ===');
    console.log('currentSongForKey:', currentSongForKey);
    console.log('currentSelectedKey:', currentSelectedKey);
    console.log('currentCreatedSetlistId:', currentCreatedSetlistId);
    console.log('addedSongsToCurrentSetlist size:', addedSongsToCurrentSetlist.size);
    
    if (!currentSongForKey) {
        console.error('No song selected for key');
        showNotification('❌ Песня не выбрана', 'error');
        return;
    }
    
    if (!currentSelectedKey) {
        console.error('No key selected');
        showNotification('❌ Тональность не выбрана', 'error');
        return;
    }
    
    const targetSetlistId = window.activeSetlistId || currentCreatedSetlistId;
    if (!targetSetlistId) {
        console.error('No setlist ID');
        showNotification('❌ Сет-лист не выбран', 'error');
        return;
    }
    
    console.log('Calling addSongToSetlist BEFORE closing modal...');
    
    // Сохраняем данные перед закрытием модального окна
    const songToAdd = currentSongForKey;
    const keyToAdd = currentSelectedKey;
    
    console.log('Saved song:', songToAdd);
    console.log('Saved key:', keyToAdd);
    
    // Закрываем модальное окно
    closeKeySelectionModal();
    
    // Добавляем песню с сохраненными данными
    await addSongToSetlist(songToAdd, keyToAdd);
    console.log('=== confirmAddSongWithKey END ===');
}

/**
 * Очищает текст от аккордов для более точного поиска
 * @param {string} text - Текст с аккордами
 * @returns {string} Очищенный текст
 */
function cleanLyricsForSearch(text) {
    if (!text) return '';
    
    // Убираем аккорды в квадратных скобках [C], [Am7], etc.
    let cleaned = text.replace(/\[[^\]]*\]/g, ' ');
    
    // Убираем лишние пробелы и переносы строк
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

/**
 * Нормализует поисковый запрос для более умного поиска
 * @param {string} query - Исходный запрос
 * @returns {string} Нормализованный запрос
 */
function normalizeSearchQuery(query) {
    if (!query) return '';
    
    return query
        .toLowerCase()
        .trim()
        // Убираем знаки препинания кроме дефисов в словах
        .replace(/[^\w\s\u0400-\u04FF-]/g, ' ')
        // Убираем лишние пробелы
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Нормализует текст для сравнения с запросом
 * @param {string} text - Исходный текст
 * @returns {string} Нормализованный текст
 */
function normalizeTextForSearch(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        // Убираем знаки препинания кроме дефисов в словах
        .replace(/[^\w\s\u0400-\u04FF-]/g, ' ')
        // Убираем лишние пробелы
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Кэширует нормализованные данные песни для оптимизации поиска
 * @param {Object} song - Объект песни
 * @returns {Object} Песня с кэшированными данными
 */
function cacheNormalizedSongData(song) {
    if (!song._searchCached) {
        // Кэшируем нормализованное название
        song._normalizedTitle = normalizeTextForSearch(song.name || '');
        
        // Кэшируем очищенный и нормализованный текст песни
        const lyrics = song.hasWebEdits 
            ? (song['Текст и аккорды (edited)'] || '') 
            : (song['Текст и аккорды'] || '');
        const cleanedLyrics = cleanLyricsForSearch(lyrics);
        song._cleanedLyrics = cleanedLyrics;
        song._normalizedLyrics = normalizeTextForSearch(cleanedLyrics);
        
        song._searchCached = true;
    }
    return song;
}

/**
 * Получает нормализованное название песни (с кэшированием)
 * @param {Object} song - Объект песни
 * @returns {string} Нормализованное название
 */
function getNormalizedTitle(song) {
    cacheNormalizedSongData(song);
    return song._normalizedTitle;
}

/**
 * Получает очищенный текст песни (с кэшированием)
 * @param {Object} song - Объект песни
 * @returns {string} Очищенный текст
 */
function getCleanedLyrics(song) {
    cacheNormalizedSongData(song);
    return song._cleanedLyrics;
}

/**
 * Получает нормализованный текст песни (с кэшированием)
 * @param {Object} song - Объект песни
 * @returns {string} Нормализованный текст
 */
function getNormalizedLyrics(song) {
    cacheNormalizedSongData(song);
    return song._normalizedLyrics;
}

/**
 * Инвалидирует кэш нормализованных данных песни
 * Используется при изменении данных песни
 * @param {Object} song - Объект песни
 */
function invalidateSongCache(song) {
    if (song) {
        song._searchCached = false;
        delete song._normalizedTitle;
        delete song._cleanedLyrics;
        delete song._normalizedLyrics;
    }
}

/**
 * Инвалидирует кэш для всех песен
 * Используется при загрузке новых данных
 */
function invalidateAllSongsCache() {
    if (state.allSongs) {
        state.allSongs.forEach(song => invalidateSongCache(song));
    }
}

// Делаем функции доступными глобально для state и поискового движка
window.invalidateAllSongsCache = invalidateAllSongsCache;
window.getNormalizedTitle = getNormalizedTitle;
window.getNormalizedLyrics = getNormalizedLyrics;
window.getCleanedLyrics = getCleanedLyrics;

/**
 * Находит фрагмент текста с выделением найденного запроса
 * Показывает ТОЧНО найденную часть в начале фрагмента
 * @param {string} text - Полный текст
 * @param {string} query - Поисковый запрос  
 * @param {number} contextLength - Длина контекста вокруг найденного
 * @returns {string} HTML с выделенным текстом
 */
function getHighlightedTextFragment(text, query, contextLength = 100) {
    if (!text || !query) return '';
    
    const normalizedQuery = normalizeSearchQuery(query);
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
    
    if (queryWords.length === 0) return '';
    
    // Ищем самое длинное совпадение из слов запроса
    let bestMatch = { index: -1, length: 0, word: '' };
    
    queryWords.forEach(word => {
        // Ищем точное совпадение слова в тексте (игнорируя аккорды и препинания)
        const cleanText = text.replace(/\[[^\]]*\]/g, ' '); // убираем аккорды
        const textWords = cleanText.split(/\s+/);
        
        for (let i = 0; i < textWords.length; i++) {
            const cleanWord = normalizeTextForSearch(textWords[i]);
            if (cleanWord.includes(word) && word.length > bestMatch.length) {
                // Найдем позицию этого слова в оригинальном тексте
                const wordStart = cleanText.toLowerCase().indexOf(textWords[i].toLowerCase());
                if (wordStart !== -1) {
                    bestMatch = { index: wordStart, length: word.length, word: word };
                }
            }
        }
    });
    
    if (bestMatch.index === -1) {
        // Если точное совпадение не найдено, ищем первое хотя бы частичное
        const firstWord = queryWords[0];
        const lowerText = text.toLowerCase();
        const searchIndex = lowerText.indexOf(firstWord);
        if (searchIndex !== -1) {
            bestMatch = { index: searchIndex, length: firstWord.length, word: firstWord };
        }
    }
    
    if (bestMatch.index === -1) {
        return text.slice(0, contextLength) + '...';
    }
    
    // Определяем границы фрагмента с найденным словом в начале
    const beforeContext = Math.min(30, bestMatch.index); // немного контекста перед
    const start = Math.max(0, bestMatch.index - beforeContext);
    const end = Math.min(text.length, bestMatch.index + contextLength);
    
    let fragment = text.slice(start, end);
    
    // Добавляем многоточие
    if (start > 0) fragment = '...' + fragment;
    if (end < text.length) fragment = fragment + '...';
    
    // Выделяем все найденные слова
    queryWords.forEach(word => {
        if (word.length > 1) {
            const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            fragment = fragment.replace(regex, '<mark class="search-highlight">$1</mark>');
        }
    });
    
    return fragment;
}

// Переменная для отслеживания текущего поискового запроса в overlay
let currentOverlaySearchRequest = null;

/**
 * Расширенный поиск по названию и тексту песни с Web Worker поддержкой
 * @param {string} searchTerm - Поисковый запрос
 * @param {string} category - Категория для фильтрации
 * @param {boolean} showAddedOnly - Показывать только добавленные песни
 */
async function filterAndDisplaySongs(searchTerm = '', category = '', showAddedOnly = false) {
    // Отменяем предыдущий поиск если есть
    if (currentOverlaySearchRequest) {
        searchWorkerManager.cancelSearch(currentOverlaySearchRequest);
        currentOverlaySearchRequest = null;
    }
    
    let filteredSongs = state.allSongs;
    
    // Фильтр по поиску через Web Worker (если есть поисковый запрос)
    if (searchTerm) {
        try {
            console.log(`🔍 Overlay поиск через Worker: "${searchTerm}"`);
            
            const startTime = performance.now();
            const { results, metadata } = await searchWorkerManager.overlaySearch(searchTerm, state.allSongs, {
                category: category || undefined,
                enablePrioritySearch: true
            });
            const duration = performance.now() - startTime;
            
            console.log(`✅ Overlay поиск завершен за ${duration.toFixed(2)}ms (Worker: ${metadata.duration.toFixed(2)}ms)`);
            
            // Объединяем точные и нечеткие результаты
            filteredSongs = [
                ...results.exactResults.map(r => r.song),
                ...results.fuzzyResults.map(r => r.song)
            ];
            
        } catch (error) {
            console.error('❌ Ошибка Web Worker overlay поиска, fallback:', error);
            
            // Fallback: стандартный поиск
            const query = normalizeSearchQuery(searchTerm);
            filteredSongs = filteredSongs.filter(song => {
                // Поиск по названию (с кэшированием)
                const normalizedTitle = getNormalizedTitle(song);
                const titleMatch = normalizedTitle.includes(query);
                
                // Поиск по тексту песни (с кэшированием)
                const normalizedLyrics = getNormalizedLyrics(song);
                const lyricsMatch = normalizedLyrics.includes(query);
                
                return titleMatch || lyricsMatch;
            });
            
            // Умная сортировка для fallback
            filteredSongs.sort((a, b) => {
                const aNormalizedTitle = getNormalizedTitle(a);
                const bNormalizedTitle = getNormalizedTitle(b);
                const aTitleMatch = aNormalizedTitle.includes(query);
                const bTitleMatch = bNormalizedTitle.includes(query);
                const aTitleStartsWith = aNormalizedTitle.startsWith(query);
                const bTitleStartsWith = bNormalizedTitle.startsWith(query);
                
                // 1. Сначала песни, название которых начинается с запроса
                if (aTitleStartsWith && !bTitleStartsWith) return -1;
                if (!aTitleStartsWith && bTitleStartsWith) return 1;
                
                // 2. Потом песни, где запрос содержится в названии (но не в начале)
                if (aTitleMatch && !aTitleStartsWith && (!bTitleMatch || bTitleStartsWith)) return -1;
                if (bTitleMatch && !bTitleStartsWith && (!aTitleMatch || aTitleStartsWith)) return 1;
                
                // 3. Наконец песни по тексту (где нет совпадения в названии)
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                
                return 0;
            });
        }
    }
    
    // Фильтр по категории (если не обработан в Worker)
    if (category && searchTerm) {
        // Если поиск был через Worker с категорией, фильтр уже применен
    } else if (category) {
        filteredSongs = filteredSongs.filter(song => song.sheet === category);
    }
    
    // Фильтр только добавленные
    if (showAddedOnly) {
        filteredSongs = filteredSongs.filter(song => 
            addedSongsToCurrentSetlist.has(song.id)
        );
    }
    
    displaySongsGrid(filteredSongs, searchTerm);
}

function finishAddingSongs() {
    closeAddSongsOverlay();
    
    // Обновляем список сет-листов
    refreshSetlists();
    
    const mode = window.activeOverlayMode || 'create';
    const setlistName = window.activeSetlistName;
    
    if (addedSongsToCurrentSetlist.size > 0) {
        if (mode === 'create') {
            showNotification(`🎉 Сет-лист "${setlistName}" создан с ${addedSongsToCurrentSetlist.size} песнями!`, 'success');
        } else {
            showNotification(`🎉 Добавлено ${addedSongsToCurrentSetlist.size} песен в "${setlistName}"!`, 'success');
        }
    } else {
        if (mode === 'create') {
            showNotification(`✅ Сет-лист "${setlistName}" готов к использованию!`, 'success');
        } else {
            showNotification(`✅ Редактирование "${setlistName}" завершено!`, 'success');
        }
    }
    
    // Сброс состояния
    if (mode === 'create') {
        currentCreatedSetlistId = null;
        currentCreatedSetlistName = '';
    }
    
    // Очищаем глобальные переменные overlay
    window.activeOverlayMode = null;
    window.activeSetlistId = null;
    window.activeSetlistName = null;
}

function handleSetlistSelect(setlist) {
    state.setCurrentSetlistId(setlist.id);
    ui.displaySelectedSetlist(setlist, handleFavoriteOrRepertoireSelect, handleRemoveSongFromSetlist);
}

async function handleSetlistDelete(setlistId, setlistName) {
    if (confirm(`Вы уверены, что хотите удалить сет-лист "${setlistName}"?`)) {
        try {
            const wasSelected = state.currentSetlistId === setlistId;

            await api.deleteSetlist(setlistId);
            await refreshSetlists(); // This re-renders the list

            if (wasSelected) {
                state.setCurrentSetlistId(null);
                ui.clearSetlistSelection();
            }
        } catch (error) {
            console.error("Ошибка при удалении сет-листа:", error);
            alert("Не удалось удалить сет-лист.");
        }
    }
}

async function handleAddSongToSetlist() {
    const songId = ui.songSelect.value;
    const key = ui.keySelect.value;
    const setlistId = state.currentSetlistId;

    if (!songId) {
        alert("Сначала выберите песню.");
        return;
    }
    if (!setlistId) {
        alert("Сначала выберите сет-лист.");
        return;
    }

    try {
        const result = await api.addSongToSetlist(setlistId, songId, key);

        if (result.status === 'duplicate_key') {
            if (confirm(`Эта песня уже есть в сет-листе в тональности ${result.existingKey}. Заменить на ${key}?`)) {
                await api.updateSongKeyInSetlist(setlistId, songId, key);
                alert("Тональность песни обновлена.");
            }
        } else if (result.status === 'duplicate_same') {
            alert("Эта песня уже есть в сет-листе с такой же тональностью.");
        } else if (result.status === 'added') {
            alert("Песня добавлена в сет-лист.");
        }

        // Refresh view
        const updatedSetlists = await api.loadSetlists();
        state.setSetlists(updatedSetlists);
        const updatedCurrentSetlist = updatedSetlists.find(s => s.id === setlistId);
        if (updatedCurrentSetlist) {
            state.setCurrentSetlistId(updatedCurrentSetlist.id); // Re-set state
            ui.displaySelectedSetlist(updatedCurrentSetlist, handleFavoriteOrRepertoireSelect, handleRemoveSongFromSetlist);
        }

    } catch (error) {
        console.error("Ошибка при добавлении песни:", error);
        alert("Не удалось добавить песню в сет-лист.");
    }
}

async function handleRemoveSongFromSetlist(songId, songName) {
    const setlistId = state.currentSetlistId;
    if (!setlistId) return;

    if (confirm(`Удалить песню "${songName}" из текущего сет-листа?`)) {
        try {
            await api.removeSongFromSetlist(setlistId, songId);

            // Refresh view
            const updatedSetlists = await api.loadSetlists();
            state.setSetlists(updatedSetlists);
            const updatedCurrentSetlist = updatedSetlists.find(s => s.id === setlistId);
            if (updatedCurrentSetlist) {
                 state.setCurrentSetlistId(updatedCurrentSetlist.id); // Re-set state
                 ui.displaySelectedSetlist(updatedCurrentSetlist, handleFavoriteOrRepertoireSelect, handleRemoveSongFromSetlist);
            } else {
                // This case handles if the setlist was somehow deleted in the process
                state.setCurrentSetlistId(null);
                ui.clearSetlistSelection();
            }
        } catch (error) {
            console.error("Ошибка при удалении песни из сет-листа:", error);
            alert("Не удалось удалить песню.");
        }
    }
}

async function handleAddToRepertoire() {
    const vocalistId = state.currentVocalistId;
    const songId = ui.songSelect.value;
    const key = ui.keySelect.value;

    if (!vocalistId) {
        alert("Пожалуйста, сначала выберите вокалиста.");
        return;
    }
    if (!songId) {
        alert("Пожалуйста, сначала выберите песню.");
        return;
    }

    const song = state.allSongs.find(s => s.id === songId);
    if (!song) {
        alert("Произошла ошибка: не удалось найти данные песни.");
        return;
    }

    try {
        const vocalistName = state.currentVocalistName || 'выбранного вокалиста';
        const result = await api.addToRepertoire(vocalistId, song, key);

        if (result.status === 'added') {
            alert(`Песня "${song.name}" добавлена в репертуар для "${vocalistName}".`);
        } else if (result.status === 'updated') {
            alert(`Тональность песни "${song.name}" в репертуаре для "${vocalistName}" обновлена на ${key}.`);
        } else if (result.status === 'exists') {
            alert(`Песня "${song.name}" уже есть в репертуаре для "${vocalistName}" с той же тональностью.`);
        }
        
        // Обновляем состояние кнопки репертуара
        ui.updateRepertoireButton(song);
    } catch (error) {
        console.error("Ошибка при добавлении в репертуар:", error);
        alert("Не удалось добавить песню в репертуар.");
    }
}

async function refreshSetlists() {
    try {
        const setlists = await api.loadSetlists();
        state.setSetlists(setlists);
        ui.renderSetlists(setlists, handleSetlistSelect, handleSetlistDelete);
    } catch (error) {
        console.error("Ошибка при загрузке сет-листов:", error);
        ui.renderSetlists([], handleSetlistSelect, handleSetlistDelete); // Render empty list on error
    }
}

// --- SWIPE TO CLOSE SETUP ---
function setupSwipeToClose() {
    const panels = document.querySelectorAll('.side-panel');
    let touchStartX = 0;
    let touchStartY = 0;
    
    panels.forEach(panel => {
        panel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        panel.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            if (Math.abs(diffY) > SWIPE_VERTICAL_LIMIT) return;
            
            const isLeftPanel = panel.id === 'setlists-panel' || panel.id === 'my-list-panel';
            const isRightPanel = panel.id === 'repertoire-panel';
            const swipedLeft = diffX < -SWIPE_THRESHOLD;
            const swipedRight = diffX > SWIPE_THRESHOLD;
            
            if ((isLeftPanel && swipedLeft) || (isRightPanel && swipedRight)) {
                ui.closeAllSidePanels();
            }
        }, { passive: true });
    });
}

// --- Утилиты ---

/** Показывает уведомление пользователю */
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--container-background-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 20px;
        font-size: 0.9rem;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Показываем с анимацией
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// --- EVENT LISTENER SETUP ---
function setupEventListeners() {
    console.log('=== setupEventListeners START ===');
    console.log('ui object:', ui);
    console.log('ui.confirmKeySelection:', ui.confirmKeySelection);
    
    // ПРОСТОЙ ТЕСТ СРАЗУ
    console.log('=== IMMEDIATE TEST ===');
    const testBtn = document.getElementById('confirm-key-selection');
    console.log('Button found immediately:', testBtn);
    
    if (testBtn) {
        console.log('Adding test click handler...');
        testBtn.addEventListener('click', () => {
            console.log('TEST CLICK HANDLER WORKED!');
        });
    }
    
    // --- Основные элементы управления ---
    ui.sheetSelect.addEventListener('change', () => {
        ui.searchInput.value = '';
        if(ui.searchResults) ui.searchResults.innerHTML = '';
        ui.populateSongSelect();
    });

    ui.songSelect.addEventListener('change', () => {
        const songId = ui.songSelect.value;
        const songData = songId ? state.allSongs.find(s => s.id === songId) : null;
        ui.displaySongDetails(songData);
    });

    ui.keySelect.addEventListener('change', () => {
        const songId = ui.keySelect.dataset.songId;
        const songData = songId ? state.allSongs.find(s => s.id === songId) : null;
        if(songData) {
            const newKey = ui.keySelect.value;
            const originalKey = songData['Оригинальная тональность'];
            const title = songData.name;
            let finalHtml = core.getRenderedSongText(songData['Текст и аккорды'], originalKey, newKey);
            
            // Если включен двухколоночный режим, распределяем блоки по колонкам
            if (ui.songContent.classList.contains('split-columns')) {
                finalHtml = core.distributeSongBlocksToColumns(finalHtml);
            }
            
            const preElement = ui.songContent.querySelector('#song-display');
            const h2Element = ui.songContent.querySelector('h2');
            if (preElement) preElement.innerHTML = finalHtml;
            if (h2Element) h2Element.textContent = `${title} — ${newKey}`;
        }
    });

    // Функция debounce для оптимизации поиска
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Переменная для отслеживания текущего поискового запроса
    let currentMainSearchRequest = null;
    
    // Создаем debounced версию поиска с Web Worker поддержкой
    const performSearch = async (rawQuery) => {
        // Отменяем предыдущий поиск если есть
        if (currentMainSearchRequest) {
            searchWorkerManager.cancelSearch(currentMainSearchRequest);
            currentMainSearchRequest = null;
        }
        
        if(!rawQuery) {
            if(ui.searchResults) ui.searchResults.innerHTML = '';
            return;
        }
        
        const query = normalizeSearchQuery(rawQuery);
        if(!query) {
            if(ui.searchResults) ui.searchResults.innerHTML = '';
            return;
        }
        
        try {
            // Используем Web Worker для поиска
            console.log(`🔍 Основной поиск через Worker: "${rawQuery}"`);
            
            const startTime = performance.now();
            const { results, metadata } = await searchWorkerManager.mainSearch(rawQuery, state.allSongs);
            const duration = performance.now() - startTime;
            
            console.log(`✅ Основной поиск завершен за ${duration.toFixed(2)}ms (Worker: ${metadata.duration.toFixed(2)}ms)`);
            
            // Объединяем точные и нечеткие результаты
            const allResults = [
                ...results.exactResults.map(r => r.song),
                ...results.fuzzyResults.map(r => r.song)
            ];
            
            // Показываем предложения если результатов мало
            if (allResults.length === 0 && results.suggestions && results.suggestions.length > 0) {
                console.log('💡 Предложения:', results.suggestions);
                // TODO: Показать предложения в UI
            }
            
            ui.displaySearchResults(allResults, (songMatch) => {
                ui.searchInput.value = songMatch.name;
                if(ui.searchResults) ui.searchResults.innerHTML = '';
                handleFavoriteOrRepertoireSelect(songMatch);
            }, rawQuery);
            
        } catch (error) {
            console.error('❌ Ошибка Web Worker поиска, fallback:', error);
            
            // Fallback: прямой поиск без worker
            performFallbackSearch(rawQuery, query);
        }
    };
    
    // Fallback функция для поиска без Web Worker
    const performFallbackSearch = (rawQuery, query) => {
        let allResults = [];
        
        // Используем фаззи-поиск если доступен
        if (window.searchEngine && typeof window.searchEngine.search === 'function') {
            const searchResults = window.searchEngine.search(rawQuery, state.allSongs);
            
            // Объединяем точные и нечеткие результаты
            allResults = [
                ...searchResults.exactResults.map(r => r.song),
                ...searchResults.fuzzyResults.map(r => r.song)
            ];
            
            // Показываем предложения если результатов мало
            if (allResults.length === 0 && searchResults.suggestions.length > 0) {
                console.log('💡 Предложения:', searchResults.suggestions);
                // TODO: Показать предложения в UI
            }
        } else {
            // Стандартный поиск
            allResults = state.allSongs.filter(song => {
                // Поиск по названию (с кэшированием)
                const normalizedTitle = getNormalizedTitle(song);
                const titleMatch = normalizedTitle.includes(query);
                
                // Поиск по тексту песни (с кэшированием)
                const normalizedLyrics = getNormalizedLyrics(song);
                const lyricsMatch = normalizedLyrics.includes(query);
                
                return titleMatch || lyricsMatch;
            });
            
            // Умная сортировка: начинающиеся → содержащие в названии → по тексту
            allResults.sort((a, b) => {
                const aNormalizedTitle = getNormalizedTitle(a);
                const bNormalizedTitle = getNormalizedTitle(b);
                const aTitleMatch = aNormalizedTitle.includes(query);
                const bTitleMatch = bNormalizedTitle.includes(query);
                const aTitleStartsWith = aNormalizedTitle.startsWith(query);
                const bTitleStartsWith = bNormalizedTitle.startsWith(query);
                
                // 1. Сначала песни, название которых начинается с запроса
                if (aTitleStartsWith && !bTitleStartsWith) return -1;
                if (!aTitleStartsWith && bTitleStartsWith) return 1;
                
                // 2. Потом песни, где запрос содержится в названии (но не в начале)
                if (aTitleMatch && !aTitleStartsWith && (!bTitleMatch || bTitleStartsWith)) return -1;
                if (bTitleMatch && !bTitleStartsWith && (!aTitleMatch || aTitleStartsWith)) return 1;
                
                // 3. Наконец песни по тексту (где нет совпадения в названии)
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                
                return 0;
            });
        }
        
        ui.displaySearchResults(allResults, (songMatch) => {
            ui.searchInput.value = songMatch.name;
            if(ui.searchResults) ui.searchResults.innerHTML = '';
            handleFavoriteOrRepertoireSelect(songMatch);
        }, rawQuery);
    };

    const debouncedSearch = debounce(performSearch, 150);

    ui.searchInput.addEventListener('input', () => {
        const rawQuery = ui.searchInput.value.trim();
        debouncedSearch(rawQuery);
    });
    
    ui.searchInput.addEventListener('blur', () => setTimeout(() => { if(ui.searchResults) ui.searchResults.innerHTML = '' }, 200));

    // --- Кнопки действий над песней ---
    ui.zoomInButton.addEventListener('click', () => {
        state.setCurrentFontSize(Math.min(state.currentFontSize + 2, 30));
        ui.updateFontSize();
    });
    ui.zoomOutButton.addEventListener('click', () => {
        state.setCurrentFontSize(Math.max(MIN_FONT_SIZE, state.currentFontSize - 2));
        ui.updateFontSize();
    });

    ui.splitTextButton.addEventListener('click', () => {
        const lyricsElement = ui.songContent.querySelector('#song-display');
        if (lyricsElement && lyricsElement.textContent?.trim()) {
            // Переключаем класс двухколоночного режима
            ui.songContent.classList.toggle('split-columns');
            
            // Перерендериваем текущую песню с учетом нового режима
            const songId = ui.songSelect.value;
            const songData = songId ? state.allSongs.find(s => s.id === songId) : null;
            if (songData) {
                const currentKey = ui.keySelect.value;
                const originalKey = songData['Оригинальная тональность'];
                let finalHtml = core.getRenderedSongText(songData['Текст и аккорды'], originalKey, currentKey);
                
                // Если теперь включен двухколоночный режим, распределяем блоки
                if (ui.songContent.classList.contains('split-columns')) {
                    finalHtml = core.distributeSongBlocksToColumns(finalHtml);
                }
                
                lyricsElement.innerHTML = finalHtml;
            }
            
            ui.updateSplitButton();
        } else {
            alert('Нет текста песни для разделения.');
        }
    });

    ui.toggleChordsButton.addEventListener('click', () => {
        if (!ui.songSelect.value) return;
        state.setAreChordsVisible(!state.areChordsVisible);
        ui.songContent.classList.toggle('chords-hidden', !state.areChordsVisible);
        
        // Скрываем/показываем блоки с только аккордами
        ui.toggleChordOnlyBlocks(!state.areChordsVisible);
        
        ui.updateToggleChordsButton();
    });

    ui.chordsOnlyButton.addEventListener('click', () => {
        if (!ui.songSelect.value) return;
        
        // Переключаем режим "только аккорды"
        state.setIsChordsOnlyMode(!state.isChordsOnlyMode);
        
        // Применяем CSS класс для основного контента
        ui.songContent.classList.toggle('chords-only-mode', state.isChordsOnlyMode);
        
        // Применяем CSS класс для презентации
        const presentationContent = document.querySelector('.presentation-content');
        if (presentationContent) {
            presentationContent.classList.toggle('chords-only-mode', state.isChordsOnlyMode);
        }
        
        // Обновляем обе кнопки
        ui.updateChordsOnlyButton();
        ui.updateToggleChordsButton();
    });

    // --- Переключение темы ---
    ui.themeToggleButton.addEventListener('click', () => {
        const currentTheme = document.body.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        ui.applyTheme(newTheme);
    });

    // --- Метроном обрабатывается в metronome.js ---

    // --- Боковые панели ---
    ui.toggleSetlistsButton.addEventListener('click', async () => {
        const isAlreadyOpen = ui.setlistsPanel.classList.contains('open');
        ui.closeAllSidePanels();
        if (!isAlreadyOpen) {
            ui.toggleSetlistsButton.classList.add('loading');
            try {
                ui.setlistsPanel.classList.add('open');
                await refreshSetlists();
            } catch (error) {
                console.error('Ошибка загрузки сет-листов:', error);
            } finally {
                ui.toggleSetlistsButton.classList.remove('loading');
            }
        }
    });

    ui.toggleMyListButton.addEventListener('click', async () => {
        const isAlreadyOpen = ui.myListPanel.classList.contains('open');
        ui.closeAllSidePanels();
        if (!isAlreadyOpen) {
            ui.toggleMyListButton.classList.add('loading');
            try {
                ui.myListPanel.classList.add('open');
                // Logic to load and render favorites
                const favoriteSongs = state.allSongs.filter(song => 
                    state.favorites.some(fav => fav.songId === song.id)
                ).map(song => {
                    const fav = state.favorites.find(f => f.songId === song.id);
                    return { ...song, preferredKey: fav.preferredKey };
                });
                ui.renderFavorites(favoriteSongs, handleFavoriteOrRepertoireSelect, async (songId) => {
                    if(confirm("Удалить песню из 'Моих'?")) {
                        try {
                            await api.removeFromFavorites(songId);
                            // Refresh list after deletion
                            ui.toggleMyListButton.click();
                        } catch (error) {
                            console.error('Ошибка удаления из избранного:', error);
                            alert('Не удалось удалить песню из списка');
                        }
                    }
                });
            } catch (error) {
                console.error('Ошибка загрузки избранного:', error);
            } finally {
                ui.toggleMyListButton.classList.remove('loading');
            }
        }
    });

    ui.toggleRepertoireButton.addEventListener('click', async () => {
        const isAlreadyOpen = ui.repertoirePanel.classList.contains('open');
        ui.closeAllSidePanels();
        if (!isAlreadyOpen) {
            ui.toggleRepertoireButton.classList.add('loading');
            try {
                ui.repertoirePanel.classList.add('open');
                api.loadRepertoire(state.currentVocalistId, handleRepertoireUpdate);
            } catch (error) {
                console.error('Ошибка загрузки репертуара:', error);
            } finally {
                ui.toggleRepertoireButton.classList.remove('loading');
            }
        }
    });

    ui.vocalistSelect.addEventListener('change', (e) => {
        state.setCurrentVocalistId(e.target.value);
        const selectedOption = e.target.options[e.target.selectedIndex];
        state.setCurrentVocalistName(selectedOption.value ? selectedOption.text : null);
        api.loadRepertoire(state.currentVocalistId, handleRepertoireUpdate);
    });

    [ui.repertoireViewKeyBtn, ui.repertoireViewSheetBtn, ui.repertoireViewAllBtn].forEach(button => {
        button.addEventListener('click', () => {
            const newMode = button.id.includes('key') ? 'byKey' : button.id.includes('sheet') ? 'bySheet' : 'allAlphabetical';
            state.setCurrentRepertoireViewMode(newMode);
            ui.renderRepertoire(handleFavoriteOrRepertoireSelect);
        });
    });

    // --- Презентация ---
    ui.presentationCloseBtn.addEventListener('click', () => {
        ui.presentationOverlay.classList.remove('visible');
    });
    ui.presPrevBtn.addEventListener('click', () => {
        state.setCurrentPresentationIndex(state.currentPresentationIndex - 1);
        ui.displayCurrentPresentationSong();
    });
    ui.presNextBtn.addEventListener('click', () => {
        state.setCurrentPresentationIndex(state.currentPresentationIndex + 1);
        ui.displayCurrentPresentationSong();
    });
    ui.presSplitTextBtn.addEventListener('click', () => {
        state.setIsPresentationSplit(!state.isPresentationSplit);
        ui.presentationContent.classList.toggle('split-columns', state.isPresentationSplit);
        
        // Перерендериваем текущую песню в презентации с учетом нового режима
        ui.displayCurrentPresentationSong();
        
        ui.updatePresentationSplitButtonState();
    });
    
    // --- Модальное окно заметок ---
    ui.saveNoteButton.addEventListener('click', handleSaveNote);
    ui.cancelNoteButton.addEventListener('click', closeNotesModal);
    ui.closeNoteModalX.addEventListener('click', closeNotesModal);
    ui.notesModal.addEventListener('click', (e) => { if (e.target === ui.notesModal) closeNotesModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.notesModal.classList.contains('visible')) closeNotesModal(); });

    // --- Сет-листы - Новые обработчики для dropdown ---
    
    // Dropdown кнопка
    ui.setlistDropdownBtn.addEventListener('click', async () => {
        const isOpen = ui.setlistDropdownMenu.classList.contains('show');
        if (isOpen) {
            ui.setlistDropdownMenu.classList.remove('show');
            ui.setlistDropdownBtn.classList.remove('active');
        } else {
            // Загружаем данные при открытии dropdown
            try {
                await refreshSetlists();
                ui.setlistDropdownMenu.classList.add('show');
                ui.setlistDropdownBtn.classList.add('active');
            } catch (error) {
                console.error('Ошибка загрузки сет-листов:', error);
                ui.setlistDropdownMenu.classList.add('show');
                ui.setlistDropdownBtn.classList.add('active');
            }
        }
    });

    // Закрытие dropdown при клике вне его
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.modern-selector')) {
            ui.setlistDropdownMenu.classList.remove('show');
            ui.setlistDropdownBtn.classList.remove('active');
        }
    });

    // Кнопка создания нового сет-листа в заголовке
    ui.createNewSetlistHeaderBtn.addEventListener('click', () => {
        ui.createSetlistModal.classList.add('show');
        ui.newSetlistNameInput.value = '';
        ui.newSetlistNameInput.focus();
    });

    // Модальное окно создания сет-листа
    ui.closeCreateModal.addEventListener('click', closeCreateSetlistModal);
    ui.cancelCreateSetlist.addEventListener('click', closeCreateSetlistModal);
    ui.createSetlistButton.addEventListener('click', handleCreateSetlist);
    
    // Закрытие модального окна при клике вне его
    ui.createSetlistModal.addEventListener('click', (e) => {
        if (e.target === ui.createSetlistModal) {
            closeCreateSetlistModal();
        }
    });

    // Создание сет-листа по Enter
    ui.newSetlistNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleCreateSetlist();
        } else if (e.key === 'Escape') {
            closeCreateSetlistModal();
        }
    });
    
    // Счетчик символов для названия
    if (ui.nameCharCount) {
        ui.newSetlistNameInput.addEventListener('input', (e) => {
            ui.nameCharCount.textContent = e.target.value.length;
        });
    }

    // Модальное окно подтверждения добавления песен
    if (ui.closeConfirmModal) {
        ui.closeConfirmModal.addEventListener('click', closeAddSongsConfirmModal);
    }
    if (ui.skipAddSongs) {
        ui.skipAddSongs.addEventListener('click', closeAddSongsConfirmModal);
    }
    if (ui.startAddSongs) {
        ui.startAddSongs.addEventListener('click', startAddingSongs);
    }
    
    // Кнопка "Добавить" в правой панели для редактирования существующего setlist
    if (ui.addSongBtn) {
        ui.addSongBtn.addEventListener('click', () => {
            console.log('=== ADD SONG BTN CLICKED ===');
            console.log('currentSetlistId:', state.currentSetlistId);
            
            if (!state.currentSetlistId) {
                showNotification('❌ Сначала выберите сет-лист', 'error');
                return;
            }
            
            // Находим setlist по ID для получения имени
            const currentSetlist = state.setlists.find(s => s.id === state.currentSetlistId);
            const setlistName = currentSetlist ? currentSetlist.name : 'Сет-лист';
            
            console.log('Found setlist:', currentSetlist);
            console.log('setlistName:', setlistName);
            
            // Запускаем overlay в режиме редактирования
            startAddingSongs('edit', state.currentSetlistId, setlistName);
        });
    }
    
    if (ui.addSongsConfirmModal) {
        ui.addSongsConfirmModal.addEventListener('click', (e) => {
            if (e.target === ui.addSongsConfirmModal) {
                closeAddSongsConfirmModal();
            }
        });
    }

    // Полноэкранный оверлей добавления песен
    if (ui.closeAddSongs) {
        ui.closeAddSongs.addEventListener('click', closeAddSongsOverlay);
    }
    if (ui.finishAddingSongs) {
        ui.finishAddingSongs.addEventListener('click', finishAddingSongs);
    }
    
    // Поиск песен
    if (ui.songSearchInput && ui.clearSearch && ui.categoryFilter && ui.showAddedOnly) {
        // Создаем debounced версию поиска для overlay (основной список)
        const performOverlaySearch = (searchTerm) => {
            const category = ui.categoryFilter.value;
            const showAddedOnly = ui.showAddedOnly.classList.contains('active');
            filterAndDisplaySongs(searchTerm, category, showAddedOnly);
        };
        
        // Используем глобальную функцию performOverlayDropdownSearch
        
        const debouncedOverlaySearch = debounce(performOverlaySearch, 150);
        const debouncedOverlayDropdownSearch = debounce(performOverlayDropdownSearch, 200);
        
        ui.songSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            ui.clearSearch.style.display = searchTerm ? 'flex' : 'none';
            
            if (searchTerm) {
                // При наличии поискового запроса показываем dropdown с результатами
                debouncedOverlayDropdownSearch(searchTerm);
            } else {
                // Если запрос пустой, скрываем dropdown и показываем основной список
                hideOverlaySearchResults();
                debouncedOverlaySearch('');
            }
        });
        
        ui.clearSearch.addEventListener('click', () => {
            ui.songSearchInput.value = '';
            ui.clearSearch.style.display = 'none';
            
            // Скрываем dropdown
            hideOverlaySearchResults();
            
            // Показываем основной список
            const category = ui.categoryFilter.value;
            const showAddedOnly = ui.showAddedOnly.classList.contains('active');
            filterAndDisplaySongs('', category, showAddedOnly);
        });
        
        // Фильтр по категориям
        ui.categoryFilter.addEventListener('change', (e) => {
            const searchTerm = ui.songSearchInput.value.trim();
            const showAddedOnly = ui.showAddedOnly.classList.contains('active');
            filterAndDisplaySongs(searchTerm, e.target.value, showAddedOnly);
        });
        
        // Показать только добавленные
        ui.showAddedOnly.addEventListener('click', () => {
            ui.showAddedOnly.classList.toggle('active');
            
            const searchTerm = ui.songSearchInput.value.trim();
            const category = ui.categoryFilter.value;
            const showAddedOnly = ui.showAddedOnly.classList.contains('active');
            filterAndDisplaySongs(searchTerm, category, showAddedOnly);
        });
    }

    // Модальное окно выбора тональности
    if (ui.closeKeyModal) {
        ui.closeKeyModal.addEventListener('click', closeKeySelectionModal);
    }
    if (ui.cancelKeySelection) {
        ui.cancelKeySelection.addEventListener('click', closeKeySelectionModal);
    }
    if (ui.confirmKeySelection) {
        console.log('Adding event listener to confirmKeySelection button');
        ui.confirmKeySelection.addEventListener('click', (e) => {
            console.log('confirmKeySelection button clicked!', e);
            confirmAddSongWithKey();
        });
    } else {
        console.error('confirmKeySelection button not found!');
    }
    
    if (ui.keySelectionModal) {
        ui.keySelectionModal.addEventListener('click', (e) => {
            if (e.target === ui.keySelectionModal) {
                closeKeySelectionModal();
            }
        });
    }
    
    // Обработчики кнопок тональностей
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('key-btn')) {
            currentSelectedKey = e.target.dataset.key;
            updateKeyButtons();
        }
        
        // АЛЬТЕРНАТИВНЫЙ ОБРАБОТЧИК ДЛЯ КНОПКИ ПОДТВЕРЖДЕНИЯ
        if (e.target.id === 'confirm-key-selection' || e.target.closest('#confirm-key-selection')) {
            console.log('=== CONFIRM BUTTON CLICKED VIA DELEGATION ===');
            console.log('Target:', e.target);
            console.log('Target ID:', e.target.id);
            console.log('Target classes:', e.target.className);
            console.log('Closest button:', e.target.closest('#confirm-key-selection'));
            console.log('Event type:', e.type);
            console.log('Event bubbles:', e.bubbles);
            
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Calling confirmAddSongWithKey...');
            confirmAddSongWithKey();
        }
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА НА ВСЕ КЛИКИ В МОДАЛЬНОМ ОКНЕ
        if (e.target.closest('#key-selection-modal')) {
            console.log('=== CLICK IN KEY SELECTION MODAL ===');
            console.log('Target:', e.target);
            console.log('Target tag:', e.target.tagName);
            console.log('Target ID:', e.target.id);
            console.log('Target classes:', e.target.className);
        }
    });

    // --- Редактор песен ---
    ui.editSongButton.addEventListener('click', () => {
        console.log('Кнопка редактирования нажата');
        const songData = ui.getCurrentSongData();
        console.log('Данные песни:', songData);
        if (songData) {
            console.log('Открываем редактор для песни:', songData.name);
            ui.openSongEditor(songData);
        } else {
            console.log('Данные песни не найдены');
        }
    });

    ui.saveEditButton.addEventListener('click', async () => {
        const songData = ui.getCurrentSongData();
        const newContent = ui.songEditTextarea.value.trim();
        
        if (!songData || !newContent) {
            alert('Выберите песню и введите текст');
            return;
        }
        
        try {
            await api.saveSongEdit(songData.id, newContent);
            
            // Обновляем данные песни в локальном состоянии
            songData['Текст и аккорды (edited)'] = newContent;
            songData.hasWebEdits = true;
            songData.lastEditedInApp = new Date();
            
            // Обновляем отображение песни
            ui.displaySongDetails(songData);
            
            // Закрываем редактор
            ui.closeSongEditor();
            
            // Показываем уведомление
            showNotification('✅ Песня успешно сохранена!', 'success');
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении: ' + error.message);
        }
    });

    ui.cancelEditButton.addEventListener('click', () => {
        ui.closeSongEditor();
    });

    ui.closeEditorButton.addEventListener('click', () => {
        ui.closeSongEditor();
    });

    // Закрытие редактора при клике на оверлей
    ui.songEditorOverlay.addEventListener('click', (e) => {
        if (e.target === ui.songEditorOverlay) {
            ui.closeSongEditor();
        }
    });

    // Закрытие редактора по клавише Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ui.songEditorOverlay.classList.contains('visible')) {
            ui.closeSongEditor();
        }
    });

    ui.revertToOriginalButton.addEventListener('click', async () => {
        const songData = ui.getCurrentSongData();
        if (!songData) return;
        
        if (!confirm('Вы уверены, что хотите вернуть оригинальный текст из Google Таблицы? Все ваши изменения будут потеряны.')) {
            return;
        }
        
        try {
            await api.revertToOriginal(songData.id);
            
            // Обновляем данные песни
            delete songData['Текст и аккорды (edited)'];
            songData.hasWebEdits = false;
            delete songData.lastEditedInApp;
            delete songData.editedBy;
            
            // Обновляем отображение
            ui.displaySongDetails(songData);
            
            // Закрываем редактор
            ui.closeSongEditor();
            
            showNotification('🔄 Песня возвращена к оригиналу', 'info');
            
        } catch (error) {
            console.error('Ошибка отката:', error);
            alert('Ошибка при возврате к оригиналу: ' + error.message);
        }
    });

    // --- Централизованная обработка кликов ---
    document.addEventListener('click', (e) => {
        // Очистка результатов поиска при клике вне поля поиска
        if (e.target.id !== 'search-input') {
            if(ui.searchResults) ui.searchResults.innerHTML = '';
        }
        
        // Клик по аккорду в тексте песни для быстрой смены тональности
        // НЕ работает в режиме "только аккорды"
        if (e.target.closest('#song-content #song-display') && !state.isChordsOnlyMode) {
            const chordEl = e.target.closest('.chord');
            if (chordEl) {
                ui.keySelect.value = chordEl.textContent;
                ui.keySelect.dispatchEvent(new Event('change'));
            }
        }
        
        // Кнопка копирования текста
        if(e.target.closest('#copy-text-button')) {
            const preElement = ui.songContent.querySelector('#song-display');
            if (preElement) {
                navigator.clipboard.writeText(preElement.innerText).then(() => {
                    const copyButton = e.target.closest('#copy-text-button');
                    if (copyButton) {
                        copyButton.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            if (copyButton) {
                                copyButton.innerHTML = '<i class="far fa-copy"></i>';
                            }
                        }, 1500);
                    }
                });
            }
        }
        
        // Закрытие панелей по кнопке-стрелке
        const closeButton = e.target.closest('.side-panel-close-btn');
        if (closeButton) {
            ui.closeAllSidePanels();
            return;
        }
        
        // Закрытие панели при клике вне ее области
        const openPanel = document.querySelector('.side-panel.open');
        if (openPanel && !openPanel.contains(e.target) && !e.target.closest('.mobile-nav-button')) {
            ui.closeAllSidePanels();
        }
    });

    ui.favoriteButton.addEventListener('click', async () => {
        const songId = ui.songSelect.value;
        const key = ui.keySelect.value;
        const songName = state.allSongs.find(s=>s.id === songId)?.name || 'Эту песню';
        if (!songId) { alert("Пожалуйста, выберите песню."); return; }

        const result = await api.addToFavorites(songId, key);
        
        if (result.status === 'added') {
            alert(`Песня "${songName}" (${result.key}) добавлена в 'Мои'.`);
        } else if (result.status === 'updated') {
            alert(`Тональность песни "${songName}" в 'Моих' обновлена на ${result.key}.`);
        } else if (result.status === 'exists') {
            alert(`Песня "${songName}" уже есть в 'Моих' с той же тональностью.`);
        }
    });

    ui.addToSetlistButton.addEventListener('click', handleAddSongToSetlist);

    ui.repertoireButton.addEventListener('click', handleAddToRepertoire);
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("=== DOM loaded ===");
    console.log("Checking key elements:");
    console.log("confirm-key-selection element:", document.getElementById('confirm-key-selection'));
    console.log("key-selection-modal element:", document.getElementById('key-selection-modal'));
    console.log("add-songs-overlay element:", document.getElementById('add-songs-overlay'));
    
    if(ui.loadingIndicator) ui.loadingIndicator.style.display = 'block';

    let initialTheme = 'dark';
    try {
        const savedTheme = localStorage.getItem('theme');
        initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : (window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark');
    } catch (e) { console.error(e); }
    ui.applyTheme(initialTheme);
    
    setupEventListeners();
    setupSwipeToClose();
    ui.updateFontSize();
    metronomeUI.initMetronomeUI().catch(console.error);
    
    // Make metronome UI available globally for backward compatibility
    window.metronomeUI = metronomeUI;
    
    // Make search worker manager available globally  
    window.searchWorkerManager = searchWorkerManager;
    
    // Устанавливаем двухколоночный режим по умолчанию
    ui.songContent.classList.add('split-columns');
    ui.updateSplitButton();

    try {
        await api.loadAllSongsFromFirestore();
        ui.populateSheetSelect();
        ui.populateSongSelect();

        const vocalists = await api.loadVocalists();
        ui.populateVocalistSelect(vocalists);
        
        // core.loadAudioFile(); // ВРЕМЕННО ОТКЛЮЧЕНО - вызывает CORS ошибки и может ломать layout

    } catch (error) {
        console.error("Критическая ошибка во время инициализации:", error);
        document.body.innerHTML = `<div style="color: red; padding: 20px;">Критическая ошибка инициализации.</div>`;
    } finally {
        if(ui.loadingIndicator) ui.loadingIndicator.style.display = 'none';
    }

    console.log("Инициализация приложения завершена.");
    
    // КРИТИЧЕСКАЯ ЗАЩИТА: принудительно исправляем размеры панелей на мобильных
    if (window.innerWidth <= 480) {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.side-panel').forEach(panel => {
                if (panel.classList.contains('open')) {
                    // ПРИНУДИТЕЛЬНЫЕ РАЗМЕРЫ
                    const maxWidth = Math.min(280, window.innerWidth * 0.85);
                    panel.style.width = maxWidth + 'px';
                    panel.style.maxWidth = maxWidth + 'px';
                    
                    // ПРИНУДИТЕЛЬНОЕ ПОЗИЦИОНИРОВАНИЕ
                    panel.style.position = 'fixed';
                    panel.style.left = '0';
                    panel.style.right = 'auto';
                    panel.style.top = '0';
                    panel.style.bottom = '0';
                    panel.style.height = '100vh';
                    panel.style.transform = 'translateX(0)';
                    panel.style.zIndex = '1000';
                    
                    // ПРИНУДИТЕЛЬНОЕ ПЕРЕПОЛНЕНИЕ
                    panel.style.overflow = 'hidden';
                    panel.style.boxSizing = 'border-box';
                }
            });
        });
        observer.observe(document.body, { 
            attributes: true, 
            subtree: true, 
            attributeFilter: ['class'] 
        });
    }
    


// ===== МОБИЛЬНЫЙ OVERLAY ДЛЯ ПРОСМОТРА ПЕСНИ =====
    
    let currentMobileSong = null;
    
    /**
     * Показ мобильного overlay для просмотра песни
     */
    function showMobileSongPreview(song) {
        console.log('🔍 Показ мобильного overlay для песни:', song.name);
        
        currentMobileSong = song;
        
        // Получаем элементы
        const overlay = document.getElementById('mobile-song-preview-overlay');
        const titleElement = document.getElementById('mobile-song-title');
        const keySelector = document.getElementById('mobile-key-selector');
        const songTextElement = document.getElementById('mobile-song-text');
        
        if (!overlay || !titleElement || !keySelector || !songTextElement) {
            console.error('❌ Не найдены элементы мобильного overlay');
            return;
        }
        
        // Устанавливаем название
        titleElement.textContent = song.name;
        
        // Устанавливаем оригинальную тональность
        const originalKey = getSongKey(song);
        keySelector.value = originalKey;
        
        // Отображаем текст песни
        displaySongTextInMobileOverlay(song, originalKey);
        
        // Показываем overlay
        overlay.classList.add('active');
        document.body.classList.add('overlay-active');
        
        console.log('✅ Мобильный overlay показан');
    }
    
    /**
     * Скрытие мобильного overlay
     */
    function hideMobileSongPreview() {
        console.log('🔒 Скрытие мобильного overlay');
        
        const overlay = document.getElementById('mobile-song-preview-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.classList.remove('overlay-active');
        }
        
        currentMobileSong = null;
        
        console.log('✅ Мобильный overlay скрыт');
    }
    
    /**
     * Отображение текста песни в мобильном overlay
     */
    function displaySongTextInMobileOverlay(song, selectedKey) {
        const songTextElement = document.getElementById('mobile-song-text');
        if (!songTextElement) return;
        
        // Получаем текст песни
        let songText = song.hasWebEdits 
            ? (song['Текст и аккорды (edited)'] || song['Текст и аккорды'] || '') 
            : (song['Текст и аккорды'] || '');
        
        if (!songText) {
            songTextElement.innerHTML = '<div style="text-align: center; color: var(--label-color); font-style: italic;">Текст песни не найден</div>';
            return;
        }
        
        // Транспонируем аккорды если нужно
        const originalKey = getSongKey(song);
        if (selectedKey !== originalKey) {
            songText = transposeChords(songText, originalKey, selectedKey);
        }
        
        // Форматируем аккорды для отображения
        const formattedText = formatChordsInText(songText);
        
        songTextElement.innerHTML = formattedText;
        
        console.log(`📝 Текст песни отображен (${originalKey} → ${selectedKey})`);
    }
    
    /**
     * Простая функция транспонирования аккордов
     */
    function transposeChords(text, fromKey, toKey) {
        // Если тональности одинаковые, возвращаем оригинальный текст
        if (fromKey === toKey) {
            return text;
        }
        
        // Карта аккордов для транспонирования
        const chordMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const fromIndex = chordMap.indexOf(fromKey);
        const toIndex = chordMap.indexOf(toKey);
        
        if (fromIndex === -1 || toIndex === -1) {
            console.warn(`Неизвестная тональность: ${fromKey} → ${toKey}`);
            return text;
        }
        
        const semitones = (toIndex - fromIndex + 12) % 12;
        
        // Транспонируем аккорды в квадратных скобках
        return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
            const transposedChord = transposeChord(chord.trim(), semitones);
            return `[${transposedChord}]`;
        });
    }
    
    /**
     * Транспонирование одного аккорда
     */
    function transposeChord(chord, semitones) {
        const chordMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Находим основную ноту аккорда
        let rootNote = '';
        let suffix = '';
        
        if (chord.length >= 2 && chord[1] === '#') {
            rootNote = chord.substring(0, 2);
            suffix = chord.substring(2);
        } else {
            rootNote = chord[0];
            suffix = chord.substring(1);
        }
        
        const rootIndex = chordMap.indexOf(rootNote);
        if (rootIndex === -1) {
            return chord; // Если не найден, возвращаем как есть
        }
        
        const newRootIndex = (rootIndex + semitones) % 12;
        const newRootNote = chordMap[newRootIndex];
        
        return newRootNote + suffix;
    }
    
    /**
     * Форматирование аккордов в тексте для отображения
     */
    function formatChordsInText(text) {
        // Заменяем аккорды в квадратных скобках на span с классом chord
        return text.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>');
    }
    
    // Обработчики событий для мобильного overlay
    document.addEventListener('DOMContentLoaded', () => {
        // Закрытие overlay
        const closeBtn = document.getElementById('close-mobile-song-preview');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideMobileSongPreview);
        }
        
        // Изменение тональности
        const keySelector = document.getElementById('mobile-key-selector');
        if (keySelector) {
            keySelector.addEventListener('change', (e) => {
                if (currentMobileSong) {
                    displaySongTextInMobileOverlay(currentMobileSong, e.target.value);
                }
            });
        }
        
        // Добавление песни в сет-лист
        const addBtn = document.getElementById('add-song-to-setlist-mobile');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (currentMobileSong) {
                    const selectedKey = document.getElementById('mobile-key-selector').value;
                    confirmAddSongWithKey(currentMobileSong, selectedKey);
                    hideMobileSongPreview();
                }
            });
        }
        
        // Закрытие по клику на overlay (вне контента)
        const overlay = document.getElementById('mobile-song-preview-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    hideMobileSongPreview();
                }
            });
        }
        
        // ===== ОБРАБОТЧИКИ ДЛЯ DROPDOWN ПОИСКА =====
        
        // Скрытие dropdown при клике вне области поиска
        document.addEventListener('click', (e) => {
            const searchWrapper = document.querySelector('.search-input-wrapper');
            const dropdown = document.getElementById('overlay-search-results');
            
            if (searchWrapper && dropdown && !searchWrapper.contains(e.target)) {
                hideOverlaySearchResults();
            }
        });
        
        // Скрытие dropdown при потере фокуса поля поиска (с задержкой для обработки кликов)
        const searchInput = document.getElementById('song-search-input');
        if (searchInput) {
            searchInput.addEventListener('blur', () => {
                // Задержка чтобы успел сработать клик по результату
                setTimeout(() => {
                    const dropdown = document.getElementById('overlay-search-results');
                    if (dropdown && dropdown.style.display === 'block') {
                        // Проверяем, не находится ли курсор над dropdown
                        const rect = dropdown.getBoundingClientRect();
                        const mouseX = event.clientX || 0;
                        const mouseY = event.clientY || 0;
                        
                        if (mouseX < rect.left || mouseX > rect.right || 
                            mouseY < rect.top || mouseY > rect.bottom) {
                            hideOverlaySearchResults();
                        }
                    }
                }, 150);
            });
            
            // Показываем dropdown при фокусе если есть текст
            searchInput.addEventListener('focus', () => {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    debouncedOverlayDropdownSearch(searchTerm);
                }
            });
        }
    });
});