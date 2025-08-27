/**
 * Модальное окно для выбора действия с событием
 * Показывается когда на выбранную дату уже есть событие
 */

import logger from '../../utils/logger.js';

class EventActionModal {
    constructor() {
        this.modal = null;
        this.onActionSelected = null;
        this.eventData = null;
        this.setlistData = null;
    }
    
    /**
     * Инициализация модального окна
     */
    init() {
        if (!this.modal) {
            this.createModal();
            this.attachEventListeners();
        }
    }
    
    /**
     * Создание HTML структуры модального окна
     */
    createModal() {
        const modalHTML = `
            <div id="event-action-modal" class="global-overlay">
                <div class="overlay-content event-action-modal">
                    
                    <div class="modal-header">
                        <i class="fas fa-calendar-check"></i>
                        <h2 class="modal-title">Событие уже существует</h2>
                    </div>
                    
                    <div class="modal-body">
                        <div class="event-info">
                            <div class="event-name" id="existing-event-name"></div>
                            <div class="event-time" id="existing-event-time"></div>
                            <div class="event-setlist" id="existing-event-setlist"></div>
                        </div>
                        
                        <div class="action-question">
                            <p>Что вы хотите сделать?</p>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="action-btn replace-setlist-btn">
                                <i class="fas fa-sync-alt"></i>
                                <span>Заменить сет-лист</span>
                                <small id="new-setlist-name"></small>
                            </button>
                            
                            <button class="action-btn create-new-btn">
                                <i class="fas fa-plus-circle"></i>
                                <span>Создать новое событие</span>

                            </button>
                            
                            <button class="action-btn cancel-btn">
                                <i class="fas fa-times-circle"></i>
                                <span>Отмена</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('event-action-modal');
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        const modal = this.modal;
        const replaceBtn = modal.querySelector('.replace-setlist-btn');
        const createNewBtn = modal.querySelector('.create-new-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        // Закрытие модального окна
        cancelBtn.addEventListener('click', () => this.close());
        
        // Замена сет-листа
        replaceBtn.addEventListener('click', () => {
            if (this.onActionSelected) {
                this.onActionSelected('replace', this.eventData, this.setlistData);
            }
            this.close();
        });
        
        // Создание нового события
        createNewBtn.addEventListener('click', () => {
            if (this.onActionSelected) {
                this.onActionSelected('create', this.eventData, this.setlistData);
            }
            this.close();
        });
        
        // Закрытие по клику на оверлей
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
        
        // Закрытие по Escape
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
    }
    
    /**
     * Открыть модальное окно
     * @param {Object} eventData - Данные существующего события
     * @param {Object} setlistData - Данные нового сет-листа
     * @param {Function} onActionSelected - Callback при выборе действия
     */
    open(eventData, setlistData, onActionSelected) {
        if (!this.modal) {
            this.init();
        }
        
        this.eventData = eventData;
        this.setlistData = setlistData;
        this.onActionSelected = onActionSelected;
        
        // Обновляем информацию о событии
        const eventNameEl = this.modal.querySelector('#existing-event-name');
        const eventTimeEl = this.modal.querySelector('#existing-event-time');
        const eventSetlistEl = this.modal.querySelector('#existing-event-setlist');
        const newSetlistNameEl = this.modal.querySelector('#new-setlist-name');
        
        eventNameEl.textContent = eventData.name || 'Без названия';
        eventTimeEl.textContent = `Время: ${eventData.time}`;
        
        if (eventData.hasSetlist) {
            eventSetlistEl.innerHTML = `<i class="fas fa-music"></i> Сет-лист уже назначен`;
            eventSetlistEl.classList.add('has-setlist');
        } else {
            eventSetlistEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Сет-лист не назначен`;
            eventSetlistEl.classList.add('no-setlist');
        }
        
        newSetlistNameEl.textContent = setlistData.name;
        
        // Показываем модальное окно
        this.modal.classList.add('show');
        document.addEventListener('keydown', this.escapeHandler);
        
        logger.log('📅 Модальное окно выбора действия открыто');
    }
    
    /**
     * Закрыть модальное окно
     */
    close() {
        if (this.modal) {
            this.modal.classList.remove('show');
        }
        document.removeEventListener('keydown', this.escapeHandler);
    }
}

// Singleton
let instance = null;

export function getEventActionModal() {
    if (!instance) {
        instance = new EventActionModal();
    }
    return instance;
}