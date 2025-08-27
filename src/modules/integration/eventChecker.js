/**
 * Модуль для проверки событий на выбранную дату
 * Часть интеграции сет-листов с календарем событий
 */

import { db } from '../../../firebase-init.js';
import { getCurrentBranchId } from '../auth/authCheck.js';
import logger from '../../utils/logger.js';

/**
 * Проверяет события на конкретную дату
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @returns {Promise<Array>} Массив событий на эту дату
 */
export async function checkEventsOnDate(dateString) {
    try {
        logger.log('📅 Проверка событий на дату:', dateString);
        
        // Получаем текущий филиал пользователя
        const branchId = getCurrentBranchId();
        logger.log('🏢 Текущий филиал:', branchId);
        
        if (!branchId) {
            logger.warn('❌ Филиал пользователя не найден');
            return [];
        }
        
        // Создаем объекты даты для начала и конца дня
        const startOfDay = new Date(dateString);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateString);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Запрашиваем события из Firestore
        const eventsRef = db.collection('events');
        // Временно упрощаем запрос - сначала получаем все события филиала
        const query = eventsRef
            .where('branchId', '==', branchId)
            .where('archived', '==', false);
            
        const snapshot = await query.get();
        
        logger.log(`📊 Получено ${snapshot.size} событий из базы для филиала ${branchId}`);
        
        if (snapshot.empty) {
            logger.warn('⚠️ В базе нет событий для этого филиала');
            return [];
        }
        
        const events = [];
        snapshot.forEach(doc => {
            const eventData = doc.data();
            const eventDate = eventData.date.toDate();
            
            // Логируем для отладки
            logger.log(`📅 Проверяем событие "${eventData.name}" на дату:`, eventDate.toISOString());
            logger.log(`📅 Сравниваем с диапазоном: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
            
            // Фильтруем по дате на клиентской стороне
            if (eventDate >= startOfDay && eventDate <= endOfDay) {
                logger.log(`✅ Событие "${eventData.name}" подходит по дате`);
                events.push({
                    id: doc.id,
                    ...eventData,
                    // Преобразуем timestamp в строку для удобства
                    dateString: eventDate.toISOString()
                });
            } else {
                logger.log(`❌ Событие "${eventData.name}" не подходит по дате`);
            }
        });
        
        logger.log(`📅 Найдено ${events.length} событий на дату ${dateString}`);
        
        // Сортируем события по времени
        events.sort((a, b) => a.date.toDate() - b.date.toDate());
        
        return events;
        
    } catch (error) {
        logger.error('❌ Ошибка при проверке событий:', error);
        return [];
    }
}

/**
 * Проверяет, есть ли у события сет-лист
 * @param {Object} event - Объект события
 * @returns {boolean}
 */
export function eventHasSetlist(event) {
    return !!(event && event.setlistId);
}

/**
 * Форматирует информацию о событии для отображения
 * @param {Object} event - Объект события
 * @returns {Object} Отформатированная информация
 */
export function formatEventInfo(event) {
    if (!event) return null;
    
    const date = event.date.toDate ? event.date.toDate() : new Date(event.dateString);
    const time = date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return {
        id: event.id,
        name: event.name || 'Без названия',
        time: time,
        hasSetlist: eventHasSetlist(event),
        setlistId: event.setlistId || null,
        leaderName: event.leaderName || 'Не указан',
        participantCount: event.participantCount || 0
    };
}

/**
 * Создает описание для списка событий
 * @param {Array} events - Массив событий
 * @returns {string} Текстовое описание
 */
export function getEventsDescription(events) {
    if (!events || events.length === 0) {
        return 'На эту дату нет событий';
    }
    
    if (events.length === 1) {
        const event = events[0];
        const info = formatEventInfo(event);
        return `Найдено событие: "${info.name}" в ${info.time}`;
    }
    
    return `Найдено ${events.length} события на эту дату`;
}