/**
 * Requests Module - Управление заявками пользователей
 * Обрабатывает отображение и управление заявками на вступление
 */

// ====================================
// ОТОБРАЖЕНИЕ ЗАЯВОК
// ====================================

/**
 * Отображает список заявок
 */
export function displayRequests() {
    const container = document.getElementById('requests-list');
    if (!container) return;
    
    const { requests, branches } = window.adminState;
    
    // Обновляем счетчик заявок
    updateRequestsCount(requests.length);
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-check"></i>
                <p>Нет новых заявок</p>
            </div>
        `;
        return;
    }
    
    // Создаем карточки заявок
    const html = requests.map(user => createRequestCard(user, branches)).join('');
    container.innerHTML = html;
}

/**
 * Создает карточку заявки
 */
function createRequestCard(user, branches) {
    const branch = branches.find(b => b.id === user.branchId);
    const branchName = branch ? branch.name : 'Филиал не указан';
    
    return `
        <div class="request-card" data-user-id="${user.id}">
            <div class="request-header">
                <h3>${user.name || 'Без имени'}</h3>
                <span class="request-date">${formatDate(user.createdAt)}</span>
            </div>
            
            <div class="request-info">
                <div class="info-row">
                    <i class="fas fa-envelope"></i>
                    <span>${user.email}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-phone"></i>
                    <span>${user.phone || 'Не указан'}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-building"></i>
                    <span>${branchName}</span>
                </div>
            </div>
            
            <div class="request-actions">
                <button class="btn-action success" 
                        onclick="window.adminRequests.approveRequest('${user.id}')"
                        title="Одобрить заявку">
                    <i class="fas fa-check"></i>
                    Одобрить
                </button>
                <button class="btn-action danger" 
                        onclick="window.adminRequests.rejectRequest('${user.id}')"
                        title="Отклонить заявку">
                    <i class="fas fa-times"></i>
                    Отклонить
                </button>
            </div>
        </div>
    `;
}

/**
 * Обновляет счетчик заявок
 */
function updateRequestsCount(count) {
    const badge = document.getElementById('requests-count');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Форматирует дату
 */
function formatDate(date) {
    if (!date) return 'Дата не указана';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дней назад`;
    
    return d.toLocaleDateString('ru-RU');
}

// ====================================
// ОБРАБОТКА ЗАЯВОК
// ====================================

/**
 * Одобряет заявку пользователя
 */
export async function approveRequest(userId) {
    if (!confirm('Подтвердить заявку этого пользователя?')) return;
    
    try {
        showRequestLoading(userId);
        
        const db = firebase.firestore();
        
        // Обновляем статус пользователя на active
        await db.collection('users').doc(userId).update({
            status: 'active',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: window.adminState.currentUser.id
        });
        
        // Удаляем пользователя из списка заявок
        window.adminState.requests = window.adminState.requests.filter(u => u.id !== userId);
        
        // Обновляем пользователя в общем списке
        const userIndex = window.adminState.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            window.adminState.users[userIndex].status = 'active';
        }
        
        // Обновляем отображение
        displayRequests();
        
        // Если открыт таб пользователей, обновляем его тоже
        if (window.adminState.currentTab === 'users') {
            const { displayUsers } = await import('./usersModule.js');
            displayUsers();
        }
        
        showSuccess('Заявка одобрена');
        
    } catch (error) {
        console.error('Error approving request:', error);
        showError('Ошибка при одобрении заявки');
        hideRequestLoading(userId);
    }
}

/**
 * Отклоняет заявку пользователя
 */
export async function rejectRequest(userId) {
    const reason = prompt('Укажите причину отклонения заявки (необязательно):');
    
    if (reason === null) return; // Отменили диалог
    
    try {
        showRequestLoading(userId);
        
        const db = firebase.firestore();
        
        // Получаем информацию о филиале пользователя
        const user = window.adminState.requests.find(u => u.id === userId);
        const branch = window.adminState.branches.find(b => b.id === user?.branchId);
        
        // Обновляем статус пользователя на rejected
        await db.collection('users').doc(userId).update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: window.adminState.currentUser.id,
            rejectionReason: reason || 'Без указания причины',
            branchName: branch?.name || 'Филиал не указан'
        });
        
        // Удаляем пользователя из списка заявок
        window.adminState.requests = window.adminState.requests.filter(u => u.id !== userId);
        
        // Обновляем пользователя в общем списке
        const userIndex = window.adminState.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            window.adminState.users[userIndex].status = 'rejected';
            window.adminState.users[userIndex].rejectionReason = reason || 'Без указания причины';
        }
        
        // Обновляем отображение
        displayRequests();
        
        showSuccess('Заявка отклонена');
        
    } catch (error) {
        console.error('Error rejecting request:', error);
        showError('Ошибка при отклонении заявки');
        hideRequestLoading(userId);
    }
}

// ====================================
// UI УТИЛИТЫ
// ====================================

function showRequestLoading(userId) {
    const card = document.querySelector(`[data-user-id="${userId}"]`);
    if (card) {
        card.classList.add('loading');
        card.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }
}

function hideRequestLoading(userId) {
    const card = document.querySelector(`[data-user-id="${userId}"]`);
    if (card) {
        card.classList.remove('loading');
        card.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }
}

function showSuccess(message) {
    // Можно использовать toast или другой UI элемент
    console.log('✅', message);
}

function showError(message) {
    // Можно использовать toast или другой UI элемент
    console.error('❌', message);
}

// ====================================
// ИНИЦИАЛИЗАЦИЯ
// ====================================

// Экспортируем функции в глобальный объект для onclick обработчиков
window.adminRequests = {
    approveRequest,
    rejectRequest
};