// =====================================================
// 🔍 SEARCH SERVICE
// =====================================================
// Сервис для поиска песен и событий в Firebase
// =====================================================

const { getFirestore, isFirebaseInitialized } = require('./firebase');

/**
 * Поиск песен по названию
 * @param {string} query - Поисковый запрос
 * @param {number} limit - Максимальное количество результатов
 * @returns {Promise<Array>} - Массив найденных песен
 */
async function searchSongs(query, limit = 10) {
    if (!isFirebaseInitialized()) {
        console.error('❌ Firebase не инициализирован');
        return [];
    }

    try {
        const db = getFirestore();
        const songsRef = db.collection('songs');

        // Нормализуем запрос
        const normalizedQuery = query.toLowerCase().trim();

        console.log(`🔍 Поиск песен: "${query}"`);

        // Получаем все песни (для упрощения - потом можно оптимизировать)
        const snapshot = await songsRef.limit(500).get();

        if (snapshot.empty) {
            console.log('⚠️ Коллекция songs пуста');
            return [];
        }

        // Фильтруем и сортируем результаты
        const songs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const name = data.name || doc.id;
            const normalizedName = name.toLowerCase();

            // Проверяем совпадение
            if (normalizedName.includes(normalizedQuery)) {
                songs.push({
                    id: doc.id,
                    name: name,
                    defaultKey: data.defaultKey,
                    sheet: data.sheet,
                    BPM: data.BPM || data.bpm,
                    youtubeLink: data.youtubeLink,
                    // Рассчитываем релевантность для сортировки
                    relevance: calculateRelevance(normalizedName, normalizedQuery)
                });
            }
        });

        // Сортируем по релевантности
        songs.sort((a, b) => b.relevance - a.relevance);

        console.log(`✅ Найдено песен: ${songs.length}`);

        return songs.slice(0, limit);
    } catch (error) {
        console.error('❌ Ошибка поиска песен:', error);
        throw error;
    }
}

/**
 * Получить ближайшие события
 * @param {number} limit - Максимальное количество событий
 * @returns {Promise<Array>} - Массив событий
 */
async function getUpcomingEvents(limit = 5) {
    if (!isFirebaseInitialized()) {
        console.error('❌ Firebase не инициализирован');
        return [];
    }

    try {
        const db = getFirestore();
        const eventsRef = db.collection('events');

        console.log('📅 Получение ближайших событий...');

        // Получаем события начиная с текущей даты
        const now = new Date();
        const snapshot = await eventsRef
            .where('date', '>=', now)
            .orderBy('date', 'asc')
            .limit(limit)
            .get();

        if (snapshot.empty) {
            console.log('⚠️ Ближайших событий не найдено');
            return [];
        }

        const events = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                name: data.name,
                date: data.date,
                songCount: data.songCount || 0,
                participantCount: data.participantCount || 0,
                leaderId: data.leaderId,
                leaderName: data.leaderName,
                branchId: data.branchId
            });
        });

        console.log(`✅ Найдено событий: ${events.length}`);

        return events;
    } catch (error) {
        console.error('❌ Ошибка получения событий:', error);
        throw error;
    }
}

/**
 * Получить детали песни по ID или названию
 * @param {string} songIdOrName - ID или название песни
 * @returns {Promise<Object|null>} - Данные песни или null
 */
async function getSongDetails(songIdOrName) {
    if (!isFirebaseInitialized()) {
        console.error('❌ Firebase не инициализирован');
        return null;
    }

    try {
        const db = getFirestore();
        const songsRef = db.collection('songs');

        // Сначала пробуем найти по ID (ID = название песни)
        const doc = await songsRef.doc(songIdOrName).get();

        if (doc.exists) {
            return {
                id: doc.id,
                ...doc.data()
            };
        }

        // Если не найдено, пытаемся искать по полю name
        const snapshot = await songsRef.where('name', '==', songIdOrName).limit(1).get();

        if (!snapshot.empty) {
            const firstDoc = snapshot.docs[0];
            return {
                id: firstDoc.id,
                ...firstDoc.data()
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Ошибка получения деталей песни:', error);
        return null;
    }
}

/**
 * Рассчитать релевантность результата поиска
 * @param {string} text - Текст для проверки
 * @param {string} query - Поисковый запрос
 * @returns {number} - Оценка релевантности (выше = лучше)
 */
function calculateRelevance(text, query) {
    let score = 0;

    // Точное совпадение = наивысший приоритет
    if (text === query) {
        score += 1000;
    }

    // Начинается с запроса = высокий приоритет
    if (text.startsWith(query)) {
        score += 500;
    }

    // Содержит запрос = средний приоритет
    if (text.includes(query)) {
        score += 100;
    }

    // Бонус за совпадающие слова
    const textWords = text.split(/\s+/);
    const queryWords = query.split(/\s+/);

    queryWords.forEach(queryWord => {
        textWords.forEach(textWord => {
            if (textWord.includes(queryWord)) {
                score += 50;
            }
        });
    });

    return score;
}

module.exports = {
    searchSongs,
    getUpcomingEvents,
    getSongDetails
};
