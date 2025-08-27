/**
 * Основной модуль страницы архива сет-листов
 */

import logger from '../src/utils/logger.js';
import { db } from '../firebase-init.js';
import { getCurrentUser, initAuthGate } from '../src/modules/auth/authCheck.js';

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
}

/**
 * Загрузка данных архива
 */
async function loadArchiveData() {
    showLoading(true);
    
    try {
        // Пока используем обычные сет-листы для демонстрации
        // TODO: Переключиться на archive_setlists когда будет создана коллекция
        const snapshot = await db.collection('worship_setlists')
            .where('branchId', '==', currentUser.branchId)
            .get();
        
        archiveSetlists = [];
        snapshot.forEach(doc => {
            archiveSetlists.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        logger.log(`📚 Loaded ${archiveSetlists.length} archive setlists`);
        
        // Загрузка групп (пока моковые данные)
        archiveGroups = [
            { id: 'christmas', name: '🎄 Рождество', color: '#ff6b6b', count: 0 },
            { id: 'easter', name: '🐣 Пасха', color: '#ffd93d', count: 0 },
            { id: 'worship', name: '🙏 Поклонение', color: '#6bcf7f', count: 0 }
        ];
        
        renderGroups();
        applyFiltersAndSort();
        
    } catch (error) {
        logger.error('Error loading archive data:', error);
        showError('Ошибка загрузки архива');
    } finally {
        showLoading(false);
    }
}

/**
 * Отрисовка групп
 */
function renderGroups() {
    elements.groupsList.innerHTML = '';
    
    // Сортируем группы по алфавиту
    const sortedGroups = [...archiveGroups].sort((a, b) => 
        a.name.localeCompare(b.name, 'ru')
    );
    
    // Добавляем группы
    sortedGroups.forEach(group => {
        const chip = document.createElement('button');
        chip.className = 'group-chip';
        chip.dataset.groupId = group.id;
        chip.innerHTML = `
            ${group.name}
            <span class="group-count">${group.count}</span>
        `;
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
            setlist.groups && setlist.groups.includes(selectedGroupId)
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
 * Создание карточки сет-листа
 */
function createSetlistCard(setlist) {
    const card = document.createElement('div');
    card.className = 'archive-setlist-card';
    card.dataset.setlistId = setlist.id;
    
    const songCount = setlist.songs?.length || 0;
    const creatorName = setlist.creatorName || 'Неизвестно';
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
        
        <button class="edit-btn-corner" title="Редактировать">
            <i class="fas fa-edit"></i>
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
        // TODO: Открыть модальное окно создания
        alert('Создание архивного сет-листа - в разработке');
    });
    
    // Добавление группы
    elements.addGroupBtn.addEventListener('click', () => {
        // TODO: Открыть модальное окно создания группы
        alert('Создание группы - в разработке');
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
        logger.log('Loading songs for setlist:', setlistId, setlist);
        
        if (!setlist || !setlist.songs || setlist.songs.length === 0) {
            container.innerHTML = '<div class="no-songs">Нет песен в сет-листе</div>';
            return;
        }
        
        logger.log('Setlist songs:', setlist.songs);
        
        // Загружаем информацию о песнях из коллекции songs
        const songIds = setlist.songs
            .map(s => {
                // Обрабатываем разные форматы хранения песен
                if (typeof s === 'string') return s;
                if (s && s.id) return s.id;
                if (s && s.songId) return s.songId; // Возможно используется songId
                return null;
            })
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
        const songsHtml = setlist.songs.map((songRef, index) => {
            // Обрабатываем разные форматы хранения песен
            let songId;
            if (typeof songRef === 'string') {
                songId = songRef;
            } else if (songRef && songRef.id) {
                songId = songRef.id;
            } else if (songRef && songRef.songId) {
                songId = songRef.songId;
            }
            
            const song = songsMap.get(songId);
            logger.log('Processing song:', songId, song, songRef);
            
            // Получаем название песни (может быть name или title)
            const songName = song ? (song.name || song.title || 'Неизвестная песня') : 'Неизвестная песня';
            
            // Если songRef это объект, берем key и bpm оттуда, иначе из song
            const key = (typeof songRef === 'object' && songRef.key) ? songRef.key : (song?.originalKey || song?.key || '-');
            const bpm = (typeof songRef === 'object' && songRef.bpm) ? songRef.bpm : (song?.bpm || '-');
            
            return `
                <div class="song-item">
                    <div class="song-info">
                        <div class="song-number">${index + 1}</div>
                        <div class="song-name">${songName}</div>
                    </div>
                    <div class="song-details">
                        <span class="song-key">${key}</span>
                        <span class="song-bpm">${bpm} BPM</span>
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
window.addToGroup = function(setlistId) {
    // TODO: Открыть модальное окно выбора группы
    logger.log('Add to group:', setlistId);
    alert('Добавление в группу - в разработке');
};

/**
 * Редактирование сет-листа
 */
window.editSetlist = function(setlistId) {
    // TODO: Открыть модальное окно редактирования
    logger.log('Edit setlist:', setlistId);
    alert('Редактирование сет-листа - в разработке');
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
    scrollContainer.addEventListener('scroll', checkScroll);
    
    // Проверка при изменении размера окна
    window.addEventListener('resize', checkScroll);
    
    // Начальная проверка
    setTimeout(checkScroll, 100);
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

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', initializePage);