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
                <div class="event-card ${hasSetlist} clickable" data-event-id="${event.id}" data-has-setlist="${!!event.setlistId}">
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
        
        // Клик по карточке события
        this.modal.addEventListener('click', (e) => {
            const eventCard = e.target.closest('.event-card');
            if (eventCard && !e.target.closest('[data-action]')) {
                const eventId = eventCard.dataset.eventId;
                const hasSetlist = eventCard.dataset.hasSetlist === 'true';
                const selectedEvent = this.events.find(evt => evt.id === eventId);
                
                if (selectedEvent) {
                    if (hasSetlist) {
                        // Если есть сет-лист, спрашиваем подтверждение
                        if (confirm(`Заменить существующий сет-лист в событии "${selectedEvent.name}"?`)) {
                            this.selectEvent(selectedEvent);
                        }
                    } else {
                        // Если нет сет-листа, просто добавляем
                        this.selectEvent(selectedEvent);
                    }
                }
            }
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
    
    async selectEvent(event) {
        logger.log('📅 Выбрано событие:', event.name);
        
        try {
            // Определяем действие - добавление или замена
            const action = event.setlistId ? 'замена' : 'добавление';
            logger.log(`📅 Выполняется ${action} сет-листа`);
            
            // Закрываем модальное окно
            this.close();
            
            // Обновляем сет-лист в событии
            await this.updateEventSetlist(event.id, this.setlistData.id, this.setlistData.name);
            
            // Показываем уведомление об успехе
            const message = event.setlistId 
                ? `✅ Сет-лист заменен в событии "${event.name}"`
                : `✅ Сет-лист добавлен в событие "${event.name}"`;
            window.showNotification(message, 'success');
            
        } catch (error) {
            logger.error('❌ Ошибка при обновлении события:', error);
            window.showNotification('❌ Ошибка при обновлении события', 'error');
        }
    }
    
    async updateEventSetlist(eventId, setlistId, setlistName) {
        try {
            const { updateEventSetlistApi } = await import('../events/eventsApi.js');
            await updateEventSetlistApi(eventId, setlistId, setlistName);
            logger.log('✅ Сет-лист обновлен в событии');
        } catch (error) {
            logger.error('❌ Ошибка при обновлении сет-листа:', error);
            throw error;
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