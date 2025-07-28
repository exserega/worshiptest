/**
 * Agape Worship App - Modal Management Module (TEMPORARY STUB)
 * Временные заглушки для избежания ошибок импорта
 */

// Временные заглушки - будут заменены в следующем этапе
export function showNotification(message, type = 'info') {
    console.log('📢 showNotification called:', message, type);
    // Используем существующую функцию из script.js
    if (window.showNotification) {
        return window.showNotification(message, type);
    }
    // Fallback - простое отображение в консоли
    console.log(`[${type.toUpperCase()}] ${message}`);
}

export const metadata = {
    name: 'ModalManager',
    version: '1.0.0-stub',
    description: 'Временные заглушки для управления модальными окнами',
    functions: [
        'showNotification'
    ]
};