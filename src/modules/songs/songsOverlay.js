// ====================================
// 🎵 SONGS OVERLAY MODULE
// ====================================
// Модуль оверлея для выбора песен
// Показывает все песни с фильтрами по категориям
// ====================================

import logger from '../../utils/logger.js';
import { loadSongs } from '../../api/index.js';
import { displaySongDetails } from '../../../ui.js';

// Категории песен
const CATEGORIES = {
    'all': 'Все песни',
    'fast-vertical': 'Быстрые вертикаль',
    'fast-horizontal': 'Быстрые горизонталь', 
    'slow-vertical': 'Медленные вертикаль',
    'slow-horizontal': 'Медленные горизонталь'
};

class SongsOverlay {
    constructor() {
        this.overlay = null;
        this.songs = [];
        this.filteredSongs = [];
        this.selectedCategory = 'all';
        this.isOpen = false;
        
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
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Фильтры категорий -->
                    <div class="songs-category-filters">
                        ${Object.entries(CATEGORIES).map(([key, label]) => `
                            <button class="category-chip ${key === 'all' ? 'active' : ''}" 
                                    data-category="${key}">
                                ${label}
                            </button>
                        `).join('')}
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
        
        // Фильтры категорий
        const categoryChips = this.overlay.querySelectorAll('.category-chip');
        categoryChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.selectCategory(category);
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
        
        // Загружаем песни если еще не загружены
        if (this.songs.length === 0) {
            await this.loadSongs();
        }
        
        this.renderSongs();
        logger.log('🎵 Songs overlay opened');
    }
    
    /**
     * Закрытие оверлея
     */
    close() {
        this.isOpen = false;
        this.overlay.classList.remove('visible');
        document.body.style.overflow = '';
        logger.log('🎵 Songs overlay closed');
    }
    
    /**
     * Загрузка песен
     */
    async loadSongs() {
        try {
            this.songs = await loadSongs();
            this.filteredSongs = [...this.songs];
            logger.log(`🎵 Loaded ${this.songs.length} songs`);
        } catch (error) {
            logger.error('Error loading songs:', error);
        }
    }
    
    /**
     * Выбор категории
     */
    selectCategory(category) {
        this.selectedCategory = category;
        
        // Обновляем активную кнопку
        const chips = this.overlay.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.category === category);
        });
        
        // Фильтруем песни
        if (category === 'all') {
            this.filteredSongs = [...this.songs];
        } else {
            // Маппинг категорий на значения из Firebase
            const categoryMap = {
                'fast-vertical': 'Быстрые вертикаль',
                'fast-horizontal': 'Быстрые горизонталь',
                'slow-vertical': 'Медленные вертикаль',
                'slow-horizontal': 'Медленные горизонталь'
            };
            
            const firebaseCategory = categoryMap[category];
            this.filteredSongs = this.songs.filter(song => 
                song.category === firebaseCategory
            );
        }
        
        this.renderSongs();
        logger.log(`🎵 Selected category: ${category}, songs: ${this.filteredSongs.length}`);
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
        
        songsList.innerHTML = this.filteredSongs.map(song => `
            <div class="song-item" data-song-id="${song.id}">
                <div class="song-info">
                    <span class="song-name">${song.name || 'Без названия'}</span>
                </div>
                <div class="song-meta">
                    <span class="song-key">${song.defaultKey || 'C'}</span>
                    <span class="song-bpm">${song.bpm || '—'} BPM</span>
                </div>
            </div>
        `).join('');
        
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
            // Отображаем песню на главном экране
            displaySongDetails(song);
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