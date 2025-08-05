/**
 * @fileoverview Оверлей репертуара пользователя
 * @module RepertoireOverlay
 */

import logger from '../../utils/logger.js';
import { db, collection, getDocs, query, orderBy, onSnapshot } from '../../utils/firebase-v8-adapter.js';
import { auth } from '../../../firebase-init.js';
import { displaySongDetails } from '../../../ui.js';

/**
 * Класс для управления оверлеем репертуара
 */
class RepertoireOverlay {
    constructor() {
        this.overlay = null;
        this.isOpen = false;
        this.currentFilter = 'all';
        this.currentKeyFilter = null;
        this.repertoireSongs = [];
        this.filteredSongs = [];
        this.unsubscribe = null;
        this.init();
    }
    
    /**
     * Инициализация оверлея
     */
    init() {
        this.createOverlayHTML();
        this.attachEventListeners();
        this.loadUserRepertoire();
    }
    
    /**
     * Создание HTML структуры оверлея
     */
    createOverlayHTML() {
        const overlayHTML = `
            <div id="repertoire-overlay" class="songs-overlay">
                <div class="songs-overlay-backdrop"></div>
                <div class="songs-overlay-content">
                    <!-- Шапка -->
                    <div class="songs-overlay-header">
                        <h2 class="songs-overlay-title">Мой репертуар</h2>
                        <button class="songs-overlay-close" aria-label="Закрыть">
                            <span class="close-icon"></span>
                        </button>
                    </div>
                    
                    <!-- Фильтры категорий -->
                    <div class="songs-filters-container">
                        <!-- Основные фильтры -->
                        <div class="songs-category-filters main-filters">
                            <button class="category-chip active" data-main-filter="all">
                                Все
                            </button>
                            <button class="category-chip" data-main-filter="key">
                                По тональности
                            </button>
                            <button class="category-chip" data-main-filter="category">
                                По категориям
                            </button>
                        </div>
                        
                        <!-- Фильтры тональности (скрыты по умолчанию) -->
                        <div class="songs-category-filters key-filters" style="display: none;">
                            ${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => `
                                <button class="category-chip sub-category" data-key-filter="${key}">
                                    ${key}
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Фильтры категорий (скрыты по умолчанию) -->
                        <div class="songs-category-filters category-filters" style="display: none;">
                            <button class="category-chip sub-category active" data-category-filter="all">
                                Все
                            </button>
                            <button class="category-chip sub-category" data-category-filter="Быстрые">
                                Быстрые
                            </button>
                            <button class="category-chip sub-category" data-category-filter="Поклонение">
                                Поклонение
                            </button>
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
        this.overlay = document.getElementById('repertoire-overlay');
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
        
        // Основные фильтры
        const mainFilterButtons = this.overlay.querySelectorAll('[data-main-filter]');
        mainFilterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.mainFilter;
                this.selectMainFilter(filter);
            });
        });
        
        // Фильтры тональности
        const keyFilterButtons = this.overlay.querySelectorAll('[data-key-filter]');
        keyFilterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.keyFilter;
                this.selectKeyFilter(key);
            });
        });
        
        // Фильтры категорий
        const categoryFilterButtons = this.overlay.querySelectorAll('[data-category-filter]');
        categoryFilterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.categoryFilter;
                this.selectCategoryFilter(category);
            });
        });
        
        // Закрытие по Escape
        this.escapeHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
    }
    
    /**
     * Загрузка репертуара пользователя
     */
    async loadUserRepertoire() {
        const user = auth.currentUser;
        if (!user) {
            logger.log('Пользователь не авторизован');
            return;
        }
        
        const repertoireRef = collection(db, 'users', user.uid, 'repertoire');
        const q = query(repertoireRef, orderBy('name'));
        
        // Подписываемся на изменения
        this.unsubscribe = onSnapshot(q, (snapshot) => {
            this.repertoireSongs = [];
            snapshot.forEach(doc => {
                this.repertoireSongs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            logger.log(`Загружено ${this.repertoireSongs.length} песен из репертуара`);
            this.filterSongs();
            this.renderSongs();
        }, (error) => {
            logger.error('Ошибка загрузки репертуара:', error);
        });
    }
    
    /**
     * Выбор основного фильтра
     */
    selectMainFilter(filter) {
        this.currentFilter = filter;
        
        // Обновляем активную кнопку
        const mainButtons = this.overlay.querySelectorAll('[data-main-filter]');
        mainButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mainFilter === filter);
        });
        
        // Показываем/скрываем подфильтры
        const keyFilters = this.overlay.querySelector('.key-filters');
        const categoryFilters = this.overlay.querySelector('.category-filters');
        
        keyFilters.style.display = filter === 'key' ? 'flex' : 'none';
        categoryFilters.style.display = filter === 'category' ? 'flex' : 'none';
        
        // Сбрасываем подфильтры при смене основного фильтра
        if (filter !== 'key') {
            this.currentKeyFilter = null;
            const keyButtons = this.overlay.querySelectorAll('[data-key-filter]');
            keyButtons.forEach(btn => btn.classList.remove('active'));
        }
        
        this.filterSongs();
        this.renderSongs();
    }
    
    /**
     * Выбор фильтра тональности
     */
    selectKeyFilter(key) {
        this.currentKeyFilter = key;
        
        // Обновляем активную кнопку
        const keyButtons = this.overlay.querySelectorAll('[data-key-filter]');
        keyButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.keyFilter === key);
        });
        
        this.filterSongs();
        this.renderSongs();
    }
    
    /**
     * Выбор фильтра категории
     */
    selectCategoryFilter(category) {
        // Обновляем активную кнопку
        const categoryButtons = this.overlay.querySelectorAll('[data-category-filter]');
        categoryButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.categoryFilter === category);
        });
        
        this.filterSongs();
        this.renderSongs();
    }
    
    /**
     * Фильтрация песен
     */
    filterSongs() {
        this.filteredSongs = [...this.repertoireSongs];
        
        // Фильтрация по тональности
        if (this.currentFilter === 'key' && this.currentKeyFilter) {
            this.filteredSongs = this.filteredSongs.filter(song => 
                song.preferredKey === this.currentKeyFilter
            );
        }
        
        // Фильтрация по категории
        if (this.currentFilter === 'category') {
            const activeCategory = this.overlay.querySelector('[data-category-filter].active');
            if (activeCategory && activeCategory.dataset.categoryFilter !== 'all') {
                const category = activeCategory.dataset.categoryFilter;
                this.filteredSongs = this.filteredSongs.filter(song => 
                    song.category?.includes(category)
                );
            }
        }
        
        // Сортировка по имени
        this.filteredSongs.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }
    
    /**
     * Отрисовка списка песен
     */
    renderSongs() {
        const songsList = this.overlay.querySelector('.songs-list');
        
        if (this.filteredSongs.length === 0) {
            songsList.innerHTML = `
                <div class="empty-message">
                    ${this.repertoireSongs.length === 0 
                        ? 'Ваш репертуар пуст' 
                        : 'Нет песен по выбранным фильтрам'}
                </div>
            `;
            return;
        }
        
        songsList.innerHTML = this.filteredSongs.map(song => `
            <div class="song-item" data-song-id="${song.id}">
                <div class="song-info">
                    <span class="song-name">${song.name}</span>
                </div>
                <div class="song-meta">
                    ${song.preferredKey ? `<span class="song-key">${song.preferredKey}</span>` : ''}
                    ${song.BPM ? `<span class="song-bpm">${song.BPM} BPM</span>` : ''}
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики кликов
        const songItems = songsList.querySelectorAll('.song-item');
        songItems.forEach(item => {
            item.addEventListener('click', () => {
                const songId = item.dataset.songId;
                const song = this.filteredSongs.find(s => s.id === songId);
                if (song) {
                    this.selectSong(song);
                }
            });
        });
    }
    
    /**
     * Выбор песни
     */
    async selectSong(song) {
        logger.log('Выбрана песня из репертуара:', song.name);
        
        try {
            // Получаем полные данные песни из общей коллекции
            const { getSongById } = await import('../../api/index.js');
            const fullSongData = await getSongById(song.id);
            
            if (fullSongData) {
                // Открываем песню в основном окне с сохраненной тональностью
                if (typeof displaySongDetails === 'function') {
                    displaySongDetails(fullSongData, song.preferredKey);
                }
                
                // Закрываем оверлей
                this.close();
            } else {
                logger.error('Песня не найдена в общей коллекции:', song.id);
                alert('Песня не найдена');
            }
        } catch (error) {
            logger.error('Ошибка загрузки песни:', error);
            alert('Ошибка загрузки песни');
        }
    }
    
    /**
     * Открытие оверлея
     */
    open() {
        if (!this.overlay) return;
        
        this.overlay.classList.add('visible');
        this.isOpen = true;
        document.addEventListener('keydown', this.escapeHandler);
        
        // Обновляем данные при открытии
        this.filterSongs();
        this.renderSongs();
    }
    
    /**
     * Закрытие оверлея
     */
    close() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('visible');
        this.isOpen = false;
        document.removeEventListener('keydown', this.escapeHandler);
    }
    
    /**
     * Уничтожение оверлея
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        if (this.overlay) {
            this.overlay.remove();
        }
        
        document.removeEventListener('keydown', this.escapeHandler);
    }
}

// Создаем и экспортируем экземпляр
let repertoireOverlayInstance = null;

export function initRepertoireOverlay() {
    if (!repertoireOverlayInstance) {
        repertoireOverlayInstance = new RepertoireOverlay();
    }
    return repertoireOverlayInstance;
}

export function openRepertoireOverlay() {
    if (!repertoireOverlayInstance) {
        initRepertoireOverlay();
    }
    repertoireOverlayInstance.open();
}

export function closeRepertoireOverlay() {
    if (repertoireOverlayInstance) {
        repertoireOverlayInstance.close();
    }
}