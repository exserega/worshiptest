/**
 * Agape Worship App - Search Management Module
 * Модуль для управления поиском и отображением результатов
 */

import { 
    stateManager,
    normalizeSearchQuery,
    getNormalizedTitle,
    getNormalizedLyrics
} from '../core/index.js';
import * as state from '../../state.js';

/**
 * Поиск в выпадающем списке overlay
 * @param {string} searchTerm - поисковый запрос
 */
export async function performOverlayDropdownSearch(searchTerm) {
    try {
        // Используем Web Worker для поиска если доступен
        if (window.searchWorkerManager && typeof window.searchWorkerManager.overlaySearch === 'function') {
            // Используем State Manager с fallback к старому state
            const allSongs = stateManager.getAllSongs().length > 0 ? stateManager.getAllSongs() : state.allSongs;
            const { results } = await window.searchWorkerManager.overlaySearch(searchTerm, allSongs, {
                enablePrioritySearch: true
            });
            
            const allResults = [
                ...results.exactResults.map(r => r.song),
                ...results.fuzzyResults.map(r => r.song)
            ];
            
            showOverlaySearchResults(allResults, searchTerm);
        } else {
            // Fallback: обычный поиск
            const query = normalizeSearchQuery(searchTerm);
            const allSongs = stateManager.getAllSongs().length > 0 ? stateManager.getAllSongs() : state.allSongs;
            let matchingSongs = allSongs.filter(song => {
                const titleMatch = getNormalizedTitle(song).includes(query);
                const lyricsMatch = getNormalizedLyrics(song).includes(query);
                return titleMatch || lyricsMatch;
            });
            
            // Применяем smart sorting
            matchingSongs.sort((a, b) => {
                const aNormalizedTitle = getNormalizedTitle(a);
                const bNormalizedTitle = getNormalizedTitle(b);
                
                // Приоритет для точных совпадений в начале названия
                const aStartsWithQuery = aNormalizedTitle.startsWith(query);
                const bStartsWithQuery = bNormalizedTitle.startsWith(query);
                
                if (aStartsWithQuery && !bStartsWithQuery) return -1;
                if (!aStartsWithQuery && bStartsWithQuery) return 1;
                
                // Приоритет для более коротких названий
                const lengthDiff = a.name.length - b.name.length;
                if (Math.abs(lengthDiff) > 10) return lengthDiff;
                
                // Алфавитная сортировка
                return a.name.localeCompare(b.name);
            });

            // Ограничиваем количество результатов
            if (matchingSongs.length > 20) {
                matchingSongs = matchingSongs.slice(0, 20);
            }
            
            showOverlaySearchResults(matchingSongs, searchTerm);
        }
    } catch (error) {
        console.error('❌ Ошибка поиска в overlay:', error);
        hideOverlaySearchResults();
    }
}

/**
 * Показ результатов поиска в dropdown overlay
 * @param {Array} results - массив результатов поиска
 * @param {string} query - поисковый запрос
 */
export function showOverlaySearchResults(results, query) {
    const dropdown = document.getElementById('overlay-search-results');
    const container = dropdown.querySelector('.search-results-container');
    
    if (!dropdown || !container) {
        console.error('❌ Не найдены элементы dropdown поиска');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    if (!results || results.length === 0) {
        // Показываем сообщение "ничего не найдено"
        container.innerHTML = `
            <div class="overlay-search-no-results">
                <i class="fas fa-search"></i>
                Ничего не найдено по запросу "${query}"
            </div>
        `;
    } else {
        // Добавляем результаты
        results.forEach(song => {
            const resultElement = createOverlaySearchResultElement(song, query);
            container.appendChild(resultElement);
        });
    }
    
    // Показываем dropdown
    dropdown.style.display = 'block';
    
    console.log(`🔍 Показано ${results.length} результатов поиска в dropdown`);
}

/**
 * Скрытие dropdown результатов поиска
 */
export function hideOverlaySearchResults() {
    const dropdown = document.getElementById('overlay-search-results');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

/**
 * Создание элемента результата поиска для dropdown
 * @param {Object} song - объект песни
 * @param {string} query - поисковый запрос
 * @returns {HTMLElement} элемент результата
 */
export function createOverlaySearchResultElement(song, query) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'search-result';
    
    // Нормализуем запрос для проверки
    const normalizedQuery = normalizeSearchQuery(query);
    
    // Проверяем, найдено ли в названии или тексте
    const normalizedTitle = getNormalizedTitle(song);
    const titleMatch = normalizedTitle.includes(normalizedQuery);
    
    const lyrics = song.hasWebEdits 
        ? (song['Текст и аккорды (edited)'] || '') 
        : (song['Текст и аккорды'] || '');
    
    // Убираем аккорды для более точного поиска
    const cleanedLyrics = lyrics.replace(/\[[^\]]*\]/g, ' ');
    const normalizedLyrics = getNormalizedLyrics({ 'Текст и аккорды': cleanedLyrics });
    const lyricsMatch = !titleMatch && normalizedLyrics.includes(normalizedQuery);
    
    // Формируем HTML для результата
    let resultHTML = `
        <div class="search-result-title">${song.name}</div>
    `;
    
    // Если найдено в тексте песни, показываем фрагмент с подсветкой
    if (lyricsMatch && query) {
        // Импортируем функцию для получения фрагмента (будет добавлена позже)
        const fragment = getHighlightedTextFragment(cleanedLyrics, query, 60);
        if (fragment) {
            resultHTML += `<div class="search-result-fragment">${fragment}</div>`;
        }
    }
    
    resultDiv.innerHTML = resultHTML;
    
    // Добавляем обработчик клика
    resultDiv.addEventListener('click', () => {
        console.log('🎵 Клик на результат поиска:', song.name);
        
        // Скрываем dropdown
        hideOverlaySearchResults();
        
        // Показываем модальное окно выбора ключа (импортируем динамически)
        import('../ui/overlay-manager.js').then(({ showKeySelectionModal }) => {
            showKeySelectionModal(song);
        });
    });
    
    return resultDiv;
}

// Временная заглушка для getHighlightedTextFragment (будет перенесена позже)
function getHighlightedTextFragment(text, query, contextLength = 100) {
    if (!text || !query) return '';
    
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(text.length, index + query.length + contextLength / 2);
    
    let fragment = text.substring(start, end);
    
    // Добавляем многоточие если фрагмент обрезан
    if (start > 0) fragment = '...' + fragment;
    if (end < text.length) fragment = fragment + '...';
    
    // Подсвечиваем найденное слово
    const regex = new RegExp(`(${query})`, 'gi');
    fragment = fragment.replace(regex, '<mark>$1</mark>');
    
    return fragment;
}

export const metadata = {
    name: 'SearchManager',
    version: '1.0.0',
    description: 'Модуль для управления поиском и отображением результатов',
    functions: [
        'performOverlayDropdownSearch',
        'showOverlaySearchResults',
        'hideOverlaySearchResults',
        'createOverlaySearchResultElement'
    ]
};