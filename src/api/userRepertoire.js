/**
 * @fileoverview API для работы с репертуаром пользователя
 * @module UserRepertoireAPI
 */

import logger from '../utils/logger.js';
import { 
    db, 
    collection, 
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp 
} from '../utils/firebase-v8-adapter.js';
import { auth } from '../../firebase-init.js';

/**
 * Добавляет песню в репертуар пользователя
 * @param {Object} song - Объект песни
 * @param {string} preferredKey - Выбранная тональность
 * @returns {Promise<Object>} Результат операции
 */
export async function addToUserRepertoire(song, preferredKey) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Пользователь не авторизован');
        }
        
        const repertoireRef = collection(db, 'users', user.uid, 'repertoire');
        const songDoc = doc(repertoireRef, song.id);
        
        // Проверяем, есть ли уже эта песня
        const existingDoc = await getDoc(songDoc);
        
        if (existingDoc.exists) {
            // Обновляем только тональность и время
            await setDoc(songDoc, {
                preferredKey: preferredKey,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            logger.log(`✅ Тональность песни "${song.name}" обновлена на ${preferredKey}`);
            return { status: 'updated', key: preferredKey };
        } else {
            // Добавляем новую песню
            await setDoc(songDoc, {
                name: song.name,
                category: song.sheet || song.category,
                preferredKey: preferredKey,
                BPM: song.BPM || song.bpm || null,
                addedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            logger.log(`✅ Песня "${song.name}" добавлена в репертуар с тональностью ${preferredKey}`);
            return { status: 'added', key: preferredKey };
        }
    } catch (error) {
        logger.error('❌ Ошибка добавления песни в репертуар:', error);
        throw error;
    }
}

/**
 * Удаляет песню из репертуара пользователя
 * @param {string} songId - ID песни
 * @returns {Promise<void>}
 */
export async function removeFromUserRepertoire(songId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Пользователь не авторизован');
        }
        
        const songDoc = doc(db, 'users', user.uid, 'repertoire', songId);
        await deleteDoc(songDoc);
        
        logger.log(`✅ Песня удалена из репертуара`);
    } catch (error) {
        logger.error('❌ Ошибка удаления песни из репертуара:', error);
        throw error;
    }
}

/**
 * Проверяет, есть ли песня в репертуаре пользователя
 * @param {string} songId - ID песни
 * @returns {Promise<Object|null>} Данные песни или null
 */
export async function checkSongInUserRepertoire(songId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            return null;
        }
        
        const songDoc = doc(db, 'users', user.uid, 'repertoire', songId);
        const docSnap = await getDoc(songDoc);
        
        if (docSnap.exists) {
            return docSnap.data();
        }
        
        return null;
    } catch (error) {
        logger.error('❌ Ошибка проверки песни в репертуаре:', error);
        return null;
    }
}

/**
 * Получает весь репертуар пользователя
 * @returns {Promise<Array>} Массив песен
 */
export async function getUserRepertoire() {
    try {
        const user = auth.currentUser;
        if (!user) {
            return [];
        }
        
        const repertoireRef = collection(db, 'users', user.uid, 'repertoire');
        const snapshot = await getDocs(repertoireRef);
        
        const songs = [];
        snapshot.forEach(doc => {
            songs.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return songs;
    } catch (error) {
        logger.error('❌ Ошибка получения репертуара:', error);
        return [];
    }
}