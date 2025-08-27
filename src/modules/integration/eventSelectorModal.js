/**
 * Модальное окно выбора события из списка
 * Показывается когда на выбранную дату есть несколько событий
 */

import logger from '../../utils/logger.js';

let modalInstance = null;

class EventSelectorModal {
    constructor() {
        this.modal = null;
        this.events = [];
        this.selectedDate = null;
        this.setlistData = null;
        this.onEventSelected = null;
    }
    
    /**
     * Открывает модальное окно выбора события
     * @param {Array} events - Массив событий на дату
     * @param {Date} selectedDate - Выбранная дата
     * @param {Object} setlistData - Данные сет-листа
     * @param {Function} onEventSelected - Callback при выборе события
     */
    open(events, selectedDate, setlistData, onEventSelected) {
        this.events = events;
        this.selectedDate = selectedDate;
        this.setlistData = setlistData;
        this.onEventSelected = onEventSelected;
        
        this.createModal();
        this.show();
    }
    
    createModal() {
        // Удаляем старое модальное окно если есть
        if (this.modal) {
            this.modal.remove();
        }
        
        // Преобразуем selectedDate в объект Date если это строка
        const dateObj = typeof this.selectedDate === 'string' 
            ? new Date(this.selectedDate) 
            : this.selectedDate;
            
        const dateString = dateObj.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const modalHTML = `
            <div class="global-overlay event-selector-modal" id="eventSelectorModal">
                <div class="overlay-content compact">
                    <div class="overlay-header">
                        <h3 class="overlay-title">Выберите событие</h3>
                        <button class="overlay-close" data-action="close" aria-label="Закрыть">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="overlay-body">
                        <p class="selector-info">
                            На ${dateString} найдено ${this.events.length} события.
                            Выберите событие для добавления сет-листа "${this.setlistData.name}":
                        </p>
                        
                        <div class="events-list">
                            ${this.renderEventsList()}
                        </div>
                        
                        <div class="selector-actions">
                            <button class="btn btn-secondary" data-action="create-new">
                                <i class="fas fa-plus"></i> Создать новое событие
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('eventSelectorModal');
        
        this.attachEventHandlers();
    }
    
    renderEventsList() {
        return this.events.map(event => {
            const time = event.date.toDate().toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const hasSetlist = event.setlistId ? 'has-setlist' : 'no-setlist';
            const setlistInfo = event.setlistId 
                ? `<span class="event-setlist"><i class="fas fa-music"></i> Есть сет-лист</span>`
                : `<span class="event-no-setlist"><i class="fas fa-music"></i> Нет сет-листа</span>`;
            
            return `
                <div class="event-card ${hasSetlist}" data-event-id="${event.id}">
                    <div class="event-time">${time}</div>
                    <div class="event-info">
                        <h4 class="event-name">${event.name || 'Без названия'}</h4>
                        <div class="event-details">
                            <span class="event-leader">
                                <i class="fas fa-user"></i> ${event.leaderName || 'Не указан'}
                            </span>
                            ${setlistInfo}
                            <span class="event-participants">
                                <i class="fas fa-users"></i> ${event.participantCount || 0}
                            </span>
                        </div>
                    </div>
                    <button class="event-select-btn" data-event-id="${event.id}" data-action="select-event">
                        <i class="fas fa-check"></i> Выбрать
                    </button>
                </div>
            `;
        }).join('');
    }
    
    attachEventHandlers() {
        // Закрытие модального окна
        this.modal.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Выбор события
        this.modal.querySelectorAll('[data-action="select-event"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.currentTarget.dataset.eventId;
                const selectedEvent = this.events.find(evt => evt.id === eventId);
                if (selectedEvent) {
                    this.selectEvent(selectedEvent);
                }
            });
        });
        
        // Создание нового события
        this.modal.querySelector('[data-action="create-new"]').addEventListener('click', () => {
            this.createNewEvent();
        });
        
        // Escape для закрытия
        document.addEventListener('keydown', this.handleEscape = (e) => {
            if (e.key === 'Escape' && this.modal) {
                this.close();
            }
        });
    }
    
    selectEvent(event) {
        logger.log('📅 Выбрано событие:', event.name);
        this.close();
        
        if (this.onEventSelected) {
            this.onEventSelected('select', event, this.setlistData, this.selectedDate);
        }
    }
    
    createNewEvent() {
        logger.log('📅 Создание нового события');
        this.close();
        
        if (this.onEventSelected) {
            this.onEventSelected('create', null, this.setlistData, this.selectedDate);
        }
    }
    
    show() {
        if (this.modal) {
            // Небольшая задержка для плавной анимации
            setTimeout(() => {
                this.modal.classList.add('show');
            }, 10);
        }
    }
    
    close() {
        if (this.modal) {
            this.modal.classList.remove('show');
            
            // Удаляем обработчик Escape
            if (this.handleEscape) {
                document.removeEventListener('keydown', this.handleEscape);
            }
            
            // Удаляем модальное окно после анимации
            setTimeout(() => {
                if (this.modal) {
                    this.modal.remove();
                    this.modal = null;
                }
            }, 300);
        }
    }
}

/**
 * Получить экземпляр модального окна
 */
export function getEventSelectorModal() {
    if (!modalInstance) {
        modalInstance = new EventSelectorModal();
    }
    return modalInstance;
}

export default EventSelectorModal;