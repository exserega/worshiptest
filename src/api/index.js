/**
 * @fileoverview API Index - Централизованный доступ ко всем API функциям
 * @module APIIndex
 * @version 1.0.0
 * @author Agape Worship Team
 * @since 2024
 */

// ====================================
// FIREBASE IMPORTS
// ====================================

import { db, auth } from '../../firebase-config.js';
import {
    collection, addDoc, query, onSnapshot, updateDoc, deleteDoc, setDoc, doc,
    orderBy, getDocs, where, getDoc, runTransaction, serverTimestamp, deleteField
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import * as state from '../../state.js';

// ====================================
// COLLECTIONS
// ====================================

const songsCollection = collection(db, "songs");
const setlistsCollection = collection(db, "worship_setlists");
const vocalistsCollection = collection(db, "vocalists");

// ====================================
// SONGS API
// ====================================

/**
 * Загружает все песни из Firestore и сохраняет в state
 * @returns {Promise<void>}
 */
export async function loadAllSongsFromFirestore() {
    try {
        console.log("Загрузка всех песен из Firestore...");
        const querySnapshot = await getDocs(songsCollection);
        let newAllSongs = [];
        let newSongsBySheet = {};

        querySnapshot.forEach(doc => {
            const songData = doc.data();
            const songId = doc.id;
            const song = { id: songId, name: songId, ...songData };
            newAllSongs.push(song);

            const sheetName = song.sheet;
            if (sheetName) {
                if (!newSongsBySheet[sheetName]) {
                    newSongsBySheet[sheetName] = [];
                }
                newSongsBySheet[sheetName].push(song);
            } else {
                console.warn(`Песня "${song.name}" (${songId}) не имеет поля 'sheet' (категории).`);
            }
        });

        newAllSongs.sort((a, b) => a.name.localeCompare(b.name));
        for (const category in newSongsBySheet) {
            newSongsBySheet[category].sort((a, b) => a.name.localeCompare(b.name));
        }
        
        state.setAllSongs(newAllSongs);
        state.setSongsBySheet(newSongsBySheet);
        console.log(`Загружено ${state.allSongs.length} песен.`);
        
        // Обновляем базу данных в Web Worker
        if (typeof window !== 'undefined' && window.searchWorkerManager) {
            window.searchWorkerManager.updateSongsDatabase(newAllSongs);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки песен:', error);
        throw error;
    }
}

// ====================================
// SONG EDITING API
// ====================================

/**
 * Сохраняет отредактированный контент песни в Firebase
 * @param {string} songId - ID песни
 * @param {string} editedContent - Отредактированный текст с аккордами
 * @returns {Promise<void>}
 */
export async function saveSongEdit(songId, editedContent) {
    if (!songId || editedContent === null || editedContent === undefined) {
        throw new Error('songId и editedContent обязательны');
    }
    
    const songRef = doc(db, 'songs', songId);
    
    try {
        await updateDoc(songRef, {
            'Текст и аккорды (edited)': editedContent,
            'hasWebEdits': true,
            'lastEditedInApp': serverTimestamp(),
            'editedBy': 'web-user'
        });
        console.log(`✅ Песня "${songId}" успешно отредактирована`);
    } catch (error) {
        console.error(`❌ Ошибка сохранения изменений для "${songId}":`, error);
        throw error;
    }
}

/**
 * Откатывает песню к оригинальному тексту
 * @param {string} songId - ID песни
 * @returns {Promise<void>}
 */
export async function revertToOriginal(songId) {
    if (!songId) {
        throw new Error('songId обязателен');
    }
    
    const songRef = doc(db, 'songs', songId);
    
    try {
        await updateDoc(songRef, {
            'hasWebEdits': false,
            'Текст и аккорды (edited)': deleteField(),
            'lastEditedInApp': deleteField(),
            'editedBy': deleteField()
        });
        console.log(`✅ Песня "${songId}" откачена к оригиналу`);
    } catch (error) {
        console.error(`❌ Ошибка отката песни "${songId}":`, error);
        throw error;
    }
}

/**
 * Получает статус редактирования песни
 * @param {string} songId - ID песни
 * @returns {Promise<Object>} Статус редактирования
 */
export async function getSongEditStatus(songId) {
    if (!songId) {
        throw new Error('songId обязателен');
    }
    
    const songRef = doc(db, 'songs', songId);
    
    try {
        const docSnap = await getDoc(songRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                hasWebEdits: data.hasWebEdits || false,
                lastEditedInApp: data.lastEditedInApp || null,
                editedBy: data.editedBy || null
            };
        } else {
            throw new Error('Песня не найдена');
        }
    } catch (error) {
        console.error(`❌ Ошибка получения статуса песни "${songId}":`, error);
        throw error;
    }
}

// ====================================
// SETLISTS API
// ====================================

/**
 * Загружает все сетлисты
 * @returns {Promise<Array>} Массив сетлистов
 */
export async function loadSetlists() {
    try {
        // Получаем данные текущего пользователя
        const currentUser = auth.currentUser;
        let userBranchId = null;
        let isRootAdmin = false;
        
        if (currentUser) {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userBranchId = userData.branchId || null;
                isRootAdmin = userData.isFounder || userData.isRootAdmin || false;
            }
        }
        
        let queryRef;
        
        // Если главный админ - показываем все сетлисты
        if (isRootAdmin) {
            queryRef = query(setlistsCollection);
        } else if (userBranchId) {
            // Если есть филиал - показываем только сетлисты этого филиала
            queryRef = query(
                setlistsCollection, 
                where("branchId", "==", userBranchId)
            );
        } else {
            // Если нет филиала - показываем только общие сетлисты (без филиала)
            queryRef = query(
                setlistsCollection,
                where("branchId", "==", null)
            );
        }
        
        const querySnapshot = await getDocs(queryRef);
        const setlists = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            setlists.push({
                id: doc.id,
                ...data,
                // Преобразуем Timestamp в Date для сортировки
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            });
        });
        
        // Сортируем в JavaScript вместо Firestore
        setlists.sort((a, b) => b.createdAt - a.createdAt);
        
        console.log(`✅ Загружено ${setlists.length} сетлистов${userBranchId && !isRootAdmin ? ' для филиала' : ''}`);
        return setlists;
    } catch (error) {
        console.error('❌ Ошибка загрузки сетлистов:', error);
        throw error;
    }
}

/**
 * Создает новый сетлист
 * @param {string} name - Название сетлиста
 * @returns {Promise<string>} ID созданного сетлиста
 */
export async function createSetlist(name) {
    if (!name || !name.trim()) {
        throw new Error('Название сетлиста обязательно');
    }
    
    try {
        // Получаем branchId текущего пользователя
        let branchId = null;
        const currentUser = auth.currentUser;
        
        if (currentUser) {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                branchId = userDoc.data().branchId || null;
            }
        }
        
        const docRef = await addDoc(setlistsCollection, {
            name: name.trim(),
            songs: [],
            branchId: branchId, // Привязываем к филиалу пользователя
            createdAt: serverTimestamp()
        });
        
        console.log(`✅ Сетлист "${name}" создан с ID: ${docRef.id} для филиала: ${branchId || 'общий'}`);
        return docRef.id;
    } catch (error) {
        console.error(`❌ Ошибка создания сетлиста "${name}":`, error);
        throw error;
    }
}

/**
 * Удаляет сетлист
 * @param {string} setlistId - ID сетлиста
 * @returns {Promise<void>}
 */
export async function deleteSetlist(setlistId) {
    if (!setlistId) {
        throw new Error('setlistId обязателен');
    }
    
    try {
        await deleteDoc(doc(setlistsCollection, setlistId));
        console.log(`✅ Сетлист ${setlistId} удален`);
    } catch (error) {
        console.error(`❌ Ошибка удаления сетлиста ${setlistId}:`, error);
        throw error;
    }
}

/**
 * Обновляет название сетлиста
 * @param {string} setlistId - ID сетлиста
 * @param {string} newName - Новое название
 * @returns {Promise<void>}
 */
export async function updateSetlistName(setlistId, newName) {
    if (!setlistId || !newName || newName.trim() === '') {
        throw new Error('setlistId и newName обязательны');
    }
    
    try {
        const setlistRef = doc(setlistsCollection, setlistId);
        await updateDoc(setlistRef, {
            name: newName.trim()
        });
        console.log(`✅ Сетлист ${setlistId} переименован в "${newName.trim()}"`);
    } catch (error) {
        console.error(`❌ Ошибка переименования сетлиста ${setlistId}:`, error);
        throw error;
    }
}

/**
 * Добавляет песню в сетлист
 * @param {string} setlistId - ID сетлиста
 * @param {string} songId - ID песни
 * @param {string} preferredKey - Предпочтительная тональность
 * @returns {Promise<Object>} Результат операции
 */
export async function addSongToSetlist(setlistId, songId, preferredKey) {
    if (!setlistId || !songId) {
        throw new Error('setlistId и songId обязательны');
    }
    
    console.log('=== API addSongToSetlist START ===');
    console.log('setlistId:', setlistId);
    console.log('songId:', songId);
    console.log('preferredKey:', preferredKey);
    
    const setlistRef = doc(setlistsCollection, setlistId);
    
    try {
        console.log('Getting setlist document...');
        const setlistDoc = await getDoc(setlistRef);
        
        if (!setlistDoc.exists()) {
            throw new Error('Сетлист не найден');
        }
        
        const setlistData = setlistDoc.data();
        const currentSongs = setlistData.songs || [];
        
        console.log('Current songs in setlist:', currentSongs);
        
        // Проверяем, есть ли уже такая песня
        const existingIndex = currentSongs.findIndex(s => s.songId === songId);
        console.log('Existing song index:', existingIndex);
        
        if (existingIndex !== -1) {
            const existingSong = currentSongs[existingIndex];
            console.log('Found existing song:', existingSong);
            
            if (existingSong.preferredKey === preferredKey) {
                console.log('Song already exists with same key');
                console.log('=== API addSongToSetlist END ===');
                return { status: 'duplicate', existingKey: existingSong.preferredKey };
            } else {
                console.log('Song exists with different key');
                console.log('=== API addSongToSetlist END ===');
                return { status: 'duplicate_key', existingKey: existingSong.preferredKey };
            }
        }
        
        // Добавляем новую песню
        console.log('Adding new song to setlist...');
        const newSong = {
            songId,
            preferredKey: preferredKey || 'C',
            order: currentSongs.length
        };
        
        const updatedSongs = [...currentSongs, newSong];
        console.log('Updated songs array:', updatedSongs);
        
        await updateDoc(setlistRef, {
            songs: updatedSongs
        });
        
        console.log('Song added successfully');
        console.log('=== API addSongToSetlist END ===');
        return { status: 'added' };
        
    } catch (error) {
        console.error(`❌ Ошибка добавления песни в сетлист:`, error);
        console.log('=== API addSongToSetlist END ===');
        throw error;
    }
}

/**
 * Удаляет песню из сетлиста
 * @param {string} setlistId - ID сетлиста
 * @param {string} songId - ID песни
 * @returns {Promise<void>}
 */
export async function removeSongFromSetlist(setlistId, songId) {
    if (!setlistId || !songId) {
        throw new Error('setlistId и songId обязательны');
    }
    
    const setlistRef = doc(setlistsCollection, setlistId);
    
    try {
        const setlistDoc = await getDoc(setlistRef);
        if (!setlistDoc.exists()) {
            throw new Error('Сетлист не найден');
        }
        
        const setlistData = setlistDoc.data();
        const currentSongs = setlistData.songs || [];
        const updatedSongs = currentSongs.filter(s => s.songId !== songId);
        
        await updateDoc(setlistRef, {
            songs: updatedSongs
        });
        
        console.log(`✅ Песня ${songId} удалена из сетлиста ${setlistId}`);
    } catch (error) {
        console.error(`❌ Ошибка удаления песни из сетлиста:`, error);
        throw error;
    }
}

// ====================================
// VOCALISTS & REPERTOIRE API
// ====================================

/**
 * Загружает список вокалистов
 * @returns {Promise<Array>} Массив вокалистов
 */
export async function loadVocalists() {
    try {
        console.log("Загрузка списка вокалистов...");
        const querySnapshot = await getDocs(vocalistsCollection);
        const vocalists = [];
        
        querySnapshot.forEach((doc) => {
            vocalists.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Загружено ${vocalists.length} вокалистов`);
        console.log("Список вокалистов успешно загружен.");
        return vocalists;
    } catch (error) {
        console.error('❌ Ошибка загрузки вокалистов:', error);
        throw error;
    }
}

/**
 * Загружает репертуар вокалиста с использованием callback для обновления UI
 * @param {string} vocalistId - ID вокалиста
 * @param {Function} onRepertoireUpdate - Callback для обновления UI
 */
export function loadRepertoire(vocalistId, onRepertoireUpdate) {
    console.log(`📊 Загрузка репертуара для вокалиста: ${vocalistId}`);
    
    if (state.currentRepertoireUnsubscribe) {
        state.currentRepertoireUnsubscribe();
    }
    
    if (!vocalistId) {
        onRepertoireUpdate({ data: [], error: null });
        return;
    }
    
    const repertoireColRef = collection(db, "vocalists", vocalistId, "repertoire");
    const q = query(repertoireColRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (vocalistId !== state.currentVocalistId) return;
        const songsData = snapshot.docs.map(doc => ({ 
            ...doc.data(), 
            repertoireDocId: doc.id 
        }));
        console.log(`✅ Загружено ${songsData.length} песен в репертуаре`);
        onRepertoireUpdate({ data: songsData, error: null });
    }, (error) => {
        console.error(`!!! ОШИБКА Firestore onSnapshot для репертуара ${vocalistId}:`, error);
        onRepertoireUpdate({ data: [], error });
    });
    
    state.setCurrentRepertoireUnsubscribe(unsubscribe);
}

/**
 * Добавляет или обновляет песню в репертуаре вокалиста
 * @param {string} vocalistId - ID вокалиста
 * @param {Object} song - Объект песни
 * @param {string} preferredKey - Выбранная тональность
 * @returns {Promise<Object>} Результат операции
 */
export async function addToRepertoire(vocalistId, song, preferredKey) {
    try {
        const repertoireCol = collection(db, 'vocalists', vocalistId, 'repertoire');
        const q = query(repertoireCol, where("name", "==", song.name));

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Песня найдена, проверяем тональность
            const repertoireDoc = querySnapshot.docs[0];
            if (repertoireDoc.data().preferredKey !== preferredKey) {
                // Обновляем тональность
                await updateDoc(repertoireDoc.ref, { preferredKey: preferredKey });
                console.log(`✅ Тональность песни "${song.name}" обновлена на ${preferredKey}`);
                return { status: 'updated', key: preferredKey };
            } else {
                console.log(`ℹ️ Песня "${song.name}" уже есть в репертуаре с тональностью ${preferredKey}`);
                return { status: 'exists', key: preferredKey };
            }
        } else {
            // Песня не найдена, добавляем новую
            const docRef = doc(db, 'vocalists', vocalistId, 'repertoire', song.id);
            await setDoc(docRef, {
                name: song.name,
                sheet: song.sheet,
                preferredKey: preferredKey,
                addedAt: serverTimestamp()
            });
            console.log(`✅ Песня "${song.name}" добавлена в репертуар с тональностью ${preferredKey}`);
            return { status: 'added', key: preferredKey };
        }
    } catch (error) {
        console.error(`❌ Ошибка добавления песни в репертуар:`, error);
        throw error;
    }
}

/**
 * Удаляет песню из репертуара вокалиста
 * @param {string} vocalistId - ID вокалиста
 * @param {string} repertoireDocId - ID документа в репертуаре
 * @returns {Promise<void>}
 */
export async function removeFromRepertoire(vocalistId, repertoireDocId) {
    if (!vocalistId || !repertoireDocId) {
        throw new Error('vocalistId и repertoireDocId обязательны');
    }
    
    try {
        const docRef = doc(db, 'vocalists', vocalistId, 'repertoire', repertoireDocId);
        await deleteDoc(docRef);
        console.log(`✅ Песня удалена из репертуара вокалиста ${vocalistId}`);
    } catch (error) {
        console.error(`❌ Ошибка удаления песни из репертуара:`, error);
        throw error;
    }
}

// ====================================
// MODULE METADATA
// ====================================

/**
 * API module metadata
 * @readonly
 */
export const metadata = {
    name: 'API',
    version: '1.0.0',
    description: 'Centralized API functions for Firebase operations',
    functions: [
        'loadAllSongsFromFirestore',
        'saveSongEdit',
        'revertToOriginal', 
        'getSongEditStatus',
        'loadSetlists',
        'createSetlist',
        'deleteSetlist',
        'updateSetlistName',
        'addSongToSetlist',
        'removeSongFromSetlist',
        'loadVocalists',
        'loadRepertoire',
        'addToRepertoire',
        'removeFromRepertoire'
    ],
    collections: [
        'songs',
        'worship_setlists', 
        'vocalists'
    ]
};