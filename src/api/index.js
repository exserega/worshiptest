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

import { db } from '../../firebase-config.js';
import {
    collection, addDoc, query, onSnapshot, updateDoc, deleteDoc, setDoc, doc,
    orderBy, getDocs, where, getDoc, runTransaction, serverTimestamp, deleteField
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ====================================
// COLLECTIONS
// ====================================

const songsCollection = collection(db, "songs");
const setlistsCollection = collection(db, "setlists");
const vocalistsCollection = collection(db, "vocalists");

// ====================================
// SONGS API
// ====================================

/**
 * Загружает все песни из Firestore
 * @returns {Promise<Array>} Массив песен
 */
export async function loadAllSongsFromFirestore() {
    try {
        const querySnapshot = await getDocs(query(songsCollection, orderBy("name")));
        const songs = [];
        
        querySnapshot.forEach((doc) => {
            songs.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Загружено ${songs.length} песен из Firestore`);
        return songs;
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
    if (!songId || !editedContent) {
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
        const querySnapshot = await getDocs(query(setlistsCollection, orderBy("createdAt", "desc")));
        const setlists = [];
        
        querySnapshot.forEach((doc) => {
            setlists.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Загружено ${setlists.length} сетлистов`);
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
        const docRef = await addDoc(setlistsCollection, {
            name: name.trim(),
            songs: [],
            createdAt: serverTimestamp()
        });
        
        console.log(`✅ Сетлист "${name}" создан с ID: ${docRef.id}`);
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
// VOCALISTS API
// ====================================

/**
 * Загружает список вокалистов
 * @returns {Promise<Array>} Массив вокалистов
 */
export async function loadVocalists() {
    try {
        const querySnapshot = await getDocs(vocalistsCollection);
        const vocalists = [];
        
        querySnapshot.forEach((doc) => {
            vocalists.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Загружено ${vocalists.length} вокалистов`);
        return vocalists;
    } catch (error) {
        console.error('❌ Ошибка загрузки вокалистов:', error);
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
        'addSongToSetlist',
        'removeSongFromSetlist',
        'loadVocalists'
    ],
    collections: [
        'songs',
        'setlists', 
        'vocalists'
    ]
};