// ====================================
// МОДУЛЬ ВЫБОРА ФИЛИАЛА ДЛЯ СЕТ-ЛИСТОВ
// ====================================

import { db } from '../../../js/firebase-config.js';
import { appState } from '../../../src/js/state/appState.js';

// Состояние выбранного филиала
let selectedBranchId = null;
let userMainBranchId = null;
let branches = [];

/**
 * Инициализация селектора филиалов
 */
export function initBranchSelector() {
    console.log('🏢 Initializing branch selector for setlists...');
    
    const selector = document.getElementById('setlist-branch-selector');
    if (!selector) {
        console.error('Branch selector not found');
        return;
    }
    
    // Загружаем основной филиал пользователя
    const currentUser = appState.currentUser;
    if (currentUser && currentUser.branchId) {
        userMainBranchId = currentUser.branchId;
        selectedBranchId = userMainBranchId; // По умолчанию выбран основной филиал
    }
    
    // Загружаем список филиалов
    loadBranches();
    
    // Обработчик изменения филиала
    selector.addEventListener('change', handleBranchChange);
}

/**
 * Загрузка списка филиалов
 */
async function loadBranches() {
    try {
        const snapshot = await db.collection('branches')
            .orderBy('name', 'asc')
            .get();
            
        branches = [];
        snapshot.forEach(doc => {
            branches.push({ id: doc.id, ...doc.data() });
        });
        
        updateBranchSelector();
        
    } catch (error) {
        console.error('Error loading branches:', error);
    }
}

/**
 * Обновление опций селектора
 */
function updateBranchSelector() {
    const selector = document.getElementById('setlist-branch-selector');
    if (!selector) return;
    
    selector.innerHTML = '';
    
    // Добавляем опции филиалов
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.id;
        option.textContent = branch.name;
        
        // Добавляем метку для основного филиала пользователя
        if (branch.id === userMainBranchId) {
            option.textContent += ' (Мой филиал)';
        }
        
        selector.appendChild(option);
    });
    
    // Устанавливаем выбранный филиал
    if (selectedBranchId) {
        selector.value = selectedBranchId;
    }
}

/**
 * Обработчик изменения филиала
 */
function handleBranchChange(event) {
    const newBranchId = event.target.value;
    if (newBranchId === selectedBranchId) return;
    
    selectedBranchId = newBranchId;
    
    // Показываем/скрываем информацию о просмотре другого филиала
    const infoElement = document.querySelector('.branch-selector-info');
    if (infoElement) {
        if (selectedBranchId !== userMainBranchId) {
            infoElement.style.display = 'flex';
        } else {
            infoElement.style.display = 'none';
        }
    }
    
    // Запускаем событие для перезагрузки сет-листов
    window.dispatchEvent(new CustomEvent('branchChanged', {
        detail: { branchId: selectedBranchId }
    }));
}

/**
 * Получить ID выбранного филиала
 */
export function getSelectedBranchId() {
    return selectedBranchId || userMainBranchId;
}

/**
 * Проверить, является ли выбранный филиал основным для пользователя
 */
export function isUserMainBranch() {
    return selectedBranchId === userMainBranchId || !selectedBranchId;
}

/**
 * Проверить, может ли пользователь редактировать в текущем филиале
 */
export function canEditInCurrentBranch() {
    // Если не свой филиал - нельзя редактировать
    if (!isUserMainBranch()) {
        return false;
    }
    
    // Если свой филиал - проверяем статус пользователя
    try {
        const currentUser = appState.currentUser;
        return currentUser && currentUser.status === 'active';
    } catch (e) {
        console.warn('AppState not loaded, checking basic auth');
        // Если appState не загружен, проверяем базовую авторизацию
        return false;
    }
}

/**
 * Показать сообщение о просмотре чужого филиала
 */
export function showOtherBranchMessage(action) {
    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    const branchName = selectedBranch ? selectedBranch.name : 'другого филиала';
    
    const message = `Вы просматриваете сет-листы филиала "${branchName}". ${action} доступно только в вашем филиале.`;
    
    alert(message);
}