/**
 * @fileoverview Модуль синхронизации имен пользователей в событиях
 * @module UserNameSync
 */

import { db } from '../../utils/firebase-v8-adapter.js';
import logger from '../../utils/logger.js';

/**
 * Синхронизирует имя пользователя во всех событиях
 * @param {string} userId - ID пользователя
 * @param {string} newName - Новое имя пользователя
 * @returns {Promise<void>}
 */
export async function syncUserNameInEvents(userId, newName) {
    try {
        logger.log('🔄 Начинаем синхронизацию имени пользователя:', { userId, newName });
        
        // Получаем все события где пользователь является лидером
        const leaderEventsSnapshot = await db.collection('events')
            .where('leaderId', '==', userId)
            .get();
            
        // Получаем все события для поиска участника
        const allEventsSnapshot = await db.collection('events').get();
        
        const batch = db.batch();
        let updateCount = 0;
        
        // Обновляем события где пользователь - лидер
        leaderEventsSnapshot.forEach(doc => {
            batch.update(doc.ref, {
                leaderName: newName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            updateCount++;
            logger.log(`📝 Обновляем leaderName в событии ${doc.id}`);
        });
        
        // Обновляем события где пользователь - участник
        allEventsSnapshot.forEach(doc => {
            const eventData = doc.data();
            let needsUpdate = false;
            const updatedParticipants = {};
            
            // Проверяем все участники события
            if (eventData.participants) {
                Object.entries(eventData.participants).forEach(([key, participant]) => {
                    if (participant.userId === userId) {
                        // Обновляем имя участника
                        updatedParticipants[key] = {
                            ...participant,
                            userName: newName
                        };
                        needsUpdate = true;
                        logger.log(`📝 Обновляем участника ${key} в событии ${doc.id}`);
                    } else {
                        // Оставляем без изменений
                        updatedParticipants[key] = participant;
                    }
                });
                
                if (needsUpdate) {
                    batch.update(doc.ref, {
                        participants: updatedParticipants,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    updateCount++;
                }
            }
        });
        
        // Выполняем все обновления одной транзакцией
        if (updateCount > 0) {
            await batch.commit();
            logger.log(`✅ Успешно обновлено ${updateCount} событий`);
        } else {
            logger.log('ℹ️ Нет событий для обновления');
        }
        
    } catch (error) {
        logger.error('❌ Ошибка синхронизации имени:', error);
        throw error;
    }
}

/**
 * Синхронизирует имя пользователя в архивных событиях (опционально)
 * @param {string} userId - ID пользователя
 * @param {string} newName - Новое имя пользователя
 * @returns {Promise<void>}
 */
export async function syncUserNameInArchivedEvents(userId, newName) {
    try {
        const archivedEventsSnapshot = await db.collection('events')
            .where('isArchived', '==', true)
            .get();
            
        const batch = db.batch();
        let updateCount = 0;
        
        archivedEventsSnapshot.forEach(doc => {
            const eventData = doc.data();
            let needsUpdate = false;
            const updates = {};
            
            // Проверяем лидера
            if (eventData.leaderId === userId) {
                updates.leaderName = newName;
                needsUpdate = true;
            }
            
            // Проверяем участников
            if (eventData.participants) {
                const updatedParticipants = {};
                Object.entries(eventData.participants).forEach(([key, participant]) => {
                    if (participant.userId === userId) {
                        updatedParticipants[key] = {
                            ...participant,
                            userName: newName
                        };
                        needsUpdate = true;
                    } else {
                        updatedParticipants[key] = participant;
                    }
                });
                
                if (needsUpdate && Object.keys(updatedParticipants).length > 0) {
                    updates.participants = updatedParticipants;
                }
            }
            
            if (needsUpdate) {
                updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                batch.update(doc.ref, updates);
                updateCount++;
            }
        });
        
        if (updateCount > 0) {
            await batch.commit();
            logger.log(`✅ Обновлено ${updateCount} архивных событий`);
        }
        
    } catch (error) {
        logger.error('❌ Ошибка синхронизации в архивных событиях:', error);
        // Не прерываем основной процесс
    }
}