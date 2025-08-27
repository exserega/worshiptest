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
let selectedGroupId = 'all';
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
    
    // Инициализация DOM элементов
    initializeElements();
    
    // Загрузка данных
    await loadArchiveData();
    
    // Настройка обработчиков событий
    setupEventHandlers();
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
    const allCount = archiveSetlists.length;
    
    // Обновляем счетчик "Все"
    const allChip = elements.groupsList.querySelector('[data-group-id="all"] .group-count');
    if (allChip) {
        allChip.textContent = allCount;
    }
    
    // Добавляем остальные группы
    archiveGroups.forEach(group => {
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
    if (selectedGroupId !== 'all') {
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
                ${setlist.groups ? `
                    <div class="setlist-groups">
                        ${setlist.groups.map(groupId => {
                            const group = archiveGroups.find(g => g.id === groupId);
                            return group ? `<span class="group-tag">${group.name}</span>` : '';
                        }).join('')}
                    </div>
                ` : ''}
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
                <i class="fas fa-play-circle"></i>
                ${usageCount} раз
            </div>
        </div>
        
        <button class="edit-btn-corner" onclick="editSetlist('${setlist.id}')" title="Редактировать">
            <i class="fas fa-edit"></i>
        </button>
        
        <div class="setlist-actions">
            <div class="setlist-actions-row">
                <button class="action-btn" onclick="addToCalendar('${setlist.id}')">
                    <i class="fas fa-calendar-plus"></i>
                    В календарь
                </button>
                <button class="action-btn" onclick="addToGroup('${setlist.id}')">
                    <i class="fas fa-folder-plus"></i>
                    В группу
                </button>
            </div>
            <button class="action-btn view-btn" onclick="viewSetlist('${setlist.id}')">
                <i class="fas fa-eye"></i>
                Просмотр
            </button>
        </div>
    `;
    
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
            // Убираем active со всех
            elements.groupsList.querySelectorAll('.group-chip').forEach(c => 
                c.classList.remove('active')
            );
            // Добавляем active на выбранную
            chip.classList.add('active');
            selectedGroupId = chip.dataset.groupId;
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
    
    // Показываем стрелки только на десктопе
    if (window.innerWidth >= 768) {
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