/**
 * Оверлей добавления песен для архива
 * Полная копия функционала с главной страницы
 */

import logger from '../../utils/logger.js';
import { db } from '../../../firebase-init.js';
import { addSongToArchiveSetlist, removeSongFromArchiveSetlist } from './archiveApi.js';

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
                            <span>в сет-лист "</span><span id="archive-target-setlist-name" class="setlist-name"></span><span>"</span>
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
                                        <option value="worship">Поклонение</option>
                                        <option value="glorifying">Прославление</option>
                                        <option value="gift">Дар</option>
                                    </select>
                                    <button id="archive-show-added" class="filter-btn">
                                        <span>Добавленные</span>
                                        <span id="archive-added-badge" class="added-count-badge">0</span>
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

            <!-- Полноэкранный preview с выбором тональности -->
            <div id="archive-key-modal" class="global-fullscreen-overlay">
                <div class="fullscreen-content song-preview-content">
                    <!-- Профессиональная шапка -->
                    <div class="song-preview-header">
                        <!-- Строка с заголовком и закрытием -->
                        <div class="header-top">
                            <button id="close-archive-key-modal" class="overlay-close-btn">
                                <i class="fas fa-times"></i>
                            </button>
                            <div class="header-title">
                                <h3 id="archive-key-song-name">Выберите тональность для песни "Название песни"</h3>
                            </div>
                        </div>
                        
                        <!-- Контролы с выбором тональности -->
                        <div class="header-controls">
                            <div class="tonality-controls-wrapper">
                                <span class="tonality-label">Тональность:</span>
                                <select id="archive-key-select" class="key-select-modern">
                                    <!-- Опции будут добавлены динамически -->
                                </select>
                            </div>
                            <button id="confirm-archive-key" class="add-to-setlist-btn">
                                <i class="fas fa-plus"></i>
                                <span>Добавить в сет-лист</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Тело preview -->
                    <div class="song-display" id="archive-song-display">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Загрузка песни...</p>
                        </div>
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
        this.categoryFilter.addEventListener('change', () => {
            this.selectedCategory = this.categoryFilter.value;
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

        document.getElementById('confirm-archive-key').addEventListener('click', () => {
            const keySelect = document.getElementById('archive-key-select');
            const selectedKey = keySelect.value;
            if (selectedKey) {
                this.confirmAddSong(selectedKey);
            }
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

        // Категории теперь определены статически через кнопки
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

        const songsHTML = this.filteredSongs.map((song, index) => {
            const isAdded = this.addedSongs.has(song.id);
            const addedKey = this.addedSongs.get(song.id);
            return `
                <div class="song-card-compact ${isAdded ? 'added' : ''}" data-song-id="${song.id}">
                    <div class="song-number">${index + 1}</div>
                    <div class="song-info">
                        <div class="song-title">${song.name}</div>
                        <div class="song-category-label">${song.category}</div>
                    </div>
                    <div class="song-meta">
                        ${addedKey ? `<span class="song-key-badge">${addedKey}</span>` : ''}
                        ${song.bpm ? `<span class="song-bpm">${song.bpm} BPM</span>` : ''}
                    </div>
                    <button class="song-action-btn ${isAdded ? 'remove' : 'add'}" data-song-id="${song.id}">
                        <i class="fas fa-${isAdded ? 'trash' : 'plus'}"></i>
                    </button>
                </div>
            `;
        }).join('');

        this.songsGrid.innerHTML = songsHTML;

        // Обработчики кликов на кнопки действий
        this.songsGrid.querySelectorAll('.song-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.dataset.songId;
                const song = this.songs.find(s => s.id === songId);
                if (song) {
                    if (btn.classList.contains('remove')) {
                        // Удаляем песню
                        this.removeSongFromSetlist(songId);
                    } else {
                        // Добавляем песню
                        this.selectSong(song);
                    }
                }
            });
        });
    }

    /**
     * Выбор песни
     */
    async selectSong(song) {
        // Загружаем полные данные песни, включая текст
        try {
            const { getSongById } = await import('../../api/index.js');
            const fullSongData = await getSongById(song.id);
            
            if (fullSongData) {
                this.selectedSong = fullSongData;
                
                // Проверяем наличие тональностей
                const keys = fullSongData.keys || [];
                
                if (keys.length === 0) {
                    // Если тональностей нет, добавляем без выбора
                    this.confirmAddSong(null);
                } else if (keys.length === 1) {
                    // Если только одна тональность, добавляем сразу
                    this.confirmAddSong(keys[0]);
                } else {
                    // Показываем модальное окно выбора тональности
                    this.showKeySelectionModal(fullSongData);
                }
            } else {
                logger.error('Не удалось загрузить данные песни');
            }
        } catch (error) {
            logger.error('Ошибка при загрузке песни:', error);
        }
    }

    /**
     * Показ модального окна выбора тональности
     */
    showKeySelectionModal(song) {
        // Обновляем заголовок
        document.getElementById('archive-key-song-name').textContent = 
            `Выберите тональность для песни "${song.name}"`;

        // Заполняем селект тональностей
        const keySelect = document.getElementById('archive-key-select');
        keySelect.innerHTML = song.keys.map(key => `
            <option value="${key}">${key}</option>
        `).join('');

        // Показываем текст песни
        const songDisplay = document.getElementById('archive-song-display');
        
        // Форматируем текст песни
        let formattedText = song.text || 'Текст песни недоступен';
        
        // Применяем базовое форматирование как на главной странице
        if (formattedText && formattedText !== 'Текст песни недоступен') {
            // Оборачиваем аккорды в span для стилизации
            formattedText = formattedText.replace(/([A-G][#b]?m?(?:maj|min|dim|aug|sus|add)?[0-9]*)/g, '<span class="chord">$1</span>');
            
            // Добавляем переносы строк
            formattedText = formattedText.replace(/\n/g, '<br>');
        }
        
        songDisplay.innerHTML = `
            <div class="song-content">
                <div class="song-text">${formattedText}</div>
            </div>
        `;

        // Обработчик изменения тональности
        keySelect.addEventListener('change', () => {
            // Здесь можно добавить транспонирование если нужно
            logger.log('Selected key:', keySelect.value);
        });

        // Показываем модальное окно
        this.keyModal.classList.add('show');
    }

    /**
     * Подтверждение добавления песни
     */
    async confirmAddSong(selectedKey = null) {
        if (!this.selectedSong) return;

        // Определяем тональность
        let key = selectedKey;
        if (!key && this.selectedSong.defaultKey) {
            key = this.selectedSong.defaultKey;
        } else if (!key && this.selectedSong.keys && this.selectedSong.keys.length > 0) {
            key = this.selectedSong.keys[0];
        }

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
     * Удаление песни из сет-листа
     */
    async removeSongFromSetlist(songId) {
        try {
            // Если есть targetSetlistId, сразу удаляем из БД
            if (this.targetSetlistId && this.mode === 'edit') {
                await removeSongFromArchiveSetlist(this.targetSetlistId, songId);
            }
            
            // Удаляем из локального состояния
            this.addedSongs.delete(songId);
            
            // Обновляем счетчики
            this.updateAddedSongsCount();
            
            // Если показываем только добавленные и больше нет песен, показываем все
            if (this.showAddedOnly && this.addedSongs.size === 0) {
                this.showAddedOnly = false;
                document.getElementById('archive-show-added').classList.remove('active');
            }
            
            // Перерисовываем
            this.filterSongs();
            
            this.showNotification('Песня удалена', 'success');
        } catch (error) {
            logger.error('Ошибка удаления песни:', error);
            this.showNotification('Ошибка удаления песни', 'error');
        }
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