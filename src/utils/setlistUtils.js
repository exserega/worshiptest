/**
 * Утилиты для работы с сет-листами из разных коллекций
 */

import { db } from './firebase-v8-adapter.js';

/**
 * Получить сет-лист по ID, проверяя обе коллекции
 * @param {string} setlistId - ID сет-листа
 * @returns {Promise<{data: Object, source: string}|null>} - Данные сет-листа и источник или null
 */
export async function getSetlistById(setlistId) {
    if (!setlistId) return null;
    
    try {
        // Сначала проверяем в worship_setlists
        const worshipDoc = await db.collection('worship_setlists').doc(setlistId).get();
        if (worshipDoc.exists) {
            return {
                data: { id: worshipDoc.id, ...worshipDoc.data() },
                source: 'worship_setlists'
            };
        }
        
        // Если не нашли, проверяем в archive_setlists
        const archiveDoc = await db.collection('archive_setlists').doc(setlistId).get();
        if (archiveDoc.exists) {
            return {
                data: { id: archiveDoc.id, ...archiveDoc.data() },
                source: 'archive_setlists'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting setlist:', error);
        return null;
    }
}

/**
 * Получить все сет-листы для выбора (из обеих коллекций)
 * @param {string} branchId - ID филиала
 * @returns {Promise<Array>} - Массив сет-листов
 */
export async function getAllSetlists(branchId) {
    try {
        const setlists = [];
        
        // Получаем из worship_setlists
        const worshipSnapshot = await db.collection('worship_setlists')
            .where('branchId', '==', branchId)
            .orderBy('name')
            .get();
            
        worshipSnapshot.forEach(doc => {
            setlists.push({
                id: doc.id,
                ...doc.data(),
                source: 'worship'
            });
        });
        
        // Получаем из archive_setlists
        const archiveSnapshot = await db.collection('archive_setlists')
            .where('branchId', '==', branchId)
            .orderBy('name')
            .get();
            
        archiveSnapshot.forEach(doc => {
            setlists.push({
                id: doc.id,
                ...doc.data(),
                source: 'archive',
                name: `[Архив] ${doc.data().name}` // Помечаем архивные
            });
        });
        
        // Сортируем по имени
        setlists.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        
        return setlists;
    } catch (error) {
        console.error('Error getting all setlists:', error);
        return [];
    }
}

/**
 * Получить количество песен в сет-листе
 * @param {string} setlistId - ID сет-листа
 * @returns {Promise<number>} - Количество песен
 */
export async function getSetlistSongCount(setlistId) {
    const result = await getSetlistById(setlistId);
    if (!result) return 0;
    
    return result.data.songs ? result.data.songs.length : 0;
}