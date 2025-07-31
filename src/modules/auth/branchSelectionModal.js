// ====================================
// BRANCH SELECTION MODAL FOR NEW USERS
// Модальное окно выбора филиала для новых пользователей
// ====================================

import { createJoinRequest } from '/src/modules/requests/requestsAPI.js';

// Firebase из глобального объекта (v8) - получаем динамически
const getDb = () => {
    if (window.firebase && window.firebase.firestore) {
        return window.firebase.firestore();
    }
    console.error('Firebase не инициализирован!');
    return null;
};

/**
 * Показывает модальное окно выбора филиала для нового пользователя
 */
export async function showNewUserBranchSelection(userId, userData) {
    try {
        const db = getDb();
        if (!db) {
            console.error('❌ Firebase не инициализирован');
            return;
        }
        
        // Загружаем список филиалов
        const branchesSnapshot = await db.collection('branches').get();
        const branches = [];
        branchesSnapshot.forEach(doc => {
            branches.push({ id: doc.id, ...doc.data() });
        });
        
        if (branches.length === 0) {
            console.warn('No branches available');
            return;
        }
        
        const modalHtml = `
            <div class="modal branch-selection-modal new-user-branch" id="new-user-branch-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-building"></i> Добро пожаловать! Выберите ваш филиал</h2>
                    </div>
                    
                    <div class="modal-body">
                        <p class="welcome-text">
                            Для начала работы с системой, пожалуйста, выберите филиал, 
                            к которому вы относитесь. После выбора будет создана заявка 
                            на вступление, которую рассмотрит администратор.
                        </p>
                        
                        <div class="branches-grid">
                            ${branches.map(branch => `
                                <div class="branch-option" data-branch-id="${branch.id}">
                                    <h3>${branch.name}</h3>
                                    <p class="branch-location">
                                        <i class="fas fa-map-marker-alt"></i> ${branch.city}
                                    </p>
                                    ${branch.address ? `<p class="branch-details">${branch.address}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="divider-section">
                            <div class="divider-line"></div>
                            <span class="divider-text">или</span>
                            <div class="divider-line"></div>
                        </div>
                        
                        <button class="btn-create-branch" onclick="window.showCreateBranchForm('${userId}')">
                            <i class="fas fa-plus-circle"></i>
                            Не нашли свой филиал? Подайте заявку на создание
                        </button>
                        
                        <div class="info-note">
                            <i class="fas fa-info-circle"></i>
                            <span>После выбора филиала вы сможете пользоваться системой в режиме ожидания подтверждения</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем стили
        addNewUserBranchStyles();
        
        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Обработчики выбора филиала
        const branchOptions = document.querySelectorAll('.branch-option');
        branchOptions.forEach(option => {
            option.addEventListener('click', async () => {
                const branchId = option.dataset.branchId;
                await handleBranchSelection(userId, userData, branchId);
            });
        });
        
    } catch (error) {
        console.error('Error showing branch selection:', error);
    }
}

/**
 * Обрабатывает выбор филиала
 */
async function handleBranchSelection(userId, userData, branchId) {
    try {
        console.log('🏢 Handling branch selection:', { userId, branchId, userData });
        
        // Показываем индикатор загрузки
        const modal = document.getElementById('new-user-branch-modal');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Создаем заявку на вступление...</p>
            </div>
        `;
        
        // Создаем заявку на вступление
        console.log('📝 Creating join request...');
        const result = await createJoinRequest(userId, branchId, userData);
        console.log('📝 Join request result:', result);
        
        if (result.success) {
            // Сначала проверяем текущий статус пользователя
            console.log('📝 Checking current user status before update...');
            const db = getDb();
            const userDoc = await db.collection('users').doc(userId).get();
            const currentUserData = userDoc.data();
            console.log('📝 Current user data:', currentUserData);
            
            // Обновляем профиль пользователя
            console.log('📝 Updating user profile...');
            const updateData = {
                branchId: branchId,
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Обновляем статус только если он еще не 'pending' или 'active'
            if (!currentUserData.status || currentUserData.status === 'active') {
                updateData.status = 'pending';
                console.log('📝 Setting status to pending');
            }
            
            await db.collection('users').doc(userId).update(updateData);
            console.log('✅ User profile updated with data:', updateData);
            
            // Показываем успешное сообщение и автоматически перезагружаем через 2 секунды
            modalContent.innerHTML = `
                <div class="success-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>Заявка отправлена!</h3>
                    <p>Ваша заявка на вступление в филиал отправлена администратору.</p>
                    <p class="info-text">Вы можете пользоваться системой в ограниченном режиме до подтверждения заявки.</p>
                    <p class="info-text" style="color: #999; margin-top: 10px;">Перенаправление через <span id="countdown">3</span> секунды...</p>
                </div>
            `;
            
            // Обратный отсчет и автоматическая перезагрузка
            let countdown = 3;
            const countdownInterval = setInterval(() => {
                countdown--;
                const countdownEl = document.getElementById('countdown');
                if (countdownEl) {
                    countdownEl.textContent = countdown;
                }
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    window.location.href = '/'; // Перенаправляем на главную страницу
                }
            }, 1000);
            
        } else {
            console.error('❌ Failed to create join request:', result.error);
            throw new Error(result.error || 'Не удалось создать заявку');
        }
        
    } catch (error) {
        console.error('❌ Error handling branch selection:', error);
        
        // Показываем ошибку в модальном окне
        const modal = document.getElementById('new-user-branch-modal');
        const modalContent = modal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle" style="color: #ff4444; font-size: 48px;"></i>
                    <h3>Ошибка!</h3>
                    <p>Произошла ошибка при создании заявки:</p>
                    <p style="color: #ff4444;">${error.message}</p>
                    <button class="btn-primary" onclick="window.location.reload()">
                        Попробовать снова
                    </button>
                </div>
            `;
        } else {
            alert('Ошибка при создании заявки: ' + error.message);
        }
    }
}

/**
 * Показывает форму создания нового филиала
 */
window.showCreateBranchForm = function(userId) {
    const modal = document.getElementById('new-user-branch-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2><i class="fas fa-building"></i> Заявка на создание филиала</h2>
            <button class="back-button" onclick="window.location.reload()">
                <i class="fas fa-arrow-left"></i> Назад
            </button>
        </div>
        
        <div class="modal-body">
            <form id="create-branch-form" class="branch-form">
                <div class="form-group">
                    <label>Название филиала *</label>
                    <input type="text" id="branch-name" required 
                           placeholder="Например: Алматы Центр">
                </div>
                
                <div class="form-group">
                    <label>Город *</label>
                    <input type="text" id="branch-city" required 
                           placeholder="Например: Алматы">
                </div>
                
                <div class="form-group">
                    <label>Адрес</label>
                    <input type="text" id="branch-address" 
                           placeholder="Например: ул. Абая 150">
                </div>
                
                <div class="form-group">
                    <label>Контактный телефон *</label>
                    <input type="tel" id="branch-phone" required 
                           placeholder="+7 (777) 123-45-67">
                </div>
                
                <div class="form-group">
                    <label>Telegram/WhatsApp</label>
                    <input type="text" id="branch-social" 
                           placeholder="@username или ссылка">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-paper-plane"></i> Отправить заявку
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Обработчик отправки формы
    document.getElementById('create-branch-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const branchData = {
            name: document.getElementById('branch-name').value,
            city: document.getElementById('branch-city').value,
            address: document.getElementById('branch-address').value,
            contactPhone: document.getElementById('branch-phone').value,
            contactSocial: document.getElementById('branch-social').value
        };
        
        await handleCreateBranchRequest(userId, branchData);
    });
};

/**
 * Обрабатывает заявку на создание филиала
 */
async function handleCreateBranchRequest(userId, branchData) {
    try {
        const { createBranchRequest } = await import('../requests/requestsAPI.js');
        
        const modal = document.getElementById('new-user-branch-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Отправляем заявку...</p>
            </div>
        `;
        
        const result = await createBranchRequest(userId, branchData);
        
        if (result.success) {
            modalContent.innerHTML = `
                <div class="success-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>Заявка отправлена!</h3>
                    <p>Ваша заявка на создание филиала отправлена администратору.</p>
                    <p class="info-text">Мы свяжемся с вами после рассмотрения заявки.</p>
                    <button class="btn-primary" onclick="window.location.reload()">
                        Закрыть
                    </button>
                </div>
            `;
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Error creating branch request:', error);
        alert('Ошибка при отправке заявки: ' + error.message);
    }
}

/**
 * Добавляет стили для модального окна
 */
function addNewUserBranchStyles() {
    if (document.getElementById('new-user-branch-styles')) return;
    
    const styles = `
        <style id="new-user-branch-styles">
            .new-user-branch {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .new-user-branch .modal-content {
                background: #1a1a1a;
                border-radius: 16px;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
            }
            
            .new-user-branch .modal-header {
                padding: 24px;
                border-bottom: 1px solid #333;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .new-user-branch .modal-header h2 {
                margin: 0;
                color: #fff;
                font-size: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .new-user-branch .back-button {
                background: none;
                border: 1px solid #333;
                color: #999;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .new-user-branch .back-button:hover {
                border-color: #666;
                color: #fff;
            }
            
            .new-user-branch .modal-body {
                padding: 24px;
            }
            
            .new-user-branch .welcome-text {
                color: #999;
                line-height: 1.6;
                margin-bottom: 24px;
            }
            
            .new-user-branch .branches-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .new-user-branch .branch-option {
                background: #2a2a2a;
                border: 2px solid #333;
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .new-user-branch .branch-option:hover {
                border-color: #4A90E2;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
            }
            
            .new-user-branch .branch-option h3 {
                margin: 0 0 8px 0;
                color: #fff;
                font-size: 18px;
            }
            
            .new-user-branch .branch-location {
                color: #999;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
            }
            
            .new-user-branch .branch-details {
                color: #666;
                margin: 8px 0 0 0;
                font-size: 13px;
            }
            
            .new-user-branch .divider-section {
                display: flex;
                align-items: center;
                margin: 24px 0;
                gap: 16px;
            }
            
            .new-user-branch .divider-line {
                flex: 1;
                height: 1px;
                background: #333;
            }
            
            .new-user-branch .divider-text {
                color: #666;
                font-size: 14px;
            }
            
            .new-user-branch .btn-create-branch {
                width: 100%;
                padding: 16px;
                background: transparent;
                border: 2px dashed #444;
                color: #999;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .new-user-branch .btn-create-branch:hover {
                border-color: #666;
                color: #fff;
                background: rgba(255, 255, 255, 0.05);
            }
            
            .new-user-branch .info-note {
                margin-top: 24px;
                padding: 16px;
                background: rgba(74, 144, 226, 0.1);
                border: 1px solid rgba(74, 144, 226, 0.3);
                border-radius: 8px;
                color: #4A90E2;
                display: flex;
                align-items: start;
                gap: 12px;
                font-size: 14px;
            }
            
            /* Form styles */
            .new-user-branch .branch-form {
                margin-top: 0;
            }
            
            .new-user-branch .form-group {
                margin-bottom: 20px;
            }
            
            .new-user-branch .form-group label {
                display: block;
                color: #999;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .new-user-branch .form-group input {
                width: 100%;
                padding: 12px 16px;
                background: #2a2a2a;
                border: 1px solid #333;
                border-radius: 8px;
                color: #fff;
                font-size: 16px;
                transition: all 0.2s;
            }
            
            .new-user-branch .form-group input:focus {
                outline: none;
                border-color: #4A90E2;
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
            }
            
            .new-user-branch .form-actions {
                margin-top: 24px;
            }
            
            .new-user-branch .btn-primary {
                width: 100%;
                padding: 14px 24px;
                background: #4A90E2;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .new-user-branch .btn-primary:hover {
                background: #357ABD;
            }
            
            /* Loading and success states */
            .new-user-branch .loading-state,
            .new-user-branch .success-state {
                padding: 60px;
                text-align: center;
            }
            
            .new-user-branch .loading-state i,
            .new-user-branch .success-state i {
                font-size: 48px;
                margin-bottom: 16px;
                display: block;
            }
            
            .new-user-branch .loading-state i {
                color: #4A90E2;
            }
            
            .new-user-branch .success-state i {
                color: #4CAF50;
            }
            
            .new-user-branch .success-state h3 {
                color: #fff;
                margin: 16px 0;
            }
            
            .new-user-branch .success-state p {
                color: #999;
                margin: 8px 0;
            }
            
            .new-user-branch .success-state .btn-primary {
                margin-top: 24px;
                display: inline-flex;
                width: auto;
                padding: 12px 24px;
            }
            
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
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}