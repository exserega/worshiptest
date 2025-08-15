/**
 * @fileoverview API для работы с событиями
 * @module EventsAPI
 */

import logger from '../../utils/logger.js';
import { db } from '../../utils/firebase-v8-adapter.js';
import { auth } from '../../../firebase-init.js';

// Firebase v8 Timestamp
const Timestamp = window.firebase.firestore.Timestamp;

/**
 * Получить события филиала
 * @param {string} branchId - ID филиала
 * @returns {Promise<Array>} Массив событий
 */
export async function getEventsByBranch(branchId) {
    console.log(`🎯 getEventsByBranch вызвана с branchId: ${branchId}`); // Временный лог
    try {
        logger.log(`📅 Загрузка событий для филиала: ${branchId}`);
        
        const eventsRef = db.collection('events');
        
        try {
            // Пробуем с составным индексом
            const query = eventsRef
                .where('branchId', '==', branchId)
                .orderBy('date', 'desc');
            
            const snapshot = await query.get();
            const events = [];
        
            snapshot.forEach(doc => {
                const eventData = doc.data();
                console.log(`📋 Обработка события ${doc.id}:`, eventData); // Отладка
                
                // Формируем объект события с участниками
                const event = {
                    id: doc.id,
                    ...eventData,
                    participantCount: 0,
                    participants: []
                };
                
                // Обрабатываем участников
                if (eventData.participants && typeof eventData.participants === 'object') {
                    console.log(`👥 Найдены участники для события ${doc.id}:`, eventData.participants); // Отладка
                    const participantsArray = [];
                    
                    // Преобразуем объект участников в массив
                    Object.entries(eventData.participants).forEach(([key, participant]) => {
                        console.log(`  - Обработка участника ${key}:`, participant); // Отладка
                        if (participant && participant.name) {
                            participantsArray.push({
                                id: key,
                                name: participant.name,
                                instrument: participant.instrument || '',
                                role: participant.role || ''
                            });
                        }
                    });
                    
                    event.participants = participantsArray;
                    event.participantCount = participantsArray.length;
                    console.log(`✅ Обработано участников: ${event.participantCount}`, participantsArray); // Отладка
                    
                    // Найдем лидера
                    const leader = participantsArray.find(p => p.role === 'leader');
                    if (leader) {
                        event.leader = leader.name;
                        console.log(`🎤 Лидер: ${event.leader}`); // Отладка
                    }
                } else {
                    console.log(`⚠️ Нет участников для события ${doc.id}`); // Отладка
                }
                
                events.push(event);
            });
            
            logger.log(`✅ Загружено ${events.length} событий`);
            return events;
        } catch (indexError) {
            // Если индекс не создан, делаем запрос без сортировки и сортируем в JS
            logger.warn('⚠️ Индекс не создан, используем альтернативный метод');
            
            const query = eventsRef.where('branchId', '==', branchId);
            const snapshot = await query.get();
            const events = [];
            
            snapshot.forEach(doc => {
                const eventData = doc.data();
                console.log(`📋 [Альт] Обработка события ${doc.id}:`, eventData); // Отладка
                
                // Формируем объект события с участниками
                const event = {
                    id: doc.id,
                    ...eventData,
                    participantCount: 0,
                    participants: []
                };
                
                // Обрабатываем участников
                if (eventData.participants && typeof eventData.participants === 'object') {
                    console.log(`👥 [Альт] Найдены участники для события ${doc.id}:`, eventData.participants); // Отладка
                    const participantsArray = [];
                    
                    // Преобразуем объект участников в массив
                    Object.entries(eventData.participants).forEach(([key, participant]) => {
                        console.log(`  - [Альт] Обработка участника ${key}:`, participant); // Отладка
                        if (participant && participant.name) {
                            participantsArray.push({
                                id: key,
                                name: participant.name,
                                instrument: participant.instrument || '',
                                role: participant.role || ''
                            });
                        }
                    });
                    
                    event.participants = participantsArray;
                    event.participantCount = participantsArray.length;
                    console.log(`✅ [Альт] Обработано участников: ${event.participantCount}`, participantsArray); // Отладка
                    
                    // Найдем лидера
                    const leader = participantsArray.find(p => p.role === 'leader');
                    if (leader) {
                        event.leader = leader.name;
                        console.log(`🎤 [Альт] Лидер: ${event.leader}`); // Отладка
                    }
                } else {
                    console.log(`⚠️ [Альт] Нет участников для события ${doc.id}`); // Отладка
                }
                
                events.push(event);
            });
            
            // Сортируем в JavaScript
            events.sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateB - dateA; // desc
            });
            
            logger.log(`✅ Загружено ${events.length} событий (без индекса)`);
            return events;
        }
    } catch (error) {
        logger.error('❌ Ошибка загрузки событий:', error);
        // Если коллекция не существует, возвращаем пустой массив
        if (error.code === 'failed-precondition') {
            logger.log('📋 Коллекция events еще не создана');
            return [];
        }
        throw error;
    }
}

/**
 * Получить событие по ID
 * @param {string} eventId - ID события
 * @returns {Promise<Object|null>} Данные события или null
 */
export async function getEventById(eventId) {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists) {
            return {
                id: eventDoc.id,
                ...eventDoc.data()
            };
        }
        
        return null;
    } catch (error) {
        logger.error('❌ Ошибка получения события:', error);
        throw error;
    }
}

/**
 * Создать новое событие
 * @param {Object} eventData - Данные события
 * @returns {Promise<string>} ID созданного события
 */
export async function createEvent(eventData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Получаем количество песен в сетлисте
        let songCount = 0;
        if (eventData.setlistId) {
            const setlistDoc = await db.collection('worship_setlists').doc(eventData.setlistId).get();
            if (setlistDoc.exists) {
                const setlistData = setlistDoc.data();
                songCount = setlistData.songs ? setlistData.songs.length : 0;
            }
        }
        
        // Получаем имя лидера
        let leaderName = null;
        if (eventData.leaderId) {
            const userDoc = await db.collection('users').doc(eventData.leaderId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                leaderName = userData.name || userData.displayName || userData.email;
            }
        }
        
        const newEvent = {
            ...eventData,
            songCount,
            leaderName,
            participants: eventData.participants || [],
            participantCount: eventData.participants ? eventData.participants.length : 0,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            isArchived: false
        };
        
        const docRef = await db.collection('events').add(newEvent);
        logger.log(`✅ Событие создано с ID: ${docRef.id}`);
        
        return docRef.id;
    } catch (error) {
        logger.error('❌ Ошибка создания события:', error);
        throw error;
    }
}

/**
 * Обновить событие
 * @param {string} eventId - ID события
 * @param {Object} updates - Обновляемые поля
 */
export async function updateEvent(eventId, updates) {
    try {
        // Получаем количество песен в сетлисте
        let songCount = 0;
        if (updates.setlistId) {
            const setlistDoc = await db.collection('worship_setlists').doc(updates.setlistId).get();
            if (setlistDoc.exists) {
                const setlistData = setlistDoc.data();
                songCount = setlistData.songs ? setlistData.songs.length : 0;
            }
        }
        
        // Получаем имя лидера
        let leaderName = null;
        if (updates.leaderId) {
            const userDoc = await db.collection('users').doc(updates.leaderId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                leaderName = userData.name || userData.displayName || userData.email;
            }
        }
        
        // Подготавливаем обновления с дополнительными полями
        const finalUpdates = {
            ...updates,
            songCount,
            leaderName,
            participantCount: updates.participants ? updates.participants.length : 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const eventRef = db.collection('events').doc(eventId);
        await eventRef.update(finalUpdates);
        
        logger.log(`✅ Событие ${eventId} обновлено`);
    } catch (error) {
        logger.error('❌ Ошибка обновления события:', error);
        throw error;
    }
}

/**
 * Удалить событие
 * @param {string} eventId - ID события
 */
export async function deleteEvent(eventId) {
    try {
        const eventRef = db.collection('events').doc(eventId);
        await eventRef.delete();
        logger.log(`✅ Событие ${eventId} удалено`);
    } catch (error) {
        logger.error('❌ Ошибка удаления события:', error);
        throw error;
    }
}

/**
 * Получить событие по ID
 * @param {string} eventId - ID события
 * @returns {Promise<DocumentSnapshot>}
 */
export async function getEvent(eventId) {
    try {
        const eventRef = db.collection('events').doc(eventId);
        return await eventRef.get();
    } catch (error) {
        logger.error('❌ Ошибка получения события:', error);
        throw error;
    }
}



/**
 * Получить сетлист события
 * @param {string} setlistId - ID сетлиста
 * @returns {Promise<Object|null>} Данные сетлиста
 */
export async function getEventSetlist(setlistId) {
    try {
        const setlistRef = doc(db, 'worship_setlists', setlistId);
        const setlistDoc = await getDoc(setlistRef);
        
        if (setlistDoc.exists) {
            return {
                id: setlistDoc.id,
                ...setlistDoc.data()
            };
        }
        
        return null;
    } catch (error) {
        logger.error('❌ Ошибка получения сетлиста:', error);
        throw error;
    }
}

/**
 * Форматировать ссылку для шаринга
 * @param {string} eventId - ID события
 * @param {string} eventName - Название события
 * @param {string} platform - Платформа (whatsapp, telegram, copy)
 * @returns {string} URL для шаринга
 */
export function getShareUrl(eventId, eventName, platform) {
    const baseUrl = `${window.location.origin}/event/${eventId}`;
    const message = `📅 Список песен на "${eventName}"\n🔗 ${baseUrl}`;
    
    switch (platform) {
        case 'whatsapp':
            return `https://wa.me/?text=${encodeURIComponent(message)}`;
        case 'telegram':
            return `https://t.me/share/url?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(`📅 Список песен на "${eventName}"`)}`;
        case 'copy':
        default:
            return baseUrl;
    }
}