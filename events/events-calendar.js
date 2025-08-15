/**
 * @fileoverview Модуль календаря событий
 * @module EventsCalendar
 */

import logger from '../src/utils/logger.js';
import { getEventsByBranch } from '../src/modules/events/eventsApi.js';
import { getCurrentUser, canManageEvents } from '../src/modules/auth/authCheck.js';

export class EventsCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = [];
        this.container = document.getElementById('calendarContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.monthTitle = document.getElementById('monthTitle');
        this.calendarDays = document.getElementById('calendarDays');
        this.weekdays = document.getElementById('weekdays');
        this.selectedDateEvents = document.getElementById('selectedDateEvents');
        
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
        
        // Логируем события для отладки
        if (this.events.length > 0) {
            logger.log('Примеры загруженных событий:', this.events.slice(0, 3));
        }
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
        
        // Логируем структуру первого события для отладки
        if (this.events.length > 0) {
            const firstEvent = this.events[0];
            logger.log('Структура первого события:', {
                id: firstEvent.id,
                name: firstEvent.name,
                date: firstEvent.date,
                dateType: typeof firstEvent.date,
                hasToDate: !!(firstEvent.date && firstEvent.date.toDate),
                hasSeconds: !!(firstEvent.date && firstEvent.date.seconds),
                fullEvent: firstEvent
            });
        }
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
        
        // Добавляем дни следующего месяца только если последний день не воскресенье
        const totalDays = this.calendarDays.children.length;
        const lastDayOfWeek = lastDay.getDay();
        
        // Если последний день месяца - воскресенье (0), не добавляем следующий месяц
        if (lastDayOfWeek !== 0) {
            // Добавляем дни до конца недели
            const daysToAdd = 7 - (totalDays % 7);
            if (daysToAdd < 7) {
                for (let day = 1; day <= daysToAdd; day++) {
                    this.createDayElement(new Date(year, month + 1, day), true);
                }
            }
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
        
        // Проверяем, выбран ли день
        if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
            dayEl.classList.add('selected');
        }
        
        // Номер дня
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = date.getDate();
        dayEl.appendChild(dayNumber);
        
        // Проверяем события для этой даты
        const dayEvents = this.getEventsForDay(date);
        if (dayEvents.length > 0) {
            // Добавляем класс для подсветки
            dayEl.classList.add('has-events');
            
            // Добавляем индикаторы событий
            const eventsEl = document.createElement('div');
            eventsEl.className = 'calendar-day-events';
            
            // Показываем точки для событий (максимум 3)
            const dotsCount = Math.min(dayEvents.length, 3);
            for (let i = 0; i < dotsCount; i++) {
                const dot = document.createElement('span');
                dot.className = 'calendar-event-dot';
                eventsEl.appendChild(dot);
            }
            
            dayEl.appendChild(eventsEl);
        }
        
        // Сохраняем дату и полные данные событий в элементе
        dayEl.dataset.date = date.toISOString();
        
        // Сохраняем полные данные событий, а не только отфильтрованные
        const fullEventsData = dayEvents.map(event => ({
            id: event.id,
            name: event.name,
            date: event.date,
            participants: event.participants || [],
            participantCount: event.participantCount || 0,
            leader: event.leader || '',
            branchId: event.branchId
        }));
        
        dayEl.dataset.events = JSON.stringify(fullEventsData);
        console.log(`💾 Сохранено событий для ${date.toDateString()}:`, fullEventsData); // Отладка
        
        // Добавляем в календарь
        this.calendarDays.appendChild(dayEl);
    }
    
    /**
     * Получение событий для конкретного дня
     */
    getEventsForDay(date) {
        const events = this.events.filter(event => {
            // Преобразуем различные форматы даты
            let eventDate;
            
            if (event.date) {
                // Если date - строка
                if (typeof event.date === 'string') {
                    eventDate = new Date(event.date);
                } 
                // Если date - Firebase Timestamp
                else if (event.date.toDate) {
                    eventDate = event.date.toDate();
                }
                // Если date - объект Date
                else if (event.date instanceof Date) {
                    eventDate = event.date;
                }
                // Если date - объект с seconds (Firestore timestamp)
                else if (event.date.seconds) {
                    eventDate = new Date(event.date.seconds * 1000);
                }
            }
            
            if (!eventDate || isNaN(eventDate.getTime())) {
                logger.warn('Некорректная дата события:', event);
                return false;
            }
            
            return eventDate.toDateString() === date.toDateString();
        });
        
        if (events.length > 0) {
            logger.log(`События для ${date.toDateString()}:`, events);
        }
        
        return events;
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
        
        // Убираем выделение с предыдущего дня
        const prevSelected = this.calendarDays.querySelector('.calendar-day.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }
        
        // Выделяем новый день
        dayEl.classList.add('selected');
        
        const date = new Date(dayEl.dataset.date);
        const events = JSON.parse(dayEl.dataset.events || '[]');
        
        this.selectedDate = date;
        
        logger.log(`📅 Выбран день: ${date.toLocaleDateString()}, событий: ${events.length}`);
        
        // Показываем события в нижнем блоке
        this.showSelectedDateEvents(date, events);
    }
    
    /**
     * Показать события выбранной даты
     */
    showSelectedDateEvents(date, events) {
        const container = this.selectedDateEvents;
        
        if (events.length === 0) {
            // Нет событий
            container.innerHTML = `
                <div class="selected-date-header">
                    <h3 class="selected-date-title">${this.formatDate(date)}</h3>
                    ${canManageEvents() ? `
                        <button class="icon-button" onclick="window.eventsCalendar.handleCreateEvent(new Date('${date.toISOString()}'))" title="Создать событие">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 5V15M5 10H15" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="no-date-selected">
                    <p>На эту дату нет запланированных событий</p>
                </div>
            `;
        } else {
            // Есть события
            console.log('📅 Отображение событий:', events); // Отладка
            
            const eventsHTML = events.map(event => {
                console.log(`🎯 Обработка события ${event.id}:`, event); // Отладка
                
                // Формируем компактный список участников
                let participantsHTML = '';
                if (event.participants && Array.isArray(event.participants)) {
                    console.log(`  👥 Участники события:`, event.participants); // Отладка
                    
                    const participantsList = event.participants
                        .filter(p => p.name) // Только участники с именами
                        .map(p => {
                            const instrument = p.instrument || '';
                            return `${p.name}${instrument ? ` (${instrument})` : ''}`;
                        })
                        .join(', ');
                    
                    console.log(`  📝 Список участников: "${participantsList}"`); // Отладка
                    
                    if (participantsList) {
                        participantsHTML = `<div class="event-participants-list">${participantsList}</div>`;
                    }
                } else {
                    console.log(`  ⚠️ Нет массива participants`); // Отладка
                }
                
                // Лидер
                const leaderHTML = event.leader ? `<div class="event-leader">🎤 ${event.leader}</div>` : '';
                console.log(`  🎤 Лидер: ${event.leader || 'не указан'}`); // Отладка
                
                return `
                    <div class="event-card" onclick="window.location.href='/public/event/?id=${event.id}'">
                        <div class="event-header">
                            <div class="event-time">${this.formatTime(event.date)}</div>
                            <div class="event-name">${event.name}</div>
                        </div>
                        ${leaderHTML}
                        ${participantsHTML}
                        <div class="event-info">
                            <span class="event-count">${event.participantCount || 0} участников</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = `
                <div class="selected-date-header">
                    <h3 class="selected-date-title">${this.formatDate(date)}</h3>
                    ${canManageEvents() ? `
                        <button class="icon-button" onclick="window.eventsCalendar.handleCreateEvent(new Date('${date.toISOString()}'))" title="Создать событие">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 5V15M5 10H15" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="events-list">
                    ${eventsHTML}
                </div>
            `;
        }
    }
    
    /**
     * Форматирование даты
     */
    formatDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('ru-RU', options);
    }
    
    /**
     * Форматирование времени
     */
    formatTime(dateData) {
        let date;
        
        // Обработка различных форматов
        if (typeof dateData === 'string') {
            date = new Date(dateData);
        } else if (dateData && dateData.toDate) {
            date = dateData.toDate();
        } else if (dateData instanceof Date) {
            date = dateData;
        } else if (dateData && dateData.seconds) {
            date = new Date(dateData.seconds * 1000);
        } else {
            return 'Время не указано';
        }
        
        if (isNaN(date.getTime())) {
            return 'Время не указано';
        }
        
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    /**
     * Обработчик создания события
     */
    async handleCreateEvent(preselectedDate) {
        logger.log('🆕 Создание нового события', preselectedDate);
        
        try {
            // TODO: Импортировать и открыть модальное окно создания события
            alert(`Функционал создания события на ${preselectedDate ? this.formatDate(preselectedDate) : 'выбранную дату'} будет реализован далее`);
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

// Делаем календарь доступным глобально для обработчиков onclick
window.eventsCalendar = null;