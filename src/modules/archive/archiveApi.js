/**
 * API для работы с архивными сет-листами
 */

import logger from '../../utils/logger.js';
import { db } from '../../../firebase-init.js';
import { getCurrentUser, isUserGuest } from '../auth/authCheck.js';
import { hasLimitedAccess } from '../permissions/permissions.js';

const Timestamp = window.firebase.firestore.Timestamp;
const FieldValue = window.firebase.firestore.FieldValue;

/**
 * Создает новый архивный сет-лист
 * @param {Object} setlistData - Данные сет-листа
 * @returns {Promise<string>} ID созданного сет-листа
 */
export async function createArchiveSetlist(setlistData) {
    // Проверяем права доступа
    if (hasLimitedAccess()) {
        if (isUserGuest()) {
            throw new Error('Создание архивных сет-листов доступно только зарегистрированным пользователям.');
        } else {
            throw new Error('Создание архивных сет-листов недоступно. Ваша заявка находится на рассмотрении.');
        }
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        throw new Error('Пользователь не авторизован');
    }
    
    try {
        const newSetlist = {
            name: setlistData.name || 'Новый сет-лист',
            songs: setlistData.songs || [],
            groupIds: setlistData.groupIds || [],
            branchId: currentUser.branchId,
            createdBy: currentUser.uid,
            createdByName: currentUser.name || currentUser.email || 'Неизвестный',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isArchived: true,
            notes: setlistData.notes || '',
            tags: setlistData.tags || []
        };
        
        const docRef = await db.collection('archive_setlists').add(newSetlist);
        logger.log('✅ Archive setlist created:', docRef.id);
        
        return docRef.id;
    } catch (error) {
        logger.error('❌ Error creating archive setlist:', error);
        throw error;
    }
}

/**
 * Обновляет архивный сет-лист
 * @param {string} setlistId - ID сет-листа
 * @param {Object} updates - Обновления
 * @returns {Promise<void>}
 */
export async function updateArchiveSetlist(setlistId, updates) {
    // Проверяем права доступа
    if (hasLimitedAccess()) {
        if (isUserGuest()) {
            throw new Error('Редактирование архивных сет-листов доступно только зарегистрированным пользователям.');
        } else {
            throw new Error('Редактирование архивных сет-листов недоступно. Ваша заявка находится на рассмотрении.');
        }
    }
    
    try {
        const updateData = {
            ...updates,
            updatedAt: Timestamp.now()
        };
        
        await db.collection('archive_setlists').doc(setlistId).update(updateData);
        logger.log('✅ Archive setlist updated:', setlistId);
    } catch (error) {
        logger.error('❌ Error updating archive setlist:', error);
        throw error;
    }
}

/**
 * Удаляет архивный сет-лист
 * @param {string} setlistId - ID сет-листа
 * @returns {Promise<void>}
 */
export async function deleteArchiveSetlist(setlistId) {
    // Проверяем права доступа
    if (hasLimitedAccess()) {
        if (isUserGuest()) {
            throw new Error('Удаление архивных сет-листов доступно только зарегистрированным пользователям.');
        } else {
            throw new Error('Удаление архивных сет-листов недоступно. Ваша заявка находится на рассмотрении.');
        }
    }
    
    try {
        await db.collection('archive_setlists').doc(setlistId).delete();
        logger.log('✅ Archive setlist deleted:', setlistId);
    } catch (error) {
        logger.error('❌ Error deleting archive setlist:', error);
        throw error;
    }
}

/**
 * Копирует активный сет-лист в архив
 * @param {string} activeSetlistId - ID активного сет-листа
 * @param {Array} groupIds - ID групп для добавления
 * @returns {Promise<string>} ID созданного архивного сет-листа
 */
export async function copyToArchive(activeSetlistId, groupIds = []) {
    try {
        // Получаем активный сет-лист
        const activeDoc = await db.collection('worship_setlists').doc(activeSetlistId).get();
        
        if (!activeDoc.exists) {
            throw new Error('Активный сет-лист не найден');
        }
        
        const activeData = activeDoc.data();
        
        // Создаем архивную копию
        const archiveData = {
            name: activeData.name,
            songs: activeData.songs || [],
            groupIds: groupIds,
            originalSetlistId: activeSetlistId,
            copiedAt: Timestamp.now()
        };
        
        return await createArchiveSetlist(archiveData);
    } catch (error) {
        logger.error('❌ Error copying to archive:', error);
        throw error;
    }
}

/**
 * Загружает архивные сет-листы
 * @param {string} branchId - ID филиала
 * @returns {Promise<Array>} Массив сет-листов
 */
export async function loadArchiveSetlists(branchId) {
    try {
        // Временно убираем orderBy чтобы не требовался составной индекс
        // TODO: Добавить индекс в Firebase Console для оптимальной работы
        const snapshot = await db.collection('archive_setlists')
            .where('branchId', '==', branchId)
            .get();
        
        const setlists = [];
        snapshot.forEach(doc => {
            setlists.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Сортируем в памяти после загрузки
        setlists.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
            const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
            return bTime - aTime; // desc
        });
        
        logger.log(`📚 Loaded ${setlists.length} archive setlists`);
        return setlists;
    } catch (error) {
        logger.error('❌ Error loading archive setlists:', error);
        throw error;
    }
}

/**
 * Добавляет песню в архивный сет-лист
 * @param {string} setlistId - ID сет-листа
 * @param {Object} songData - Данные песни
 * @returns {Promise<void>}
 */
export async function addSongToArchiveSetlist(setlistId, songData) {
    try {
        await db.collection('archive_setlists').doc(setlistId).update({
            songs: FieldValue.arrayUnion({
                songId: songData.songId,
                order: songData.order || 0,
                preferredKey: songData.preferredKey || null
            }),
            updatedAt: Timestamp.now()
        });
        
        logger.log('✅ Song added to archive setlist');
    } catch (error) {
        logger.error('❌ Error adding song to archive setlist:', error);
        throw error;
    }
}

/**
 * Удаляет песню из архивного сет-листа
 * @param {string} setlistId - ID сет-листа
 * @param {string} songId - ID песни
 * @returns {Promise<void>}
 */
export async function removeSongFromArchiveSetlist(setlistId, songId) {
    try {
        const doc = await db.collection('archive_setlists').doc(setlistId).get();
        if (!doc.exists) {
            throw new Error('Архивный сет-лист не найден');
        }
        
        const data = doc.data();
        const updatedSongs = data.songs.filter(s => s.songId !== songId);
        
        await db.collection('archive_setlists').doc(setlistId).update({
            songs: updatedSongs,
            updatedAt: Timestamp.now()
        });
        
        logger.log('✅ Song removed from archive setlist');
    } catch (error) {
        logger.error('❌ Error removing song from archive setlist:', error);
        throw error;
    }
}