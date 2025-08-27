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
        this.currentDate = new Date();
        this.today = new Date();
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
            <div id="date-picker-modal" class="global-overlay">
                <div class="overlay-content date-picker-modal">
                    <button class="modal-close-btn" aria-label="Закрыть">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <h2 class="modal-title">Добавить список песен</h2>
                    
                    <div class="setlist-name-display" id="modal-setlist-name"></div>
                    
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button class="calendar-nav-btn" id="prevMonth">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <h3 class="calendar-month" id="calendarMonth"></h3>
                            <button class="calendar-nav-btn" id="nextMonth">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        
                        <div class="calendar-weekdays">
                            <div class="weekday">Пн</div>
                            <div class="weekday">Вт</div>
                            <div class="weekday">Ср</div>
                            <div class="weekday">Чт</div>
                            <div class="weekday">Пт</div>
                            <div class="weekday">Сб</div>
                            <div class="weekday">Вс</div>
                        </div>
                        
                        <div class="calendar-days" id="calendarDays"></div>
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
        const closeBtn = modal.querySelector('.modal-close-btn');
        const prevMonthBtn = modal.querySelector('#prevMonth');
        const nextMonthBtn = modal.querySelector('#nextMonth');
        const overlay = modal;
        
        // Закрытие модального окна
        closeBtn.addEventListener('click', () => this.close());
        
        // Закрытие по клику на оверлей
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        // Навигация по месяцам
        prevMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
        
        // Закрытие по Escape
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
    }
    
    /**
     * Отрисовка календаря
     */
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Обновляем заголовок месяца
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                          'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        const monthTitle = this.modal.querySelector('#calendarMonth');
        monthTitle.textContent = `${monthNames[month]} ${year}`;
        
        // Очищаем дни
        const calendarDays = this.modal.querySelector('#calendarDays');
        calendarDays.innerHTML = '';
        
        // Первый день месяца
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // День недели первого дня (0 = воскресенье)
        let startDay = firstDay.getDay();
        // Преобразуем в понедельник = 0
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        // Добавляем пустые ячейки до первого дня
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Добавляем дни месяца
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;
            
            const date = new Date(year, month, day);
            
            // Проверяем, является ли день сегодняшним
            if (this.isToday(date)) {
                dayEl.classList.add('today');
            }
            
            // Проверяем, является ли дата прошедшей
            if (this.isPastDate(date)) {
                dayEl.classList.add('past');
            } else {
                // Добавляем обработчик клика только для будущих дат
                dayEl.addEventListener('click', () => this.selectDate(date));
            }
            
            calendarDays.appendChild(dayEl);
        }
    }
    
    /**
     * Проверка, является ли дата сегодняшней
     */
    isToday(date) {
        const today = this.today;
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    /**
     * Проверка, является ли дата прошедшей
     */
    isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }
    
    /**
     * Выбор даты
     */
    selectDate(date) {
        this.selectedDate = date;
        
        // Форматируем дату для передачи
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // Вызываем callback и закрываем модальное окно
        if (this.onDateSelected) {
            this.onDateSelected(formattedDate, this.setlistData);
        }
        
        this.close();
    }
    
    /**
     * Открыть модальное окно
     * @param {Object} setlistData - Данные сет-листа
     * @param {Function} onDateSelected - Callback при выборе даты
     */
    open(setlistData, onDateSelected) {
        // Проверяем, создано ли модальное окно
        if (!this.modal) {
            logger.warn('📅 Модальное окно не инициализировано, создаем...');
            this.init();
        }
        
        this.setlistData = setlistData;
        this.onDateSelected = onDateSelected;
        this.selectedDate = null;
        
        // Обновляем название сет-листа
        const setlistNameEl = this.modal.querySelector('#modal-setlist-name');
        if (setlistNameEl) {
            setlistNameEl.textContent = setlistData.name || 'Без названия';
        }
        
        // Сбрасываем текущую дату на сегодня
        this.currentDate = new Date();
        
        // Отрисовываем календарь
        this.renderCalendar();
        
        // Показываем модальное окно
        this.modal.classList.add('show');
        document.addEventListener('keydown', this.escapeHandler);
        
        // Фокус на поле даты
        setTimeout(() => dateInput.focus(), 100);
        
        logger.log('📅 Модальное окно выбора даты открыто для сет-листа:', setlistData.name);
    }
    
    /**
     * Закрыть модальное окно
     */
    close() {
        this.modal.classList.remove('show');
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