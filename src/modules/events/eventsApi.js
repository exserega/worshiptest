/**
 * @fileoverview API для работы с событиями
 * @module EventsAPI
 */

import logger from '../../utils/logger.js';
import { db, collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from '../../utils/firebase-v8-adapter.js';
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
        
        const eventsRef = collection(db, 'events');
        
        try {
            // Пробуем с составным индексом
            const q = query(eventsRef, 
                where('branchId', '==', branchId),
                orderBy('date', 'desc')
            );
            
            const snapshot = await getDocs(q);
            const events = [];
        
            snapshot.forEach(doc => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            logger.log(`✅ Загружено ${events.length} событий`);
            return events;
        } catch (indexError) {
            // Если индекс не создан, делаем запрос без сортировки и сортируем в JS
            logger.warn('⚠️ Индекс не создан, используем альтернативный метод');
            
            const q = query(eventsRef, where('branchId', '==', branchId));
            const snapshot = await getDocs(q);
            const events = [];
            
            snapshot.forEach(doc => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
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
            if (setlistDoc.exists()) {
                const setlistData = setlistDoc.data();
                songCount = setlistData.songs ? setlistData.songs.length : 0;
            }
        }
        
        // Получаем имя лидера
        let leaderName = null;
        if (eventData.leaderId) {
            const userDoc = await db.collection('users').doc(eventData.leaderId).get();
            if (userDoc.exists()) {
                const userData = userDoc.data();
                leaderName = userData.displayName || userData.email;
            }
        }
        
        const newEvent = {
            ...eventData,
            songCount,
            leaderName,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            isArchived: false
        };
        
        const docRef = await addDoc(collection(db, 'events'), newEvent);
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
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
        
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
        await deleteDoc(doc(db, 'events', eventId));
        logger.log(`✅ Событие ${eventId} удалено`);
    } catch (error) {
        logger.error('❌ Ошибка удаления события:', error);
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