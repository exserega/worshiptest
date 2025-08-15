/**
 * @fileoverview Модуль календаря событий
 * @module EventsCalendar
 */

import logger from '../src/utils/logger.js';
import { getEventsByBranch } from '../src/modules/events/eventsApi.js';
import { getCurrentUser } from '../src/modules/auth/authCheck.js';

export class EventsCalendar {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.container = document.getElementById('calendarContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.monthTitle = document.getElementById('monthTitle');
        this.calendarDays = document.getElementById('calendarDays');
        this.weekdays = document.getElementById('weekdays');
        
        // Кнопки навигации
        this.prevMonthBtn = document.getElementById('prevMonthBtn');
        this.nextMonthBtn = document.getElementById('nextMonthBtn');
        this.createEventBtn = document.getElementById('createEventBtn');
        
        // Привязываем методы к контексту
        this.handlePrevMonth = this.handlePrevMonth.bind(this);
        this.handleNextMonth = this.handleNextMonth.bind(this);
        this.handleCreateEvent = this.handleCreateEvent.bind(this);
        this.handleDayClick = this.handleDayClick.bind(this);
    }
    
    /**
     * Инициализация календаря
     */
    async init() {
        logger.log('📅 Инициализация календаря событий');
        
        // Показываем индикатор загрузки
        this.showLoading(true);
        
        try {
            // Загружаем события
            await this.loadEvents();
            
            // Рендерим календарь
            this.render();
            
            // Привязываем обработчики
            this.attachEventHandlers();
            
            // Скрываем индикатор загрузки
            this.showLoading(false);
            
        } catch (error) {
            logger.error('Ошибка инициализации календаря:', error);
            this.showLoading(false);
            this.showError('Не удалось загрузить события');
        }
    }
    
    /**
     * Загрузка событий из Firebase
     */
    async loadEvents() {
        const user = getCurrentUser();
        if (!user || !user.branchId) {
            throw new Error('Пользователь не авторизован или не выбран филиал');
        }
        
        logger.log(`📊 Загрузка событий для филиала: ${user.branchId}`);
        this.events = await getEventsByBranch(user.branchId);
        logger.log(`✅ Загружено событий: ${this.events.length}`);
    }
    
    /**
     * Рендеринг календаря
     */
    render() {
        // Обновляем заголовок месяца
        this.updateMonthTitle();
        
        // Рендерим дни недели
        this.renderWeekdays();
        
        // Рендерим дни месяца
        this.renderDays();
    }
    
    /**
     * Обновление заголовка месяца
     */
    updateMonthTitle() {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        
        const month = monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        this.monthTitle.textContent = `${month} ${year}`;
    }
    
    /**
     * Рендеринг дней недели
     */
    renderWeekdays() {
        const weekdayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        
        this.weekdays.innerHTML = weekdayNames
            .map(day => `<div class="calendar-weekday">${day}</div>`)
            .join('');
    }
    
    /**
     * Рендеринг дней месяца
     */
    renderDays() {
        this.calendarDays.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Первый день месяца
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // День недели первого дня (0 = воскресенье)
        let startingDayOfWeek = firstDay.getDay();
        // Преобразуем в понедельник = 0
        startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
        
        // Добавляем дни предыдущего месяца
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            this.createDayElement(new Date(year, month - 1, day), true);
        }
        
        // Добавляем дни текущего месяца
        for (let day = 1; day <= lastDay.getDate(); day++) {
            this.createDayElement(new Date(year, month, day), false);
        }
        
        // Добавляем дни следующего месяца
        const totalDays = this.calendarDays.children.length;
        const daysToAdd = totalDays < 35 ? 35 - totalDays : 42 - totalDays;
        
        for (let day = 1; day <= daysToAdd; day++) {
            this.createDayElement(new Date(year, month + 1, day), true);
        }
    }
    
    /**
     * Создание элемента дня
     */
    createDayElement(date, isOtherMonth) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayEl.classList.add('other-month');
        }
        
        // Проверяем, является ли день сегодняшним
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }
        
        // Номер дня
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = date.getDate();
        dayEl.appendChild(dayNumber);
        
        // События дня
        const dayEvents = this.getEventsForDay(date);
        if (dayEvents.length > 0 && !isOtherMonth) {
            const eventsEl = document.createElement('div');
            eventsEl.className = 'calendar-day-events';
            
            // Показываем точки для событий (максимум 3)
            const dotsCount = Math.min(dayEvents.length, 3);
            for (let i = 0; i < dotsCount; i++) {
                const dot = document.createElement('span');
                dot.className = 'calendar-event-dot';
                eventsEl.appendChild(dot);
            }
            
            // Если событий больше 3, показываем +N
            if (dayEvents.length > 3) {
                const more = document.createElement('span');
                more.textContent = `+${dayEvents.length - 3}`;
                more.style.fontSize = '0.7rem';
                more.style.color = 'var(--text-secondary)';
                eventsEl.appendChild(more);
            }
            
            dayEl.appendChild(eventsEl);
        }
        
        // Сохраняем дату в элементе
        dayEl.dataset.date = date.toISOString();
        dayEl.dataset.events = JSON.stringify(dayEvents.map(e => e.id));
        
        // Добавляем в календарь
        this.calendarDays.appendChild(dayEl);
    }
    
    /**
     * Получение событий для конкретного дня
     */
    getEventsForDay(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventHandlers() {
        // Навигация по месяцам
        this.prevMonthBtn.addEventListener('click', this.handlePrevMonth);
        this.nextMonthBtn.addEventListener('click', this.handleNextMonth);
        
        // Создание события
        if (this.createEventBtn) {
            this.createEventBtn.addEventListener('click', this.handleCreateEvent);
        }
        
        // Клики по дням
        this.calendarDays.addEventListener('click', this.handleDayClick);
    }
    
    /**
     * Переход к предыдущему месяцу
     */
    handlePrevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }
    
    /**
     * Переход к следующему месяцу
     */
    handleNextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }
    
    /**
     * Обработчик клика по дню
     */
    handleDayClick(event) {
        const dayEl = event.target.closest('.calendar-day');
        if (!dayEl || dayEl.classList.contains('other-month')) return;
        
        const date = new Date(dayEl.dataset.date);
        const eventIds = JSON.parse(dayEl.dataset.events || '[]');
        
        logger.log(`📅 Клик по дню: ${date.toLocaleDateString()}, событий: ${eventIds.length}`);
        
        // TODO: Реализовать расширение блока с событиями
        // Пока просто логируем
        if (eventIds.length > 0) {
            alert(`События дня ${date.toLocaleDateString()}:\n${eventIds.join('\n')}`);
        } else {
            // Если нет событий и есть права - предлагаем создать
            if (this.createEventBtn && this.createEventBtn.style.display !== 'none') {
                if (confirm(`Создать событие на ${date.toLocaleDateString()}?`)) {
                    this.handleCreateEvent(date);
                }
            }
        }
    }
    
    /**
     * Обработчик создания события
     */
    async handleCreateEvent(preselectedDate) {
        logger.log('🆕 Создание нового события', preselectedDate);
        
        try {
            // TODO: Импортировать и открыть модальное окно создания события
            alert('Функционал создания события будет реализован далее');
        } catch (error) {
            logger.error('Ошибка создания события:', error);
        }
    }
    
    /**
     * Показать/скрыть индикатор загрузки
     */
    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.add('active');
            this.container.style.display = 'none';
        } else {
            this.loadingIndicator.classList.remove('active');
            this.container.style.display = 'block';
        }
    }
    
    /**
     * Показать ошибку
     */
    showError(message) {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">Обновить</button>
            </div>
        `;
    }
}