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
        this.fontSize = 'medium'; // small, medium, large
        
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
                <button class="player-close-btn" aria-label="Закрыть плеер">
                    <i class="fas fa-times"></i>
                </button>
                <div class="player-song-info">
                    <span class="player-song-number">1 / 1</span>
                    <span class="player-song-name">Название песни</span>
                </div>
                <div class="player-controls">
                    <button class="player-control-btn" id="player-transpose-down" aria-label="Транспонировать вниз">
                        <i class="fas fa-minus"></i> <span class="transpose-value">0</span>
                    </button>
                    <button class="player-control-btn" id="player-transpose-up" aria-label="Транспонировать вверх">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="player-control-btn" id="player-font-size" aria-label="Размер текста">
                        <i class="fas fa-font"></i>
                    </button>
                    <button class="player-control-btn" id="player-fullscreen" aria-label="Полноэкранный режим">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            
            <div class="event-player-content">
                <div class="player-song-display" id="player-song-display">
                    <!-- Здесь будет отображаться песня -->
                </div>
            </div>
            
            <div class="event-player-navigation">
                <button class="player-nav-btn player-prev" id="player-prev" aria-label="Предыдущая песня">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="player-nav-btn player-next" id="player-next" aria-label="Следующая песня">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
    }
    
    attachEventHandlers() {
        // Закрытие плеера
        const closeBtn = this.overlay.querySelector('.player-close-btn');
        closeBtn.addEventListener('click', () => this.close());
        
        // Навигация
        const prevBtn = this.overlay.querySelector('#player-prev');
        const nextBtn = this.overlay.querySelector('#player-next');
        prevBtn.addEventListener('click', () => this.previousSong());
        nextBtn.addEventListener('click', () => this.nextSong());
        
        // Транспонирование
        const transposeDown = this.overlay.querySelector('#player-transpose-down');
        const transposeUp = this.overlay.querySelector('#player-transpose-up');
        transposeDown.addEventListener('click', () => this.transpose(-1));
        transposeUp.addEventListener('click', () => this.transpose(1));
        
        // Размер шрифта
        const fontSizeBtn = this.overlay.querySelector('#player-font-size');
        fontSizeBtn.addEventListener('click', () => this.toggleFontSize());
        
        // Полноэкранный режим
        const fullscreenBtn = this.overlay.querySelector('#player-fullscreen');
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
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
        
        if (!this.songs || this.songs.length === 0) {
            console.error('❌ Нет песен для отображения');
            return;
        }
        
        // Показываем оверлей
        console.log('🎬 Показываем оверлей плеера');
        this.overlay.classList.add('show');
        this.isOpen = true;
        console.log('📍 Оверлей элемент:', this.overlay);
        console.log('📍 Классы оверлея:', this.overlay.className);
        
        // Добавляем обработчик клавиатуры
        document.addEventListener('keydown', this.handleKeyboard);
        
        // Загружаем первую песню
        await this.loadCurrentSong();
        
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
        
        numberEl.textContent = `${this.currentIndex + 1} / ${this.songs.length}`;
        nameEl.textContent = song.name || 'Без названия';
    }
    
    async displaySong(song) {
        const display = this.overlay.querySelector('#player-song-display');
        
        try {
            // Загружаем модули для отображения песни
            const [
                { processLyrics, transposeLyrics, highlightChords },
                { wrapSongBlocks }
            ] = await Promise.all([
                import('../../js/core/transposition.js'),
                import('../../js/core/songParser.js')
            ]);
            
            // Получаем текст песни
            const lyrics = song['Текст и аккорды'] || song.lyrics || song.text || 'Текст песни не найден';
            
            // Обрабатываем текст
            let processedLyrics = processLyrics(lyrics);
            
            // Применяем транспонирование если нужно
            if (this.transposition !== 0) {
                const fromKey = song.preferredKey || song.defaultKey || 'C';
                // transposeLyrics принимает (lyrics, transposition, targetKey)
                // Вычисляем целевую тональность
                const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const fromIndex = keys.indexOf(fromKey.replace('♭', 'b').replace('m', ''));
                let targetIndex = (fromIndex + this.transposition) % 12;
                if (targetIndex < 0) targetIndex += 12;
                const targetKey = keys[targetIndex];
                
                processedLyrics = transposeLyrics(processedLyrics, this.transposition, targetKey);
            }
            
            // Оборачиваем блоки песни и подсвечиваем аккорды
            const wrappedLyrics = wrapSongBlocks(processedLyrics);
            const finalLyrics = highlightChords(wrappedLyrics);
            
            // Определяем текущую тональность
            let currentKey = song.preferredKey || song.defaultKey || 'C';
            if (this.transposition !== 0) {
                const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const fromIndex = keys.indexOf(currentKey.replace('♭', 'b').replace('m', ''));
                let targetIndex = (fromIndex + this.transposition) % 12;
                if (targetIndex < 0) targetIndex += 12;
                currentKey = keys[targetIndex];
            }
            
            // Отображаем
            display.innerHTML = `
                <div class="song-content font-size-${this.fontSize}">
                    <div class="song-key-info">
                        ${currentKey}
                        ${song.BPM ? `<span class="song-bpm-info">${song.BPM} BPM</span>` : ''}
                    </div>
                    ${finalLyrics}
                </div>
            `;
            
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
            this.transposition = 0; // Сбрасываем транспонирование
            this.updateTransposeDisplay();
            this.loadCurrentSong();
        }
    }
    
    nextSong() {
        if (this.currentIndex < this.songs.length - 1) {
            this.currentIndex++;
            this.transposition = 0; // Сбрасываем транспонирование
            this.updateTransposeDisplay();
            this.loadCurrentSong();
        }
    }
    
    transpose(direction) {
        this.transposition += direction;
        this.updateTransposeDisplay();
        this.loadCurrentSong();
    }
    
    updateTransposeDisplay() {
        const transposeValue = this.overlay.querySelector('.transpose-value');
        transposeValue.textContent = this.transposition > 0 ? `+${this.transposition}` : this.transposition;
    }
    
    toggleFontSize() {
        const sizes = ['small', 'medium', 'large'];
        const currentIndex = sizes.indexOf(this.fontSize);
        this.fontSize = sizes[(currentIndex + 1) % sizes.length];
        
        // Обновляем класс
        const content = this.overlay.querySelector('.song-content');
        if (content) {
            content.className = `song-content font-size-${this.fontSize}`;
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.overlay.requestFullscreen().catch(err => {
                console.error('Ошибка входа в полноэкранный режим:', err);
            });
        } else {
            document.exitFullscreen();
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