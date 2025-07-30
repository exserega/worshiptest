// ====================================
// TRANSFER REQUEST MODAL
// Модальное окно для запроса на перевод в другой филиал
// ====================================

import { createTransferRequest, getActiveUserRequest, REQUEST_TYPES } from './requestsAPI.js';

/**
 * Показывает модальное окно запроса на перевод
 */
export async function showTransferRequestModal(currentUser, branches) {
    // Проверяем, нет ли уже активной заявки
    const activeCheck = await getActiveUserRequest(currentUser.id, REQUEST_TYPES.BRANCH_TRANSFER);
    
    if (activeCheck.hasActiveRequest) {
        showNotification('У вас уже есть активная заявка на перевод. Дождитесь её рассмотрения.', 'warning');
        return;
    }
    
    // Фильтруем филиалы (исключаем текущий)
    const availableBranches = branches.filter(b => b.id !== currentUser.branchId);
    
    if (availableBranches.length === 0) {
        showNotification('Нет доступных филиалов для перевода', 'info');
        return;
    }
    
    const modalHtml = `
        <div class="modal transfer-request-modal" id="transfer-request-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-exchange-alt"></i> Запрос на перевод в другой филиал</h2>
                    <button class="close-button" onclick="closeTransferModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="current-branch-info">
                        <p><strong>Текущий филиал:</strong> ${getCurrentBranchName(currentUser.branchId, branches)}</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="target-branch">Выберите филиал для перевода:</label>
                        <select id="target-branch" class="form-control" required>
                            <option value="">-- Выберите филиал --</option>
                            ${availableBranches.map(branch => `
                                <option value="${branch.id}">${branch.name} (${branch.city})</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="transfer-reason">Причина перевода (необязательно):</label>
                        <textarea 
                            id="transfer-reason" 
                            class="form-control" 
                            rows="3"
                            placeholder="Укажите причину перевода..."
                        ></textarea>
                    </div>
                    
                    <div class="info-message">
                        <i class="fas fa-info-circle"></i>
                        <span>После отправки заявки администратор рассмотрит её и примет решение.</span>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="button secondary" onclick="closeTransferModal()">
                        Отмена
                    </button>
                    <button class="button primary" onclick="submitTransferRequest('${currentUser.id}', '${currentUser.branchId}')">
                        <i class="fas fa-paper-plane"></i> Отправить заявку
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем стили
    addTransferModalStyles();
    
    // Добавляем модальное окно в DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Добавляем обработчик закрытия по клику вне окна
    const modal = document.getElementById('transfer-request-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTransferModal();
        }
    });
}

/**
 * Отправляет заявку на перевод
 */
window.submitTransferRequest = async function(userId, fromBranchId) {
    const targetBranchSelect = document.getElementById('target-branch');
    const reasonTextarea = document.getElementById('transfer-reason');
    
    const toBranchId = targetBranchSelect.value;
    const reason = reasonTextarea.value.trim();
    
    if (!toBranchId) {
        showNotification('Пожалуйста, выберите филиал для перевода', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const submitButton = document.querySelector('.transfer-request-modal .button.primary');
    const originalContent = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitButton.disabled = true;
    
    try {
        const result = await createTransferRequest(userId, fromBranchId, toBranchId, reason);
        
        if (result.success) {
            showNotification('Заявка на перевод успешно отправлена!', 'success');
            closeTransferModal();
        } else {
            showNotification('Ошибка при отправке заявки: ' + result.error, 'error');
            submitButton.innerHTML = originalContent;
            submitButton.disabled = false;
        }
    } catch (error) {
        showNotification('Произошла ошибка: ' + error.message, 'error');
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
    }
};

/**
 * Закрывает модальное окно
 */
window.closeTransferModal = function() {
    const modal = document.getElementById('transfer-request-modal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Получает название филиала по ID
 */
function getCurrentBranchName(branchId, branches) {
    if (!branchId) return 'Не назначен';
    const branch = branches.find(b => b.id === branchId);
    return branch ? `${branch.name} (${branch.city})` : 'Неизвестный филиал';
}

/**
 * Добавляет стили для модального окна
 */
function addTransferModalStyles() {
    if (document.getElementById('transfer-modal-styles')) return;
    
    const styles = `
        <style id="transfer-modal-styles">
            /* Модальное окно перевода */
            .transfer-request-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .transfer-request-modal .modal-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            
            /* Заголовок модального окна */
            .transfer-request-modal .modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .transfer-request-modal .modal-header h2 {
                margin: 0;
                font-size: 20px;
                color: #333;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .transfer-request-modal .close-button {
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .transfer-request-modal .close-button:hover {
                background: #f5f5f5;
                color: #333;
            }
            
            /* Тело модального окна */
            .transfer-request-modal .modal-body {
                padding: 20px;
            }
            
            .transfer-request-modal .current-branch-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .transfer-request-modal .current-branch-info p {
                margin: 0;
                color: #666;
            }
            
            .transfer-request-modal .form-group {
                margin-bottom: 20px;
            }
            
            .transfer-request-modal .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #333;
            }
            
            .transfer-request-modal .form-control {
                width: 100%;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.2s;
            }
            
            .transfer-request-modal .form-control:focus {
                outline: none;
                border-color: #4A90E2;
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
            }
            
            .transfer-request-modal select.form-control {
                cursor: pointer;
            }
            
            .transfer-request-modal textarea.form-control {
                resize: vertical;
                min-height: 80px;
            }
            
            /* Информационное сообщение */
            .transfer-request-modal .info-message {
                background: #e3f2fd;
                color: #1976d2;
                padding: 12px 15px;
                border-radius: 8px;
                display: flex;
                align-items: start;
                gap: 10px;
                font-size: 14px;
            }
            
            .transfer-request-modal .info-message i {
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            /* Подвал модального окна */
            .transfer-request-modal .modal-footer {
                padding: 20px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            /* Кнопки */
            .transfer-request-modal .button {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .transfer-request-modal .button.primary {
                background: #4A90E2;
                color: white;
            }
            
            .transfer-request-modal .button.primary:hover {
                background: #357ABD;
            }
            
            .transfer-request-modal .button.secondary {
                background: #f5f5f5;
                color: #666;
            }
            
            .transfer-request-modal .button.secondary:hover {
                background: #e8e8e8;
            }
            
            .transfer-request-modal .button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            /* Анимации */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            /* Мобильная адаптация */
            @media (max-width: 600px) {
                .transfer-request-modal .modal-content {
                    width: 95%;
                    margin: 10px;
                }
                
                .transfer-request-modal .modal-header h2 {
                    font-size: 18px;
                }
                
                .transfer-request-modal .modal-footer {
                    flex-direction: column;
                }
                
                .transfer-request-modal .button {
                    width: 100%;
                    justify-content: center;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

/**
 * Показывает уведомление (временная функция)
 */
function showNotification(message, type = 'info') {
    // Проверяем, есть ли глобальная функция уведомлений
    if (window.showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Иначе используем alert
        alert(message);
    }
}