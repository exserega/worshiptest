/**
 * Модуль управления overlay выбора сет-листа
 */

import { loadSetlists, createSetlist, addSongToSetlist } from '../api/index.js';

class SetlistSelector {
    constructor() {
        // DOM элементы
        this.overlay = document.getElementById('setlist-select-overlay');
        this.songNameDisplay = document.getElementById('adding-song-name');
        this.dropdown = document.getElementById('setlist-select-dropdown');
        this.newNameInput = document.getElementById('new-setlist-name-modal');
        this.confirmButton = document.getElementById('confirm-add-to-setlist');
        this.cancelButton = document.getElementById('cancel-setlist-select');
        this.closeButton = document.getElementById('close-setlist-select');
        
        // Состояние
        this.currentSong = null;
        this.setlists = [];
        
        // Инициализация
        this.init();
    }
    
    init() {
        // Обработчики событий
        this.confirmButton?.addEventListener('click', () => this.handleConfirm());
        this.cancelButton?.addEventListener('click', () => this.close());
        this.closeButton?.addEventListener('click', () => this.close());
        
        // Закрытие по клику на фон
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay?.classList.contains('show')) {
                this.close();
            }
        });
        
        // Обработчики изменений
        this.dropdown?.addEventListener('change', () => this.updateConfirmButton());
        this.newNameInput?.addEventListener('input', () => this.updateConfirmButton());
        
        // Enter в поле ввода
        this.newNameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.confirmButton.disabled) {
                this.handleConfirm();
            }
        });
    }
    
    /**
     * Открывает overlay для выбора сет-листа
     * @param {Object} song - Объект песни для добавления
     */
    async open(song) {
        if (!song) {
            console.error('No song provided to SetlistSelector');
            return;
        }
        
        this.currentSong = song;
        
        // Отображаем название песни
        if (this.songNameDisplay) {
            this.songNameDisplay.textContent = song.name || 'Без названия';
        }
        
        // Сбрасываем форму
        if (this.newNameInput) {
            this.newNameInput.value = '';
        }
        
        // Показываем overlay
        this.overlay?.classList.add('show');
        
        // Загружаем сет-листы
        await this.loadSetlists();
        
        // Фокус на dropdown
        this.dropdown?.focus();
    }
    
    /**
     * Закрывает overlay
     */
    close() {
        this.overlay?.classList.remove('show');
        this.currentSong = null;
        
        // Очищаем форму
        if (this.newNameInput) {
            this.newNameInput.value = '';
        }
        if (this.dropdown) {
            this.dropdown.value = '';
        }
        this.updateConfirmButton();
    }
    
    /**
     * Загружает список сет-листов
     */
    async loadSetlists() {
        try {
            // Показываем загрузку
            if (this.dropdown) {
                this.dropdown.innerHTML = '<option value="">Загрузка...</option>';
                this.dropdown.disabled = true;
            }
            
            // Загружаем сет-листы
            this.setlists = await loadSetlists();
            
            // Обновляем dropdown
            if (this.dropdown) {
                this.dropdown.innerHTML = '<option value="">Выберите сет-лист</option>';
                
                this.setlists.forEach(setlist => {
                    const option = document.createElement('option');
                    option.value = setlist.id;
                    option.textContent = setlist.name;
                    this.dropdown.appendChild(option);
                });
                
                this.dropdown.disabled = false;
            }
            
        } catch (error) {
            console.error('Error loading setlists:', error);
            if (this.dropdown) {
                this.dropdown.innerHTML = '<option value="">Ошибка загрузки</option>';
            }
        }
    }
    
    /**
     * Обновляет состояние кнопки подтверждения
     */
    updateConfirmButton() {
        if (!this.confirmButton) return;
        
        const hasSelectedSetlist = this.dropdown?.value;
        const hasNewName = this.newNameInput?.value.trim();
        
        this.confirmButton.disabled = !hasSelectedSetlist && !hasNewName;
    }
    
    /**
     * Обрабатывает подтверждение добавления
     */
    async handleConfirm() {
        if (!this.currentSong) return;
        
        try {
            // Блокируем кнопку
            if (this.confirmButton) {
                this.confirmButton.disabled = true;
                this.confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Добавление...';
            }
            
            let setlistId = this.dropdown?.value;
            
            // Если нужно создать новый сет-лист
            if (!setlistId && this.newNameInput?.value.trim()) {
                const newName = this.newNameInput.value.trim();
                console.log('Creating new setlist:', newName);
                
                setlistId = await createSetlist(newName);
                console.log('Created setlist with ID:', setlistId);
            }
            
            if (!setlistId) {
                throw new Error('No setlist selected or created');
            }
            
            // Добавляем песню в сет-лист
            await addSongToSetlist(setlistId, this.currentSong);
            
            // Показываем уведомление
            this.showNotification('✅ Песня успешно добавлена в сет-лист!', 'success');
            
            // Закрываем overlay
            this.close();
            
            // Обновляем UI если панель сет-листов открыта
            const setlistsPanel = document.getElementById('setlists-panel');
            if (setlistsPanel?.classList.contains('open')) {
                // Триггерим обновление через событие
                window.dispatchEvent(new CustomEvent('setlist-updated', { 
                    detail: { setlistId } 
                }));
            }
            
        } catch (error) {
            console.error('Error adding song to setlist:', error);
            this.showNotification('❌ Ошибка при добавлении песни', 'error');
        } finally {
            // Восстанавливаем кнопку
            if (this.confirmButton) {
                this.confirmButton.innerHTML = '<i class="fas fa-plus"></i> Добавить';
                this.updateConfirmButton();
            }
        }
    }
    
    /**
     * Показывает уведомление
     */
    showNotification(message, type = 'info') {
        // Используем глобальную функцию уведомлений если она есть
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Иначе простой alert
        alert(message);
    }
}

// Создаем экземпляр
const setlistSelector = new SetlistSelector();

// Экспортируем функцию открытия
export function openSetlistSelector(song) {
    return setlistSelector.open(song);
}

// Экспортируем для глобального доступа
window.openSetlistSelector = openSetlistSelector;