/**
 * ===================================================================
 * MAIN CONTROLLER MODULE
 * ===================================================================
 * Главный контроллер приложения - управляет основной логикой
 * 
 * Функции:
 * - Управление сетлистами (создание, удаление, выбор)
 * - Управление песнями (добавление, удаление, заметки)
 * - Управление репертуаром
 * - Обработка пользовательских действий
 */

// Импорты
import { eventBus, stateManager } from '../core/index.js';
import { showNotification, showConfirmDialog } from '../core/index.js';
import * as api from '../api/index.js';
import * as state from '../../state.js';
import * as ui from '../../ui.js';

// ====================================
// SETLIST MANAGEMENT
// ====================================

/**
 * Создает новый сетлист
 * @param {string} name - Название сетлиста
 */
export async function handleCreateSetlist(name) {
    console.log('🎵 [Controller] handleCreateSetlist:', name);
    
    if (!name || !name.trim()) {
        showNotification('❌ Название сет-листа не может быть пустым', 'error');
        return;
    }
    
    try {
        // Показываем индикатор загрузки
        if (ui.createSetlistButton) {
            ui.createSetlistButton.disabled = true;
            ui.createSetlistButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Создание...</span>';
        }
        
        const setlistId = await api.createSetlist(name.trim());
        
        // Сохраняем созданный сетлист как текущий
        eventBus.setState('currentCreatedSetlistId', setlistId);
        eventBus.setState('currentCreatedSetlistName', name.trim());
        
        // Обновляем список сетлистов
        await refreshSetlists();
        
        // Показываем модальное окно подтверждения добавления песен
        if (ui.createdSetlistName) {
            ui.createdSetlistName.textContent = name.trim();
        }
        if (ui.addSongsConfirmModal) {
            ui.addSongsConfirmModal.classList.add('show');
        }
        
        showNotification('✅ Сет-лист создан успешно!', 'success');
        
        return setlistId;
        
    } catch (error) {
        console.error('❌ [Controller] Ошибка создания сетлиста:', error);
        showNotification('❌ Не удалось создать сет-лист', 'error');
        throw error;
    } finally {
        // Восстанавливаем кнопку
        if (ui.createSetlistButton) {
            ui.createSetlistButton.disabled = false;
            ui.createSetlistButton.innerHTML = '<i class="fas fa-arrow-right"></i><span>Продолжить</span>';
        }
    }
}

/**
 * Обновляет список сетлистов
 */
export async function refreshSetlists() {
    console.log('🔄 [Controller] refreshSetlists');
    
    try {
        const setlists = await api.loadSetlists();
        
        // Обновляем состояние
        stateManager.setAllSetlists(setlists);
        
        // Обновляем UI если есть соответствующие элементы
        if (typeof window.updateSetlistsUI === 'function') {
            window.updateSetlistsUI(setlists);
        }
        
        return setlists;
        
    } catch (error) {
        console.error('❌ [Controller] Ошибка обновления сетлистов:', error);
        showNotification('❌ Ошибка загрузки сетлистов', 'error');
        throw error;
    }
}

/**
 * Выбирает сетлист для редактирования
 * @param {Object} setlist - Объект сетлиста
 */
export function handleSetlistSelect(setlist) {
    console.log('🎯 [Controller] handleSetlistSelect:', setlist.name);
    
    // Сохраняем выбранный сетлист в состояние
    state.currentSetlistId = setlist.id;
    state.currentSetlistName = setlist.name;
    state.currentSetlistSongs = setlist.songs || [];
    
    // Обновляем Event Bus
    eventBus.setState('currentSetlistId', setlist.id);
    eventBus.setState('currentSetlistName', setlist.name);
    eventBus.setState('currentSetlistSongs', setlist.songs || []);
    
    // Обновляем UI
    if (typeof window.updateCurrentSetlistUI === 'function') {
        window.updateCurrentSetlistUI(setlist);
    }
}

/**
 * Удаляет сетлист с подтверждением
 * @param {string} setlistId - ID сетлиста
 * @param {string} setlistName - Название сетлиста
 */
export async function handleSetlistDelete(setlistId, setlistName) {
    console.log('🗑️ [Controller] handleSetlistDelete:', setlistName);
    
    const confirmed = await showConfirmDialog(
        `Вы уверены, что хотите удалить сет-лист "${setlistName}"?`,
        {
            title: 'Подтверждение удаления',
            confirmText: 'Удалить',
            cancelText: 'Отмена'
        }
    );
    
    if (!confirmed) {
        return false;
    }
    
    try {
        await api.deleteSetlist(setlistId);
        
        // Если удаляем текущий сетлист, очищаем состояние
        if (state.currentSetlistId === setlistId) {
            state.currentSetlistId = null;
            state.currentSetlistName = '';
            state.currentSetlistSongs = [];
            
            eventBus.setState('currentSetlistId', null);
            eventBus.setState('currentSetlistName', '');
            eventBus.setState('currentSetlistSongs', []);
        }
        
        // Обновляем список сетлистов
        await refreshSetlists();
        
        showNotification(`🗑️ Сет-лист "${setlistName}" удален`, 'info');
        
        return true;
        
    } catch (error) {
        console.error('❌ [Controller] Ошибка удаления сетлиста:', error);
        showNotification('❌ Ошибка при удалении сет-листа', 'error');
        throw error;
    }
}

// ====================================
// SONG MANAGEMENT
// ====================================

/**
 * Удаляет песню из сетлиста
 * @param {string} songId - ID песни
 * @param {string} songName - Название песни
 */
export async function handleRemoveSongFromSetlist(songId, songName) {
    console.log('➖ [Controller] handleRemoveSongFromSetlist:', songName);
    
    if (!state.currentSetlistId) {
        showNotification('❌ Сетлист не выбран', 'error');
        return false;
    }
    
    const confirmed = await showConfirmDialog(
        `Удалить "${songName}" из сет-листа?`,
        {
            title: 'Подтверждение удаления',
            confirmText: 'Удалить',
            cancelText: 'Отмена'
        }
    );
    
    if (!confirmed) {
        return false;
    }
    
    try {
        await api.removeSongFromSetlist(state.currentSetlistId, songId);
        
        // Обновляем локальное состояние
        state.currentSetlistSongs = state.currentSetlistSongs.filter(song => song.id !== songId);
        eventBus.setState('currentSetlistSongs', state.currentSetlistSongs);
        
        // Обновляем UI
        if (typeof window.updateCurrentSetlistUI === 'function') {
            window.updateCurrentSetlistUI({
                id: state.currentSetlistId,
                name: state.currentSetlistName,
                songs: state.currentSetlistSongs
            });
        }
        
        showNotification(`➖ "${songName}" удалена из сет-листа`, 'info');
        
        return true;
        
    } catch (error) {
        console.error('❌ [Controller] Ошибка удаления песни:', error);
        showNotification('❌ Ошибка при удалении песни', 'error');
        throw error;
    }
}

/**
 * Сохраняет заметку к песне
 * @param {string} songId - ID песни
 * @param {string} note - Текст заметки
 */
export async function handleSaveNote(songId, note) {
    console.log('📝 [Controller] handleSaveNote:', songId);
    
    try {
        await api.saveSongNote(songId, note);
        
        showNotification('✅ Заметка сохранена', 'success');
        
        // Закрываем модальное окно заметок
        if (ui.notesModal) {
            ui.notesModal.classList.remove('show');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [Controller] Ошибка сохранения заметки:', error);
        showNotification('❌ Ошибка сохранения заметки', 'error');
        throw error;
    }
}

// ====================================
// REPERTOIRE MANAGEMENT
// ====================================

/**
 * Обрабатывает выбор избранного или репертуара
 * @param {Object} song - Объект песни
 */
export function handleFavoriteOrRepertoireSelect(song) {
    console.log('⭐ [Controller] handleFavoriteOrRepertoireSelect:', song.name);
    
    // Логика обработки будет зависеть от UI
    // Пока просто эмитим событие
    eventBus.emit('favoriteOrRepertoireSelect', { song });
}

/**
 * Добавляет песню в репертуар
 * @param {Object} song - Объект песни
 */
export async function handleAddToRepertoire(song) {
    console.log('📚 [Controller] handleAddToRepertoire:', song.name);
    
    try {
        await api.addToRepertoire(song.id);
        
        showNotification(`📚 "${song.name}" добавлена в репертуар`, 'success');
        
        // Обновляем состояние репертуара
        if (typeof window.updateRepertoireUI === 'function') {
            window.updateRepertoireUI();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [Controller] Ошибка добавления в репертуар:', error);
        showNotification('❌ Ошибка добавления в репертуар', 'error');
        throw error;
    }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Завершает процесс добавления песен
 */
export function finishAddingSongs() {
    console.log('🏁 [Controller] finishAddingSongs');
    
    const addedCount = window.addedSongsToCurrentSetlist?.size || 0;
    const setlistName = eventBus.getState('currentCreatedSetlistName') || 
                       eventBus.getState('currentSetlistName') || 
                       state.currentSetlistName;
    
    // Закрываем overlay
    if (ui.addSongsOverlay) {
        ui.addSongsOverlay.classList.remove('show');
    }
    
    // Показываем уведомление о завершении
    if (addedCount > 0) {
        if (eventBus.getState('activeOverlayMode') === 'create') {
            showNotification(`🎉 Сет-лист "${setlistName}" создан с ${addedCount} песнями!`, 'success');
        } else {
            showNotification(`🎉 Добавлено ${addedCount} песен в "${setlistName}"!`, 'success');
        }
    } else {
        if (eventBus.getState('activeOverlayMode') === 'create') {
            showNotification(`✅ Сет-лист "${setlistName}" готов к использованию!`, 'success');
        } else {
            showNotification(`✅ Редактирование "${setlistName}" завершено!`, 'success');
        }
    }
    
    // Очищаем состояние
    eventBus.setState('activeOverlayMode', null);
    eventBus.setState('activeSetlistId', null);
    eventBus.setState('activeSetlistName', null);
    
    // Очищаем глобальные переменные
    if (window.addedSongsToCurrentSetlist) {
        window.addedSongsToCurrentSetlist.clear();
    }
}

// ====================================
// MODULE METADATA
// ====================================

export const metadata = {
    name: 'MainController',
    version: '1.0.0',
    description: 'Главный контроллер приложения для управления основной логикой',
    functions: [
        'handleCreateSetlist',
        'refreshSetlists',
        'handleSetlistSelect',
        'handleSetlistDelete',
        'handleRemoveSongFromSetlist',
        'handleSaveNote',
        'handleFavoriteOrRepertoireSelect',
        'handleAddToRepertoire',
        'finishAddingSongs'
    ]
};