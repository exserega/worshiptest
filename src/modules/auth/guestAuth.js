// ====================================
// GUEST AUTHENTICATION MODULE
// Модуль для входа в систему как гость
// ====================================

// Firebase из глобального объекта (v8)
const db = window.firebase?.firestore?.() || null;
const auth = window.firebase?.auth?.() || null;

/**
 * Создает гостевую сессию
 */
export async function createGuestSession() {
    try {
        // Генерируем уникальный ID для гостя
        const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Создаем объект гостевого пользователя
        const guestUser = {
            id: guestId,
            name: 'Гость',
            email: null,
            phone: null,
            photoURL: null,
            role: 'guest',
            status: 'active',
            branchId: null, // Гость выберет филиал после входа
            isGuest: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date()
        };
        
        // Сохраняем гостя в localStorage (не в Firestore, т.к. это временная сессия)
        localStorage.setItem('guestUser', JSON.stringify({
            ...guestUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        }));
        
        // Устанавливаем флаг гостевой сессии
        localStorage.setItem('isGuestSession', 'true');
        
        console.log('✅ Guest session created:', guestId);
        
        return {
            success: true,
            guestUser: guestUser
        };
        
    } catch (error) {
        console.error('Error creating guest session:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Показывает модальное окно выбора филиала для гостя
 */
export async function showBranchSelectionModal(branches, onSelect) {
    const modalHtml = `
        <div class="modal branch-selection-modal" id="branch-selection-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-building"></i> Выберите филиал</h2>
                </div>
                
                <div class="modal-body">
                    <p class="info-text">
                        Как гость, вы можете просматривать информацию выбранного филиала.
                        Для полного доступа необходима регистрация.
                    </p>
                    
                    <div class="branches-list">
                        ${branches.map(branch => `
                            <div class="branch-card" data-branch-id="${branch.id}">
                                <h3>${branch.name}</h3>
                                <p class="branch-city">
                                    <i class="fas fa-map-marker-alt"></i> ${branch.city}
                                </p>
                                ${branch.address ? `<p class="branch-address">${branch.address}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="guest-info">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <p><strong>Гостевой доступ позволяет:</strong></p>
                            <ul>
                                <li>Просматривать песни</li>
                                <li>Искать и открывать песни</li>
                                <li>Добавлять песни в "мой список"</li>
                                <li>Просматривать сет-листы филиала</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем стили
    addBranchSelectionStyles();
    
    // Добавляем модальное окно в DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Добавляем обработчики клика на карточки филиалов
    const branchCards = document.querySelectorAll('.branch-card');
    branchCards.forEach(card => {
        card.addEventListener('click', async () => {
            const branchId = card.dataset.branchId;
            
            // Обновляем гостевого пользователя с выбранным филиалом
            const guestUser = JSON.parse(localStorage.getItem('guestUser'));
            guestUser.branchId = branchId;
            localStorage.setItem('guestUser', JSON.stringify(guestUser));
            
            // Закрываем модальное окно
            document.getElementById('branch-selection-modal').remove();
            
            // Вызываем callback
            if (onSelect) {
                onSelect(branchId);
            }
        });
    });
}

/**
 * Проверяет, является ли текущая сессия гостевой
 */
export function isGuestSession() {
    return localStorage.getItem('isGuestSession') === 'true';
}

/**
 * Получает данные гостевого пользователя
 */
export function getGuestUser() {
    const guestData = localStorage.getItem('guestUser');
    return guestData ? JSON.parse(guestData) : null;
}

/**
 * Завершает гостевую сессию
 */
export function endGuestSession() {
    localStorage.removeItem('guestUser');
    localStorage.removeItem('isGuestSession');
    console.log('✅ Guest session ended');
}

/**
 * Конвертирует гостя в зарегистрированного пользователя
 */
export async function convertGuestToUser(guestId, userData) {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }
        
        // Создаем профиль пользователя в Firestore
        const userRef = db.collection('users').doc(userData.uid);
        
        // Сохраняем данные гостя для переноса
        const guestUser = getGuestUser();
        
        const newUserData = {
            ...userData,
            branchId: guestUser?.branchId || null,
            previousGuestId: guestId,
            convertedFromGuest: true,
            convertedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await userRef.set(newUserData, { merge: true });
        
        // Очищаем гостевую сессию
        endGuestSession();
        
        console.log('✅ Guest converted to user:', userData.uid);
        
        return { success: true };
        
    } catch (error) {
        console.error('Error converting guest to user:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Добавляет стили для модального окна выбора филиала
 */
function addBranchSelectionStyles() {
    if (document.getElementById('branch-selection-styles')) return;
    
    const styles = `
        <style id="branch-selection-styles">
            /* Модальное окно выбора филиала */
            .branch-selection-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .branch-selection-modal .modal-content {
                background: #1a1a1a;
                border-radius: 16px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
            }
            
            /* Заголовок */
            .branch-selection-modal .modal-header {
                padding: 24px;
                border-bottom: 1px solid #333;
            }
            
            .branch-selection-modal .modal-header h2 {
                margin: 0;
                font-size: 24px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            /* Тело модального окна */
            .branch-selection-modal .modal-body {
                padding: 24px;
            }
            
            .branch-selection-modal .info-text {
                color: #999;
                margin-bottom: 24px;
                line-height: 1.6;
            }
            
            /* Список филиалов */
            .branch-selection-modal .branches-list {
                display: grid;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .branch-selection-modal .branch-card {
                background: #2a2a2a;
                border: 2px solid #333;
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .branch-selection-modal .branch-card:hover {
                border-color: #4A90E2;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
            }
            
            .branch-selection-modal .branch-card h3 {
                margin: 0 0 8px 0;
                color: #fff;
                font-size: 18px;
            }
            
            .branch-selection-modal .branch-city {
                color: #999;
                margin: 0;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .branch-selection-modal .branch-address {
                color: #666;
                margin: 8px 0 0 0;
                font-size: 13px;
            }
            
            /* Информация о гостевом доступе */
            .branch-selection-modal .guest-info {
                background: #1e1e1e;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 16px;
                display: flex;
                gap: 16px;
                color: #999;
                font-size: 14px;
            }
            
            .branch-selection-modal .guest-info i {
                color: #4A90E2;
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .branch-selection-modal .guest-info p {
                margin: 0 0 8px 0;
                color: #fff;
            }
            
            .branch-selection-modal .guest-info ul {
                margin: 0;
                padding-left: 20px;
            }
            
            .branch-selection-modal .guest-info li {
                margin: 4px 0;
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
                .branch-selection-modal .modal-content {
                    width: 100%;
                    height: 100%;
                    max-height: 100vh;
                    border-radius: 0;
                }
                
                .branch-selection-modal .modal-header h2 {
                    font-size: 20px;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}