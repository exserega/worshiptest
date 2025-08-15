/**
 * @fileoverview Модуль отображения календарной сетки
 * @module CalendarView
 */

import logger from '../../utils/logger.js';

/**
 * Класс для управления отображением календаря
 */
export class CalendarView {
    constructor(container) {
        this.container = container;
        this.currentDate = new Date();
        this.events = [];
        this.onDayClick = null; // Callback для клика по дню
        
        logger.log('📅 CalendarView инициализирован');
    }
    
    /**
     * Установить текущий месяц
     */
    setMonth(date) {
        this.currentDate = new Date(date);
        this.render();
    }
    
    /**
     * Перейти к предыдущему месяцу
     */
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }
    
    /**
     * Перейти к следующему месяцу
     */
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }
    
    /**
     * Установить события для отображения
     */
    setEvents(events) {
        this.events = events;
        this.render();
    }
    
    /**
     * Получить первый день месяца
     */
    getFirstDayOfMonth() {
        return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    }
    
    /**
     * Получить последний день месяца
     */
    getLastDayOfMonth() {
        return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    }
    
    /**
     * Получить события для конкретного дня
     */
    getEventsForDay(date) {
        return this.events.filter(event => {
            const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
            return eventDate.getDate() === date.getDate() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getFullYear() === date.getFullYear();
        });
    }
    
    /**
     * Рендер календаря
     */
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        
        let html = `
            <div class="calendar-header">
                <button class="calendar-nav-btn prev-month" aria-label="Предыдущий месяц">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 class="calendar-month-title">${monthNames[month]} ${year}</h3>
                <button class="calendar-nav-btn next-month" aria-label="Следующий месяц">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    <div class="calendar-weekday">Пн</div>
                    <div class="calendar-weekday">Вт</div>
                    <div class="calendar-weekday">Ср</div>
                    <div class="calendar-weekday">Чт</div>
                    <div class="calendar-weekday">Пт</div>
                    <div class="calendar-weekday">Сб</div>
                    <div class="calendar-weekday">Вс</div>
                </div>
                <div class="calendar-days">
                    ${this.renderDays()}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachEventHandlers();
    }
    
    /**
     * Рендер дней месяца
     */
    renderDays() {
        const firstDay = this.getFirstDayOfMonth();
        const lastDay = this.getLastDayOfMonth();
        const prevLastDay = new Date(firstDay.getTime() - 1);
        
        // Корректировка для начала недели с понедельника
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;
        
        let html = '';
        
        // Дни предыдущего месяца
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const day = prevLastDay.getDate() - i;
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        // Дни текущего месяца
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const events = this.getEventsForDay(date);
            const isToday = this.isToday(date);
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${date.toISOString()}">
                    <div class="calendar-day-number">${day}</div>
                    ${events.length > 0 ? this.renderDayEvents(events) : ''}
                </div>
            `;
        }
        
        // Дни следующего месяца
        const totalCells = 42; // 6 недель
        const renderedCells = startDayOfWeek + lastDay.getDate();
        const remainingCells = totalCells - renderedCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        return html;
    }
    
    /**
     * Рендер событий дня
     */
    renderDayEvents(events) {
        // Пока просто показываем количество событий
        // В следующих этапах здесь будут сами события
        return `<div class="calendar-day-events-count">${events.length} событ.</div>`;
    }
    
    /**
     * Проверка, является ли день сегодняшним
     */
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventHandlers() {
        // Навигация по месяцам
        const prevBtn = this.container.querySelector('.prev-month');
        const nextBtn = this.container.querySelector('.next-month');
        
        prevBtn?.addEventListener('click', () => this.previousMonth());
        nextBtn?.addEventListener('click', () => this.nextMonth());
        
        // Клики по дням
        const days = this.container.querySelectorAll('.calendar-day:not(.other-month)');
        days.forEach(day => {
            day.addEventListener('click', () => {
                const date = new Date(day.dataset.date);
                if (this.onDayClick) {
                    this.onDayClick(date, this.getEventsForDay(date));
                }
            });
        });
    }
}