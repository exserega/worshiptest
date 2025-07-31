// ====================================
// REQUESTS MODULE FOR ADMIN PANEL
// Модуль управления заявками в админ панели
// ====================================

import { 
    getRequestsByType, 
    approveJoinRequest, 
    rejectRequest,
    approveBranchRequest,
    REQUEST_TYPES,
    REQUEST_STATUS 
} from '../requests/requestsAPI.js';

// Firebase из глобального объекта
const db = window.firebase?.firestore?.() || null;

// ====================================
// STATE
// ====================================

let joinRequests = [];
let branchRequests = [];
let currentUser = null;
let branchesCache = {}; // Кэш филиалов для быстрого доступа

// ====================================
// INITIALIZATION
// ====================================

/**
 * Инициализирует модуль заявок
 */
export async function initRequestsModule(user) {
    console.log('🚀 Initializing requests module...');
    currentUser = user;
    
    // Загружаем филиалы для кэша
    await loadBranchesCache();
    
    // Загружаем заявки
    await loadJoinRequests();
    await loadBranchRequests();
    
    // Настраиваем обработчики событий
    setupEventHandlers();
    
    console.log('✅ Requests module initialized');
}

/**
 * Загружает филиалы в кэш
 */
async function loadBranchesCache() {
    try {
        const snapshot = await db.collection('branches').get();
        branchesCache = {};
        snapshot.forEach(doc => {
            branchesCache[doc.id] = doc.data();
        });
        console.log('✅ Branches loaded to cache:', Object.keys(branchesCache).length);
    } catch (error) {
        console.error('Error loading branches cache:', error);
    }
}

// ====================================
// DATA LOADING
// ====================================

/**
 * Загружает заявки на вступление
 */
async function loadJoinRequests() {
    try {
        const result = await getRequestsByType(REQUEST_TYPES.BRANCH_JOIN, REQUEST_STATUS.PENDING);
        if (result.success) {
            joinRequests = result.requests;
            displayJoinRequests();
        }
    } catch (error) {
        console.error('Error loading join requests:', error);
    }
}

/**
 * Загружает заявки на создание филиалов
 */
async function loadBranchRequests() {
    try {
        const result = await getRequestsByType(REQUEST_TYPES.BRANCH_CREATE, REQUEST_STATUS.PENDING);
        if (result.success) {
            branchRequests = result.requests;
            displayBranchRequests();
        }
    } catch (error) {
        console.error('Error loading branch requests:', error);
    }
}

// ====================================
// UI DISPLAY
// ====================================

/**
 * Отображает заявки на вступление
 */
function displayJoinRequests() {
    const container = document.getElementById('join-requests-list');
    if (!container) return;
    
    if (joinRequests.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет новых заявок на вступление</div>';
        return;
    }
    
    container.innerHTML = joinRequests.map(request => {
        const createdAt = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
        
        return `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="request-info">
                        <h4>${request.userData?.name || 'Без имени'}</h4>
                        <p class="request-contact">${request.userData?.email || request.userData?.phone || 'Нет контактов'}</p>
                    </div>
                    <span class="request-date">${createdAt.toLocaleDateString('ru-RU')}</span>
                </div>
                
                <div class="request-details">
                    <div class="detail-item">
                        <span class="detail-label">Филиал:</span>
                        <span class="detail-value">${getBranchName(request.branchId)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Статус:</span>
                        <span class="badge badge-warning">Ожидает</span>
                    </div>
                </div>
                
                <div class="request-actions">
                    <button class="button success small" onclick="window.approveJoinRequest('${request.id}')">
                        <i class="fas fa-check"></i> Одобрить
                    </button>
                    <button class="button danger small" onclick="window.rejectJoinRequest('${request.id}')">
                        <i class="fas fa-times"></i> Отклонить
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Отображает заявки на создание филиалов
 */
function displayBranchRequests() {
    const container = document.getElementById('branch-requests-list');
    if (!container) return;
    
    if (branchRequests.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет новых заявок на создание филиалов</div>';
        return;
    }
    
    container.innerHTML = branchRequests.map(request => {
        const createdAt = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt);
        
        return `
            <div class="request-card" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="request-info">
                        <h4>Новый филиал: ${request.branchData?.name || 'Без названия'}</h4>
                        <p class="request-location">
                            <i class="fas fa-map-marker-alt"></i> 
                            ${request.branchData?.city || 'Город не указан'}
                        </p>
                    </div>
                    <span class="request-date">${createdAt.toLocaleDateString('ru-RU')}</span>
                </div>
                
                <div class="request-details">
                    ${request.branchData?.address ? `
                        <div class="detail-item">
                            <span class="detail-label">Адрес:</span>
                            <span class="detail-value">${request.branchData.address}</span>
                        </div>
                    ` : ''}
                    ${request.branchData?.contactPhone ? `
                        <div class="detail-item">
                            <span class="detail-label">Телефон:</span>
                            <span class="detail-value">${request.branchData.contactPhone}</span>
                        </div>
                    ` : ''}
                    ${request.branchData?.contactSocial ? `
                        <div class="detail-item">
                            <span class="detail-label">Соцсеть:</span>
                            <span class="detail-value">${request.branchData.contactSocial}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="request-from">
                    <span class="detail-label">Заявку подал:</span>
                    <span>${await getUserName(request.userId)}</span>
                </div>
                
                <div class="request-actions">
                    <button class="button success small" onclick="window.approveBranchRequest('${request.id}')">
                        <i class="fas fa-check"></i> Создать филиал
                    </button>
                    <button class="button danger small" onclick="window.rejectBranchRequest('${request.id}')">
                        <i class="fas fa-times"></i> Отклонить
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ====================================
// ACTIONS
// ====================================

/**
 * Одобряет заявку на вступление
 */
window.approveJoinRequest = async function(requestId) {
    if (!confirm('Одобрить заявку на вступление?')) return;
    
    try {
        const result = await approveJoinRequest(requestId);
        if (result.success) {
            alert('✅ Заявка одобрена');
            await loadJoinRequests(); // Перезагружаем список
        } else {
            alert('❌ Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Error approving join request:', error);
        alert('❌ Произошла ошибка при одобрении заявки');
    }
};

/**
 * Отклоняет заявку на вступление
 */
window.rejectJoinRequest = async function(requestId) {
    if (!confirm('Отклонить заявку на вступление?')) return;
    
    try {
        const result = await rejectRequest(requestId);
        if (result.success) {
            alert('✅ Заявка отклонена');
            await loadJoinRequests(); // Перезагружаем список
        } else {
            alert('❌ Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Error rejecting join request:', error);
        alert('❌ Произошла ошибка при отклонении заявки');
    }
};

/**
 * Одобряет заявку на создание филиала
 */
window.approveBranchRequest = async function(requestId) {
    if (!confirm('Создать новый филиал на основе этой заявки?')) return;
    
    try {
        const result = await approveBranchRequest(requestId);
        if (result.success) {
            alert('✅ Филиал создан успешно');
            await loadBranchRequests(); // Перезагружаем список
        } else {
            alert('❌ Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Error approving branch request:', error);
        alert('❌ Произошла ошибка при создании филиала');
    }
};

/**
 * Отклоняет заявку на создание филиала
 */
window.rejectBranchRequest = async function(requestId) {
    if (!confirm('Отклонить заявку на создание филиала?')) return;
    
    try {
        const result = await rejectRequest(requestId);
        if (result.success) {
            alert('✅ Заявка отклонена');
            await loadBranchRequests(); // Перезагружаем список
        } else {
            alert('❌ Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Error rejecting branch request:', error);
        alert('❌ Произошла ошибка при отклонении заявки');
    }
};

// ====================================
// HELPERS
// ====================================

/**
 * Получает название филиала по ID
 */
function getBranchName(branchId) {
    if (!branchId) return 'Не указан';
    
    // Ищем в кэше
    const branch = branchesCache[branchId];
    if (branch) {
        return branch.name || 'Неизвестный филиал';
    }
    
    // Если не нашли в кэше, возвращаем ID
    return `Филиал ${branchId}`;
}

/**
 * Получает имя пользователя по ID
 */
async function getUserName(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return userData.name || userData.email || 'Неизвестный пользователь';
        }
    } catch (error) {
        console.error('Error getting user name:', error);
    }
    return 'Неизвестный пользователь';
}

// ====================================
// EVENT HANDLERS
// ====================================

/**
 * Настраивает обработчики событий
 */
function setupEventHandlers() {
    // Фильтр статуса заявок на вступление
    const requestStatusFilter = document.getElementById('request-status-filter');
    if (requestStatusFilter) {
        requestStatusFilter.addEventListener('change', async (e) => {
            const status = e.target.value || null;
            const result = await getRequestsByType(REQUEST_TYPES.BRANCH_JOIN, status);
            if (result.success) {
                joinRequests = result.requests;
                displayJoinRequests();
            }
        });
    }
    
    // Фильтр статуса заявок на филиалы
    const branchRequestStatusFilter = document.getElementById('branch-request-status-filter');
    if (branchRequestStatusFilter) {
        branchRequestStatusFilter.addEventListener('change', async (e) => {
            const status = e.target.value || null;
            const result = await getRequestsByType(REQUEST_TYPES.BRANCH_CREATE, status);
            if (result.success) {
                branchRequests = result.requests;
                displayBranchRequests();
            }
        });
    }
}

// Экспортируем функции для использования в админ панели
export {
    loadJoinRequests,
    loadBranchRequests
};