/**
 * Оверлей добавления песен для архива
 * Полная копия функционала с главной страницы
 */

import logger from '../../utils/logger.js';
import { db } from '../../../firebase-init.js';
import { addSongToArchiveSetlist } from './archiveApi.js';

class ArchiveSongsOverlay {
    constructor() {
        this.songs = [];
        this.filteredSongs = [];
        this.selectedSong = null;
        this.addedSongs = new Map();
        this.searchTerm = '';
        this.selectedCategory = '';
        this.showAddedOnly = false;
        this.targetSetlistId = null;
        this.targetSetlistName = '';
        this.mode = 'add'; // 'add' или 'edit'
    }

    /**
     * Инициализация оверлея
     */
    async init() {
        this.createHTML();
        this.attachEventListeners();
        await this.loadSongs();
        await this.loadCategories();
        logger.log('🎵 Archive songs overlay initialized');
    }

    /**
     * Создание HTML структуры
     */
    createHTML() {
        const overlayHTML = `
            <div id="archive-songs-overlay" class="global-fullscreen-overlay">
                <div class="fullscreen-content">
                    <div class="fullscreen-header">
                        <div class="header-top-row">
                            <div class="header-left">
                                <button id="close-archive-songs" class="overlay-close-btn">
                                    <i class="fas fa-times"></i>
                                </button>
                                <div class="header-title">
                                    <h3>Добавить песни</h3>
                                </div>
                            </div>
                            <div class="header-right">
                                <div class="added-counter">
                                    <i class="fas fa-music"></i>
                                    <span id="archive-added-songs-count">0</span>
                                </div>
                                <button id="finish-archive-adding" class="btn-modern primary">
                                    <i class="fas fa-check"></i>
                                    <span>Готово</span>
                                </button>
                            </div>
                        </div>
                        <div class="header-subtitle">
                            <span>в архивный сет-лист "</span>
                            <span id="archive-target-setlist-name" class="setlist-name"></span>
                            <span>"</span>
                        </div>
                    </div>
                    
                    <div class="fullscreen-body">
                        <div class="search-section">
                            <div class="search-container">
                                <div class="search-input-wrapper">
                                    <i class="fas fa-search"></i>
                                    <input 
                                        type="text" 
                                        id="archive-song-search" 
                                        class="search-input"
                                        placeholder="Поиск песен по названию..."
                                    >
                                    <button id="archive-clear-search" class="clear-search-btn" style="display: none;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                    
                                    <!-- Dropdown для результатов поиска -->
                                    <div id="archive-search-results" class="overlay-search-dropdown" style="display: none;">
                                        <div class="search-results-container">
                                            <!-- Результаты поиска будут добавлены динамически -->
                                        </div>
                                    </div>
                                </div>
                                <div class="search-filters">
                                    <select id="archive-category-filter" class="filter-select">
                                        <option value="">Все категории</option>
                                    </select>
                                    <button id="archive-show-added" class="filter-btn">
                                        <span>Добавленные</span>
                                        <span id="archive-added-badge" class="added-count-badge" style="display: none;">0</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="results-section">
                            <div id="archive-songs-grid" class="songs-grid">
                                <div class="loading-state">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    <p>Загрузка песен...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Модальное окно выбора тональности -->
            <div id="archive-key-modal" class="global-fullscreen-overlay">
                <div class="fullscreen-content song-preview-content">
                    <div class="song-preview-header">
                        <div class="header-top">
                            <button id="close-archive-key-modal" class="overlay-close-btn">
                                <i class="fas fa-times"></i>
                            </button>
                            <div class="header-title">
                                <h3 id="archive-key-song-name">Выберите тональность</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div class="song-preview-body">
                        <div class="key-selection-section">
                            <h4>Доступные тональности:</h4>
                            <div id="archive-keys-grid" class="keys-grid">
                                <!-- Тональности будут добавлены динамически -->
                            </div>
                        </div>
                        
                        <div class="song-preview-section">
                            <div id="archive-song-preview" class="song-text-preview">
                                <!-- Превью песни -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="song-preview-footer">
                        <button id="cancel-archive-key" class="btn-modern secondary">
                            <i class="fas fa-times"></i>
                            <span>Отмена</span>
                        </button>
                        <button id="confirm-archive-key" class="btn-modern primary">
                            <i class="fas fa-plus"></i>
                            <span>Добавить в сет-лист</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Добавляем в DOM
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        
        // Сохраняем ссылки на элементы
        this.overlay = document.getElementById('archive-songs-overlay');
        this.keyModal = document.getElementById('archive-key-modal');
        this.searchInput = document.getElementById('archive-song-search');
        this.categoryFilter = document.getElementById('archive-category-filter');
        this.songsGrid = document.getElementById('archive-songs-grid');
        this.searchResults = document.getElementById('archive-search-results');
        this.addedCount = document.getElementById('archive-added-songs-count');
        this.addedBadge = document.getElementById('archive-added-badge');
    }

    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        // Закрытие оверлея
        document.getElementById('close-archive-songs').addEventListener('click', () => this.close());
        document.getElementById('finish-archive-adding').addEventListener('click', () => this.close());

        // Поиск
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('archive-clear-search').addEventListener('click', () => {
            this.searchInput.value = '';
            this.handleSearch('');
        });

        // Фильтр категорий
        this.categoryFilter.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.filterSongs();
        });

        // Кнопка "Добавленные"
        document.getElementById('archive-show-added').addEventListener('click', () => {
            this.showAddedOnly = !this.showAddedOnly;
            document.getElementById('archive-show-added').classList.toggle('active', this.showAddedOnly);
            this.filterSongs();
        });

        // Модальное окно тональности
        document.getElementById('close-archive-key-modal').addEventListener('click', () => {
            this.keyModal.classList.remove('show');
        });

        document.getElementById('cancel-archive-key').addEventListener('click', () => {
            this.keyModal.classList.remove('show');
        });

        document.getElementById('confirm-archive-key').addEventListener('click', () => {
            this.confirmAddSong();
        });

        // Клик вне результатов поиска
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.searchResults.style.display = 'none';
            }
        });
    }

    /**
     * Загрузка песен из базы
     */
    async loadSongs() {
        try {
            const snapshot = await db.collection('songs').get();
            this.songs = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.songs.push({
                    id: doc.id,
                    name: data.name || doc.id,
                    category: data.sheet || 'Без категории',
                    keys: this.parseKeys(data),
                    defaultKey: data.defaultKey || 'C',
                    text: data.text || '',
                    bpm: data.BPM || data.bpm || ''
                });
            });

            logger.log(`📚 Loaded ${this.songs.length} songs for archive`);
            this.filterSongs();
        } catch (error) {
            logger.error('Error loading songs:', error);
        }
    }

    /**
     * Парсинг тональностей песни
     */
    parseKeys(songData) {
        const keys = [];
        
        // Проверяем поле defaultKey
        if (songData.defaultKey) {
            keys.push(songData.defaultKey);
        }
        
        // Проверяем текст песни на наличие тональностей
        if (songData.text) {
            const keyMatches = songData.text.match(/Тональность[:\s]+([A-G][#b]?m?)/gi);
            if (keyMatches) {
                keyMatches.forEach(match => {
                    const key = match.replace(/Тональность[:\s]+/i, '').trim();
                    if (key && !keys.includes(key)) {
                        keys.push(key);
                    }
                });
            }
        }
        
        // Если тональности не найдены, добавляем стандартные
        if (keys.length === 0) {
            keys.push('C', 'D', 'E', 'F', 'G', 'A', 'B');
        }
        
        return keys;
    }

    /**
     * Загрузка категорий
     */
    async loadCategories() {
        const categories = new Set();
        this.songs.forEach(song => {
            if (song.category) {
                categories.add(song.category);
            }
        });

        // Добавляем категории в селект
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.categoryFilter.appendChild(option);
        });
    }

    /**
     * Обработка поиска
     */
    handleSearch(term) {
        this.searchTerm = term.toLowerCase();
        const clearBtn = document.getElementById('archive-clear-search');
        clearBtn.style.display = term ? 'block' : 'none';

        if (term.length > 0) {
            this.showSearchResults();
        } else {
            this.searchResults.style.display = 'none';
        }

        this.filterSongs();
    }

    /**
     * Показ результатов поиска в dropdown
     */
    showSearchResults() {
        const results = this.songs.filter(song => 
            song.name.toLowerCase().includes(this.searchTerm)
        ).slice(0, 10); // Максимум 10 результатов

        if (results.length === 0) {
            this.searchResults.style.display = 'none';
            return;
        }

        const resultsHTML = results.map(song => `
            <div class="search-result-item" data-song-id="${song.id}">
                <div class="song-name">${this.highlightMatch(song.name, this.searchTerm)}</div>
                <div class="song-meta">
                    <span class="song-category">${song.category}</span>
                    ${song.bpm ? `<span class="song-bpm">${song.bpm} BPM</span>` : ''}
                </div>
            </div>
        `).join('');

        this.searchResults.querySelector('.search-results-container').innerHTML = resultsHTML;
        this.searchResults.style.display = 'block';

        // Обработчики кликов на результаты
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const songId = item.dataset.songId;
                const song = this.songs.find(s => s.id === songId);
                if (song) {
                    this.selectSong(song);
                }
                this.searchResults.style.display = 'none';
            });
        });
    }

    /**
     * Подсветка совпадений в поиске
     */
    highlightMatch(text, term) {
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Фильтрация песен
     */
    filterSongs() {
        this.filteredSongs = this.songs.filter(song => {
            // Фильтр по поиску
            if (this.searchTerm && !song.name.toLowerCase().includes(this.searchTerm)) {
                return false;
            }

            // Фильтр по категории
            if (this.selectedCategory && song.category !== this.selectedCategory) {
                return false;
            }

            // Фильтр по добавленным
            if (this.showAddedOnly && !this.addedSongs.has(song.id)) {
                return false;
            }

            return true;
        });

        this.renderSongs();
    }

    /**
     * Отображение песен
     */
    renderSongs() {
        if (this.filteredSongs.length === 0) {
            this.songsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <p>Песни не найдены</p>
                </div>
            `;
            return;
        }

        const songsHTML = this.filteredSongs.map(song => {
            const isAdded = this.addedSongs.has(song.id);
            return `
                <div class="song-card ${isAdded ? 'added' : ''}" data-song-id="${song.id}">
                    <div class="song-card-header">
                        <h4 class="song-title">${song.name}</h4>
                        ${isAdded ? '<span class="added-indicator"><i class="fas fa-check"></i></span>' : ''}
                    </div>
                    <div class="song-card-meta">
                        <span class="song-category">${song.category}</span>
                        ${song.bpm ? `<span class="song-bpm">${song.bpm} BPM</span>` : ''}
                    </div>
                    <div class="song-card-actions">
                        <button class="btn-add-song" data-song-id="${song.id}">
                            <i class="fas fa-${isAdded ? 'check' : 'plus'}"></i>
                            <span>${isAdded ? 'Добавлено' : 'Добавить'}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.songsGrid.innerHTML = songsHTML;

        // Обработчики кликов на карточки
        this.songsGrid.querySelectorAll('.song-card').forEach(card => {
            const addBtn = card.querySelector('.btn-add-song');
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = card.dataset.songId;
                const song = this.songs.find(s => s.id === songId);
                if (song) {
                    this.selectSong(song);
                }
            });
        });
    }

    /**
     * Выбор песни
     */
    selectSong(song) {
        this.selectedSong = song;
        
        // Если у песни только одна тональность, добавляем сразу
        if (song.keys.length === 1) {
            this.confirmAddSong(song.keys[0]);
        } else {
            // Показываем модальное окно выбора тональности
            this.showKeySelectionModal(song);
        }
    }

    /**
     * Показ модального окна выбора тональности
     */
    showKeySelectionModal(song) {
        // Обновляем заголовок
        document.getElementById('archive-key-song-name').textContent = 
            `Выберите тональность для песни "${song.name}"`;

        // Генерируем кнопки тональностей
        const keysGrid = document.getElementById('archive-keys-grid');
        keysGrid.innerHTML = song.keys.map(key => `
            <button class="key-option" data-key="${key}">
                ${key}
            </button>
        `).join('');

        // Показываем превью песни
        const preview = document.getElementById('archive-song-preview');
        preview.innerHTML = `<pre>${song.text || 'Текст песни недоступен'}</pre>`;

        // Обработчики выбора тональности
        let selectedKey = null;
        keysGrid.querySelectorAll('.key-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // Убираем выделение с других
                keysGrid.querySelectorAll('.key-option').forEach(b => b.classList.remove('selected'));
                // Выделяем текущую
                btn.classList.add('selected');
                selectedKey = btn.dataset.key;
            });
        });

        // Выбираем первую тональность по умолчанию
        const firstKey = keysGrid.querySelector('.key-option');
        if (firstKey) {
            firstKey.click();
        }

        // Обновляем обработчик подтверждения
        const confirmBtn = document.getElementById('confirm-archive-key');
        confirmBtn.onclick = () => {
            if (selectedKey) {
                this.confirmAddSong(selectedKey);
                this.keyModal.classList.remove('show');
            }
        };

        // Показываем модальное окно
        this.keyModal.classList.add('show');
    }

    /**
     * Подтверждение добавления песни
     */
    async confirmAddSong(selectedKey = null) {
        if (!this.selectedSong) return;

        const key = selectedKey || this.selectedSong.defaultKey || this.selectedSong.keys[0];

        try {
            // Добавляем песню в архивный сет-лист
            await addSongToArchiveSetlist(this.targetSetlistId, {
                id: this.selectedSong.id,
                preferredKey: key
            });

            // Добавляем в список добавленных
            this.addedSongs.set(this.selectedSong.id, key);

            // Обновляем счетчики
            this.updateCounters();

            // Обновляем отображение
            this.renderSongs();

            // Показываем уведомление
            this.showNotification(`Песня "${this.selectedSong.name}" добавлена`);

        } catch (error) {
            logger.error('Error adding song to archive:', error);
            this.showNotification('Ошибка при добавлении песни', 'error');
        }
    }

    /**
     * Обновление счетчиков
     */
    updateCounters() {
        const count = this.addedSongs.size;
        this.addedCount.textContent = count;
        this.addedBadge.textContent = count;
        this.addedBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    /**
     * Показ уведомления
     */
    showNotification(message, type = 'success') {
        // Временное уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Открытие оверлея
     */
    async open(setlistId, setlistName, mode = 'add') {
        this.targetSetlistId = setlistId;
        this.targetSetlistName = setlistName;
        this.mode = mode;

        // Обновляем заголовок
        document.querySelector('#archive-songs-overlay .header-title h3').textContent = 
            mode === 'edit' ? `Редактировать "${setlistName}"` : 'Добавить песни';
        
        document.getElementById('archive-target-setlist-name').textContent = setlistName;

        // Загружаем существующие песни если режим редактирования
        if (mode === 'edit') {
            await this.loadExistingSongs(setlistId);
        }

        // Показываем оверлей
        this.overlay.classList.add('show');
        
        // Фокус на поиске
        setTimeout(() => this.searchInput.focus(), 100);
    }

    /**
     * Загрузка существующих песен сет-листа
     */
    async loadExistingSongs(setlistId) {
        try {
            const doc = await db.collection('archive_setlists').doc(setlistId).get();
            if (doc.exists) {
                const data = doc.data();
                const songs = data.songs || [];
                
                // Добавляем существующие песни в список добавленных
                this.addedSongs.clear();
                songs.forEach(song => {
                    this.addedSongs.set(song.songId, song.preferredKey);
                });
                
                this.updateCounters();
            }
        } catch (error) {
            logger.error('Error loading existing songs:', error);
        }
    }

    /**
     * Закрытие оверлея
     */
    close() {
        this.overlay.classList.remove('show');
        this.keyModal.classList.remove('show');
        
        // Очистка состояния
        this.searchInput.value = '';
        this.selectedCategory = '';
        this.categoryFilter.value = '';
        this.showAddedOnly = false;
        document.getElementById('archive-show-added').classList.remove('active');
        this.searchResults.style.display = 'none';
        
        // Очистка добавленных песен
        this.addedSongs.clear();
        this.updateCounters();
        
        // Перезагрузка архива
        if (window.loadArchiveData) {
            window.loadArchiveData();
        }
    }
}

// Создаем и экспортируем экземпляр
const archiveSongsOverlay = new ArchiveSongsOverlay();

export async function openArchiveSongsOverlay(setlistId, setlistName, mode = 'add') {
    if (!archiveSongsOverlay.overlay) {
        await archiveSongsOverlay.init();
    }
    await archiveSongsOverlay.open(setlistId, setlistName, mode);
}

// Делаем доступным глобально для архива
window.openArchiveSongsOverlay = openArchiveSongsOverlay;