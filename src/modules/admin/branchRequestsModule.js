// ====================================
// МОДУЛЬ УПРАВЛЕНИЯ ЗАЯВКАМИ НА ФИЛИАЛЫ
// ====================================

import { db } from '../../../js/firebase-config.js';

/**
 * Отображение заявок на филиалы
 */
export async function displayBranchRequests() {
    const { branchRequests, branches, users } = window.adminState;
    
    const container = document.getElementById('branch-requests-list');
    if (!container) {
        console.error('Branch requests container not found');
        return;
    }
    
    // Фильтруем только pending заявки
    const pendingRequests = branchRequests.filter(r => r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Нет активных заявок на филиалы</p>
            </div>
        `;
        updateBranchRequestsCount(0);
        return;
    }
    
    // Создаем карточки заявок
    const html = pendingRequests.map(request => createBranchRequestCard(request, branches, users)).join('');
    container.innerHTML = `<div class="requests-grid">${html}</div>`;
    
    updateBranchRequestsCount(pendingRequests.length);
}

/**
 * Создание карточки заявки
 */
function createBranchRequestCard(request, branches, users) {
    const user = users.find(u => u.id === request.userId);
    const currentBranch = branches.find(b => b.id === request.currentBranchId);
    const requestedBranch = branches.find(b => b.id === request.requestedBranchId);
    
    if (!user || !requestedBranch) {
        console.error('Invalid request data:', request);
        return '';
    }
    
    const typeText = request.type === 'changeMain' 
        ? 'Смена основного филиала' 
        : 'Присоединение к филиалу';
    
    const typeIcon = request.type === 'changeMain' 
        ? 'fa-exchange-alt' 
        : 'fa-plus';
    
    return `
        <div class="request-card" data-request-id="${request.id}">
            <div class="request-header">
                <h3><i class="fas ${typeIcon}"></i> ${typeText}</h3>
                <span class="request-date">${formatDate(request.createdAt)}</span>
            </div>
            
            <div class="request-info">
                <div class="info-row">
                    <i class="fas fa-user"></i>
                    <span>${user.name || user.email}</span>
                </div>
                
                ${currentBranch ? `
                <div class="info-row">
                    <i class="fas fa-building"></i>
                    <span>Текущий: ${currentBranch.name}</span>
                </div>
                ` : ''}
                
                <div class="info-row">
                    <i class="fas fa-arrow-right"></i>
                    <span>Запрашивает: ${requestedBranch.name}</span>
                </div>
                
                ${request.reason ? `
                <div class="info-row">
                    <i class="fas fa-comment"></i>
                    <span>${request.reason}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="request-actions">
                <button class="btn-action success" onclick="window.adminBranchRequests.approveRequest('${request.id}')">
                    <i class="fas fa-check"></i>
                    Одобрить
                </button>
                <button class="btn-action danger" onclick="window.adminBranchRequests.showRejectDialog('${request.id}')">
                    <i class="fas fa-times"></i>
                    Отклонить
                </button>
            </div>
        </div>
    `;
}

/**
 * Обновление счетчика заявок
 */
function updateBranchRequestsCount(count) {
    const badge = document.querySelector('#branch-requests-tab-btn .badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

/**
 * Форматирование даты
 */
function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Одобрение заявки
 */
async function approveRequest(requestId) {
    const request = window.adminState.branchRequests.find(r => r.id === requestId);
    if (!request) {
        console.error('Request not found:', requestId);
        return;
    }
    
    if (!confirm(`Одобрить заявку на ${request.type === 'changeMain' ? 'смену основного филиала' : 'присоединение к филиалу'}?`)) {
        return;
    }
    
    showRequestLoading(requestId);
    
    try {
        const userRef = db.collection('users').doc(request.userId);
        const requestRef = db.collection('branchRequests').doc(requestId);
        
        // Обновляем данные пользователя в зависимости от типа заявки
        if (request.type === 'changeMain') {
            // Смена основного филиала
            await userRef.update({
                branchId: request.requestedBranchId,
                lastBranchChange: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Добавление дополнительного филиала
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            const additionalBranches = userData.additionalBranchIds || [];
            
            if (!additionalBranches.includes(request.requestedBranchId)) {
                additionalBranches.push(request.requestedBranchId);
                await userRef.update({
                    additionalBranchIds: additionalBranches
                });
            }
        }
        
        // Обновляем статус заявки
        await requestRef.update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: window.adminState.currentUser?.id || window.adminState.currentUser?.uid
        });
        
        // Обновляем локальное состояние
        const requestIndex = window.adminState.branchRequests.findIndex(r => r.id === requestId);
        if (requestIndex !== -1) {
            window.adminState.branchRequests[requestIndex].status = 'approved';
        }
        
        // Обновляем данные пользователя в локальном состоянии
        const userIndex = window.adminState.users.findIndex(u => u.id === request.userId);
        if (userIndex !== -1) {
            const userRef = db.collection('users').doc(request.userId);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                window.adminState.users[userIndex] = { id: request.userId, ...userDoc.data() };
            }
        }
        
        showSuccess('Заявка одобрена');
        displayBranchRequests();
        
        // Обновляем список пользователей
        const { displayUsers } = await import('./usersModule.js');
        displayUsers();
        
    } catch (error) {
        console.error('Error approving request:', error);
        showError('Ошибка при одобрении заявки');
    } finally {
        hideRequestLoading(requestId);
    }
}

/**
 * Показать диалог отклонения
 */
function showRejectDialog(requestId) {
    const reason = prompt('Укажите причину отклонения заявки:');
    if (reason === null) return; // Отмена
    
    rejectRequest(requestId, reason || 'Без указания причины');
}

/**
 * Отклонение заявки
 */
async function rejectRequest(requestId, reason) {
    const request = window.adminState.branchRequests.find(r => r.id === requestId);
    if (!request) {
        console.error('Request not found:', requestId);
        return;
    }
    
    showRequestLoading(requestId);
    
    try {
        const requestRef = db.collection('branchRequests').doc(requestId);
        
        // Обновляем статус заявки
        await requestRef.update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: window.adminState.currentUser?.id || window.adminState.currentUser?.uid,
            rejectionReason: reason
        });
        
        // Обновляем локальное состояние
        const requestIndex = window.adminState.branchRequests.findIndex(r => r.id === requestId);
        if (requestIndex !== -1) {
            window.adminState.branchRequests[requestIndex].status = 'rejected';
        }
        
        // Создаем уведомление для пользователя
        await db.collection('notifications').add({
            userId: request.userId,
            type: 'branchRequestRejected',
            requestType: request.type,
            branchId: request.requestedBranchId,
            reason: reason,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        showSuccess('Заявка отклонена');
        displayBranchRequests();
        
    } catch (error) {
        console.error('Error rejecting request:', error);
        showError('Ошибка при отклонении заявки');
    } finally {
        hideRequestLoading(requestId);
    }
}

/**
 * Показать состояние загрузки
 */
function showRequestLoading(requestId) {
    const card = document.querySelector(`[data-request-id="${requestId}"]`);
    if (card) {
        card.classList.add('loading');
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
    }
}

/**
 * Скрыть состояние загрузки
 */
function hideRequestLoading(requestId) {
    const card = document.querySelector(`[data-request-id="${requestId}"]`);
    if (card) {
        card.classList.remove('loading');
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = false);
    }
}

/**
 * Показать успешное сообщение
 */
function showSuccess(message) {
    // Используем существующую систему уведомлений админ панели
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * Показать сообщение об ошибке
 */
function showError(message) {
    // Используем существующую систему уведомлений админ панели
    if (window.showNotification) {
        window.showNotification(message, 'error');
    } else {
        alert(message);
    }
}

// Экспортируем функции для onclick обработчиков
window.adminBranchRequests = {
    approveRequest,
    showRejectDialog
};