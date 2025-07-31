// ====================================
// 🚀 USER NAVIGATION MODULE
// ====================================
// Обработка кнопки "Пользователь" в нижней навигации

/**
 * Инициализирует обработчик кнопки пользователя
 */
export function initUserNavigation() {
    const userButton = document.getElementById('toggle-user');
    
    if (!userButton) {
        console.warn('User navigation button not found');
        return;
    }
    
    userButton.addEventListener('click', () => {
        // Переход на страницу настроек
        window.location.href = '/public/public/settings.html';
    });
    
    console.log('👤 User navigation initialized');
}