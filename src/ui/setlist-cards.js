/**
 * Модуль для управления карточками сет-листов
 */

import { logger } from '../utils/logger.js';
import * as ui from '../../ui.js';
import * as state from '../../js/state.js';

// Текущий активный сет-лист
let currentActiveSetlist = null;

// Карта открытых карточек
const expandedCards = new Set();

/**
 * Функция для правильного склонения слова "песня"
 */
function getSongCountText(count) {
    if (count % 10 === 1 && count % 100 !== 11) {
        return 'песня';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return 'песни';
    } else {
        return 'песен';
    }
}

/**
 * Создает карточку сет-листа
 */
function createSetlistCard(setlist, isActive, onSelect, onDelete) {
    const card = document.createElement('div');
    card.className = 'setlist-card';
    card.dataset.setlistId = setlist.id;
    
    if (isActive) {
        card.classList.add('active');
        currentActiveSetlist = setlist.id;
    }
    
    if (expandedCards.has(setlist.id)) {
        card.classList.add('expanded');
    }
    
    // Заголовок карточки
    const headerInfo = document.createElement('div');
    headerInfo.className = 'card-header-info';
    headerInfo.onclick = (e) => {
        e.stopPropagation();
        toggleCard(setlist.id);
    };
    
    // Название сет-листа
    const title = document.createElement('h4');
    title.className = 'card-title';
    title.textContent = setlist.name;
    headerInfo.appendChild(title);
    
    // Создатель (если есть)
    if (setlist.creator) {
        const creator = document.createElement('div');
        creator.className = 'card-creator';
        creator.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${setlist.creator}</span>
        `;
        headerInfo.appendChild(creator);
    }
    
    // Метаданные
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const songsCount = setlist.songs ? setlist.songs.length : 0;
    const songText = getSongCountText(songsCount);
    
    meta.innerHTML = `
        <span>${songsCount} ${songText}</span>
        <span>${formatDate(setlist.updatedAt || setlist.createdAt)}</span>
    `;
    headerInfo.appendChild(meta);
    
    // Активный значок
    if (isActive) {
        const badge = document.createElement('span');
        badge.className = 'active-badge';
        badge.textContent = 'АКТИВНЫЙ';
        card.appendChild(badge);
    }
    
    card.appendChild(headerInfo);
    
    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Удалить сет-лист';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Удалить сет-лист "${setlist.name}"?`)) {
            onDelete(setlist.id, setlist.name);
        }
    };
    card.appendChild(deleteBtn);
    
    // Список песен (скрытый по умолчанию)
    const songsList = document.createElement('div');
    songsList.className = 'card-songs';
    
    if (setlist.songs && setlist.songs.length > 0) {
        const fullSongs = setlist.songs
            .map(s => {
                const songDetails = state.allSongs.find(song => song.id === s.songId) || {};
                return { ...songDetails, ...s };
            })
            .filter(s => s.id)
            .sort((a, b) => a.order - b.order);
        
        fullSongs.forEach(song => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.onclick = (e) => {
                e.stopPropagation();
                // Открываем песню на главной странице и закрываем панель
                if (window.handleFavoriteOrRepertoireSelect) {
                    window.handleFavoriteOrRepertoireSelect(song);
                    // Закрываем панель сет-листов
                    const panel = document.getElementById('setlists-panel');
                    if (panel) panel.classList.remove('open');
                }
            };
            
            songItem.innerHTML = `
                <span class="song-name-text">${song.name}</span>
                <div class="song-info">
                    ${song.key ? `<span class="song-key">${song.key}</span>` : ''}
                    ${song.bpm ? `<span class="song-bpm">${song.bpm}</span>` : ''}
                </div>
            `;
            
            songsList.appendChild(songItem);
        });
    } else {
        songsList.innerHTML = '<div style="text-align: center; color: #9ca3af; font-size: 0.75rem; padding: 8px;">Нет песен</div>';
    }
    
    card.appendChild(songsList);
    
    // Кнопки действий (скрытые по умолчанию)
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    // Кнопка "Изменить"
    const editBtn = document.createElement('button');
    editBtn.className = 'card-action-btn primary';
    editBtn.innerHTML = `
        <i class="fas fa-edit"></i>
        <span>Изменить</span>
    `;
    editBtn.onclick = async (e) => {
        e.stopPropagation();
        // Активируем сет-лист
        await activateSetlist(setlist);
        // Открываем добавление песен
        const addSongBtn = document.getElementById('add-song-btn');
        if (addSongBtn) addSongBtn.click();
    };
    actions.appendChild(editBtn);
    
    // Кнопка "Презентация"
    const presentBtn = document.createElement('button');
    presentBtn.className = 'card-action-btn secondary';
    presentBtn.innerHTML = `
        <i class="fas fa-play"></i>
        <span>Презент.</span>
    `;
    presentBtn.onclick = async (e) => {
        e.stopPropagation();
        // Активируем сет-лист и запускаем презентацию
        await activateSetlist(setlist);
        const startBtn = document.getElementById('start-presentation-button');
        if (startBtn) startBtn.click();
    };
    actions.appendChild(presentBtn);
    
    // Кнопка "Календарь" (если есть права)
    if (canManageEvents()) {
        const calendarBtn = document.createElement('button');
        calendarBtn.className = 'card-action-btn secondary';
        calendarBtn.innerHTML = `
            <i class="fas fa-calendar"></i>
            <span>Календарь</span>
        `;
        calendarBtn.onclick = async (e) => {
            e.stopPropagation();
            await activateSetlist(setlist);
            const calBtn = document.getElementById('add-to-calendar-btn');
            if (calBtn) calBtn.click();
        };
        actions.appendChild(calendarBtn);
    }
    
    // Кнопка "Архив"
    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'card-action-btn secondary';
    archiveBtn.innerHTML = `
        <i class="fas fa-archive"></i>
        <span>Архив</span>
    `;
    archiveBtn.onclick = async (e) => {
        e.stopPropagation();
        await activateSetlist(setlist);
        const archBtn = document.getElementById('save-to-archive-btn');
        if (archBtn) archBtn.click();
    };
    actions.appendChild(archiveBtn);
    
    card.appendChild(actions);
    
    return card;
}

/**
 * Переключает состояние карточки (свернута/развернута)
 */
function toggleCard(setlistId) {
    const card = document.querySelector(`.setlist-card[data-setlist-id="${setlistId}"]`);
    if (!card) return;
    
    card.classList.toggle('expanded');
    
    if (card.classList.contains('expanded')) {
        expandedCards.add(setlistId);
        // Закрываем другие карточки
        document.querySelectorAll('.setlist-card').forEach(c => {
            if (c.dataset.setlistId !== setlistId) {
                c.classList.remove('expanded');
                expandedCards.delete(c.dataset.setlistId);
            }
        });
    } else {
        expandedCards.delete(setlistId);
    }
}

/**
 * Активирует сет-лист
 */
async function activateSetlist(setlist) {
    logger.log('📋 Activating setlist:', setlist.name);
    
    // Обновляем состояние
    state.setCurrentSetlistId(setlist.id);
    state.setCurrentSetlistName(setlist.name);
    
    // Обновляем визуально все карточки
    document.querySelectorAll('.setlist-card').forEach(card => {
        const isActive = card.dataset.setlistId === setlist.id;
        card.classList.toggle('active', isActive);
        
        // Обновляем значок
        const badge = card.querySelector('.active-badge');
        if (isActive && !badge) {
            const newBadge = document.createElement('span');
            newBadge.className = 'active-badge';
            newBadge.textContent = 'АКТИВНЫЙ';
            card.insertBefore(newBadge, card.firstChild);
        } else if (!isActive && badge) {
            badge.remove();
        }
    });
    
    currentActiveSetlist = setlist.id;
    
    // Вызываем оригинальную функцию отображения для совместимости
    if (ui.displaySelectedSetlist) {
        ui.displaySelectedSetlist(setlist, window.handleFavoriteOrRepertoireSelect, window.handleRemoveSongFromSetlist);
    }
}

/**
 * Проверяет права на управление событиями
 */
function canManageEvents() {
    const role = localStorage.getItem('userRole');
    return role === 'admin' || role === 'moderator';
}

/**
 * Форматирует дату
 */
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Отображает карточки сет-листов
 */
export function renderSetlistCards(setlists, onSelect, onDelete) {
    const container = document.getElementById('setlists-cards-container');
    if (!container) {
        logger.error('📋 Cards container not found!');
        return;
    }
    
    container.innerHTML = '';
    
    if (!setlists || setlists.length === 0) {
        container.innerHTML = '<div class="empty-message">Сет-листов пока нет. Создайте новый!</div>';
        return;
    }
    
    const currentSetlistId = state.currentSetlistId;
    
    setlists.forEach(setlist => {
        const isActive = setlist.id === currentSetlistId;
        const card = createSetlistCard(setlist, isActive, onSelect, onDelete);
        container.appendChild(card);
    });
    
    logger.log('📋 Rendered', setlists.length, 'setlist cards');
}

/**
 * Инициализация обработчиков для карточек
 */
export function initCardHandlers() {
    // Обработчик кнопки филиала
    const branchBtn = document.getElementById('setlist-branch-btn');
    const branchPopup = document.getElementById('branch-selector-popup');
    const branchSelector = document.getElementById('setlist-branch-selector');
    
    if (branchBtn && branchPopup) {
        branchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            branchPopup.style.display = branchPopup.style.display === 'none' ? 'block' : 'none';
        });
        logger.log('📋 Branch button handler attached');
    }
    
    // Обработчик изменения филиала
    if (branchSelector) {
        // Обработчик уже установлен в branchSelector.js, просто логируем
        logger.log('📋 Branch selector found:', branchSelector);
    }
    
    // Закрытие попапа по клику вне
    document.addEventListener('click', (e) => {
        if (branchPopup && 
            !branchBtn?.contains(e.target) && 
            !branchPopup.contains(e.target)) {
            branchPopup.style.display = 'none';
        }
    });
    
    logger.log('📋 Card handlers initialized');
}