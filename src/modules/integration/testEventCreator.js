/**
 * Временный модуль для создания тестовых событий
 * Используется только для разработки
 */

import { db } from '../../../firebase-init.js';
import { getCurrentBranchId } from '../auth/authCheck.js';
import logger from '../../utils/logger.js';

/**
 * Создает тестовое событие на указанную дату
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @param {Object} options - Дополнительные параметры события
 * @returns {Promise<string>} ID созданного события
 */
export async function createTestEvent(dateString, options = {}) {
    try {
        const branchId = getCurrentBranchId();
        if (!branchId) {
            throw new Error('Филиал пользователя не найден');
        }
        
        // Создаем дату с временем
        const eventDate = new Date(dateString);
        eventDate.setHours(options.hour || 19, options.minute || 0, 0, 0);
        
        const eventData = {
            name: options.name || `Тестовое событие ${new Date().getTime()}`,
            date: eventDate,
            branchId: branchId,
            archived: false,
            createdAt: new Date(),
            createdBy: firebase.auth().currentUser.uid,
            leaderName: options.leaderName || 'Тестовый лидер',
            participants: options.participants || {},
            participantCount: options.participantCount || 0,
            setlistId: options.setlistId || null
        };
        
        const docRef = await db.collection('events').add(eventData);
        logger.log('✅ Создано тестовое событие:', docRef.id, eventData.name);
        
        return docRef.id;
        
    } catch (error) {
        logger.error('❌ Ошибка создания тестового события:', error);
        throw error;
    }
}

/**
 * Создает несколько тестовых событий на одну дату
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @param {number} count - Количество событий
 */
export async function createMultipleTestEvents(dateString, count = 2) {
    const events = [];
    
    for (let i = 0; i < count; i++) {
        const eventId = await createTestEvent(dateString, {
            name: `Событие ${i + 1}`,
            hour: 18 + i,
            setlistId: i === 0 ? 'test-setlist-id' : null // Первое событие с сет-листом
        });
        events.push(eventId);
    }
    
    logger.log(`✅ Создано ${count} тестовых событий на дату ${dateString}`);
    return events;
}

// Экспортируем в window для удобства тестирования в консоли
if (typeof window !== 'undefined') {
    window.createTestEvent = createTestEvent;
    window.createMultipleTestEvents = createMultipleTestEvents;
}