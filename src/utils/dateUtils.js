/**
 * Утилиты для работы с датами
 */

/**
 * Форматирует дату в читаемый вид
 * @param {Date|Timestamp} date - Дата для форматирования
 * @returns {string} Отформатированная дата
 */
export function formatDate(date) {
    if (!date) return '';
    
    // Если это Firestore Timestamp
    if (date.toDate) {
        date = date.toDate();
    }
    
    // Форматируем дату
    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('ru-RU', options);
}

/**
 * Форматирует дату в короткий вид
 * @param {Date|Timestamp} date - Дата для форматирования
 * @returns {string} Отформатированная дата (дд.мм.гггг)
 */
export function formatShortDate(date) {
    if (!date) return '';
    
    if (date.toDate) {
        date = date.toDate();
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}