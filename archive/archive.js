/**
 * Основной модуль страницы архива сет-листов
 */

import logger from '../src/utils/logger.js';
import { db } from '../firebase-init.js';
import { getCurrentUser, initAuthGate } from '../src/modules/auth/authCheck.js';
import { 
    loadArchiveSetlists, 
    createArchiveSetlist,
    updateArchiveSetlist,
    deleteArchiveSetlist,
    addSongToArchiveSetlist
} from '../src/modules/archive/archiveApi.js';
import archiveGroupsManager from '../src/modules/archive/archiveGroupsManager.js';

// Глобальные переменные
let currentUser = null;
let archiveSetlists = [];
let filteredSetlists = [];
let archiveGroups = [];
let selectedGroupId = null; // null означает показать все
let currentSort = 'name';

// DOM элементы
const elements = {
    searchInput: null,
    groupsList: null,
    setlistsContainer: null,
    emptyState: null,
    loadingIndicator: null,
    createBtn: null,
    addGroupBtn: null,
    sortButtons: null
};

// Глобальные переменные для синхронизации создания сет-листа
window.currentCreatedSetlistId = null;
window.currentCreatedSetlistName = null;
window.addedSongsToCurrentSetlist = new Map();

// Адаптер для работы с архивными сет-листами
window.archiveAdapter = {
    async addSongToSetlist(setlistId, songData) {
        return await addSongToArchiveSetlist(setlistId, songData);
    }
};

/**
 * Инициализация страницы
 */
async function initializePage() {
    logger.log('🗂️ Initializing archive page');
    
    try {
        // Проверка авторизации
        const authPassed = await initAuthGate({
            requireAuth: true,
            requireBranch: false,
            requireAdmin: false
        });
        
        if (!authPassed) {
            logger.log('❌ Auth check failed');
            return;
        }
        
        currentUser = getCurrentUser();
        logger.log('✅ User authenticated:', currentUser?.email);
        
        if (!currentUser) {
            logger.error('❌ getCurrentUser returned null after auth passed');
            return;
        }
        
        // Инициализация DOM элементов
        initializeElements();
        
        // Загрузка данных
        await loadArchiveData();
        
        // Инициализация менеджера групп
        await archiveGroupsManager.init((groups) => {
            archiveGroups = groups;
            renderGroups();
            applyFiltersAndSort();
        });
        
        // Настройка обработчиков событий
        setupEventHandlers();
        
    } catch (error) {
        logger.error('❌ Error initializing archive page:', error);
    }
}

/**
 * Инициализация DOM элементов
 */
function initializeElements() {
    elements.searchInput = document.getElementById('archive-search');
    elements.groupsList = document.getElementById('groups-list');
    elements.setlistsContainer = document.getElementById('archive-setlists');
    elements.emptyState = document.getElementById('empty-state');
    elements.loadingIndicator = document.getElementById('loading-indicator');
    elements.createBtn = document.getElementById('create-archive-setlist');
    elements.addGroupBtn = document.getElementById('add-group-btn');
    elements.sortButtons = document.querySelectorAll('.sort-btn');
    elements.filterToggle = document.getElementById('filter-toggle');
    elements.filtersWrapper = document.getElementById('filters-wrapper');
}

/**
 * Загрузка данных архива
 */
async function loadArchiveData() {
    showLoading(true);
    
    try {
        // Загружаем архивные сет-листы
        logger.log(`🔍 Loading archive setlists for branch: ${currentUser.branchId}`);
        archiveSetlists = await loadArchiveSetlists(currentUser.branchId);
        
        logger.log(`📚 Loaded ${archiveSetlists.length} archive setlists`);
        
        if (archiveSetlists.length === 0) {
            logger.log('ℹ️ No archive setlists found. Collection might be empty.');
        }
        
    } catch (error) {
        logger.error('Error loading archive data:', error);
        showError('Ошибка загрузки архива');
    } finally {
        showLoading(false);
    }
}

// Делаем функцию доступной глобально для оверлея
window.loadArchiveData = loadArchiveData;

/**
 * Обновление конкретной карточки сет-листа
 */
async function updateSetlistCard(setlistId) {
    try {
        logger.log('🔄 Starting updateSetlistCard for:', setlistId);
        
        // Загружаем обновленный сет-лист из базы
        logger.log('📥 Loading updated setlists from Firebase...');
        const updatedSetlists = await loadArchiveSetlists(currentUser.branchId);
        logger.log('📋 Loaded setlists count:', updatedSetlists.length);
        
        const setlist = updatedSetlists.find(s => s.id === setlistId);
        
        if (!setlist) {
            logger.error('❌ Setlist not found in Firebase:', setlistId);
            return;
        }
        
        logger.log('📋 Found updated setlist:', {
            id: setlist.id,
            name: setlist.name,
            songsCount: setlist.songs?.length || 0,
            songs: setlist.songs
        });
        
        // Обновляем данные в глобальном массиве
        const index = archiveSetlists.findIndex(s => s.id === setlistId);
        if (index !== -1) {
            const oldSongsCount = archiveSetlists[index].songs?.length || 0;
            archiveSetlists[index] = setlist;
            logger.log('✅ Global array updated at index:', index);
            logger.log(`📊 Songs count: ${oldSongsCount} → ${setlist.songs?.length || 0}`);
        } else {
            logger.error('❌ Setlist not found in global array');
            return;
        }
        
        // Находим карточку на странице
        logger.log('🔍 Looking for card element...');
        const cardElement = document.querySelector(`.archive-setlist-card[data-setlist-id="${setlistId}"]`);
        if (!cardElement) {
            logger.error('❌ Card element not found with selector:', `.archive-setlist-card[data-setlist-id="${setlistId}"]`);
            // Попробуем найти все карточки для отладки
            const allCards = document.querySelectorAll('.archive-setlist-card');
            logger.log('📋 Found cards on page:', allCards.length);
            allCards.forEach(card => {
                logger.log('Card ID:', card.dataset.setlistId);
            });
            return;
        }
        logger.log('✅ Card element found');
        
        // Проверяем, была ли карточка развернута
        const wasExpanded = cardElement.classList.contains('expanded');
        const songsContainer = cardElement.querySelector(`#songs-${setlistId}`);
        
        // Если карточка развернута, просто обновляем список песен
        logger.log('📊 Card state - expanded:', wasExpanded, 'songsContainer exists:', !!songsContainer);
        
        if (wasExpanded && songsContainer) {
            logger.log('🎵 Card is expanded, updating songs list...');
            logger.log('Old loaded state:', songsContainer.dataset.loaded);
            
            // Сбрасываем флаг загрузки, чтобы песни перезагрузились
            delete songsContainer.dataset.loaded;
            
            // Загружаем песни заново
            logger.log('🔄 Reloading songs...');
            await loadSetlistSongs(setlistId, songsContainer);
            songsContainer.dataset.loaded = 'true';
            logger.log('✅ Songs reloaded');
        } else {
            logger.log('ℹ️ Card is not expanded or no songs container, skipping songs update');
        }
        
        // Обновляем метаданные карточки
        logger.log('🔄 Updating card metadata...');
        
        // Обновляем название сет-листа
        const nameElement = cardElement.querySelector('.setlist-name');
        if (nameElement && setlist.name) {
            const oldName = nameElement.textContent;
            nameElement.textContent = setlist.name;
            logger.log(`📝 Updated setlist name: "${oldName}" → "${setlist.name}"`);
        }
        
        // Обновляем количество песен
        const songCountElement = cardElement.querySelector('.setlist-meta .meta-item:first-child');
        if (songCountElement) {
            const songCount = setlist.songs?.length || 0;
            const oldText = songCountElement.textContent;
            songCountElement.innerHTML = `<i class="fas fa-music"></i> ${songCount} песен`;
            logger.log(`📊 Updated song count: "${oldText}" → "${songCount} песен"`);
        } else {
            logger.error('❌ Song count element not found');
        }
        
        logger.log('✅ Setlist card update completed');
    } catch (error) {
        logger.error('Error updating setlist card:', error);
    }
}

// Делаем функцию доступной глобально
window.updateSetlistCard = updateSetlistCard;

/**
 * Отрисовка групп
 */
function renderGroups() {
    elements.groupsList.innerHTML = '';
    
    // Сортируем группы по алфавиту (убираем эмодзи для сортировки)
    const sortedGroups = [...archiveGroups].sort((a, b) => {
        const nameA = a.name.replace(/[^\u0400-\u04FF\w\s]/g, '').trim();
        const nameB = b.name.replace(/[^\u0400-\u04FF\w\s]/g, '').trim();
        return nameA.localeCompare(nameB, 'ru');
    });
    
    // Добавляем группы
    sortedGroups.forEach(group => {
        const chip = document.createElement('button');
        chip.className = 'group-chip';
        chip.dataset.groupId = group.id;
        
        // Создаем элементы отдельно для лучшего контроля
        const iconSpan = document.createElement('span');
        iconSpan.textContent = group.icon || '📁';
        iconSpan.style.marginRight = '4px';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = group.name;
        
        const countSpan = document.createElement('span');
        countSpan.className = 'group-count';
        countSpan.textContent = group.setlistCount || 0;
        
        chip.appendChild(iconSpan);
        chip.appendChild(nameSpan);
        chip.appendChild(countSpan);
        
        // Добавляем стиль с цветом группы
        chip.style.borderColor = group.color || '#22d3ee';
        
        elements.groupsList.appendChild(chip);
    });
}

/**
 * Применение фильтров и сортировки
 */
function applyFiltersAndSort() {
    // Фильтрация
    filteredSetlists = [...archiveSetlists];
    
    // Фильтр по группе
    if (selectedGroupId) {
        filteredSetlists = filteredSetlists.filter(setlist => 
            setlist.groupIds && setlist.groupIds.includes(selectedGroupId)
        );
    }
    
    // Поиск
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredSetlists = filteredSetlists.filter(setlist =>
            setlist.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Сортировка
    switch (currentSort) {
        case 'name':
            filteredSetlists.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            break;
        case 'date':
            filteredSetlists.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA; // Новые первыми
            });
            break;
        case 'date-old':
            filteredSetlists.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeA - timeB; // Старые первыми
            });
            break;
        case 'popular':
            filteredSetlists.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
            break;
    }
    
    renderSetlists();
}

/**
 * Отрисовка сет-листов
 */
function renderSetlists() {
    elements.setlistsContainer.innerHTML = '';
    
    if (filteredSetlists.length === 0) {
        elements.emptyState.style.display = 'flex';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    filteredSetlists.forEach(setlist => {
        const card = createSetlistCard(setlist);
        elements.setlistsContainer.appendChild(card);
    });
}

/**
 * Рендеринг групп сет-листа
 */
function renderSetlistGroups(setlist) {
    if (!setlist.groupIds || setlist.groupIds.length === 0) {
        return '';
    }
    
    const groupTags = setlist.groupIds.map(groupId => {
        const group = archiveGroups.find(g => g.id === groupId);
        if (!group) return '';
        
        return `
            <span class="setlist-group-tag" style="border-color: ${group.color}; background: ${group.color}20;">
                <span>${group.icon || '📁'}</span>
                <span>${group.name}</span>
            </span>
        `;
    }).filter(tag => tag).join('');
    
    if (!groupTags) return '';
    
    return `
        <div class="setlist-groups">
            ${groupTags}
        </div>
    `;
}

/**
 * Создание карточки сет-листа
 */
function createSetlistCard(setlist) {
    const card = document.createElement('div');
    card.className = 'archive-setlist-card';
    card.dataset.setlistId = setlist.id;
    
    const songCount = setlist.songs?.length || 0;
    const creatorName = setlist.createdByName || setlist.creatorName || 'Неизвестно';
    const usageCount = setlist.usageCount || 0;
    
    // Форматирование даты
    let dateStr = 'Неизвестно';
    if (setlist.createdAt) {
        const date = setlist.createdAt.toDate ? setlist.createdAt.toDate() : new Date(setlist.createdAt);
        dateStr = date.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }
    
    card.innerHTML = `
        <div class="setlist-card-header">
            <div class="setlist-info">
                <h3 class="setlist-name">${setlist.name}</h3>
                <div class="setlist-creator">
                    <i class="fas fa-user"></i>
                    ${creatorName}
                </div>
            </div>
        </div>
        
        <div class="setlist-meta">
            <div class="meta-item">
                <i class="fas fa-music"></i>
                ${songCount} песен
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                ${dateStr}
            </div>
            <div class="meta-item">
                <i class="fas fa-chart-line"></i>
                Использований: ${usageCount}
            </div>
        </div>
        
        ${renderSetlistGroups(setlist)}
        
        <button class="edit-btn-corner" title="Редактировать">
            <i class="fas fa-edit"></i>
        </button>
        
        <button class="delete-btn-corner" title="Удалить" onclick="deleteSetlist('${setlist.id}')">
            <i class="fas fa-trash"></i>
        </button>
        
        <div class="setlist-actions">
            <div class="setlist-actions-row">
                <button class="action-btn" data-action="calendar">
                    <i class="fas fa-calendar-plus"></i>
                    В календарь
                </button>
                <button class="action-btn" data-action="group">
                    <i class="fas fa-folder-plus"></i>
                    В группу
                </button>
            </div>
        </div>
        
        <div class="setlist-songs">
            <div class="songs-list" id="songs-${setlist.id}">
                <!-- Песни будут загружены при развертывании -->
            </div>
        </div>
    `;
    
    // Обработчик клика на карточку
    card.addEventListener('click', async (e) => {
        // Проверяем, что клик не по кнопке
        if (!e.target.closest('button')) {
            const isExpanding = !card.classList.contains('expanded');
            card.classList.toggle('expanded');
            
            // Загружаем песни при первом развертывании
            if (isExpanding) {
                const songsContainer = card.querySelector(`#songs-${setlist.id}`);
                if (songsContainer && !songsContainer.dataset.loaded) {
                    await loadSetlistSongs(setlist.id, songsContainer);
                    songsContainer.dataset.loaded = 'true';
                }
            }
        }
    });
    
    // Обработчики для кнопок
    const editBtn = card.querySelector('.edit-btn-corner');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editSetlist(setlist.id);
    });
    
    const actionBtns = card.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            switch(action) {
                case 'calendar':
                    addToCalendar(setlist.id);
                    break;
                case 'group':
                    addToGroup(setlist.id);
                    break;
            }
        });
    });
    
    return card;
}

/**
 * Настройка обработчиков событий
 */
function setupEventHandlers() {
    // Поиск
    elements.searchInput.addEventListener('input', debounce(() => {
        applyFiltersAndSort();
    }, 300));
    
    // Группы
    elements.groupsList.addEventListener('click', (e) => {
        const chip = e.target.closest('.group-chip');
        if (chip) {
            const groupId = chip.dataset.groupId;
            
            if (selectedGroupId === groupId) {
                // Повторный клик - снимаем выделение
                chip.classList.remove('active');
                selectedGroupId = null;
            } else {
                // Убираем active со всех
                elements.groupsList.querySelectorAll('.group-chip').forEach(c => 
                    c.classList.remove('active')
                );
                // Добавляем active на выбранную
                chip.classList.add('active');
                selectedGroupId = groupId;
            }
            applyFiltersAndSort();
        }
    });
    
    // Настройка стрелок скролла для групп
    setupGroupsScrollArrows();
    
    // Кнопка фильтров
    elements.filterToggle.addEventListener('click', () => {
        elements.filterToggle.classList.toggle('active');
        elements.filtersWrapper.classList.toggle('expanded');
        
        // Если фильтры скрыты при первом открытии, показываем их
        if (elements.filtersWrapper.classList.contains('expanded') && 
            !elements.filtersWrapper.hasAttribute('data-initialized')) {
            elements.filtersWrapper.setAttribute('data-initialized', 'true');
        }
    });
    
    // Сортировка
    elements.sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.sortButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            applyFiltersAndSort();
        });
    });
    
    // Создание сет-листа
    elements.createBtn.addEventListener('click', () => {
        openCreateSetlistModal();
    });
    

    
    // Список групп
    const listGroupsBtn = document.getElementById('list-groups-btn');
    
    if (listGroupsBtn) {
        listGroupsBtn.addEventListener('click', () => {
            // TODO: Открыть вертикальный список групп
            alert('Список групп - в разработке');
        });
    }
}

/**
 * Загрузка песен сет-листа
 */
async function loadSetlistSongs(setlistId, container) {
    try {
        // Показываем загрузку
        container.innerHTML = '<div class="loading-songs">Загрузка песен...</div>';
        
        // Находим сет-лист
        const setlist = archiveSetlists.find(s => s.id === setlistId);
        logger.log('🎵 Loading songs for setlist:', setlistId);
        logger.log('📋 Current setlist data from array:', setlist);
        
        if (!setlist || !setlist.songs || setlist.songs.length === 0) {
            container.innerHTML = '<div class="no-songs">Нет песен в сет-листе</div>';
            logger.log('ℹ️ No songs found in setlist');
            return;
        }
        
        logger.log('🎵 Found songs:', setlist.songs.length, 'songs');
        
        // Сортируем песни по полю order
        const sortedSongs = [...setlist.songs].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Получаем ID песен из поля songId
        const songIds = sortedSongs
            .map(s => s.songId)
            .filter(id => id); // Фильтруем null/undefined
            
        logger.log('Song IDs to load:', songIds);
            
        if (songIds.length === 0) {
            container.innerHTML = '<div class="no-songs">Нет корректных песен в сет-листе</div>';
            return;
        }
        
        const songsSnapshot = await db.collection('songs')
            .where(window.firebase.firestore.FieldPath.documentId(), 'in', songIds)
            .get();
        
        const songsMap = new Map();
        songsSnapshot.forEach(doc => {
            const songData = doc.data();
            logger.log('Song data:', doc.id, songData);
            songsMap.set(doc.id, { id: doc.id, ...songData });
        });
        
        logger.log('Songs map:', songsMap);
        
        // Создаем HTML для песен
        const songsHtml = sortedSongs.map((songRef, index) => {
            const songId = songRef.songId;
            const song = songsMap.get(songId);
            
            logger.log('Processing song:', songId, song, songRef);
            
            // Получаем название песни
            const songName = song ? (song.name || song.title || songId || 'Неизвестная песня') : songId || 'Неизвестная песня';
            
            // Тональность берем из songRef.preferredKey, BPM из данных песни
            const key = songRef.preferredKey || '-';
            const bpm = song?.BPM || song?.bpm || '-';
            
            return `
                <div class="song-item">
                    <span class="song-number">${index + 1}.</span>
                    <span class="song-name">${songName}</span>
                    <div class="song-details">
                        ${key !== '-' ? `<div class="song-key">${key}</div>` : ''}
                        ${bpm !== '-' && bpm !== 'NA' ? `<div class="song-bpm">${bpm} BPM</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = songsHtml;
        
    } catch (error) {
        logger.error('Ошибка загрузки песен:', error);
        container.innerHTML = '<div class="error-loading">Ошибка загрузки песен</div>';
    }
}

/**
 * Просмотр сет-листа
 */
window.viewSetlist = function(setlistId) {
    // TODO: Реализовать просмотр
    logger.log('View setlist:', setlistId);
    alert('Просмотр сет-листа - в разработке');
};

/**
 * Добавление в календарь
 */
window.addToCalendar = function(setlistId) {
    // TODO: Использовать существующий datePickerModal
    logger.log('Add to calendar:', setlistId);
    alert('Добавление в календарь - в разработке');
};

/**
 * Добавление в группу
 */
let currentEditingSetlistId = null;

window.addToGroup = function(setlistId) {
    const setlist = archiveSetlists.find(s => s.id === setlistId);
    if (!setlist) return;
    
    currentEditingSetlistId = setlistId;
    
    // Обновляем название сет-листа в модальном окне
    const nameSpan = document.getElementById('setlist-groups-name');
    if (nameSpan) {
        nameSpan.textContent = setlist.name;
    }
    
    // Показываем модальное окно
    openSetlistGroupsModal(setlist);
};

/**
 * Редактирование сет-листа
 */
window.editSetlist = async function(setlistId) {
    const setlist = archiveSetlists.find(s => s.id === setlistId);
    if (!setlist) {
        showError('Сет-лист не найден');
        return;
    }
    
    try {
        // Импортируем и используем специальный оверлей для архива
        const { openArchiveSongsOverlay } = await import('../src/modules/archive/archiveSongsOverlay.js');
        
        // Открываем оверлей в режиме редактирования
        await openArchiveSongsOverlay(setlistId, setlist.name, 'edit');
        
    } catch (error) {
        logger.error('Error opening songs overlay for edit:', error);
        showError('Ошибка при открытии редактора');
    }
};

/**
 * Удаление сет-листа
 */
window.deleteSetlist = async function(setlistId) {
    const setlist = archiveSetlists.find(s => s.id === setlistId);
    if (!setlist) {
        showError('Сет-лист не найден');
        return;
    }
    
    const confirmDelete = confirm(`Вы уверены, что хотите удалить сет-лист "${setlist.name}"?`);
    if (!confirmDelete) return;
    
    try {
        showLoading(true);
        await deleteArchiveSetlist(setlistId);
        
        // Перезагружаем данные
        await loadArchiveData();
        showNotification('Сет-лист успешно удален');
    } catch (error) {
        logger.error('Error deleting setlist:', error);
        showError(error.message || 'Ошибка при удалении сет-листа');
    } finally {
        showLoading(false);
    }
};

/**
 * Показать/скрыть индикатор загрузки
 */
function showLoading(show) {
    elements.loadingIndicator.style.display = show ? 'flex' : 'none';
}

/**
 * Показать ошибку
 */
function showError(message) {
    // TODO: Использовать существующую систему уведомлений
    alert(message);
}

/**
 * Показать уведомление
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Настройка стрелок скролла для групп
 */
function setupGroupsScrollArrows() {
    const scrollContainer = document.getElementById('groups-scroll-container');
    const leftArrow = document.getElementById('scroll-left');
    const rightArrow = document.getElementById('scroll-right');
    
    if (!scrollContainer || !leftArrow || !rightArrow) return;
    
    const checkScroll = () => {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const canScrollLeft = scrollContainer.scrollLeft > 0;
        const canScrollRight = scrollContainer.scrollLeft < maxScroll - 5; // небольшой буфер
        
        leftArrow.disabled = !canScrollLeft;
        rightArrow.disabled = !canScrollRight;
        
        // Показываем стрелки только если есть что скроллить
        const hasScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
        if (!hasScroll) {
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
        } else {
            leftArrow.style.display = 'flex';
            rightArrow.style.display = 'flex';
        }
    };
    
    // Прокрутка при клике на стрелки
    leftArrow.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
    });
    
    rightArrow.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
    });
    
    // Проверка при скролле
    scrollContainer.addEventListener('scroll', () => {
        checkScroll();
        updateMobileArrows();
    });
    
    // Проверка при изменении размера окна
    window.addEventListener('resize', () => {
        checkScroll();
        updateMobileArrows();
    });
    
    // Функция для обновления стрелочек на мобильных
    function updateMobileArrows() {
        if (window.innerWidth <= 480) {
            const scrollLeft = scrollContainer.scrollLeft;
            const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            const section = scrollContainer.closest('.archive-groups-section');
            
            // Левая стрелочка - показываем если можно скролить влево
            if (scrollLeft > 5) {
                section.classList.add('scrolled-left');
            } else {
                section.classList.remove('scrolled-left');
            }
            
            // Правая стрелочка - скрываем если достигли конца
            if (scrollLeft >= maxScroll - 5) {
                section.classList.add('scrolled-right');
            } else {
                section.classList.remove('scrolled-right');
            }
        }
    }
    
    // Начальная проверка
    setTimeout(() => {
        checkScroll();
        updateMobileArrows();
    }, 100);
}

/**
 * Debounce функция
 */
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

/**
 * Открытие модального окна создания сет-листа
 */
function openCreateSetlistModal() {
    const modal = document.getElementById('create-setlist-modal');
    const input = document.getElementById('new-setlist-name-input');
    const charCount = document.getElementById('name-char-count');
    
    if (modal && input) {
        modal.classList.add('show');
        input.value = '';
        input.focus();
        if (charCount) charCount.textContent = '0';
    }
}

/**
 * Закрытие модального окна создания
 */
function closeCreateSetlistModal() {
    const modal = document.getElementById('create-setlist-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Обработка создания сет-листа
 */
async function handleCreateSetlist() {
    const input = document.getElementById('new-setlist-name-input');
    const createBtn = document.getElementById('create-setlist-button');
    const name = input?.value.trim();
    
    if (!name) {
        showNotification('Название сет-листа не может быть пустым');
        return;
    }
    
    try {
        createBtn.disabled = true;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Создание...</span>';
        
        // Создаем архивный сет-лист
        const setlistId = await createArchiveSetlist({
            name: name,
            songs: [],
            groupIds: [],
            notes: '',
            tags: []
        });
        
        // Сохраняем для синхронизации
        window.currentCreatedSetlistId = setlistId;
        window.currentCreatedSetlistName = name;
        
        // Закрываем модальное окно
        closeCreateSetlistModal();
        
        // Перезагружаем список
        await loadArchiveData();
        
        // Сразу открываем оверлей добавления песен
        await startAddingSongsToArchive();
        
    } catch (error) {
        logger.error('Error creating archive setlist:', error);
        showError(error.message || 'Ошибка при создании сет-листа');
    } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = '<span>Далее</span>';
    }
}

/**
 * Обработчики для модальных окон
 */
function setupModalHandlers() {
    // Кнопка создания
    const createBtn = document.getElementById('create-setlist-button');
    if (createBtn) {
        createBtn.addEventListener('click', handleCreateSetlist);
    }
    
    // Enter в поле ввода
    const nameInput = document.getElementById('new-setlist-name-input');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCreateSetlist();
            }
        });
        
        // Счетчик символов
        nameInput.addEventListener('input', (e) => {
            const charCount = document.getElementById('name-char-count');
            if (charCount) {
                charCount.textContent = e.target.value.length;
            }
        });
    }
    
    // Кнопка отмены
    const cancelBtn = document.getElementById('cancel-create-setlist');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCreateSetlistModal);
    }
    
    // Кнопка закрытия
    const closeBtn = document.getElementById('close-create-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCreateSetlistModal);
    }
    
    // Клик вне модального окна
    const modal = document.getElementById('create-setlist-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCreateSetlistModal();
            }
        });
    }
    
    // Обработчики для модального окна подтверждения
    setupConfirmModalHandlers();
}

/**
 * Обработчики для модального окна подтверждения
 */
function setupConfirmModalHandlers() {
    // Кнопка "Добавить песни"
    const startAddBtn = document.getElementById('start-add-songs');
    if (startAddBtn) {
        startAddBtn.addEventListener('click', async () => {
            // Закрываем модальное окно подтверждения
            const confirmModal = document.getElementById('add-songs-confirm-modal');
            if (confirmModal) {
                confirmModal.classList.remove('show');
            }
            
            // Открываем оверлей добавления песен
            await startAddingSongsToArchive();
        });
    }
    
    // Кнопка "Пока нет"
    const skipBtn = document.getElementById('skip-add-songs');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            const confirmModal = document.getElementById('add-songs-confirm-modal');
            if (confirmModal) {
                confirmModal.classList.remove('show');
            }
            
            // Предлагаем добавить в группы
            if (window.currentCreatedSetlistId && archiveGroups.length > 0) {
                setTimeout(() => {
                    if (confirm('Хотите добавить сет-лист в группы?')) {
                        window.addToGroup(window.currentCreatedSetlistId);
                    }
                }, 300);
            }
        });
    }
    
    // Кнопка закрытия
    const closeConfirmBtn = document.getElementById('close-confirm-modal');
    if (closeConfirmBtn) {
        closeConfirmBtn.addEventListener('click', () => {
            const confirmModal = document.getElementById('add-songs-confirm-modal');
            if (confirmModal) {
                confirmModal.classList.remove('show');
            }
        });
    }
}

/**
 * Запуск оверлея добавления песен для архива
 */
async function startAddingSongsToArchive() {
    try {
        // Импортируем и используем специальный оверлей для архива
        const { openArchiveSongsOverlay } = await import('../src/modules/archive/archiveSongsOverlay.js');
        
        // Открываем оверлей в режиме добавления
        await openArchiveSongsOverlay(
            window.currentCreatedSetlistId, 
            window.currentCreatedSetlistName,
            'add'
        );
        
    } catch (error) {
        logger.error('Error starting songs overlay:', error);
        showError('Ошибка при открытии списка песен');
    }
}

/**
 * Открытие модального окна выбора групп для сет-листа
 */
function openSetlistGroupsModal(setlist) {
    const modal = document.getElementById('setlist-groups-modal');
    const container = document.getElementById('groups-checkbox-list');
    
    if (!container || !modal) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    if (archiveGroups.length === 0) {
        container.innerHTML = `
            <div class="groups-checkbox-empty">
                <p>Нет доступных групп</p>
                <p>Создайте группы для организации сет-листов</p>
            </div>
        `;
    } else {
        // Создаем чекбоксы для каждой группы
        archiveGroups.forEach(group => {
            const isChecked = setlist.groupIds && setlist.groupIds.includes(group.id);
            
            const item = document.createElement('label');
            item.className = 'group-checkbox-item';
            item.innerHTML = `
                <input type="checkbox" 
                    value="${group.id}" 
                    ${isChecked ? 'checked' : ''}
                    id="group-check-${group.id}"
                >
                <div class="group-checkbox-icon" style="background-color: ${group.color};">
                    ${group.icon || '📁'}
                </div>
                <div class="group-checkbox-info">
                    <div class="group-checkbox-name">${escapeHtml(group.name)}</div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    // Показываем модальное окно
    modal.classList.add('show');
    
    // Настраиваем обработчики
    setupSetlistGroupsModalHandlers();
}

/**
 * Настройка обработчиков для модального окна групп сет-листа
 */
function setupSetlistGroupsModalHandlers() {
    const modal = document.getElementById('setlist-groups-modal');
    const closeBtn = document.getElementById('setlist-groups-close');
    const cancelBtn = document.getElementById('setlist-groups-cancel');
    const saveBtn = document.getElementById('setlist-groups-save');
    
    // Обработчики закрытия
    const closeModal = () => {
        modal.classList.remove('show');
        currentEditingSetlistId = null;
    };
    
    closeBtn?.addEventListener('click', closeModal, { once: true });
    cancelBtn?.addEventListener('click', closeModal, { once: true });
    
    // Закрытие по клику на оверлей
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    }, { once: true });
    
    // Сохранение изменений
    saveBtn?.addEventListener('click', async () => {
        await saveSetlistGroups();
        closeModal();
    }, { once: true });
}

/**
 * Сохранение выбранных групп для сет-листа
 */
async function saveSetlistGroups() {
    if (!currentEditingSetlistId) return;
    
    const container = document.getElementById('groups-checkbox-list');
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    
    const selectedGroupIds = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    try {
        // Получаем текущий сет-лист
        const setlist = archiveSetlists.find(s => s.id === currentEditingSetlistId);
        if (!setlist) return;
        
        const currentGroupIds = setlist.groupIds || [];
        
        // Определяем какие группы добавить и какие удалить
        const groupsToAdd = selectedGroupIds.filter(id => !currentGroupIds.includes(id));
        const groupsToRemove = currentGroupIds.filter(id => !selectedGroupIds.includes(id));
        
        // Импортируем функции для работы с группами
        const { addSetlistToGroups, removeSetlistFromGroups } = 
            await import('../src/modules/archive/archiveGroupsApi.js');
        
        // Применяем изменения
        if (groupsToAdd.length > 0) {
            await addSetlistToGroups(currentEditingSetlistId, groupsToAdd);
        }
        
        if (groupsToRemove.length > 0) {
            await removeSetlistFromGroups(currentEditingSetlistId, groupsToRemove);
        }
        
        // Обновляем локальные данные
        setlist.groupIds = selectedGroupIds;
        
        // Перерисовываем карточку
        updateSetlistCard(currentEditingSetlistId, setlist);
        
        // Обновляем счетчики групп
        await archiveGroupsManager.loadGroups();
        
        logger.log('✅ Setlist groups updated');
    } catch (error) {
        logger.error('Error saving setlist groups:', error);
        alert('Ошибка при сохранении групп');
    }
}

/**
 * Экранирование HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupModalHandlers();
});