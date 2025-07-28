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
            
            // Импортируем функцию динамически чтобы избежать циклических зависимостей
            const { showOverlaySearchResults } = await import('./search-manager.js');
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
            
            // Импортируем функцию динамически
            const { showOverlaySearchResults } = await import('./search-manager.js');
            showOverlaySearchResults(matchingSongs, searchTerm);
        }
    } catch (error) {
        console.error('❌ Ошибка поиска в overlay:', error);
        // Импортируем функцию динамически
        const { hideOverlaySearchResults } = await import('./search-manager.js');
        hideOverlaySearchResults();
    }
}

export const metadata = {
    name: 'SearchManager',
    version: '1.0.0',
    description: 'Модуль для управления поиском и отображением результатов',
    functions: [
        'performOverlayDropdownSearch'
    ]
};