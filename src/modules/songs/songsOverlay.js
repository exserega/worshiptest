// ====================================
// 🎵 SONGS OVERLAY MODULE
// ====================================
// Модуль оверлея для выбора песен
// Показывает все песни с фильтрами по категориям
// ====================================

import logger from '../../utils/logger.js';
import { displaySongDetails } from '../../../ui.js';
import * as state from '../../../js/state.js';
import { getUserRepertoire } from '../../api/userRepertoire.js';

// Основные категории (первый уровень)
const MAIN_CATEGORIES = {
    'all': 'Все',
    'fast': 'Быстрые',
    'worship': 'Поклонение'
};

// Подкатегории (второй уровень)
const SUB_CATEGORIES = {
    'vertical': 'Вертикаль',
    'horizontal': 'Горизонталь'
};

// Маппинг значения поля song.sheet -> { main, sub }
const SHEET_TO_LABELS = {
    'Быстрые (вертикаль)': { main: 'Быстрые', sub: 'Вертикаль' },
    'Быстрые (горизонталь)': { main: 'Быстрые', sub: 'Горизонталь' },
    'Поклонение (вертикаль)': { main: 'Поклонение', sub: 'Вертикаль' },
    'Поклонение (горизонталь)': { main: 'Поклонение', sub: 'Горизонталь' }
};

class SongsOverlay {
    constructor() {
        this.overlay = null;
        this.songs = [];
        this.filteredSongs = [];
        this.selectedMainCategory = 'all';
        this.selectedSubCategory = null; // null означает "показать все"
        this.isOpen = false;
        this.repertoireKeyBySongId = {}; // songId -> preferredKey
        
        this.init();
    }
    
    /**
     * Инициализация оверлея
     */
    init() {
        this.createOverlayHTML();
        this.attachEventListeners();
        logger.log('🎵 Songs overlay initialized');
    }
    
    /**
     * Создание HTML структуры оверлея
     */
    createOverlayHTML() {
        const overlayHTML = `
            <div id="songs-overlay" class="songs-overlay">
                <div class="songs-overlay-backdrop"></div>
                <div class="songs-overlay-content">
                    <!-- Шапка -->
                    <div class="songs-overlay-header">
                        <h2 class="songs-overlay-title">Выбор песни</h2>
                        <button class="songs-overlay-close" aria-label="Закрыть">
                            <span class="close-icon"></span>
                        </button>
                    </div>
                    
                    <!-- Фильтры категорий -->
                    <div class="songs-filters-container">
                        <!-- Основные категории -->
                        <div class="songs-category-filters main-filters">
                            ${Object.entries(MAIN_CATEGORIES).map(([key, label]) => `
                                <button class="category-chip main-category ${key === 'all' ? 'active' : ''}" 
                                        data-main-category="${key}">
                                    ${label}
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Подкатегории (скрыты изначально) -->
                        <div class="songs-category-filters sub-filters" style="display: none;">
                            ${Object.entries(SUB_CATEGORIES).map(([key, label]) => `
                                <button class="category-chip sub-category" 
                                        data-sub-category="${key}">
                                    ${label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Список песен -->
                    <div class="songs-list-container">
                        <div class="songs-list">
                            <!-- Песни будут добавлены динамически -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        this.overlay = document.getElementById('songs-overlay');
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        // Закрытие оверлея
        const closeBtn = this.overlay.querySelector('.songs-overlay-close');
        const backdrop = this.overlay.querySelector('.songs-overlay-backdrop');
        
        closeBtn.addEventListener('click', () => this.close());
        backdrop.addEventListener('click', () => this.close());
        
        // Основные категории
        const mainCategoryChips = this.overlay.querySelectorAll('.main-category');
        mainCategoryChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const category = e.target.dataset.mainCategory;
                this.selectMainCategory(category);
            });
        });
        
        // Подкатегории
        const subCategoryChips = this.overlay.querySelectorAll('.sub-category');
        subCategoryChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const subCategory = e.target.dataset.subCategory;
                this.selectSubCategory(subCategory);
            });
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    /**
     * Открытие оверлея
     */
    async open() {
        this.isOpen = true;
        this.overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
        // Скрываем шапку на главной как при других оверлеях/модалках
        try { document.body.classList.add('hide-header'); } catch(e) {}
        
        // Загружаем песни из state и применяем сохраненные фильтры
        this.loadSongs();
        await this.loadUserRepertoireMap();
        this.loadPersistedFilterState();
        this.applyFilterStateToUI();
        this.filterSongs();
        
        logger.log('🎵 Songs overlay opened');
    }
    
    /**
     * Закрытие оверлея
     */
    close() {
        this.isOpen = false;
        this.overlay.classList.remove('visible');
        document.body.style.overflow = '';
        // Мгновенно возвращаем шапку
        try { document.body.classList.remove('hide-header'); } catch(e) {}
        logger.log('🎵 Songs overlay closed');
    }
    
    /**
     * Загрузка песен из state
     */
    loadSongs() {
        try {
            // Получаем песни из глобального state
            this.songs = state.allSongs || [];
            this.filteredSongs = [...this.songs];
            logger.log(`🎵 Loaded ${this.songs.length} songs from state`);
            
            // Выводим уникальные категории для отладки
            const uniqueSheets = [...new Set(this.songs.map(s => s.sheet))];
            logger.log('📂 Available sheets (categories):', uniqueSheets);
            
            // Проверяем структуру данных первой песни для отладки
            if (this.songs.length > 0) {
                const firstSong = this.songs[0];
                logger.log('🎵 Sample song structure:', {
                    name: firstSong.name,
                    'Оригинальная тональность': firstSong['Оригинальная тональность'],
                    defaultKey: firstSong.defaultKey,
                    BPM: firstSong.BPM,
                    bpm: firstSong.bpm
                });
            }
            
        } catch (error) {
            logger.error('Error loading songs:', error);
            this.songs = [];
            this.filteredSongs = [];
        }
    }

    /**
     * Загружает карту репертуара пользователя: songId -> preferredKey
     */
    async loadUserRepertoireMap() {
        try {
            const repSongs = await getUserRepertoire();
            const map = {};
            repSongs.forEach(rs => {
                if (rs?.id && rs?.preferredKey) {
                    map[rs.id] = rs.preferredKey;
                }
            });
            this.repertoireKeyBySongId = map;
            logger.log(`🎤 Repertoire map size: ${Object.keys(map).length}`);
        } catch (e) {
            logger.warn('⚠️ Не удалось загрузить репертуар пользователя', e);
            this.repertoireKeyBySongId = {};
        }
    }
    
    /**
     * Выбор основной категории
     */
    selectMainCategory(category) {
        this.selectedMainCategory = category;
        this.selectedSubCategory = null; // Сбрасываем подкатегорию
        
        // Обновляем активную кнопку
        const chips = this.overlay.querySelectorAll('.main-category');
        chips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.mainCategory === category);
        });
        
        // Показываем/скрываем подкатегории
        const subFilters = this.overlay.querySelector('.sub-filters');
        if (category === 'fast' || category === 'worship') {
            subFilters.style.display = 'flex';
        } else {
            subFilters.style.display = 'none';
        }
        
        // Убираем активный класс со всех подкатегорий
        const subChips = this.overlay.querySelectorAll('.sub-category');
        subChips.forEach(chip => {
            chip.classList.remove('active');
        });
        
        // Сохраняем выбор
        this.persistFilterState();

        this.filterSongs();
    }
    
    /**
     * Выбор подкатегории
     */
    selectSubCategory(subCategory) {
        // Если кликнули на уже активную подкатегорию - снимаем выбор
        if (this.selectedSubCategory === subCategory) {
            this.selectedSubCategory = null;
        } else {
            this.selectedSubCategory = subCategory;
        }
        
        // Обновляем активную кнопку
        const chips = this.overlay.querySelectorAll('.sub-category');
        chips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.subCategory === this.selectedSubCategory);
        });
        
        // Сохраняем выбор
        this.persistFilterState();

        this.filterSongs();
    }
    
    /**
     * Фильтрация песен по выбранным категориям
     */
    filterSongs() {
        logger.log(`🎵 Filtering: main=${this.selectedMainCategory}, sub=${this.selectedSubCategory}`);
        
        if (this.selectedMainCategory === 'all') {
            this.filteredSongs = [...this.songs];
        } else {
            // Маппинг категорий
            const categoryMap = {
                'fast': {
                    'vertical': ['Быстрые (вертикаль)'],
                    'horizontal': ['Быстрые (горизонталь)']
                },
                'worship': {
                    'vertical': ['Поклонение (вертикаль)'],
                    'horizontal': ['Поклонение (горизонталь)']
                }
            };
            
            // Если подкатегория не выбрана (null), показываем все песни категории
            let targetSheets;
            if (this.selectedSubCategory) {
                targetSheets = categoryMap[this.selectedMainCategory]?.[this.selectedSubCategory] || [];
            } else {
                // Показываем все подкатегории основной категории
                const allSubCategories = categoryMap[this.selectedMainCategory] || {};
                targetSheets = Object.values(allSubCategories).flat();
            }
            logger.log(`🎵 Target sheets: ${targetSheets.join(', ')}`);
            
            this.filteredSongs = this.songs.filter(song => {
                const matches = targetSheets.includes(song.sheet);
                if (matches) {
                    logger.log(`✅ Song "${song.name}" matches filter`);
                }
                return matches;
            });
        }
        
        logger.log(`🎵 Filtered songs count: ${this.filteredSongs.length}`);
        this.renderSongs();
    }

    /**
     * Возвращает объект меток для песни: { main, sub }
     */
    getSongCategoryLabels(song) {
        const labels = SHEET_TO_LABELS[song?.sheet];
        if (labels) return labels;
        return { main: '—', sub: '—' };
    }

    /**
     * Возвращает HTML подстроки под названием песни в зависимости от выбранных фильтров
     */
    getSongSublineHTML(song) {
        const { main, sub } = this.getSongCategoryLabels(song);
        // ТЕМНЫЙ фон → светлый текст (явно задаем цвет, не полагаемся на наследование)
        const colorStyle = 'color: var(--text-secondary, #9ca3af);';
        
        if (this.selectedMainCategory === 'all') {
            // Показать главную категорию и подкатегорию
            return `<div class="song-subline" style="${colorStyle}">${main} • ${sub}</div>`;
        }
        
        const isMainSelected = (this.selectedMainCategory === 'fast' || this.selectedMainCategory === 'worship');
        if (isMainSelected && !this.selectedSubCategory) {
            // Показать только подкатегорию
            return `<div class="song-subline" style="${colorStyle}">${sub}</div>`;
        }
        
        // При выбранной подкатегории ничего не показываем
        return '';
    }
    
    /**
     * Синхронизация UI с текущим состоянием фильтров
     */
    applyFilterStateToUI() {
        // Основные категории
        const mainChips = this.overlay.querySelectorAll('.main-category');
        mainChips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.mainCategory === this.selectedMainCategory);
        });

        // Подкатегории: показать/скрыть контейнер
        const subFilters = this.overlay.querySelector('.sub-filters');
        if (this.selectedMainCategory === 'fast' || this.selectedMainCategory === 'worship') {
            subFilters.style.display = 'flex';
        } else {
            subFilters.style.display = 'none';
        }

        // Подкатегории: активная кнопка
        const subChips = this.overlay.querySelectorAll('.sub-category');
        subChips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.subCategory === this.selectedSubCategory);
        });
    }

    /**
     * Сохранение выбранных фильтров между открытиями (localStorage)
     */
    persistFilterState() {
        try {
            localStorage.setItem('songsOverlay.mainCategory', this.selectedMainCategory || 'all');
            localStorage.setItem('songsOverlay.subCategory', this.selectedSubCategory || '');
        } catch (e) {
            logger.warn('⚠️ Не удалось сохранить состояние фильтров песен', e);
        }
    }

    /**
     * Загрузка сохраненных фильтров (если есть)
     */
    loadPersistedFilterState() {
        try {
            const persistedMain = localStorage.getItem('songsOverlay.mainCategory');
            const persistedSub = localStorage.getItem('songsOverlay.subCategory');

            if (persistedMain && MAIN_CATEGORIES[persistedMain]) {
                this.selectedMainCategory = persistedMain;
            }
            // Пустая строка означает отсутствие подкатегории
            if (persistedSub && SUB_CATEGORIES[persistedSub]) {
                this.selectedSubCategory = persistedSub;
            } else {
                this.selectedSubCategory = null;
            }
        } catch (e) {
            logger.warn('⚠️ Не удалось загрузить состояние фильтров песен', e);
        }
    }

    /**
     * Отрисовка списка песен
     */
    renderSongs() {
        const songsList = this.overlay.querySelector('.songs-list');
        
        if (this.filteredSongs.length === 0) {
            songsList.innerHTML = `
                <div class="no-songs-message">
                    Песни не найдены
                </div>
            `;
            return;
        }
        
        songsList.innerHTML = this.filteredSongs.map(song => {
            const userKey = this.repertoireKeyBySongId[song.id];
            const bpmLabel = (song.BPM || song.bpm) ? `${song.BPM || song.bpm} BPM` : '— BPM';
            return `
                <div class="song-item" data-song-id="${song.id}">
                    <div class="song-info">
                        <span class="song-name">${song.name || 'Без названия'}</span>
                        ${this.getSongSublineHTML(song)}
                    </div>
                    <div class="song-meta">
                        ${userKey ? `<span class="song-key">${userKey}</span>` : ''}
                        <span class="song-bpm">${bpmLabel}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Добавляем обработчики клика на песни
        const songItems = songsList.querySelectorAll('.song-item');
        songItems.forEach(item => {
            item.addEventListener('click', () => {
                const songId = item.dataset.songId;
                this.selectSong(songId);
            });
        });
    }
    
    /**
     * Выбор песни
     */
    selectSong(songId) {
        const song = this.songs.find(s => s.id === songId);
        if (song) {
            logger.log(`🎵 Selected song: ${song.name}`);
            this.close();
            // Открываем в сохраненной тональности, если есть в репертуаре
            const userKey = this.repertoireKeyBySongId[song.id];
            if (userKey) {
                displaySongDetails(song, userKey);
            } else {
                displaySongDetails(song);
            }
        }
    }
}

// Создаем экземпляр оверлея
const songsOverlay = new SongsOverlay();

// Экспортируем функцию открытия
export function openSongsOverlay() {
    songsOverlay.open();
}

logger.log('🎵 Songs overlay module loaded');