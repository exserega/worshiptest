/**
 * API для работы с группами архива сет-листов
 */

import logger from '../../utils/logger.js';
import { db } from '../../../firebase-init.js';
import { getCurrentUser, isUserGuest } from '../auth/authCheck.js';
import { hasLimitedAccess } from '../permissions/permissions.js';

const Timestamp = window.firebase.firestore.Timestamp;
const FieldValue = window.firebase.firestore.FieldValue;

/**
 * Создает новую группу архива
 * @param {Object} groupData - Данные группы
 * @returns {Promise<string>} ID созданной группы
 */
export async function createArchiveGroup(groupData) {
    // Проверяем права доступа
    if (hasLimitedAccess()) {
        if (isUserGuest()) {
            throw new Error('Создание групп доступно только зарегистрированным пользователям.');
        } else {
            throw new Error('Создание групп недоступно. Ваша заявка находится на рассмотрении.');
        }
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        throw new Error('Пользователь не авторизован');
    }
    
    try {
        const newGroup = {
            name: groupData.name || 'Новая группа',
            color: groupData.color || '#22d3ee',
            icon: groupData.icon || '📁',
            branchId: currentUser.branchId,
            createdBy: currentUser.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            setlistCount: 0
        };
        
        const docRef = await db.collection('archive_groups').add(newGroup);
        logger.log('✅ Archive group created:', docRef.id);
        
        return docRef.id;
    } catch (error) {
        logger.error('❌ Error creating archive group:', error);
        throw error;
    }
}

/**
 * Обновляет группу архива
 * @param {string} groupId - ID группы
 * @param {Object} updates - Обновления
 * @returns {Promise<void>}
 */
export async function updateArchiveGroup(groupId, updates) {
    // Проверяем права доступа
    if (hasLimitedAccess()) {
        if (isUserGuest()) {
            throw new Error('Редактирование групп доступно только зарегистрированным пользователям.');
        } else {
            throw new Error('Редактирование групп недоступно. Ваша заявка находится на рассмотрении.');
        }
    }
    
    try {
        const updateData = {
            ...updates,
            updatedAt: Timestamp.now()
        };
        
        // Убираем поля, которые не должны обновляться
        delete updateData.branchId;
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.setlistCount;
        
        await db.collection('archive_groups').doc(groupId).update(updateData);
        logger.log('✅ Archive group updated:', groupId);
    } catch (error) {
        logger.error('❌ Error updating archive group:', error);
        throw error;
    }
}

/**
 * Удаляет группу архива
 * @param {string} groupId - ID группы
 * @returns {Promise<void>}
 */
export async function deleteArchiveGroup(groupId) {
    // Проверяем права доступа
    if (hasLimitedAccess()) {
        if (isUserGuest()) {
            throw new Error('Удаление групп доступно только зарегистрированным пользователям.');
        } else {
            throw new Error('Удаление групп недоступно. Ваша заявка находится на рассмотрении.');
        }
    }
    
    try {
        // Сначала удаляем группу из всех сет-листов
        const setlistsSnapshot = await db.collection('archive_setlists')
            .where('groupIds', 'array-contains', groupId)
            .get();
        
        const batch = db.batch();
        
        // Убираем группу из всех сет-листов
        setlistsSnapshot.forEach(doc => {
            const groupIds = doc.data().groupIds || [];
            const updatedGroupIds = groupIds.filter(id => id !== groupId);
            batch.update(doc.ref, { 
                groupIds: updatedGroupIds,
                updatedAt: Timestamp.now()
            });
        });
        
        // Удаляем саму группу
        batch.delete(db.collection('archive_groups').doc(groupId));
        
        await batch.commit();
        logger.log('✅ Archive group deleted:', groupId);
    } catch (error) {
        logger.error('❌ Error deleting archive group:', error);
        throw error;
    }
}

/**
 * Загружает группы архива для филиала
 * @param {string} branchId - ID филиала
 * @returns {Promise<Array>} Массив групп
 */
export async function loadArchiveGroups(branchId) {
    try {
        const snapshot = await db.collection('archive_groups')
            .where('branchId', '==', branchId)
            .orderBy('name', 'asc')
            .get();
        
        const groups = [];
        snapshot.forEach(doc => {
            groups.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        logger.log(`📚 Loaded ${groups.length} archive groups`);
        return groups;
    } catch (error) {
        logger.error('❌ Error loading archive groups:', error);
        throw error;
    }
}

/**
 * Обновляет счетчик сет-листов в группе
 * @param {string} groupId - ID группы
 * @param {number} delta - Изменение количества (+1 или -1)
 * @returns {Promise<void>}
 */
export async function updateGroupSetlistCount(groupId, delta) {
    try {
        await db.collection('archive_groups').doc(groupId).update({
            setlistCount: FieldValue.increment(delta),
            updatedAt: Timestamp.now()
        });
        logger.log(`✅ Updated setlist count for group ${groupId}: ${delta > 0 ? '+' : ''}${delta}`);
    } catch (error) {
        logger.error('❌ Error updating group setlist count:', error);
        // Не бросаем ошибку, так как это не критично
    }
}

/**
 * Добавляет сет-лист в группы
 * @param {string} setlistId - ID сет-листа
 * @param {Array<string>} groupIds - Массив ID групп
 * @returns {Promise<void>}
 */
export async function addSetlistToGroups(setlistId, groupIds) {
    try {
        // Получаем текущие группы сет-листа
        const setlistDoc = await db.collection('archive_setlists').doc(setlistId).get();
        if (!setlistDoc.exists) {
            throw new Error('Сет-лист не найден');
        }
        
        const currentGroupIds = setlistDoc.data().groupIds || [];
        const newGroupIds = [...new Set([...currentGroupIds, ...groupIds])];
        
        // Обновляем сет-лист
        await db.collection('archive_setlists').doc(setlistId).update({
            groupIds: newGroupIds,
            updatedAt: Timestamp.now()
        });
        
        // Обновляем счетчики групп
        const addedGroups = groupIds.filter(id => !currentGroupIds.includes(id));
        for (const groupId of addedGroups) {
            await updateGroupSetlistCount(groupId, 1);
        }
        
        logger.log('✅ Setlist added to groups:', groupIds);
    } catch (error) {
        logger.error('❌ Error adding setlist to groups:', error);
        throw error;
    }
}

/**
 * Удаляет сет-лист из групп
 * @param {string} setlistId - ID сет-листа
 * @param {Array<string>} groupIds - Массив ID групп для удаления
 * @returns {Promise<void>}
 */
export async function removeSetlistFromGroups(setlistId, groupIds) {
    try {
        // Получаем текущие группы сет-листа
        const setlistDoc = await db.collection('archive_setlists').doc(setlistId).get();
        if (!setlistDoc.exists) {
            throw new Error('Сет-лист не найден');
        }
        
        const currentGroupIds = setlistDoc.data().groupIds || [];
        const newGroupIds = currentGroupIds.filter(id => !groupIds.includes(id));
        
        // Обновляем сет-лист
        await db.collection('archive_setlists').doc(setlistId).update({
            groupIds: newGroupIds,
            updatedAt: Timestamp.now()
        });
        
        // Обновляем счетчики групп
        const removedGroups = groupIds.filter(id => currentGroupIds.includes(id));
        for (const groupId of removedGroups) {
            await updateGroupSetlistCount(groupId, -1);
        }
        
        logger.log('✅ Setlist removed from groups:', groupIds);
    } catch (error) {
        logger.error('❌ Error removing setlist from groups:', error);
        throw error;
    }
}

/**
 * Пересчитывает количество сет-листов во всех группах
 * @param {string} branchId - ID филиала
 * @returns {Promise<void>}
 */
export async function recalculateAllGroupCounts(branchId) {
    try {
        // Получаем все группы филиала
        const groupsSnapshot = await db.collection('archive_groups')
            .where('branchId', '==', branchId)
            .get();
        
        // Получаем все сет-листы филиала
        const setlistsSnapshot = await db.collection('archive_setlists')
            .where('branchId', '==', branchId)
            .get();
        
        // Считаем количество сет-листов для каждой группы
        const groupCounts = {};
        groupsSnapshot.forEach(doc => {
            groupCounts[doc.id] = 0;
        });
        
        setlistsSnapshot.forEach(doc => {
            const groupIds = doc.data().groupIds || [];
            groupIds.forEach(groupId => {
                if (groupCounts.hasOwnProperty(groupId)) {
                    groupCounts[groupId]++;
                }
            });
        });
        
        // Обновляем счетчики в базе
        const batch = db.batch();
        Object.entries(groupCounts).forEach(([groupId, count]) => {
            batch.update(db.collection('archive_groups').doc(groupId), {
                setlistCount: count,
                updatedAt: Timestamp.now()
            });
        });
        
        await batch.commit();
        logger.log('✅ Recalculated all group counts');
    } catch (error) {
        logger.error('❌ Error recalculating group counts:', error);
        throw error;
    }
}