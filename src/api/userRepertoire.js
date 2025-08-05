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
        
        // В Firebase v8 нужно сначала получить документ пользователя, потом его коллекцию
        const userDocRef = doc(db, 'users', user.uid);
        const repertoireRef = userDocRef.collection('repertoire');
        const songDoc = repertoireRef.doc(song.id);
        
        // Проверяем, есть ли уже эта песня
        const existingDoc = await getDoc(songDoc);
        
        if (existingDoc.exists) {
            // Обновляем тональность, BPM и время
            const bpmValue = song.BPM || song.bpm || song['Оригинальный BPM'] || null;
            
            await setDoc(songDoc, {
                preferredKey: preferredKey,
                BPM: bpmValue,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            logger.log(`✅ Тональность песни "${song.name}" обновлена на ${preferredKey}, BPM: ${bpmValue}`);
            return { status: 'updated', key: preferredKey };
        } else {
            // Добавляем новую песню
            const bpmValue = song.BPM || song.bpm || song['Оригинальный BPM'] || null;
            logger.log(`🎵 Добавляем песню с BPM: ${bpmValue}, данные песни:`, song);
            
            await setDoc(songDoc, {
                name: song.name,
                category: song.sheet || song.category,
                preferredKey: preferredKey,
                BPM: bpmValue,
                addedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            logger.log(`✅ Песня "${song.name}" добавлена в репертуар с тональностью ${preferredKey} и BPM ${bpmValue}`);
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
        
        // В Firebase v8 правильный путь к документу в подколлекции
        const userDocRef = doc(db, 'users', user.uid);
        const songDoc = userDocRef.collection('repertoire').doc(songId);
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
        
        // В Firebase v8 правильный путь к документу в подколлекции
        const userDocRef = doc(db, 'users', user.uid);
        const songDoc = userDocRef.collection('repertoire').doc(songId);
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
        
        // В Firebase v8 правильный путь к подколлекции
        const userDocRef = doc(db, 'users', user.uid);
        const repertoireRef = userDocRef.collection('repertoire');
        const snapshot = await repertoireRef.get();
        
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