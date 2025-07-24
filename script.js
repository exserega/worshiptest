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
    console.log('ui.keySelectionModal:', ui.keySelectionModal);
    
    if (!ui.keySelectionModal) {
        console.error('keySelectionModal not found!');
        return;
    }
    
    currentSongForKey = song;
    const originalSongKey = song['Тональность'] || 'C';
    currentSelectedKey = originalSongKey;
    
    console.log('Set currentSongForKey:', currentSongForKey);
    console.log('Set currentSelectedKey:', currentSelectedKey);
    
    // Заполняем информацию о песне
    if (ui.keySongName) {
        ui.keySongName.textContent = song.name;
    }
    if (ui.originalKey) {
        ui.originalKey.textContent = originalSongKey;
    }
    if (ui.selectedKey) {
        ui.selectedKey.textContent = currentSelectedKey;
    }
    
    // Обновляем кнопки тональностей
    updateKeyButtons();
    
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

function updateKeyButtons() {
    const keyButtons = document.querySelectorAll('.key-btn');
    keyButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.key === currentSelectedKey) {
            btn.classList.add('selected');
        }
    });
    
    if (ui.selectedKey) {
        ui.selectedKey.textContent = currentSelectedKey;
    }
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
    displaySongsGrid(state.allSongs);
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

function displaySongsGrid(songs) {
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
        const originalKey = song['Тональность'] || 'C';
        
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
            
            e.stopPropagation();
            if (isAdded) {
                // Если песня уже добавлена, удаляем её
                console.log('Removing song from setlist...');
                removeSongFromSetlist(song);
            } else {
                // Если песня не добавлена, показываем модальное окно выбора тональности
                console.log('Showing key selection modal...');
                
                // Проверяем что у нас есть активный сет-лист
                if (!currentCreatedSetlistId) {
                    console.error('No active setlist! currentCreatedSetlistId is null');
                    showNotification('❌ Сначала создайте сет-лист', 'error');
                    return;
                }
                
                showKeySelectionModal(song);
                
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

function filterAndDisplaySongs(searchTerm = '', category = '', showAddedOnly = false) {
    let filteredSongs = state.allSongs;
    
    // Фильтр по поиску
    if (searchTerm) {
        filteredSongs = filteredSongs.filter(song => 
            song.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Фильтр по категории
    if (category) {
        filteredSongs = filteredSongs.filter(song => song.sheet === category);
    }
    
    // Фильтр только добавленные
    if (showAddedOnly) {
        filteredSongs = filteredSongs.filter(song => 
            addedSongsToCurrentSetlist.has(song.id)
        );
    }
    
    displaySongsGrid(filteredSongs);
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

    ui.searchInput.addEventListener('input', () => {
        const query = ui.searchInput.value.trim().toLowerCase();
        if(!query) {
            if(ui.searchResults) ui.searchResults.innerHTML = '';
            return;
        }
        const matchingSongs = state.allSongs.filter(song =>
            song.name && song.name.toLowerCase().includes(query)
        );
        ui.displaySearchResults(matchingSongs, (songMatch) => {
            ui.searchInput.value = songMatch.name;
            if(ui.searchResults) ui.searchResults.innerHTML = '';
            handleFavoriteOrRepertoireSelect(songMatch);
        });
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
        ui.songSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            ui.clearSearch.style.display = searchTerm ? 'flex' : 'none';
            
            const category = ui.categoryFilter.value;
            const showAddedOnly = ui.showAddedOnly.classList.contains('active');
            filterAndDisplaySongs(searchTerm, category, showAddedOnly);
        });
        
        ui.clearSearch.addEventListener('click', () => {
            ui.songSearchInput.value = '';
            ui.clearSearch.style.display = 'none';
            
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
});