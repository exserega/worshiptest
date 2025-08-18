/**
 * @fileoverview Модуль календаря событий
 * @module EventsCalendar
 */

import logger from '../src/utils/logger.js';
import { getCurrentUser } from '../src/modules/auth/authCheck.js';
import { getEventsByBranch, deleteEvent } from '../src/modules/events/eventsApi.js';
import { canManageEvents } from '../src/modules/permissions/permissions.js';

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
        this.listViewBtn = document.getElementById('listViewBtn');
        
        // Состояние вида
        this.viewMode = 'calendar'; // 'calendar' или 'list'
        
        // Привязываем методы к контексту
        this.handlePrevMonth = this.handlePrevMonth.bind(this);
        this.handleNextMonth = this.handleNextMonth.bind(this);
        this.handleCreateEvent = this.handleCreateEvent.bind(this);
        this.handleDayClick = this.handleDayClick.bind(this);
        this.handleViewToggle = this.handleViewToggle.bind(this);
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
        // Если режим списка, показываем список событий
        if (this.viewMode === 'list') {
            this.renderListView();
            return;
        }
        
        // Обычный вид календаря
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
            
            // Проверяем, участвует ли текущий пользователь в каком-либо событии этого дня
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.uid) {
                const isUserParticipant = dayEvents.some(event => {
                    // Проверяем, является ли пользователь лидером
                    if (event.leaderId === currentUser.uid) {
                        logger.log(`📍 Пользователь ${currentUser.name} - лидер события ${event.name}`);
                        return true;
                    }
                    
                    // Проверяем участников
                    if (event.participants && Array.isArray(event.participants)) {
                        const isParticipant = event.participants.some(p => p.id === currentUser.uid);
                        if (isParticipant) {
                            logger.log(`📍 Пользователь ${currentUser.name} - участник события ${event.name}`);
                        }
                        return isParticipant;
                    }
                    
                    return false;
                });
                
                if (isUserParticipant) {
                    dayEl.classList.add('user-participant');
                    logger.log(`✨ День ${date.toDateString()} помечен как день участия пользователя`);
                }
            }
            
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
        this.prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        
        // Кнопка создания события
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn) {
            createEventBtn.addEventListener('click', () => this.handleCreateEvent());
        }
        
        // Кнопка переключения вида
        if (this.listViewBtn) {
            this.listViewBtn.style.display = 'block';
            this.listViewBtn.addEventListener('click', () => this.handleViewToggle());
        }
        
        // Обработчик клика по дням календаря
        this.calendarDays.addEventListener('click', (e) => {
            const dayEl = e.target.closest('.calendar-day');
            if (dayEl && !dayEl.classList.contains('other-month')) {
                this.handleDayClick({ target: dayEl });
            }
        });
    }
    
    /**
     * Навигация по месяцам
     * @param {number} direction - направление (-1 для предыдущего, 1 для следующего)
     */
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
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
                
                // Проверяем участие текущего пользователя
                const currentUser = getCurrentUser();
                let isUserParticipant = false;
                
                if (currentUser && currentUser.uid) {
                    // Проверяем, является ли пользователь лидером
                    if (event.leaderId === currentUser.uid) {
                        isUserParticipant = true;
                        logger.log(`✨ Пользователь - лидер события ${event.name}`);
                    }
                    
                    // Проверяем участников
                    if (!isUserParticipant && event.participants && Array.isArray(event.participants)) {
                        isUserParticipant = event.participants.some(p => p.id === currentUser.uid);
                        if (isUserParticipant) {
                            logger.log(`✨ Пользователь - участник события ${event.name}`);
                        }
                    }
                }
                
                // Формируем компактный список участников
                let participantsHTML = '';
                if (event.participants && Array.isArray(event.participants)) {
                    console.log(`  👥 Участники события:`, event.participants); // Отладка
                    
                    // Маппинг инструментов на эмодзи
                    const instrumentIcons = {
                        'vocals': '🎤',
                        'вокал': '🎤',
                        'guitar': '🎸',
                        'гитара': '🎸',
                        'electric_guitar': '🎸',
                        'электрогитара': '🎸',
                        'acoustic_guitar': '🎸',
                        'акустическая гитара': '🎸',
                        'bass': '🎸',
                        'бас': '🎸',
                        'бас-гитара': '🎸',
                        'keys': '🎹',
                        'keyboard': '🎹',
                        'piano': '🎹',
                        'клавиши': '🎹',
                        'drums': '🥁',
                        'барабаны': '🥁',
                        'cajon': '🪘',
                        'кахон': '🪘',
                        'sound': '🎛️',
                        'звукооператор': '🎛️',
                        'звук': '🎛️',
                        'other': '🎵',
                        'другое': '🎵'
                    };
                    
                    // Группируем участников по инструментам
                    const instrumentGroups = {};
                    
                    event.participants
                        .filter(p => p.userName || p.name)
                        .forEach(p => {
                            const instrumentName = p.instrumentName || p.instrument || 'Участник';
                            if (!instrumentGroups[instrumentName]) {
                                instrumentGroups[instrumentName] = {
                                    names: [],
                                    icon: instrumentIcons[(p.instrument || '').toLowerCase()] || 
                                          instrumentIcons[(p.instrumentName || '').toLowerCase()] || 
                                          '🎵'
                                };
                            }
                            instrumentGroups[instrumentName].names.push(p.userName || p.name);
                        });
                    
                    // Формируем HTML
                    const instrumentLines = Object.entries(instrumentGroups).map(([instrument, data]) => {
                        const names = data.names.join(', ');
                        return `<div class="instrument-line">${data.icon}${instrument} - ${names}</div>`;
                    });
                    
                    if (instrumentLines.length > 0) {
                        participantsHTML = `<div class="event-participants-compact">${instrumentLines.join('')}</div>`;
                    }
                    
                    console.log(`  📝 Участники обработаны`); // Отладка
                } else {
                    console.log(`  ⚠️ Нет массива participants`); // Отладка
                }
                
                // Ведущий (ранее лидер)
                const leaderHTML = event.leader ? `<div class="event-leader">👤 Ведущий: ${event.leader}</div>` : '';
                console.log(`  👤 Ведущий: ${event.leader || 'не указан'}`); // Отладка
                
                // Кнопки управления для модераторов и администраторов
                let actionButtons = '';
                if (canManageEvents()) {
                    actionButtons = `
                        <div class="event-actions">
                            <button class="action-btn edit-btn" onclick="window.eventsCalendar.handleEditEvent('${event.id}'); event.stopPropagation();" title="Редактировать">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="action-btn delete-btn" onclick="window.eventsCalendar.handleDeleteEvent('${event.id}', '${event.name.replace(/'/g, "\\'")}'); event.stopPropagation();" title="Удалить">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10 11V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14 11V17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    `;
                }
                
                return `
                    <div class="event-card ${isUserParticipant ? 'user-participant' : ''}" onclick="window.location.href='/public/event/?id=${event.id}'">
                        <div class="event-info">
                            <div class="event-header">
                                <span class="event-time">${this.formatTime(event.date)}</span>
                                <span class="event-name">${event.name}</span>
                            </div>
                            ${leaderHTML}
                            ${participantsHTML}
                        </div>
                        <div class="event-footer">
                            <span class="event-count">${event.songCount || 0} песен</span>
                            ${actionButtons}
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
     * Создание карточки события
     */
    createEventCard(event, showDate = false) {
        const currentUser = getCurrentUser();
        
        // Проверяем, участвует ли текущий пользователь
        let isUserParticipant = false;
        if (currentUser && currentUser.uid) {
            if (event.leaderId === currentUser.uid) {
                isUserParticipant = true;
            }
            if (!isUserParticipant && event.participants && Array.isArray(event.participants)) {
                isUserParticipant = event.participants.some(p => p.id === currentUser.uid);
            }
        }
        
        // Форматируем дату события
        const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
        const dateStr = showDate ? eventDate.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'short',
            weekday: 'short'
        }) : '';
        
        // Формируем информацию о лидере
        const leaderHTML = event.leader ? `
            <div class="event-leader">
                <i class="fas fa-user"></i>
                <span>${event.leader}</span>
            </div>
        ` : '';
        
        // Формируем информацию об участниках
        const participantsHTML = event.participants && event.participants.length > 0 ? `
            <div class="event-participants">
                <i class="fas fa-users"></i>
                <span>${event.participants.length} участ.</span>
            </div>
        ` : '';
        
        return `
            <div class="event-card ${isUserParticipant ? 'user-participant' : ''}" onclick="window.location.href='/public/event/?id=${event.id}'">
                <div class="event-info">
                    <div class="event-header">
                        ${showDate ? `<span class="event-date">${dateStr}</span>` : ''}
                        <span class="event-time">${this.formatTime(event.date)}</span>
                        <span class="event-name">${event.name}</span>
                    </div>
                    ${leaderHTML}
                    ${participantsHTML}
                </div>
                <div class="event-footer">
                    <span class="event-count">${event.songCount || 0} песен</span>
                    ${canManageEvents() ? `
                        <div class="event-actions" onclick="event.stopPropagation();">
                            <button class="icon-button small" onclick="window.eventsCalendar.handleEditEvent('${event.id}')" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-button small delete" onclick="window.eventsCalendar.handleDeleteEvent('${event.id}')" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Рендеринг списка событий
     */
    renderListView() {
        logger.log('📋 Рендеринг списка событий');
        
        // Скрываем календарь и показываем контейнер для списка
        this.weekdays.style.display = 'none';
        this.calendarDays.style.display = 'none';
        
        // Очищаем и используем selectedDateEvents для списка
        this.selectedDateEvents.innerHTML = '';
        this.selectedDateEvents.style.display = 'block';
        
        // Обновляем заголовок
        this.monthTitle.textContent = 'Все события';
        
        // Получаем все события отсортированные по дате
        const sortedEvents = [...this.events].sort((a, b) => {
            const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
            return dateA - dateB;
        });
        
        // Фильтруем будущие события (включая сегодня)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureEvents = sortedEvents.filter(event => {
            const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        });
        
        if (futureEvents.length === 0) {
            this.selectedDateEvents.innerHTML = `
                <div class="no-events-message">
                    <p>Нет предстоящих событий</p>
                </div>
            `;
            return;
        }
        
        // Группируем события по месяцам
        const eventsByMonth = {};
        futureEvents.forEach(event => {
            const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
            const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
            const monthName = eventDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
            
            if (!eventsByMonth[monthKey]) {
                eventsByMonth[monthKey] = {
                    name: monthName,
                    events: []
                };
            }
            eventsByMonth[monthKey].events.push(event);
        });
        
        // Рендерим события по месяцам
        let html = '<div class="events-list-view">';
        
        Object.values(eventsByMonth).forEach(monthData => {
            html += `
                <div class="month-section">
                    <h3 class="month-section-title">${monthData.name}</h3>
                    <div class="month-events">
            `;
            
            html += monthData.events.map(event => this.createEventCard(event, true)).join('');
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        this.selectedDateEvents.innerHTML = html;
    }

    /**
     * Переключение вида календаря
     */
    handleViewToggle() {
        this.viewMode = this.viewMode === 'calendar' ? 'list' : 'calendar';
        logger.log(`📅 Переключение вида на: ${this.viewMode}`);
        
        // Обновляем иконку кнопки
        const icon = this.listViewBtn.querySelector('svg');
        if (this.viewMode === 'list') {
            // Иконка календаря для возврата к виду календаря
            icon.innerHTML = `
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            `;
            this.listViewBtn.title = 'Вид календаря';
        } else {
            // Иконка списка для переключения на вид списка
            icon.innerHTML = `
                <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
            this.listViewBtn.title = 'Список событий';
        }
        
        // Если возвращаемся к календарю, показываем элементы
        if (this.viewMode === 'calendar') {
            this.weekdays.style.display = '';
            this.calendarDays.style.display = '';
            this.selectedDateEvents.style.display = 'none';
        }
        
        // Перерисовываем интерфейс
        this.render();
    }

    /**
     * Обработчик создания события
     */
    async handleCreateEvent(preselectedDate = null) {
        logger.log('🆕 Создание нового события', preselectedDate);
        
        try {
            // Если дата не передана, используем выбранную или текущую
            const date = preselectedDate || this.selectedDate || new Date();
            
            // Убедимся что date это объект Date
            const eventDate = date instanceof Date ? date : new Date(date);
            
            // Открываем модальное окно создания события
            const { openEventCreationModal } = await import('../src/modules/events/eventCreationModal.js');
            
            openEventCreationModal(eventDate, async (eventId) => {
                logger.log('✅ Событие создано:', eventId);
                
                // Перезагружаем события
                await this.loadEvents();
                this.render();
                
                // Выбираем дату с новым событием
                const dayElements = this.calendarDays.querySelectorAll('.calendar-day');
                for (const dayEl of dayElements) {
                    const dayDate = new Date(dayEl.dataset.date);
                    if (dayDate.toDateString() === eventDate.toDateString()) {
                        this.handleDayClick({ target: dayEl });
                        break;
                    }
                }
            });
            
        } catch (error) {
            logger.error('Ошибка создания события:', error);
            alert('Ошибка при открытии окна создания события');
        }
    }
    
    /**
     * Обработчик редактирования события
     */
    async handleEditEvent(eventId) {
        logger.log('🖊️ Редактирование события:', eventId);
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) {
                logger.warn('Событие не найдено для редактирования:', eventId);
                return;
            }

            const { openEventCreationModal } = await import('../src/modules/events/eventCreationModal.js');
            openEventCreationModal(new Date(event.date), async (updatedEventId) => {
                if (updatedEventId === eventId) {
                    logger.log('✅ Событие обновлено:', eventId);
                    await this.loadEvents();
                    this.render();
                    this.handleDayClick({ target: this.calendarDays.querySelector(`.calendar-day[data-date="${event.date.toISOString()}"]`) });
                } else {
                    logger.warn('Событие с другим ID было создано:', updatedEventId);
                }
            });
        } catch (error) {
            logger.error('Ошибка редактирования события:', error);
            alert('Ошибка при открытии окна редактирования события');
        }
    }

    /**
     * Обработчик удаления события
     */
    async handleDeleteEvent(eventId, eventName) {
        if (!confirm(`Вы уверены, что хотите удалить событие "${eventName}"?`)) {
            return;
        }
        
        logger.log('🗑️ Удаление события:', eventId);
        
        try {
            await deleteEvent(eventId);
            logger.log('✅ Событие удалено:', eventId);
            
            // Перезагружаем события
            await this.loadEvents();
            this.render();
            
            // Если есть выбранная дата, обновляем отображение
            if (this.selectedDate) {
                const selectedDateStr = this.selectedDate.toDateString();
                const dayElements = this.calendarDays.querySelectorAll('.calendar-day');
                
                for (const dayEl of dayElements) {
                    if (dayEl.dataset.date) {
                        const dayDate = new Date(dayEl.dataset.date);
                        if (dayDate.toDateString() === selectedDateStr) {
                            this.handleDayClick({ target: dayEl });
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('Ошибка удаления события:', error);
            alert('Ошибка при удалении события: ' + error.message);
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