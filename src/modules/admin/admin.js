// Admin Panel Module
// Панель администратора

// Firebase imports
const auth = firebase.auth();
const db = firebase.firestore();

// Import modules
import { initAuthGate, isAdmin } from '../auth/authCheck.js';
import { getAllBranches, createBranch } from '../branches/branchManager.js';
import { getPendingTransferRequests, processTransferRequest } from '../branches/transferRequests.js';

// State
let currentTab = 'users';
let users = [];
let branches = [];
let requests = [];

// DOM Elements
let elements = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🛠️ Admin panel loading...');
    
    // Применяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Проверка прав доступа
    const hasAccess = await initAuthGate({
        requireAuth: true,
        requireAdmin: true,
        redirectTo: '/settings.html'
    });
    
    if (!hasAccess) {
        console.log('🚫 Access denied - admin rights required');
        return;
    }
    
    console.log('✅ Admin access granted');
    
    // Инициализация DOM элементов
    initElements();
    
    // Загрузка данных
    await loadAllData();
    
    // Установка обработчиков
    setupEventHandlers();
});

// Инициализация элементов
function initElements() {
    elements = {
        // Tabs
        navTabs: document.querySelectorAll('.nav-tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Users
        usersList: document.getElementById('users-list'),
        branchFilter: document.getElementById('branch-filter'),
        statusFilter: document.getElementById('status-filter'),
        
        // Branches
        branchesList: document.getElementById('branches-list'),
        addBranchBtn: document.getElementById('add-branch-btn'),
        
        // Requests
        requestsList: document.getElementById('requests-list'),
        requestsBadge: document.getElementById('requests-badge'),
        
        // Modals
        userModal: document.getElementById('user-modal'),
        branchModal: document.getElementById('branch-modal'),
        branchForm: document.getElementById('branch-form')
    };
}

// Загрузка всех данных
async function loadAllData() {
    try {
        // Загружаем филиалы
        branches = await getAllBranches(true);
        populateBranchFilter();
        
        // Загружаем пользователей
        await loadUsers();
        
        // Загружаем заявки
        await loadRequests();
        
        // Отображаем текущую вкладку
        showTab(currentTab);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Загрузка пользователей
async function loadUsers() {
    try {
        elements.usersList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
        
        const snapshot = await db.collection('users').get();
        users = [];
        
        snapshot.forEach(doc => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📊 Loaded ${users.length} users`);
        displayUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        elements.usersList.innerHTML = '<p class="error">Ошибка загрузки пользователей</p>';
    }
}

// Отображение пользователей
function displayUsers() {
    const branchFilter = elements.branchFilter.value;
    const statusFilter = elements.statusFilter.value;
    
    // Фильтрация
    let filteredUsers = users;
    if (branchFilter) {
        filteredUsers = filteredUsers.filter(u => u.branchId === branchFilter);
    }
    if (statusFilter) {
        filteredUsers = filteredUsers.filter(u => u.status === statusFilter);
    }
    
    // Сортировка: сначала pending, потом active, потом banned
    filteredUsers.sort((a, b) => {
        const statusOrder = { pending: 0, active: 1, banned: 2 };
        return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
    });
    
    // Отображение
    if (filteredUsers.length === 0) {
        elements.usersList.innerHTML = '<p class="empty-state">Пользователи не найдены</p>';
        return;
    }
    
    elements.usersList.innerHTML = filteredUsers.map(user => {
        const branch = branches.find(b => b.id === user.branchId);
        const statusText = {
            pending: 'В ожидании',
            active: 'Активный',
            banned: 'Заблокирован'
        }[user.status] || user.status;
        
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-header">
                    <div>
                        <div class="user-name">${user.name || 'Без имени'}</div>
                        <div class="user-email">${user.email || user.phone || 'Нет контактов'}</div>
                    </div>
                    <span class="user-status status-${user.status}">${statusText}</span>
                </div>
                <div class="user-info">
                    <div>Роль: ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</div>
                    <div>Филиал: ${branch ? branch.name : 'Не назначен'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Загрузка филиалов
function displayBranches() {
    if (branches.length === 0) {
        elements.branchesList.innerHTML = '<p class="empty-state">Филиалы не найдены</p>';
        return;
    }
    
    elements.branchesList.innerHTML = branches.map(branch => {
        const memberCount = users.filter(u => u.branchId === branch.id && u.status === 'active').length;
        
        return `
            <div class="branch-card" data-branch-id="${branch.id}">
                <div class="branch-name">${branch.name}</div>
                <div class="branch-location">${branch.location || 'Местоположение не указано'}</div>
                <div class="branch-stats">
                    <div class="stat">
                        <span class="stat-value">${memberCount}</span>
                        <span class="stat-label">Участников</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${branch.setlistCount || 0}</span>
                        <span class="stat-label">Сет-листов</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Загрузка заявок
async function loadRequests() {
    try {
        requests = await getPendingTransferRequests();
        console.log(`📋 Loaded ${requests.length} pending requests`);
        
        // Обновляем бейдж
        if (requests.length > 0) {
            elements.requestsBadge.textContent = requests.length;
            elements.requestsBadge.style.display = 'block';
        } else {
            elements.requestsBadge.style.display = 'none';
        }
        
        displayRequests();
    } catch (error) {
        console.error('Error loading requests:', error);
        elements.requestsList.innerHTML = '<p class="error">Ошибка загрузки заявок</p>';
    }
}

// Отображение заявок
function displayRequests() {
    if (requests.length === 0) {
        elements.requestsList.innerHTML = '<p class="empty-state">Нет активных заявок</p>';
        return;
    }
    
    elements.requestsList.innerHTML = requests.map(request => {
        const date = request.createdAt?.toDate ? request.createdAt.toDate() : new Date();
        const dateStr = new Intl.DateTimeFormat('ru', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
        
        return `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <span class="request-user">${request.userName}</span>
                    <span class="request-date">${dateStr}</span>
                </div>
                <div class="request-branches">
                    <span class="branch-tag">${request.fromBranchName}</span>
                    <i class="fas fa-arrow-right arrow-icon"></i>
                    <span class="branch-tag">${request.toBranchName}</span>
                </div>
                ${request.reason ? `<div class="request-reason">"${request.reason}"</div>` : ''}
                <div class="request-actions">
                    <button class="btn-primary approve-request" data-request-id="${request.id}">
                        <i class="fas fa-check"></i> Одобрить
                    </button>
                    <button class="btn-secondary reject-request" data-request-id="${request.id}">
                        <i class="fas fa-times"></i> Отклонить
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Показать вкладку
function showTab(tabName) {
    currentTab = tabName;
    
    // Обновляем активную вкладку
    elements.navTabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Показываем соответствующий контент
    elements.tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Обновляем отображение
    switch (tabName) {
        case 'users':
            displayUsers();
            break;
        case 'branches':
            displayBranches();
            break;
        case 'requests':
            displayRequests();
            break;
    }
}

// Заполнение фильтра филиалов
function populateBranchFilter() {
    elements.branchFilter.innerHTML = '<option value="">Все филиалы</option>';
    branches.forEach(branch => {
        elements.branchFilter.innerHTML += `<option value="${branch.id}">${branch.name}</option>`;
    });
}

// Показать модальное окно пользователя
async function showUserModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const branch = branches.find(b => b.id === user.branchId);
    
    document.getElementById('user-modal-title').textContent = 'Информация о пользователе';
    document.getElementById('user-modal-body').innerHTML = `
        <div class="user-details">
            <div class="detail-row">
                <label>Имя:</label>
                <span>${user.name || 'Не указано'}</span>
            </div>
            <div class="detail-row">
                <label>Email:</label>
                <span>${user.email || 'Не указан'}</span>
            </div>
            <div class="detail-row">
                <label>Телефон:</label>
                <span>${user.phone || 'Не указан'}</span>
            </div>
            <div class="detail-row">
                <label>Роль:</label>
                <select id="user-role" ${user.id === auth.currentUser?.uid ? 'disabled' : ''}>
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                </select>
            </div>
            <div class="detail-row">
                <label>Статус:</label>
                <select id="user-status">
                    <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>В ожидании</option>
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Активный</option>
                    <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Заблокирован</option>
                </select>
            </div>
            <div class="detail-row">
                <label>Филиал:</label>
                <select id="user-branch">
                    <option value="">Не назначен</option>
                    ${branches.map(b => `
                        <option value="${b.id}" ${user.branchId === b.id ? 'selected' : ''}>${b.name}</option>
                    `).join('')}
                </select>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="window.adminModule.saveUserChanges('${userId}')">
                <i class="fas fa-save"></i> Сохранить изменения
            </button>
        </div>
    `;
    
    elements.userModal.style.display = 'flex';
}

// Сохранить изменения пользователя
async function saveUserChanges(userId) {
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;
    const branchId = document.getElementById('user-branch').value;
    
    try {
        await db.collection('users').doc(userId).update({
            role,
            status,
            branchId: branchId || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: auth.currentUser.uid
        });
        
        console.log('✅ User updated successfully');
        
        // Обновляем локальные данные
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                role,
                status,
                branchId: branchId || null
            };
        }
        
        // Закрываем модальное окно и обновляем отображение
        elements.userModal.style.display = 'none';
        displayUsers();
        
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Ошибка при сохранении изменений');
    }
}

// Обработка заявки
async function handleRequest(requestId, approve) {
    const comment = approve ? 'Заявка одобрена администратором' : 'Заявка отклонена администратором';
    
    try {
        await processTransferRequest(requestId, approve, comment);
        console.log(`✅ Request ${approve ? 'approved' : 'rejected'}`);
        
        // Перезагружаем данные
        await loadAllData();
        
    } catch (error) {
        console.error('Error processing request:', error);
        alert('Ошибка при обработке заявки');
    }
}

// Обработчики событий
function setupEventHandlers() {
    // Переключение вкладок
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            showTab(tab.dataset.tab);
        });
    });
    
    // Фильтры
    elements.branchFilter.addEventListener('change', displayUsers);
    elements.statusFilter.addEventListener('change', displayUsers);
    
    // Клик по карточке пользователя
    elements.usersList.addEventListener('click', (e) => {
        const userCard = e.target.closest('.user-card');
        if (userCard) {
            showUserModal(userCard.dataset.userId);
        }
    });
    
    // Создание филиала
    elements.addBranchBtn.addEventListener('click', () => {
        document.getElementById('branch-modal-title').textContent = 'Создать филиал';
        document.getElementById('branch-name').value = '';
        document.getElementById('branch-location').value = '';
        elements.branchModal.style.display = 'flex';
    });
    
    // Форма создания филиала
    elements.branchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('branch-name').value.trim();
        const location = document.getElementById('branch-location').value.trim();
        
        if (!name) return;
        
        try {
            const newBranch = await createBranch({ name, location });
            console.log('✅ Branch created:', newBranch);
            
            // Добавляем в локальный массив
            branches.push(newBranch);
            
            // Закрываем модальное окно и обновляем отображение
            elements.branchModal.style.display = 'none';
            populateBranchFilter();
            displayBranches();
            
        } catch (error) {
            console.error('Error creating branch:', error);
            alert('Ошибка при создании филиала');
        }
    });
    
    // Обработка заявок
    elements.requestsList.addEventListener('click', (e) => {
        if (e.target.closest('.approve-request')) {
            const requestId = e.target.closest('.approve-request').dataset.requestId;
            if (confirm('Одобрить эту заявку на перевод?')) {
                handleRequest(requestId, true);
            }
        } else if (e.target.closest('.reject-request')) {
            const requestId = e.target.closest('.reject-request').dataset.requestId;
            if (confirm('Отклонить эту заявку на перевод?')) {
                handleRequest(requestId, false);
            }
        }
    });
    
    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Закрытие модальных окон по клику вне
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Экспорт функций для глобального доступа
window.adminModule = {
    saveUserChanges
};

console.log('🛠️ Admin module loaded');