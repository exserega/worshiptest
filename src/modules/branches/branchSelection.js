/**
 * Branch Selection Module
 * Модуль выбора филиала для новых пользователей
 */

const db = firebase.firestore();
const auth = firebase.auth();

// DOM элементы
let branchSelectionModal = null;
let branchesList = null;
let selectedBranchId = null;

/**
 * Инициализация модуля
 */
export function initBranchSelection() {
    branchSelectionModal = document.getElementById('branch-selection-modal');
    branchesList = document.getElementById('branches-list');
    
    if (!branchSelectionModal || !branchesList) {
        console.error('Branch selection elements not found', {
            modal: branchSelectionModal,
            list: branchesList
        });
        return;
    }
    console.log('✅ Branch selection initialized');
}

/**
 * Показать модальное окно выбора филиала
 */
export async function showBranchSelection() {
    if (!branchSelectionModal) {
        console.error('❌ Branch selection modal not initialized');
        return;
    }
    
    console.log('🏢 Showing branch selection modal');
    branchSelectionModal.classList.add('visible');
    
    // Загружаем список филиалов
    await loadBranches();
}

/**
 * Скрыть модальное окно выбора филиала
 */
export function hideBranchSelection() {
    if (!branchSelectionModal) return;
    
    branchSelectionModal.classList.remove('visible');
}

/**
 * Загрузить список филиалов
 */
async function loadBranches() {
    try {
        branchesList.innerHTML = `
            <div class="loading-branches">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Загрузка филиалов...</span>
            </div>
        `;
        
        const snapshot = await db.collection('branches')
            .orderBy('name', 'asc')
            .get();
            
        if (snapshot.empty) {
            branchesList.innerHTML = `
                <div class="no-branches">
                    <i class="fas fa-building"></i>
                    <p>Нет доступных филиалов</p>
                </div>
            `;
            return;
        }
        
        // Очищаем загрузку
        branchesList.innerHTML = '';
        
        // Рендерим карточки филиалов
        snapshot.forEach(doc => {
            const branch = { id: doc.id, ...doc.data() };
            renderBranchCard(branch);
        });
        
        // Добавляем кнопку подтверждения
        addConfirmButton();
        
    } catch (error) {
        console.error('Error loading branches:', error);
        branchesList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки филиалов</p>
            </div>
        `;
    }
}

/**
 * Отрисовать карточку филиала
 */
function renderBranchCard(branch) {
    const card = document.createElement('div');
    card.className = 'branch-card';
    card.dataset.branchId = branch.id;
    
    card.innerHTML = `
        <h3>${branch.name || 'Без названия'}</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${branch.address || 'Адрес не указан'}</p>
        <p class="member-count"><i class="fas fa-users"></i> ${branch.memberCount || 0} участников</p>
    `;
    
    // Обработчик клика
    card.addEventListener('click', () => selectBranch(branch.id, card));
    
    branchesList.appendChild(card);
}

/**
 * Выбрать филиал
 */
function selectBranch(branchId, cardElement) {
    // Убираем выделение с других карточек
    document.querySelectorAll('.branch-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Выделяем текущую карточку
    cardElement.classList.add('selected');
    selectedBranchId = branchId;
    
    // Активируем кнопку подтверждения
    const confirmButton = document.querySelector('.confirm-button');
    if (confirmButton) {
        confirmButton.disabled = false;
    }
}

/**
 * Добавить кнопку подтверждения
 */
function addConfirmButton() {
    // Проверяем, не добавлена ли уже кнопка
    if (document.querySelector('.branch-selection-actions')) return;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'branch-selection-actions';
    
    actionsDiv.innerHTML = `
        <button class="confirm-button" disabled>
            <i class="fas fa-check"></i>
            Выбрать филиал
        </button>
    `;
    
    const modalContent = branchSelectionModal.querySelector('.modal-content');
    modalContent.appendChild(actionsDiv);
    
    // Обработчик кнопки подтверждения
    const confirmButton = actionsDiv.querySelector('.confirm-button');
    confirmButton.addEventListener('click', confirmBranchSelection);
}

/**
 * Подтвердить выбор филиала
 */
async function confirmBranchSelection() {
    if (!selectedBranchId || !auth.currentUser) return;
    
    const confirmButton = document.querySelector('.confirm-button');
    confirmButton.disabled = true;
    confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    
    try {
        // Обновляем профиль пользователя
        await db.collection('users').doc(auth.currentUser.uid).update({
            branchId: selectedBranchId,
            status: 'pending', // Устанавливаем статус pending
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Обновляем счетчик участников филиала
        await db.collection('branches').doc(selectedBranchId).update({
            memberCount: firebase.firestore.FieldValue.increment(1)
        });
        
        console.log('✅ Branch selected successfully');
        
        // Скрываем модальное окно
        hideBranchSelection();
        
        // Перезагружаем страницу для применения изменений
        window.location.reload();
        
    } catch (error) {
        console.error('Error selecting branch:', error);
        confirmButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Ошибка';
        
        setTimeout(() => {
            confirmButton.disabled = false;
            confirmButton.innerHTML = '<i class="fas fa-check"></i> Выбрать филиал';
        }, 2000);
    }
}

/**
 * Проверить нужно ли показать выбор филиала
 */
export async function checkAndShowBranchSelection() {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('🔍 Checking user branch:', {
                userId: user.uid,
                branchId: userData.branchId,
                status: userData.status
            });
            
            // Если у пользователя нет филиала, показываем выбор
            if (!userData.branchId) {
                console.log('📋 User has no branch, showing selection');
                await showBranchSelection();
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Error checking user branch:', error);
        return false;
    }
}

// Экспортируем функции
export default {
    initBranchSelection,
    showBranchSelection,
    hideBranchSelection,
    checkAndShowBranchSelection
};