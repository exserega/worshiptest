/**
 * @fileoverview API для работы с событиями
 * @module EventsAPI
 */

import logger from '../../utils/logger.js';
import { db } from '../../utils/firebase-v8-adapter.js';
import { createNotificationForUser } from '../notifications/notificationsApi.js';
import { auth } from '../../../firebase-init.js';
import { getSetlistById, getSetlistSongCount } from '../../utils/setlistUtils.js';

// Firebase v8 Timestamp
const Timestamp = window.firebase.firestore.Timestamp;

/**
 * Собирает словарь userId -> [{ instrumentId, instrumentName }]
 * из объекта участников события
 */
function buildUserPlacementsMap(participantsObj = {}) {
    const userIdToPlacements = {};
    Object.values(participantsObj || {}).forEach((p) => {
        const userId = p?.userId;
        if (!userId || String(userId).startsWith('custom_')) return;
        if (!userIdToPlacements[userId]) userIdToPlacements[userId] = [];
        userIdToPlacements[userId].push({
            instrumentId: p.instrument || '',
            instrumentName: p.instrumentName || ''
        });
    });
    return userIdToPlacements;
}

/**
 * Уведомления при создании события: всем указанным участникам
 */
async function notifyParticipantsOnCreateEvent(eventId, eventData) {
    try {
        const userPlacements = buildUserPlacementsMap(eventData.participants || {});
        const tasks = [];
        const eventDate = eventData.date || null;
        const eventName = eventData.name || '';
        const branchId = eventData.branchId || null;
        Object.entries(userPlacements).forEach(([userId, placements]) => {
            tasks.push(createNotificationForUser(userId, {
                type: 'event_participant_added',
                eventId,
                eventName,
                eventDate,
                placements,
                branchId
            }));
        });
        await Promise.all(tasks);
    } catch (e) {
        logger.warn('notifyParticipantsOnCreateEvent failed:', e);
    }
}

/**
 * Уведомления при обновлении события: только для НОВЫХ назначений
 */
async function notifyParticipantsOnUpdateEvent(eventId, finalUpdates, prevParticipants, prevMeta) {
    try {
        const prevMap = buildUserPlacementsMap(prevParticipants || {});
        const nextMap = buildUserPlacementsMap(finalUpdates.participants || {});
        const tasks = [];
        const eventDate = finalUpdates.date || prevMeta?.prevDate || null;
        const eventName = finalUpdates.name || prevMeta?.prevName || '';
        const branchId = finalUpdates.branchId || null;
        Object.entries(nextMap).forEach(([userId, placements]) => {
            const prevPlacements = prevMap[userId] || [];
            // Вычисляем новые назначения (по instrumentId)
            const prevSet = new Set(prevPlacements.map(p => p.instrumentId || p.instrument));
            const newPlacements = placements.filter(p => !prevSet.has(p.instrumentId));
            if (newPlacements.length > 0) {
                tasks.push(createNotificationForUser(userId, {
                    type: 'event_participant_added',
                    eventId,
                    eventName,
                    eventDate,
                    placements: newPlacements,
                    branchId
                }));
            }
        });
        if (tasks.length > 0) {
            await Promise.all(tasks);
        }
    } catch (e) {
        logger.warn('notifyParticipantsOnUpdateEvent failed:', e);
    }
}

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
                        if (participant && (participant.userName || participant.name)) {
                            participantsArray.push({
                                id: participant.userId || key,
                                name: participant.userName || participant.name,
                                instrument: participant.instrument || '',
                                instrumentName: participant.instrumentName || '',
                                role: participant.role || ''
                            });
                        }
                    });
                    
                    event.participants = participantsArray;
                    event.participantCount = participantsArray.length;
                    console.log(`✅ Обработано участников: ${event.participantCount}`, participantsArray); // Отладка
                    
                    // Найдем лидера по leaderId
                    if (eventData.leaderId) {
                        const leader = participantsArray.find(p => p.id === eventData.leaderId);
                        if (leader) {
                            event.leader = leader.name;
                            console.log(`🎤 Лидер: ${event.leader}`); // Отладка
                        } else if (eventData.leaderName) {
                            event.leader = eventData.leaderName;
                            console.log(`🎤 Лидер (из leaderName): ${event.leader}`); // Отладка
                        }
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
                        if (participant && (participant.userName || participant.name)) {
                            participantsArray.push({
                                id: participant.userId || key,
                                name: participant.userName || participant.name,
                                instrument: participant.instrument || '',
                                instrumentName: participant.instrumentName || '',
                                role: participant.role || ''
                            });
                        }
                    });
                    
                    event.participants = participantsArray;
                    event.participantCount = participantsArray.length;
                    console.log(`✅ [Альт] Обработано участников: ${event.participantCount}`, participantsArray); // Отладка
                    
                    // Найдем лидера по leaderId
                    if (eventData.leaderId) {
                        const leader = participantsArray.find(p => p.id === eventData.leaderId);
                        if (leader) {
                            event.leader = leader.name;
                            console.log(`🎤 [Альт] Лидер: ${event.leader}`); // Отладка
                        } else if (eventData.leaderName) {
                            event.leader = eventData.leaderName;
                            console.log(`🎤 [Альт] Лидер (из leaderName): ${event.leader}`); // Отладка
                        }
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
            songCount = await getSetlistSongCount(eventData.setlistId);
        }
        
        // Получаем имя лидера
        // Если имя передано явно (например, кастомный ведущий) — сохраняем как есть
        let leaderName = eventData.leaderName || null;
        if (!leaderName && eventData.leaderId && !String(eventData.leaderId).startsWith('custom_leader_')) {
            try {
                const userDoc = await db.collection('users').doc(eventData.leaderId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    leaderName = userData.name || userData.displayName || userData.email;
                }
            } catch (e) {
                // игнорируем, если не нашли пользователя по leaderId
            }
        }
        
        const newEvent = {
            ...eventData,
            songCount,
            leaderName,
            participants: eventData.participants || {},
            participantCount: eventData.participants ? Object.keys(eventData.participants).length : 0,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            isArchived: false
        };
        
        const docRef = await db.collection('events').add(newEvent);
        logger.log(`✅ Событие создано с ID: ${docRef.id}`);
        try {
            await notifyParticipantsOnCreateEvent(docRef.id, newEvent);
        } catch (e) {
            logger.warn('⚠️ Не удалось создать уведомления для участников при создании события:', e);
        }
        
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
            songCount = await getSetlistSongCount(updates.setlistId);
        }
        
        // Получаем имя лидера
        // Если имя передано явно (например, кастомный ведущий) — сохраняем как есть
        let leaderName = updates.leaderName || null;
        if (!leaderName && updates.leaderId && !String(updates.leaderId).startsWith('custom_leader_')) {
            try {
                const userDoc = await db.collection('users').doc(updates.leaderId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    leaderName = userData.name || userData.displayName || userData.email;
                }
            } catch (e) {
                // игнорируем, если не нашли пользователя по leaderId
            }
        }
        
        // Подготавливаем обновления с дополнительными полями
        const finalUpdates = {
            ...updates,
            songCount,
            leaderName,
            participantCount: updates.participants ? Object.keys(updates.participants).length : 0,
            updatedAt: Timestamp.now()
        };
        
        const eventRef = db.collection('events').doc(eventId);
        // Снимок до обновления, чтобы посчитать diff участников
        let prevParticipants = {};
        let prevName = null;
        let prevDate = null;
        try {
            const prevSnap = await eventRef.get();
            if (prevSnap.exists) {
                const prevData = prevSnap.data() || {};
                prevParticipants = prevData.participants || {};
                prevName = prevData.name || null;
                prevDate = prevData.date || null;
            }
        } catch (e) {
            logger.warn('⚠️ Не удалось получить предыдущее состояние события для diff:', e);
        }

        await eventRef.update(finalUpdates);
        
        // Создаем уведомления только если обновлялись участники
        if (updates && updates.participants) {
            try {
                await notifyParticipantsOnUpdateEvent(eventId, finalUpdates, prevParticipants, { prevName, prevDate });
            } catch (e) {
                logger.warn('⚠️ Не удалось создать уведомления для участников при обновлении события:', e);
            }
        }
        
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
 * @returns {Promise<Object>} Документ события
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
 * Обновить сет-лист в событии
 * @param {string} eventId - ID события
 * @param {string} setlistId - ID сет-листа
 * @param {string} setlistName - Название сет-листа (опционально)
 */
export async function updateEventSetlistApi(eventId, setlistId, setlistName) {
    try {
        // Получаем количество песен в сетлисте
        let songCount = 0;
        if (setlistId) {
            songCount = await getSetlistSongCount(setlistId);
        }
        
        // Обновляем событие
        const updates = {
            setlistId: setlistId,
            songCount: songCount,
            updatedAt: Timestamp.now()
        };
        
        const eventRef = db.collection('events').doc(eventId);
        await eventRef.update(updates);
        
        logger.log(`✅ Сет-лист обновлен в событии ${eventId}`);
    } catch (error) {
        logger.error('❌ Ошибка обновления сет-листа в событии:', error);
        throw error;
    }
}