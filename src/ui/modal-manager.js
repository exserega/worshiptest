/**
 * ===================================================================
 * MODAL MANAGER MODULE
 * ===================================================================
 * Модуль для управления модальными окнами, уведомлениями и диалогами
 * 
 * Функции:
 * - showNotification() - показ уведомлений с анимацией
 * - showConfirmDialog() - диалоги подтверждения
 * - showModal() - управление модальными окнами
 * - closeModal() - закрытие модальных окон
 * - showToast() - быстрые toast сообщения
 */

// ====================================
// NOTIFICATION SYSTEM
// ====================================

/**
 * Показывает уведомление пользователю с анимацией
 * @param {string} message - Текст уведомления
 * @param {string} type - Тип уведомления: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Длительность показа в миллисекундах (по умолчанию 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
    console.log('📢 [ModalManager] showNotification:', message, type);
    
    // Проверяем что document.body существует
    if (!document.body) {
        console.error('❌ [ModalManager] document.body not found!');
        return;
    }
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    console.log('📢 [ModalManager] Notification element created:', notification);
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--bg-secondary, #1f2937);
        color: var(--text-primary, #e5e7eb);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 16px 24px;
        font-size: 0.95rem;
        z-index: 99999;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        transform: translateX(calc(100% + 40px));
        transition: transform 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
        min-width: 250px;
        font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    `;
    
    // Цветовая схема в зависимости от типа
    switch (type) {
        case 'success':
            notification.style.borderColor = '#10b981';
            notification.style.backgroundColor = '#065f46';
            notification.style.color = '#d1fae5';
            break;
        case 'error':
            notification.style.borderColor = '#ef4444';
            notification.style.backgroundColor = '#7f1d1d';
            notification.style.color = '#fee2e2';
            break;
        case 'warning':
            notification.style.borderColor = '#f59e0b';
            notification.style.backgroundColor = '#78350f';
            notification.style.color = '#fef3c7';
            break;
        case 'info':
        default:
            notification.style.borderColor = '#3b82f6';
            notification.style.backgroundColor = '#1e3a8a';
            notification.style.color = '#dbeafe';
            break;
    }
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    console.log('📢 [ModalManager] Notification added to DOM, parent:', notification.parentNode);
    console.log('📢 [ModalManager] Notification computed styles:', window.getComputedStyle(notification).transform);
    
    // Показываем с анимацией
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        console.log('📢 [ModalManager] Transform set to translateX(0)');
    }, 100);
    
    // Скрываем через заданное время
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
    
    return notification;
}

/**
 * Быстрые методы для разных типов уведомлений
 */
export function showSuccess(message, duration = 3000) {
    return showNotification(message, 'success', duration);
}

export function showError(message, duration = 3000) {
    return showNotification(message, 'error', duration);
}

export function showWarning(message, duration = 3000) {
    return showNotification(message, 'warning', duration);
}

export function showInfo(message, duration = 3000) {
    return showNotification(message, 'info', duration);
}

// ====================================
// MODAL SYSTEM
// ====================================

/**
 * Показывает модальное окно
 * @param {string} modalId - ID модального окна
 * @param {Object} options - Опции отображения
 */
export function showModal(modalId, options = {}) {
    console.log('🎭 [ModalManager] showModal:', modalId);
    
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error('❌ Modal not found:', modalId);
        return false;
    }
    
    // Добавляем класс показа
    modal.classList.add('show');
    
    // Опциональная блокировка скролла
    if (options.blockScroll !== false) {
        document.body.style.overflow = 'hidden';
    }
    
    // Фокус на первом элементе
    if (options.autoFocus !== false) {
        const firstInput = modal.querySelector('input, button, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    return true;
}

/**
 * Закрывает модальное окно
 * @param {string} modalId - ID модального окна
 */
export function closeModal(modalId) {
    console.log('🎭 [ModalManager] closeModal:', modalId);
    
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error('❌ Modal not found:', modalId);
        return false;
    }
    
    // Убираем класс показа
    modal.classList.remove('show');
    
    // Восстанавливаем скролл
    document.body.style.overflow = '';
    
    return true;
}

/**
 * Закрывает все открытые модальные окна
 */
export function closeAllModals() {
    console.log('🎭 [ModalManager] closeAllModals');
    
    const modals = document.querySelectorAll('.global-fullscreen-overlay.show');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
    
    // Восстанавливаем скролл
    document.body.style.overflow = '';
}

// ====================================
// CONFIRMATION DIALOGS
// ====================================

/**
 * Показывает диалог подтверждения
 * @param {string} message - Текст вопроса
 * @param {Object} options - Опции диалога
 * @returns {Promise<boolean>} - true если подтверждено, false если отменено
 */
export function showConfirmDialog(message, options = {}) {
    return new Promise((resolve) => {
        console.log('❓ [ModalManager] showConfirmDialog:', message);
        
        const {
            title = 'Подтверждение',
            confirmText = 'Да',
            cancelText = 'Отмена',
            type = 'info'
        } = options;
        
        // Создаем элементы диалога
        const overlay = document.createElement('div');
        overlay.className = 'confirm-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.style.cssText = `
            background: var(--container-background-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--text-color); font-size: 1.2rem;">${title}</h3>
            <p style="margin: 0 0 24px 0; color: var(--text-color); line-height: 1.5;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="cancel-btn" style="
                    padding: 8px 16px;
                    border: 1px solid var(--border-color);
                    background: transparent;
                    color: var(--text-color);
                    border-radius: 6px;
                    cursor: pointer;
                ">${cancelText}</button>
                <button class="confirm-btn" style="
                    padding: 8px 16px;
                    border: 1px solid #3b82f6;
                    background: #3b82f6;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">${confirmText}</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Обработчики событий
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        
        const cleanup = () => {
            document.body.removeChild(overlay);
        };
        
        confirmBtn.onclick = () => {
            cleanup();
            resolve(true);
        };
        
        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };
        
        // Закрытие по клику вне диалога
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false);
            }
        };
        
        // Закрытие по Escape
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeydown);
                cleanup();
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleKeydown);
        
        // Фокус на кнопке подтверждения
        setTimeout(() => confirmBtn.focus(), 100);
    });
}

/**
 * Диалог с несколькими вариантами (до 3 кнопок)
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.message
 * @param {Array<{key:string,label:string,variant?:'primary'|'danger'|'default'}>} params.choices
 * @returns {Promise<string|null>} возвращает key выбранного варианта или null
 */
export function showChoiceDialog({ title = 'Выбор', message = '', choices = [] } = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'choice-dialog-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.5);
            display:flex; align-items:center; justify-content:center; z-index:10002;
        `;
        const dialog = document.createElement('div');
        dialog.className = 'choice-dialog';
        dialog.style.cssText = `
            background: var(--container-background-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px; max-width: 460px; margin: 20px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        `;
        const header = `<h3 style="margin:0 0 12px 0;color:var(--text-color);font-size:1.1rem;">${title}</h3>`;
        const body = `<p style="margin:0 0 18px 0;color:var(--text-color);line-height:1.5;">${message}</p>`;
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;';
        choices.slice(0,3).forEach(c => {
            const btn = document.createElement('button');
            btn.textContent = c.label;
            btn.style.cssText = `padding:8px 14px;border-radius:6px;cursor:pointer;border:1px solid var(--border-color);`;
            if (c.variant === 'primary') {
                btn.style.background = '#22d3ee';
                btn.style.color = '#111827';
                btn.style.borderColor = '#22d3ee';
            } else if (c.variant === 'danger') {
                btn.style.background = '#e74c3c';
                btn.style.color = '#fee2e2';
                btn.style.borderColor = '#e74c3c';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-color)';
            }
            btn.onclick = () => { cleanup(); resolve(c.key); };
            actions.appendChild(btn);
        });
        dialog.innerHTML = header + body;
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        const cleanup = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); resolve(null); } });
        document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ document.removeEventListener('keydown', esc); cleanup(); resolve(null);} });
    });
}

// ====================================
// TOAST SYSTEM
// ====================================

/**
 * Показывает быстрое toast сообщение
 * @param {string} message - Текст сообщения
 * @param {Object} options - Опции toast
 */
export function showToast(message, options = {}) {
    const {
        type = 'info',
        duration = 2000,
        position = 'bottom-right'
    } = options;
    
    console.log('🍞 [ModalManager] showToast:', message, type);
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Позиционирование
    const positions = {
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' },
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' }
    };
    
    const pos = positions[position] || positions['bottom-right'];
    
    toast.style.cssText = `
        position: fixed;
        ${Object.entries(pos).map(([key, value]) => `${key}: ${value}`).join('; ')};
        background: var(--container-background-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.8rem;
        z-index: 10002;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        max-width: 250px;
    `;
    
    document.body.appendChild(toast);
    
    // Показываем с анимацией
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 50);
    
    // Скрываем
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
    
    return toast;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Проверяет, открыто ли модальное окно
 * @param {string} modalId - ID модального окна
 * @returns {boolean}
 */
export function isModalOpen(modalId) {
    const modal = document.getElementById(modalId);
    return modal ? modal.classList.contains('show') : false;
}

/**
 * Получает все открытые модальные окна
 * @returns {NodeList}
 */
export function getOpenModals() {
    return document.querySelectorAll('.global-fullscreen-overlay.show');
}

// ====================================
// MODULE METADATA
// ====================================

export const metadata = {
    name: 'ModalManager',
    version: '2.0.0',
    description: 'Полноценный модуль для управления модальными окнами, уведомлениями и диалогами',
    functions: [
        'showNotification',
        'showSuccess',
        'showError', 
        'showWarning',
        'showInfo',
        'showModal',
        'closeModal',
        'closeAllModals',
        'showConfirmDialog',
        'showToast',
        'isModalOpen',
        'getOpenModals'
    ]
};