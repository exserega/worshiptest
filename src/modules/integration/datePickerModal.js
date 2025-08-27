/**
 * @fileoverview Модальное окно выбора даты для добавления сет-листа в календарь
 * @module DatePickerModal
 */

import logger from '../../utils/logger.js';

/**
 * Класс для управления модальным окном выбора даты
 */
class DatePickerModal {
    constructor() {
        this.modal = null;
        this.onDateSelected = null;
        this.setlistData = null;
        this.selectedDate = null;
    }
    
    /**
     * Инициализация модального окна
     */
    init() {
        this.createModal();
        this.attachEventListeners();
    }
    
    /**
     * Создание HTML структуры модального окна
     */
    createModal() {
        const modalHTML = `
            <div id="date-picker-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content compact date-picker-modal">
                    <div class="modal-header">
                        <h3>Добавить сет-лист в календарь</h3>
                        <button class="close-btn" aria-label="Закрыть">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="setlist-info">
                            <i class="fas fa-music"></i>
                            <div class="info-content">
                                <span class="setlist-name-label">Сет-лист:</span>
                                <span id="modal-setlist-name" class="setlist-name"></span>
                            </div>
                        </div>
                        
                        <div class="date-selection">
                            <label for="event-date-input" class="date-label">
                                <i class="fas fa-calendar"></i>
                                Выберите дату:
                            </label>
                            <input 
                                type="date" 
                                id="event-date-input" 
                                class="form-control date-input"
                                min="${this.getTodayDate()}"
                            >
                        </div>
                        
                        <div class="quick-dates">
                            <button class="quick-date-btn" data-days="0">Сегодня</button>
                            <button class="quick-date-btn" data-days="1">Завтра</button>
                            <button class="quick-date-btn" data-days="7">Через неделю</button>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-secondary cancel-btn">Отмена</button>
                        <button class="btn-primary continue-btn" disabled>Далее</button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('date-picker-modal');
    }
    
    /**
     * Получить сегодняшнюю дату в формате YYYY-MM-DD
     */
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        const modal = this.modal;
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const continueBtn = modal.querySelector('.continue-btn');
        const dateInput = modal.querySelector('#event-date-input');
        const overlay = modal;
        
        // Закрытие модального окна
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        
        // Закрытие по клику на оверлей
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        // Обработка изменения даты
        dateInput.addEventListener('change', (e) => {
            this.selectedDate = e.target.value;
            continueBtn.disabled = !this.selectedDate;
        });
        
        // Кнопка "Далее"
        continueBtn.addEventListener('click', () => {
            if (this.selectedDate && this.onDateSelected) {
                this.onDateSelected(this.selectedDate, this.setlistData);
                this.close();
            }
        });
        
        // Быстрый выбор даты
        const quickDateBtns = modal.querySelectorAll('.quick-date-btn');
        quickDateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const daysToAdd = parseInt(btn.dataset.days);
                const date = new Date();
                date.setDate(date.getDate() + daysToAdd);
                
                dateInput.value = date.toISOString().split('T')[0];
                dateInput.dispatchEvent(new Event('change'));
            });
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
     * @param {Object} setlistData - Данные сет-листа
     * @param {Function} onDateSelected - Callback при выборе даты
     */
    open(setlistData, onDateSelected) {
        this.setlistData = setlistData;
        this.onDateSelected = onDateSelected;
        this.selectedDate = null;
        
        // Обновляем название сет-листа
        const setlistNameEl = this.modal.querySelector('#modal-setlist-name');
        if (setlistNameEl) {
            setlistNameEl.textContent = setlistData.name || 'Без названия';
        }
        
        // Сбрасываем поля
        const dateInput = this.modal.querySelector('#event-date-input');
        const continueBtn = this.modal.querySelector('.continue-btn');
        
        dateInput.value = '';
        continueBtn.disabled = true;
        
        // Показываем модальное окно
        this.modal.style.display = 'flex';
        document.addEventListener('keydown', this.escapeHandler);
        
        // Фокус на поле даты
        setTimeout(() => dateInput.focus(), 100);
        
        logger.log('📅 Модальное окно выбора даты открыто для сет-листа:', setlistData.name);
    }
    
    /**
     * Закрыть модальное окно
     */
    close() {
        this.modal.style.display = 'none';
        document.removeEventListener('keydown', this.escapeHandler);
        
        // Очистка данных
        this.setlistData = null;
        this.onDateSelected = null;
        this.selectedDate = null;
        
        logger.log('📅 Модальное окно выбора даты закрыто');
    }
}

// Создаем и экспортируем экземпляр
let datePickerInstance = null;

/**
 * Получить экземпляр модального окна выбора даты
 * @returns {DatePickerModal}
 */
export function getDatePickerModal() {
    if (!datePickerInstance) {
        datePickerInstance = new DatePickerModal();
        datePickerInstance.init();
    }
    return datePickerInstance;
}