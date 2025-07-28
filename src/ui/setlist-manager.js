/**
 * Agape Worship App - Setlist Management Module (TEMPORARY STUB)
 * Временные заглушки для избежания ошибок импорта
 */

// Временные заглушки - будут заменены в следующем этапе
export async function addSongToSetlist(song, key) {
    console.log('🎵 addSongToSetlist called:', song.name, key);
    
    // Вызываем функцию напрямую из глобального контекста
    // Функция addSongToSetlist определена в script.js как глобальная
    if (typeof window !== 'undefined' && window.addSongToSetlist) {
        return await window.addSongToSetlist(song, key);
    }
    
    // Fallback: вызываем функцию напрямую через eval (временное решение)
    try {
        console.log('🔄 Trying direct call to addSongToSetlist');
        
        // Получаем доступ к функции из script.js через глобальный контекст
        const scriptContext = window;
        
        // Ищем функцию в различных местах
        let addSongFunc = null;
        
        // Проверяем различные способы доступа к функции
        if (scriptContext.addSongToSetlist) {
            addSongFunc = scriptContext.addSongToSetlist;
        } else {
            // Создаем временную реализацию используя существующий API
            console.log('🔧 Creating temporary implementation');
            
            const targetSetlistId = window.activeSetlistId || window.currentCreatedSetlistId;
            console.log('📝 Using targetSetlistId:', targetSetlistId);
            
            if (!targetSetlistId) {
                throw new Error('No active setlist found');
            }
            
            // Импортируем api динамически
            const apiModule = await import('../../api.js');
            const result = await apiModule.default.addSongToSetlist(targetSetlistId, song.id, key);
            
            console.log('✅ Song added via API:', result);
            return result;
        }
        
        if (addSongFunc) {
            return await addSongFunc(song, key);
        }
        
        throw new Error('addSongToSetlist function not accessible');
        
    } catch (error) {
        console.error('❌ Error in addSongToSetlist fallback:', error);
        throw error;
    }
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