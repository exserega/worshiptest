// ====================================
// 🚀 USER NAVIGATION MODULE
// ====================================
// Обработка кнопки "Профиль" в нижней навигации
// Для гостей показывает предложение зарегистрироваться
// ====================================

import { isUserGuest, showGuestProfileMessage } from './authCheck.js';
import logger from '../../utils/logger.js';

/**
 * Инициализирует обработчик кнопки пользователя
 */
export function initUserNavigation() {
    // Поддержка обеих кнопок профиля - в хедере и старой в навигации (если есть)
    const profileButton = document.getElementById('profile-button');
    const userButton = document.getElementById('toggle-user');
    
    const handleProfileClick = () => {
        // Проверяем, является ли пользователь гостем
        if (isUserGuest()) {
            showGuestProfileMessage();
            return;
        }
        
        // Для зарегистрированных пользователей - переход на страницу настроек
        window.location.href = '/public/settings.html';
    };
    
    // Подключаем обработчик к обеим кнопкам
    if (profileButton) {
        profileButton.addEventListener('click', handleProfileClick);
    }
    
    if (userButton) {
        userButton.addEventListener('click', handleProfileClick);
    }
    
    logger.log('👤 User navigation initialized');
}