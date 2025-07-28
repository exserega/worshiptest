/**
 * Agape Worship App - Setlist Management Module (TEMPORARY STUB)
 * Временные заглушки для избежания ошибок импорта
 */

// Временные заглушки - будут заменены в следующем этапе
export async function addSongToSetlist(song, key) {
    console.log('🎵 addSongToSetlist called:', song.name, key);
    // Импортируем функцию из script.js динамически
    const scriptModule = await import('../../script.js');
    if (window.addSongToSetlist) {
        return window.addSongToSetlist(song, key);
    }
    throw new Error('addSongToSetlist not found');
}

export async function confirmAddSongWithKey() {
    console.log('🎵 confirmAddSongWithKey called');
    // Импортируем функцию из script.js динамически
    if (window.confirmAddSongWithKey) {
        return window.confirmAddSongWithKey();
    }
    throw new Error('confirmAddSongWithKey not found');
}

export const metadata = {
    name: 'SetlistManager',
    version: '1.0.0-stub',
    description: 'Временные заглушки для управления сетлистами',
    functions: [
        'addSongToSetlist',
        'confirmAddSongWithKey'
    ]
};