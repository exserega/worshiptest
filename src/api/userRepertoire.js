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
        const bpmValue = song.BPM || song.bpm || song['Оригинальный BPM'] || null;
        
        if (existingDoc.exists) {
            const existingData = existingDoc.data();
            const existingKeys = existingData.keys || [existingData.preferredKey];
            
            // Проверяем, есть ли уже эта тональность
            if (existingKeys.includes(preferredKey)) {
                logger.log(`ℹ️ Песня "${song.name}" уже есть в репертуаре в тональности ${preferredKey}`);
                return { 
                    status: 'exists', 
                    keys: existingKeys, 
                    message: `Песня уже есть в репертуаре в тональности ${preferredKey}` 
                };
            }
            
            // Проверяем, не превышен ли лимит тональностей
            if (existingKeys.length >= 2) {
                logger.log(`⚠️ Песня "${song.name}" уже есть в репертуаре в 2 тональностях`);
                return { 
                    status: 'limit', 
                    keys: existingKeys,
                    message: `Песня уже есть в репертуаре в тональностях: ${existingKeys.join(', ')}`
                };
            }
            
            // Добавляем новую тональность
            const updatedKeys = [...existingKeys, preferredKey];
            await setDoc(songDoc, {
                keys: updatedKeys,
                preferredKey: preferredKey, // Для обратной совместимости
                BPM: bpmValue,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            logger.log(`✅ Добавлена тональность ${preferredKey} к песне "${song.name}"`);
            return { status: 'key_added', keys: updatedKeys };
        } else {
            // Добавляем новую песню
            logger.log(`🎵 Добавляем песню с BPM: ${bpmValue}, данные песни:`, song);
            
            await setDoc(songDoc, {
                name: song.name,
                category: song.sheet || song.category,
                keys: [preferredKey],
                preferredKey: preferredKey, // Для обратной совместимости
                BPM: bpmValue,
                addedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            logger.log(`✅ Песня "${song.name}" добавлена в репертуар с тональностью ${preferredKey} и BPM ${bpmValue}`);
            return { status: 'added', keys: [preferredKey] };
        }
    } catch (error) {
        logger.error('❌ Ошибка добавления песни в репертуар:', error);
        throw error;
    }
}

/**
 * Заменяет тональность песни в репертуаре
 * @param {string} songId - ID песни
 * @param {string} oldKey - Старая тональность
 * @param {string} newKey - Новая тональность
 * @returns {Promise<Object>} Результат операции
 */
export async function replaceKeyInRepertoire(songId, oldKey, newKey) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Пользователь не авторизован');
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        const songDoc = userDocRef.collection('repertoire').doc(songId);
        const existingDoc = await getDoc(songDoc);
        
        if (!existingDoc.exists) {
            throw new Error('Песня не найдена в репертуаре');
        }
        
        const data = existingDoc.data();
        const keys = data.keys || [data.preferredKey];
        const updatedKeys = keys.map(k => k === oldKey ? newKey : k);
        
        await setDoc(songDoc, {
            keys: updatedKeys,
            preferredKey: newKey, // Обновляем основную тональность
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        logger.log(`✅ Тональность ${oldKey} заменена на ${newKey}`);
        return { status: 'replaced', keys: updatedKeys };
    } catch (error) {
        logger.error('❌ Ошибка замены тональности:', error);
        throw error;
    }
}

/**
 * Удаляет тональность из репертуара
 * @param {string} songId - ID песни
 * @param {string} keyToRemove - Тональность для удаления
 * @returns {Promise<Object>} Результат операции
 */
export async function removeKeyFromRepertoire(songId, keyToRemove) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Пользователь не авторизован');
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        const songDoc = userDocRef.collection('repertoire').doc(songId);
        const existingDoc = await getDoc(songDoc);
        
        if (!existingDoc.exists) {
            throw new Error('Песня не найдена в репертуаре');
        }
        
        const data = existingDoc.data();
        const keys = data.keys || [data.preferredKey];
        const updatedKeys = keys.filter(k => k !== keyToRemove);
        
        if (updatedKeys.length === 0) {
            // Если тональностей не осталось, удаляем песню
            await deleteDoc(songDoc);
            logger.log(`✅ Песня удалена из репертуара`);
            return { status: 'removed', keys: [] };
        } else {
            // Обновляем список тональностей
            await setDoc(songDoc, {
                keys: updatedKeys,
                preferredKey: updatedKeys[0], // Устанавливаем первую как основную
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            logger.log(`✅ Тональность ${keyToRemove} удалена из репертуара`);
            return { status: 'key_removed', keys: updatedKeys };
        }
    } catch (error) {
        logger.error('❌ Ошибка удаления тональности:', error);
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