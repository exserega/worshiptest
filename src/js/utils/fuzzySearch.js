/**
 * Модуль для нечеткого (фаззи) поиска
 * Позволяет находить текст с опечатками и неточными совпадениями
 */

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 * @param {string} str1 - Первая строка
 * @param {string} str2 - Вторая строка
 * @returns {number} Расстояние Левенштейна
 */
function levenshteinDistance(str1, str2) {
    if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0);
    
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Инициализация матрицы
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Заполнение матрицы
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[len1][len2];
}

/**
 * Вычисляет процент схожести между двумя строками
 * @param {string} str1 - Первая строка
 * @param {string} str2 - Вторая строка
 * @returns {number} Процент схожести (0-1)
 */
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const maxLength = Math.max(str1.length, str2.length);
    const distance = levenshteinDistance(str1, str2);
    
    return (maxLength - distance) / maxLength;
}

/**
 * Проверяет нечеткое совпадение между запросом и текстом
 * @param {string} query - Поисковый запрос
 * @param {string} text - Текст для проверки
 * @param {number} threshold - Порог схожести (0-1)
 * @returns {boolean} true если найдено нечеткое совпадение
 */
function fuzzyMatch(query, text, threshold = 0.7) {
    if (!query || !text) return false;
    
    query = query.toLowerCase().trim();
    text = text.toLowerCase().trim();
    
    // Точное совпадение
    if (text.includes(query)) return true;
    
    // Проверяем слова по отдельности
    const queryWords = query.split(/\s+/).filter(w => w.length > 2);
    const textWords = text.split(/\s+/);
    
    for (const queryWord of queryWords) {
        let bestMatch = 0;
        
        for (const textWord of textWords) {
            const similarity = calculateSimilarity(queryWord, textWord);
            bestMatch = Math.max(bestMatch, similarity);
        }
        
        if (bestMatch >= threshold) {
            return true;
        }
    }
    
    return false;
}

/**
 * Находит нечеткие совпадения в массиве текстов
 * @param {string} query - Поисковый запрос
 * @param {Array<string>} texts - Массив текстов для поиска
 * @param {number} threshold - Порог схожести (0-1)
 * @returns {Array<{text: string, similarity: number, index: number}>} Найденные совпадения
 */
function findFuzzyMatches(query, texts, threshold = 0.7) {
    if (!query || !texts || !Array.isArray(texts)) return [];
    
    const matches = [];
    
    texts.forEach((text, index) => {
        if (fuzzyMatch(query, text, threshold)) {
            // Вычисляем точную схожесть для сортировки
            const similarity = calculateTextSimilarity(query, text);
            matches.push({ text, similarity, index });
        }
    });
    
    // Сортируем по убыванию схожести
    return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Вычисляет общую схожесть между запросом и текстом
 * @param {string} query - Поисковый запрос
 * @param {string} text - Текст для сравнения
 * @returns {number} Оценка схожести (0-1)
 */
function calculateTextSimilarity(query, text) {
    if (!query || !text) return 0;
    
    query = query.toLowerCase().trim();
    text = text.toLowerCase().trim();
    
    // Бонус за точное вхождение
    if (text.includes(query)) return 1;
    
    // Анализ по словам
    const queryWords = query.split(/\s+/).filter(w => w.length > 2);
    const textWords = text.split(/\s+/);
    
    let totalSimilarity = 0;
    let matchedWords = 0;
    
    for (const queryWord of queryWords) {
        let bestWordMatch = 0;
        
        for (const textWord of textWords) {
            const similarity = calculateSimilarity(queryWord, textWord);
            bestWordMatch = Math.max(bestWordMatch, similarity);
        }
        
        if (bestWordMatch > 0.5) {
            totalSimilarity += bestWordMatch;
            matchedWords++;
        }
    }
    
    return matchedWords > 0 ? totalSimilarity / queryWords.length : 0;
}

/**
 * Создает предложения для исправления запроса
 * @param {string} query - Исходный запрос
 * @param {Array<string>} dictionary - Словарь возможных слов
 * @param {number} maxSuggestions - Максимальное количество предложений
 * @returns {Array<string>} Предложения для исправления
 */
function generateSuggestions(query, dictionary, maxSuggestions = 3) {
    if (!query || !dictionary || !Array.isArray(dictionary)) return [];
    
    const queryWords = query.toLowerCase().split(/\s+/);
    const suggestions = new Set();
    
    queryWords.forEach(queryWord => {
        if (queryWord.length < 3) return;
        
        const wordMatches = dictionary
            .filter(word => word.length >= 3)
            .map(word => ({
                word: word.toLowerCase(),
                similarity: calculateSimilarity(queryWord, word.toLowerCase())
            }))
            .filter(match => match.similarity >= 0.6)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxSuggestions);
            
        wordMatches.forEach(match => suggestions.add(match.word));
    });
    
    return Array.from(suggestions).slice(0, maxSuggestions);
}

// Экспорт функций
export {
    levenshteinDistance,
    calculateSimilarity,
    fuzzyMatch,
    findFuzzyMatches,
    calculateTextSimilarity,
    generateSuggestions
};