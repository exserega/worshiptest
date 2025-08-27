/**
 * Утилита для создания нескольких тестовых событий на одну дату
 * Используется для тестирования выбора из нескольких событий
 */

import { db } from '../../utils/firebase-v8-adapter.js';
import { getCurrentBranchId } from '../auth/authCheck.js';
import logger from '../../utils/logger.js';

/**
 * Создает несколько тестовых событий на указанную дату
 * @param {Date} date - Дата для создания событий
 */
export async function createMultipleTestEvents(date) {
    try {
        const branchId = getCurrentBranchId();
        if (!branchId) {
            throw new Error('Филиал не определен');
        }
        
        // Создаем 3 тестовых события на разное время
        const events = [
            {
                name: 'Утренняя молитва',
                time: '08:00',
                leaderId: 'test_leader_1',
                leaderName: 'Иван Иванов',
                participantCount: 5,
                setlistId: null // Без сет-листа
            },
            {
                name: 'Молодёжное служение',
                time: '13:30',
                leaderId: 'test_leader_2',
                leaderName: 'Петр Петров',
                participantCount: 12,
                setlistId: 'test_setlist_1', // С сет-листом
                songCount: 7
            },
            {
                name: 'Вечернее прославление',
                time: '19:00',
                leaderId: 'test_leader_3',
                leaderName: 'Сергей Сергеев',
                participantCount: 8,
                setlistId: null // Без сет-листа
            }
        ];
        
        const promises = events.map(async (eventData) => {
            // Создаем дату с нужным временем
            const [hours, minutes] = eventData.time.split(':');
            const eventDate = new Date(date);
            eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const eventDoc = {
                name: eventData.name,
                date: firebase.firestore.Timestamp.fromDate(eventDate),
                branchId: branchId,
                leaderId: eventData.leaderId,
                leaderName: eventData.leaderName,
                participantCount: eventData.participantCount,
                setlistId: eventData.setlistId,
                songCount: eventData.songCount || 0,
                participants: {},
                isArchived: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Удаляем undefined поля
            Object.keys(eventDoc).forEach(key => {
                if (eventDoc[key] === undefined || eventDoc[key] === null) {
                    delete eventDoc[key];
                }
            });
            
            const docRef = await db.collection('worship_events').add(eventDoc);
            logger.log('✅ Создано тестовое событие:', eventData.name, 'ID:', docRef.id);
            
            return docRef.id;
        });
        
        const eventIds = await Promise.all(promises);
        
        logger.log('✅ Создано', eventIds.length, 'тестовых событий на дату:', date.toLocaleDateString('ru-RU'));
        
        return eventIds;
        
    } catch (error) {
        logger.error('❌ Ошибка при создании тестовых событий:', error);
        throw error;
    }
}

// Экспортируем для использования в консоли
window.createMultipleTestEvents = createMultipleTestEvents;