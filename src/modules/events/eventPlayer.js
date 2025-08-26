/**
 * Модуль плеера для события
 * Отображает песни события в полноэкранном режиме с навигацией
 */

import logger from '../../utils/logger.js';

class EventPlayer {
    constructor() {
        this.songs = [];
        this.currentIndex = 0;
        this.overlay = null;
        this.isOpen = false;
        this.eventId = null;
        this.transposition = 0;
        this.currentFontSize = 16; // Базовый размер шрифта в px
        this.areChordsVisible = true;
        this.isChordsOnlyMode = false;
        this.isSplitMode = true; // По умолчанию 2 колонки
        this.currentKey = null;  // Будет установлена из сетлиста
        this.originalKey = null;
        
        this.init();
    }
    
    init() {
        // Создаем оверлей плеера
        this.createOverlay();
        this.attachEventHandlers();
    }
    
    createOverlay() {
        // Создаем основной контейнер оверлея
        this.overlay = document.createElement('div');
        this.overlay.id = 'event-player-overlay';
        this.overlay.className = 'event-player-overlay';
        this.overlay.innerHTML = `
            <div class="event-player-header">
                <!-- Первая строка: закрытие, переключатель панели, позиция, навигация -->
                <div class="player-header-row-1">
                    <div class="player-header-left">
                        <button class="player-close-btn" aria-label="Закрыть плеер">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="player-toggle-controls-btn" aria-label="Показать/скрыть панель инструментов">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                    
                    <span class="player-song-number">Песня 1/1</span>
                    
                    <div class="player-nav-compact">
                        <button class="player-nav-btn-small" id="player-prev" aria-label="Предыдущая">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="player-nav-btn-small" id="player-next" aria-label="Следующая">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Вторая строка: название песни -->
                <div class="player-header-row-2">
                    <span class="player-song-name">Название песни</span>
                </div>
                
                <!-- Третья строка: тональность и BPM -->
                <div class="player-header-row-3">
                    <div class="player-song-key-bpm">
                        <span class="player-key">C</span>
                        <span class="divider">|</span>
                        <span class="player-bpm">120 BPM</span>
                    </div>
                </div>
                
                <!-- Ряд контролов -->
                <div class="player-controls-row">
                    <div class="player-key-selector">
                        <button class="player-control-btn player-key-btn" id="player-key-button" aria-label="Выбрать тональность">
                            <span class="player-current-key">C</span>
                        </button>
                        <div class="player-key-dropdown" id="player-key-dropdown">
                            <button data-key="C">C</button>
                            <button data-key="C#">C#</button>
                            <button data-key="Db">D♭</button>
                            <button data-key="D">D</button>
                            <button data-key="D#">D#</button>
                            <button data-key="Eb">E♭</button>
                            <button data-key="E">E</button>
                            <button data-key="F">F</button>
                            <button data-key="F#">F#</button>
                            <button data-key="Gb">G♭</button>
                            <button data-key="G">G</button>
                            <button data-key="G#">G#</button>
                            <button data-key="Ab">A♭</button>
                            <button data-key="A">A</button>
                            <button data-key="A#">A#</button>
                            <button data-key="Bb">B♭</button>
                            <button data-key="H">H</button>
                            <button data-key="B">B</button>
                        </div>
                    </div>
                    <button class="player-control-btn" id="player-toggle-chords" aria-label="Скрыть аккорды">
                        <i class="fas fa-music"></i>
                    </button>
                    <button class="player-control-btn" id="player-chords-only" aria-label="Только аккорды">
                        <span class="text-icon">T</span>
                    </button>
                    <button class="player-control-btn" id="player-split-text" aria-label="Разделить текст">
                        <i class="fas fa-columns"></i>
                    </button>
                    <button class="player-control-btn" id="player-font-decrease" aria-label="Уменьшить текст">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="player-control-btn" id="player-font-increase" aria-label="Увеличить текст">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="player-control-btn" id="player-copy-text" aria-label="Копировать текст">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            
            <div class="event-player-content">
                <div class="player-song-display" id="player-song-display">
                    <!-- Здесь будет отображаться песня -->
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
    }
    
    attachEventHandlers() {
        // Закрытие плеера
        const closeBtn = this.overlay.querySelector('.player-close-btn');
        closeBtn.addEventListener('click', () => this.close());
        
        // Переключение панели инструментов
        const toggleBtn = this.overlay.querySelector('.player-toggle-controls-btn');
        const controlsRow = this.overlay.querySelector('.player-controls-row');
        
        toggleBtn.addEventListener('click', () => {
            const isHidden = controlsRow.style.display === 'none';
            controlsRow.style.display = isHidden ? 'flex' : 'none';
            toggleBtn.classList.toggle('controls-hidden', !isHidden);
            
            // Изменяем иконку
            const icon = toggleBtn.querySelector('i');
            icon.className = isHidden ? 'fas fa-times' : 'fas fa-bars';
            
            // Сохраняем состояние
            localStorage.setItem('eventPlayerControlsHidden', !isHidden);
        });
        
        // Восстанавливаем состояние панели
        const savedState = localStorage.getItem('eventPlayerControlsHidden');
        if (savedState === 'true') {
            controlsRow.style.display = 'none';
            toggleBtn.classList.add('controls-hidden');
            toggleBtn.querySelector('i').className = 'fas fa-bars';
        }
        
        // Навигация
        const prevBtn = this.overlay.querySelector('#player-prev');
        const nextBtn = this.overlay.querySelector('#player-next');
        prevBtn.addEventListener('click', () => this.previousSong());
        nextBtn.addEventListener('click', () => this.nextSong());
        
        // Размер шрифта
        const fontDecreaseBtn = this.overlay.querySelector('#player-font-decrease');
        const fontIncreaseBtn = this.overlay.querySelector('#player-font-increase');
        if (fontDecreaseBtn) {
            fontDecreaseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.changeFontSize(-1);
            });
        }
        if (fontIncreaseBtn) {
            fontIncreaseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.changeFontSize(1);
            });
        }
        
        // Выбор тональности
        const keyButton = this.overlay.querySelector('#player-key-button');
        const keyDropdown = this.overlay.querySelector('#player-key-dropdown');
        
        keyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            keyDropdown.classList.toggle('show');
        });
        
        keyDropdown.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-key')) {
                const newKey = e.target.getAttribute('data-key');
                this.setKey(newKey);
                keyDropdown.classList.remove('show');
            }
        });
        
        // Закрытие при клике вне
        document.addEventListener('click', (e) => {
            if (!keyButton.contains(e.target) && !keyDropdown.contains(e.target)) {
                keyDropdown.classList.remove('show');
            }
        });
        
        // Полноэкранный режим убран - запускается автоматически
        
        // Новые кнопки
        const toggleChordsBtn = this.overlay.querySelector('#player-toggle-chords');
        toggleChordsBtn.addEventListener('click', () => this.toggleChords());
        
        const chordsOnlyBtn = this.overlay.querySelector('#player-chords-only');
        chordsOnlyBtn.addEventListener('click', () => this.toggleChordsOnly());
        
        const splitTextBtn = this.overlay.querySelector('#player-split-text');
        splitTextBtn.addEventListener('click', () => this.toggleSplitMode());
        
        const copyTextBtn = this.overlay.querySelector('#player-copy-text');
        copyTextBtn.addEventListener('click', () => this.copyText());
        
        // Клавиатурная навигация
        this.handleKeyboard = (e) => {
            if (!this.isOpen) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSong();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSong();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
            }
        };
        
        // Свайп для мобильных
        this.setupSwipeHandling();
    }
    
    setupSwipeHandling() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        const content = this.overlay.querySelector('.event-player-content');
        
        content.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        content.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
        
        this.handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Свайп влево - следующая песня
                    this.nextSong();
                } else {
                    // Свайп вправо - предыдущая песня
                    this.previousSong();
                }
            }
        };
    }
    
    async open(eventId, songs, startIndex = 0) {
        logger.log('🎵 Открываем плеер события:', eventId);
        
        this.eventId = eventId;
        this.songs = songs;
        this.currentIndex = startIndex;
        this.transposition = 0;
        this.currentKey = null;  // Сбрасываем тональность для загрузки из сетлиста
        
        // Устанавливаем базовый размер шрифта в зависимости от устройства
        this.currentFontSize = window.innerWidth <= 768 ? 12 : 16;
        
        if (!this.songs || this.songs.length === 0) {
            console.error('❌ Нет песен для отображения');
            return;
        }
        
        // Скрываем скролл на основной странице
        document.body.style.overflow = 'hidden';
        
        // Показываем оверлей
        console.log('🎬 Показываем оверлей плеера');
        this.overlay.classList.add('show');
        this.isOpen = true;
        console.log('📍 Оверлей элемент:', this.overlay);
        console.log('📍 Классы оверлея:', this.overlay.className);
        
        // Добавляем обработчик клавиатуры
        document.addEventListener('keydown', this.handleKeyboard);
        
        // Загружаем песню
        await this.loadCurrentSong();
        
        // Автоматически включаем полноэкранный режим
        this.enterFullscreen();
        
        // Добавляем в историю браузера
        history.pushState({ eventPlayer: true }, '', `#player`);
        
        // Обработчик кнопки назад
        window.addEventListener('popstate', this.handlePopState);
    }
    
    handlePopState = (e) => {
        if (this.isOpen) {
            this.close();
        }
    };
    
    close() {
        logger.log('🎵 Закрываем плеер события');
        
        this.overlay.classList.remove('show');
        this.isOpen = false;
        
        // Восстанавливаем скролл на основной странице
        document.body.style.overflow = '';
        
        // Удаляем обработчики
        document.removeEventListener('keydown', this.handleKeyboard);
        window.removeEventListener('popstate', this.handlePopState);
        
        // Убираем из истории
        if (window.location.hash === '#player') {
            history.back();
        }
        
        // Выходим из полноэкранного режима
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
    
    async loadCurrentSong() {
        const song = this.songs[this.currentIndex];
        if (!song) return;
        
        logger.log('📄 Загружаем песню:', song.name);
        
        // Обновляем информацию о песне
        this.updateSongInfo();
        
        // Загружаем и отображаем текст песни
        await this.displaySong(song);
        
        // Обновляем состояние кнопок навигации
        this.updateNavigationButtons();
    }
    
    updateSongInfo() {
        const song = this.songs[this.currentIndex];
        const numberEl = this.overlay.querySelector('.player-song-number');
        const nameEl = this.overlay.querySelector('.player-song-name');
        const keyEl = this.overlay.querySelector('.player-key');
        const bpmEl = this.overlay.querySelector('.player-bpm');
        
        // Обновляем номер и название песни
        numberEl.textContent = `Песня ${this.currentIndex + 1}/${this.songs.length}`;
        nameEl.textContent = song.name || 'Без названия';
        
        // Обновляем тональность
        const songKey = song.preferredKey || song.defaultKey || 'C';
        keyEl.textContent = songKey;
        
        // Обновляем BPM
        const bpm = song.BPM || song.bpm || song.tempo || '';
        if (bpm && bpm !== 'NA') {
            bpmEl.textContent = `${bpm} BPM`;
            bpmEl.style.display = '';
        } else {
            bpmEl.style.display = 'none';
        }
    }
    
    async displaySong(song) {
        const display = this.overlay.querySelector('#player-song-display');
        
        try {
            // Загружаем модули для отображения песни
            const [
                { getRenderedSongText, distributeSongBlocksToColumns },
                { getTransposition }
            ] = await Promise.all([
                import('/js/core.js'),
                import('/src/js/core/transposition.js')
            ]);
            
            // Получаем текст песни (приоритет отредактированному)
            console.log('📝 Проверка отредактированного текста:', {
                hasWebEdits: song.hasWebEdits,
                hasEditedText: !!song['Текст и аккорды (edited)'],
                editedLength: song['Текст и аккорды (edited)']?.length || 0
            });
            
            const originalLyrics = song.hasWebEdits 
                ? (song['Текст и аккорды (edited)'] || song['Текст и аккорды'] || song.lyrics || song.text || 'Текст песни не найден')
                : (song['Текст и аккорды'] || song.lyrics || song.text || 'Текст песни не найден');
                
            console.log('📝 Используем текст:', song.hasWebEdits ? 'отредактированный' : 'оригинальный');
            
            // Оригинальная тональность из Firebase (та, в которой записаны аккорды)
            const originalKey = song['Оригинальная тональность'] || song.originalKey || song.defaultKey || 'C';
            
            // Предпочитаемая тональность из сетлиста
            const preferredKey = song.preferredKey || originalKey;
            
            // Сохраняем оригинальную тональность
            this.originalKey = originalKey;
            
            // При загрузке новой песни устанавливаем тональность из сетлиста
            // Сохраняем начальную тональность песни для этого события
            if (!song._eventStartKey) {
                song._eventStartKey = preferredKey;
            }
            
            // Если текущая тональность не установлена, берем из сетлиста
            if (!this.currentKey) {
                this.currentKey = preferredKey;
            }
            
            // Обновляем кнопку тональности
            const keyBtn = this.overlay.querySelector('.player-current-key');
            if (keyBtn) {
                const displayKey = this.currentKey.replace('b', '♭');
                keyBtn.textContent = displayKey;
            }
            
            // Логируем для отладки
            console.log('🎵 Транспонирование:', {
                originalKey,
                currentKey: this.currentKey,
                preferredKey
            });
            
            // Используем ту же функцию что и на главной странице
            console.log('🎸 Вызываем getRenderedSongText:', { 
                from: originalKey, 
                to: this.currentKey 
            });
            let finalLyrics = getRenderedSongText(originalLyrics, originalKey, this.currentKey);
            
            // Распределяем по колонкам если включен режим
            if (this.isSplitMode) {
                finalLyrics = distributeSongBlocksToColumns(finalLyrics);
            }
            
            // Обновляем тональность и BPM в шапке
            const keyEl = this.overlay.querySelector('.player-key');
            const bpmEl = this.overlay.querySelector('.player-bpm');
            if (keyEl) {
                const displayKey = this.currentKey.replace('b', '♭');
                keyEl.textContent = displayKey;
            }
            if (bpmEl) bpmEl.textContent = song.BPM ? `${song.BPM} BPM` : '';
            
            // Формируем классы для контента
            const contentClasses = [
                'song-content',
                this.isSplitMode ? 'split-columns' : '',
                !this.areChordsVisible ? 'chords-hidden' : '',
                this.isChordsOnlyMode ? 'chords-only-mode' : ''
            ].filter(c => c).join(' ');
            
            // Отображаем
            display.innerHTML = `
                <div class="${contentClasses}" style="font-size: ${this.currentFontSize}px; --current-font-size: ${this.currentFontSize}px">
                    <pre style="font-size: ${this.currentFontSize}px">${finalLyrics}</pre>
                </div>
            `;
            
            // Применяем размер шрифта после рендеринга
            setTimeout(() => {
                const songContent = display.querySelector('.song-content');
                if (songContent) {
                    songContent.style.setProperty('font-size', `${this.currentFontSize}px`, 'important');
                    const pre = songContent.querySelector('pre');
                    if (pre) {
                        pre.style.setProperty('font-size', `${this.currentFontSize}px`, 'important');
                    }
                }
            }, 0);
            
        } catch (error) {
            console.error('❌ Ошибка отображения песни:', error);
            display.innerHTML = '<div class="error-message">Ошибка загрузки песни</div>';
        }
    }
    
    updateNavigationButtons() {
        const prevBtn = this.overlay.querySelector('#player-prev');
        const nextBtn = this.overlay.querySelector('#player-next');
        
        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.songs.length - 1;
    }
    
    previousSong() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            // Сбрасываем текущую тональность, чтобы взять из сетлиста
            this.currentKey = null;
            this.loadCurrentSong();
        }
    }
    
    nextSong() {
        if (this.currentIndex < this.songs.length - 1) {
            this.currentIndex++;
            // Сбрасываем текущую тональность, чтобы взять из сетлиста
            this.currentKey = null;
            this.loadCurrentSong();
        }
    }
    
    setKey(newKey) {
        console.log('🎹 Установка новой тональности:', newKey);
        this.currentKey = newKey;
        
        // Обновляем отображение (заменяем b на ♭ для красоты)
        const keyBtn = this.overlay.querySelector('.player-current-key');
        if (keyBtn) {
            const displayKey = newKey.replace('b', '♭');
            keyBtn.textContent = displayKey;
        }
        
        // Перезагружаем песню с новой тональностью
        this.loadCurrentSong();
    }
    
    changeFontSize(direction) {
        console.log('🔤 Изменяем размер шрифта:', direction);
        
        // Изменяем сохраненный размер
        const newSize = this.currentFontSize + (direction * 2);
        
        // Ограничиваем диапазон
        const minSize = 6;  // Уменьшаем минимальный размер до 6px
        const maxSize = 24;
        this.currentFontSize = Math.max(minSize, Math.min(maxSize, newSize));
        console.log('📐 Новый размер:', this.currentFontSize);
        
        // Применяем размер ко всем элементам песни
        const songContent = this.overlay.querySelector('.song-content');
        if (songContent) {
            songContent.style.setProperty('font-size', `${this.currentFontSize}px`, 'important');
            songContent.style.setProperty('--current-font-size', `${this.currentFontSize}px`);
            
            // Применяем к pre и всем вложенным элементам
            const preElement = songContent.querySelector('pre');
            if (preElement) {
                preElement.style.setProperty('font-size', `${this.currentFontSize}px`, 'important');
            }
            
            // Применяем к блокам песни
            const songBlocks = songContent.querySelectorAll('.song-block-content');
            songBlocks.forEach(block => {
                block.style.setProperty('font-size', `${this.currentFontSize}px`, 'important');
            });
        }
    }
    
    enterFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            // Проверяем поддержку fullscreen API
            if (this.overlay.requestFullscreen) {
                this.overlay.requestFullscreen().catch(err => {
                    console.error('Ошибка входа в полноэкранный режим:', err);
                });
            } else if (this.overlay.webkitRequestFullscreen) {
                // Safari iOS использует webkit префикс
                this.overlay.webkitRequestFullscreen();
            } else {
                console.log('Полноэкранный режим не поддерживается на этом устройстве');
            }
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            // Входим в полноэкранный режим
            if (this.overlay.requestFullscreen) {
                this.overlay.requestFullscreen().catch(err => {
                    console.error('Ошибка входа в полноэкранный режим:', err);
                });
            } else if (this.overlay.webkitRequestFullscreen) {
                // Safari iOS
                this.overlay.webkitRequestFullscreen();
            }
        } else {
            // Выходим из полноэкранного режима
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                // Safari iOS
                document.webkitExitFullscreen();
            }
        }
    }
    
    toggleChords() {
        this.areChordsVisible = !this.areChordsVisible;
        const songContent = this.overlay.querySelector('.song-content');
        if (songContent) {
            songContent.classList.toggle('chords-hidden', !this.areChordsVisible);
        }
        
        // Обновляем состояние кнопки
        const btn = this.overlay.querySelector('#player-toggle-chords');
        btn.classList.toggle('active', !this.areChordsVisible);
    }
    
    toggleChordsOnly() {
        this.isChordsOnlyMode = !this.isChordsOnlyMode;
        const songContent = this.overlay.querySelector('.song-content');
        if (songContent) {
            songContent.classList.toggle('chords-only-mode', this.isChordsOnlyMode);
        }
        
        // Обновляем состояние кнопки
        const btn = this.overlay.querySelector('#player-chords-only');
        btn.classList.toggle('active', this.isChordsOnlyMode);
    }
    
    toggleSplitMode() {
        console.log('🔀 Переключаем режим колонок');
        this.isSplitMode = !this.isSplitMode;
        this.loadCurrentSong(); // Перезагружаем песню с новым режимом
        
        // Обновляем состояние кнопки
        const btn = this.overlay.querySelector('#player-split-text');
        if (btn) {
            btn.classList.toggle('active', this.isSplitMode);
        }
    }
    
    async copyText() {
        try {
            const songContent = this.overlay.querySelector('.song-content pre');
            if (songContent) {
                const text = songContent.textContent;
                await navigator.clipboard.writeText(text);
                
                // Визуальная обратная связь
                const btn = this.overlay.querySelector('#player-copy-text');
                btn.classList.add('success');
                setTimeout(() => btn.classList.remove('success'), 2000);
            }
        } catch (error) {
            console.error('Ошибка при копировании:', error);
        }
    }
}

// Создаем единственный экземпляр
let playerInstance = null;

export function getEventPlayer() {
    if (!playerInstance) {
        playerInstance = new EventPlayer();
    }
    return playerInstance;
}

// Экспортируем функцию для открытия плеера
export async function openEventPlayer(eventId, songs, startIndex = 0) {
    const player = getEventPlayer();
    await player.open(eventId, songs, startIndex);
}