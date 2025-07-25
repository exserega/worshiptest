/**
 * Поисковый движок с поддержкой точного и нечеткого поиска
 * Объединяет все алгоритмы поиска в единый интерфейс
 */

import { 
    fuzzyMatch, 
    fuzzyMatchWithScore,
    calculateTextSimilarity, 
    generateSuggestions 
} from '../utils/fuzzySearch.js';

/**
 * Конфигурация поискового движка
 */
const SEARCH_CONFIG = {
    // Пороги для нечеткого поиска (оптимизированные)
    FUZZY_THRESHOLD_HIGH: 0.8,    // Высокая точность
    FUZZY_THRESHOLD_MEDIUM: 0.7,  // Средняя точность
    FUZZY_THRESHOLD_LOW: 0.6,     // Низкая точность
    
    // Настройки алгоритмов
    MIN_WORD_LENGTH: 3,           // Минимум символов в слове для фаззи-поиска
    MIN_WORD_SIMILARITY: 0.5,     // Минимальная схожесть слова для учета
    MIN_OVERALL_SCORE: 0.3,       // Минимальный общий балл для включения в результаты
    
    // Настройки результатов
    MAX_EXACT_RESULTS: 50,        // Максимум точных результатов
    MAX_FUZZY_RESULTS: 20,        // Максимум нечетких результатов
    MAX_SUGGESTIONS: 3,           // Максимум предложений
    FUZZY_TRIGGER_THRESHOLD: 10,  // Запускать фаззи-поиск если точных < этого
    
    // Веса для ранжирования (точно настроенные)
    WEIGHT_TITLE_EXACT: 1.0,      // Точное совпадение в названии
    WEIGHT_TITLE_START: 0.9,      // Начало названия
    WEIGHT_TITLE_CONTAIN: 0.8,    // Содержание в названии
    WEIGHT_LYRICS_EXACT: 0.7,     // Точное совпадение в тексте
    WEIGHT_TITLE_FUZZY: 0.6,      // Нечеткое совпадение в названии
    WEIGHT_LYRICS_FUZZY: 0.5,     // Нечеткое совпадение в тексте
};

/**
 * Класс расширенного поискового движка
 */
class SearchEngine {
    constructor() {
        this.dictionary = new Set(); // Словарь для предложений
        this.lastResults = [];       // Кэш последних результатов
        this.lastQuery = '';         // Последний запрос
    }

    /**
     * Инициализация словаря из песен
     * @param {Array} songs - Массив песен
     */
    initializeDictionary(songs) {
        this.dictionary.clear();
        
        songs.forEach(song => {
            // Добавляем слова из названий
            if (song.name) {
                const titleWords = song.name.toLowerCase()
                    .split(/\s+/)
                    .filter(word => word.length >= 3);
                titleWords.forEach(word => this.dictionary.add(word));
            }
            
            // Добавляем ключевые слова из текста (первые строки)
            const lyrics = song.hasWebEdits 
                ? (song['Текст и аккорды (edited)'] || '') 
                : (song['Текст и аккорды'] || '');
                
            if (lyrics) {
                const firstLines = lyrics.split('\n').slice(0, 10).join(' ');
                const cleanText = firstLines.replace(/\[[^\]]*\]/g, ' ');
                const lyricsWords = cleanText.toLowerCase()
                    .split(/\s+/)
                    .filter(word => word.length >= 4 && !/\d/.test(word));
                    
                lyricsWords.slice(0, 20).forEach(word => this.dictionary.add(word));
            }
        });
    }

    /**
     * Выполняет комбинированный поиск (точный + нечеткий)
     * @param {string} query - Поисковый запрос
     * @param {Array} songs - Массив песен для поиска
     * @param {Object} options - Опции поиска
     * @returns {Object} Результаты поиска
     */
    search(query, songs, options = {}) {
        if (!query || !songs) {
            return { 
                exactResults: [], 
                fuzzyResults: [], 
                suggestions: [],
                totalFound: 0 
            };
        }

        const config = { ...SEARCH_CONFIG, ...options };
        this.lastQuery = query;

        // Получаем нормализованные данные
        const normalizedQuery = this.normalizeSearchQuery(query);
        
        // Точный поиск
        const exactResults = this.performExactSearch(normalizedQuery, songs, config);
        
        // Нечеткий поиск (только если точных результатов мало)
        let fuzzyResults = [];
        if (exactResults.length < config.FUZZY_TRIGGER_THRESHOLD) {
            fuzzyResults = this.performFuzzySearch(normalizedQuery, songs, exactResults, config);
        }

        // Предложения для исправления (только если результатов очень мало)
        let suggestions = [];
        if (exactResults.length === 0 && fuzzyResults.length < 3) {
            suggestions = generateSuggestions(
                normalizedQuery, 
                Array.from(this.dictionary), 
                config.MAX_SUGGESTIONS
            );
        }

        const results = {
            exactResults: exactResults.slice(0, config.MAX_EXACT_RESULTS),
            fuzzyResults: fuzzyResults.slice(0, config.MAX_FUZZY_RESULTS),
            suggestions,
            totalFound: exactResults.length + fuzzyResults.length,
            hasMore: exactResults.length > config.MAX_EXACT_RESULTS || fuzzyResults.length > config.MAX_FUZZY_RESULTS
        };

        this.lastResults = results;
        return results;
    }

    /**
     * Выполняет точный поиск
     * @param {string} query - Нормализованный запрос
     * @param {Array} songs - Массив песен
     * @param {Object} config - Конфигурация
     * @returns {Array} Результаты точного поиска
     */
    performExactSearch(query, songs, config) {
        const results = [];

        songs.forEach(song => {
            const normalizedTitle = this.getNormalizedTitle(song);
            const normalizedLyrics = this.getNormalizedLyrics(song);
            
            let score = 0;
            let matchType = null;

            // Проверяем точные совпадения
            if (normalizedTitle.includes(query)) {
                if (normalizedTitle.startsWith(query)) {
                    score = config.WEIGHT_TITLE_START;
                    matchType = 'title-start';
                } else {
                    score = config.WEIGHT_TITLE_CONTAIN;
                    matchType = 'title-contain';
                }
            } else if (normalizedLyrics.includes(query)) {
                score = config.WEIGHT_LYRICS_EXACT;
                matchType = 'lyrics-exact';
            }

            if (score > 0) {
                results.push({
                    song,
                    score,
                    matchType,
                    searchType: 'exact'
                });
            }
        });

        // Сортируем по убыванию релевантности
        return results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.song.name.localeCompare(b.song.name);
        });
    }

    /**
     * Выполняет нечеткий поиск
     * @param {string} query - Нормализованный запрос
     * @param {Array} songs - Массив песен
     * @param {Array} exactResults - Результаты точного поиска (для исключения)
     * @param {Object} config - Конфигурация
     * @returns {Array} Результаты нечеткого поиска
     */
    performFuzzySearch(query, songs, exactResults, config) {
        const exactSongIds = new Set(exactResults.map(r => r.song.id));
        const results = [];

        songs.forEach(song => {
            // Пропускаем песни, уже найденные точным поиском
            if (exactSongIds.has(song.id)) return;

            const normalizedTitle = this.getNormalizedTitle(song);
            const normalizedLyrics = this.getNormalizedLyrics(song);
            
            let score = 0;
            let matchType = null;

            // Нечеткое совпадение в названии (оптимизированно)
            const titleFuzzyResult = fuzzyMatchWithScore(query, normalizedTitle, config.FUZZY_THRESHOLD_MEDIUM);
            if (titleFuzzyResult.isMatch) {
                score = config.WEIGHT_TITLE_FUZZY * titleFuzzyResult.similarity;
                matchType = `title-${titleFuzzyResult.matchType}`;
            }
            // Нечеткое совпадение в тексте (только если не найдено в названии)
            else {
                const lyricsFuzzyResult = fuzzyMatchWithScore(query, normalizedLyrics, config.FUZZY_THRESHOLD_LOW);
                if (lyricsFuzzyResult.isMatch) {
                    score = config.WEIGHT_LYRICS_FUZZY * lyricsFuzzyResult.similarity;
                    matchType = `lyrics-${lyricsFuzzyResult.matchType}`;
                }
            }

            if (score > config.MIN_OVERALL_SCORE) { // Минимальный порог для включения в результаты
                results.push({
                    song,
                    score,
                    matchType,
                    searchType: 'fuzzy',
                    // Дополнительная информация для отладки и UI
                    fuzzyDetails: {
                        titleResult: titleFuzzyResult.isMatch ? titleFuzzyResult : null,
                        lyricsResult: lyricsFuzzyResult?.isMatch ? lyricsFuzzyResult : null
                    }
                });
            }
        });

        // Сортируем по убыванию релевантности
        return results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.song.name.localeCompare(b.song.name);
        });
    }

    /**
     * Нормализует поисковый запрос
     * @param {string} query - Исходный запрос
     * @returns {string} Нормализованный запрос
     */
    normalizeSearchQuery(query) {
        if (!query) return '';
        
        return query
            .toLowerCase()
            .trim()
            .replace(/[^\w\s\u0400-\u04FF-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Получает нормализованное название песни (использует кэш)
     * @param {Object} song - Объект песни
     * @returns {string} Нормализованное название
     */
    getNormalizedTitle(song) {
        // Используем существующую систему кэширования
        if (typeof window !== 'undefined' && window.getNormalizedTitle) {
            return window.getNormalizedTitle(song);
        }
        
        // Fallback для случаев без глобальных функций
        return this.normalizeText(song.name || '');
    }

    /**
     * Получает нормализованный текст песни (использует кэш)
     * @param {Object} song - Объект песни
     * @returns {string} Нормализованный текст
     */
    getNormalizedLyrics(song) {
        // Используем существующую систему кэширования
        if (typeof window !== 'undefined' && window.getNormalizedLyrics) {
            return window.getNormalizedLyrics(song);
        }
        
        // Fallback для случаев без глобальных функций
        const lyrics = song.hasWebEdits 
            ? (song['Текст и аккорды (edited)'] || '') 
            : (song['Текст и аккорды'] || '');
        const cleanedLyrics = lyrics.replace(/\[[^\]]*\]/g, ' ');
        return this.normalizeText(cleanedLyrics);
    }

    /**
     * Нормализует текст (fallback функция)
     * @param {string} text - Исходный текст
     * @returns {string} Нормализованный текст
     */
    normalizeText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .replace(/[^\w\s\u0400-\u04FF-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Получает последние результаты поиска
     * @returns {Object} Последние результаты
     */
    getLastResults() {
        return this.lastResults;
    }

    /**
     * Получает последний запрос
     * @returns {string} Последний запрос
     */
    getLastQuery() {
        return this.lastQuery;
    }
}

// Создаем единственный экземпляр поискового движка
const searchEngine = new SearchEngine();

// Экспортируем экземпляр и класс
export default searchEngine;
export { SearchEngine, SEARCH_CONFIG };