/**
 * @fileoverview Компонент списка событий
 * @module EventsList
 */

import logger from '../../utils/logger.js';
import { hasLimitedAccess } from '../auth/authCheck.js';

/**
 * Класс для управления списком событий
 */
export class EventsList {
    constructor(container) {
        this.container = container;
        this.events = [];
        this.currentFilter = 'upcoming'; // upcoming | archive | all
    }
    
    /**
     * Установить события для отображения
     * @param {Array} events - Массив событий
     */
    setEvents(events) {
        this.events = events;
        this.render();
    }
    
    /**
     * Фильтровать события по типу
     * @param {string} filter - Тип фильтра
     */
    filterEvents(filter) {
        this.currentFilter = filter;
        this.render();
    }
    
    /**
     * Разделить события на предстоящие и архивные
     * @returns {Object} Объект с массивами upcoming и archive
     */
    categorizeEvents() {
        const now = new Date();
        const upcoming = [];
        const archive = [];
        
        this.events.forEach(event => {
            const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
            if (eventDate >= now) {
                upcoming.push(event);
            } else {
                archive.push(event);
            }
        });
        
        // Сортировка: предстоящие по возрастанию, архив по убыванию
        upcoming.sort((a, b) => {
            const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
            return dateA - dateB;
        });
        
        archive.sort((a, b) => {
            const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
            return dateB - dateA;
        });
        
        return { upcoming, archive };
    }
    
    /**
     * Форматировать дату события
     * @param {Date|Timestamp} date - Дата события
     * @returns {string} Отформатированная дата
     */
    formatEventDate(date) {
        const eventDate = date.toDate ? date.toDate() : new Date(date);
        const options = { 
            day: 'numeric', 
            month: 'long', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return eventDate.toLocaleDateString('ru-RU', options);
    }
    
    /**
     * Создать HTML для одного события
     * @param {Object} event - Данные события
     * @returns {string} HTML разметка
     */
    createEventItemHTML(event) {
        const date = this.formatEventDate(event.date);
        const songCount = event.songCount || 0;
        const leaderName = event.leaderName || 'не указан';
        
        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-header">
                    <div class="event-date">📅 ${date}</div>
                    <div class="event-actions">
                        ${!hasLimitedAccess() && event.canEdit ? 
                            `<button class="event-edit-btn" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="event-delete-btn" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>` : ''
                        }
                    </div>
                </div>
                <div class="event-name">${event.name}</div>
                <div class="event-details">
                    <span class="event-leader">🎤 Лидер: ${leaderName}</span>
                    <span class="event-songs">🎵 ${songCount} песен</span>
                </div>
                ${event.comment ? 
                    `<div class="event-comment">📝 ${event.comment}</div>` : ''
                }
            </div>
        `;
    }
    
    /**
     * Отрендерить список событий
     */
    render() {
        console.log('🎨 EventsList.render вызван');
        if (this.events.length === 0) {
            this.container.innerHTML = `
                <div class="empty-events">
                    <p>Нет событий в вашем филиале</p>
                    ${!hasLimitedAccess() ? 
                        '<button class="btn-create-event">Создать первое событие</button>' : ''
                    }
                </div>
            `;
            // Привязываем обработчики после рендера
            this.attachEventHandlers();
            return;
        }
        
        const { upcoming, archive } = this.categorizeEvents();
        let html = '';
        
        // Фильтры и кнопка создания
        html += `
            <div class="events-header-controls">
                <div class="events-filters">
                    <button class="filter-btn ${this.currentFilter === 'upcoming' ? 'active' : ''}" 
                            data-filter="upcoming">Предстоящие</button>
                    <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" 
                            data-filter="all">Все</button>
                    <button class="filter-btn ${this.currentFilter === 'archive' ? 'active' : ''}" 
                            data-filter="archive">Архив</button>
                </div>
                ${!hasLimitedAccess() ? 
                    '<button class="btn-create-event"><i class="fas fa-plus"></i> Создать событие</button>' : ''
                }
            </div>
        `;
        
        // Контент в зависимости от фильтра
        if (this.currentFilter === 'upcoming' || this.currentFilter === 'all') {
            if (upcoming.length > 0) {
                html += '<div class="events-section">';
                html += '<h3 class="events-section-title">Предстоящие события</h3>';
                html += '<div class="events-list">';
                upcoming.forEach(event => {
                    html += this.createEventItemHTML(event);
                });
                html += '</div></div>';
            }
        }
        
        if (this.currentFilter === 'archive' || this.currentFilter === 'all') {
            if (archive.length > 0) {
                html += '<div class="events-section">';
                html += '<h3 class="events-section-title">Архив событий</h3>';
                html += '<div class="events-list">';
                archive.forEach(event => {
                    html += this.createEventItemHTML(event);
                });
                html += '</div></div>';
            }
        }
        
        // Если нет событий по фильтру
        if ((this.currentFilter === 'upcoming' && upcoming.length === 0) ||
            (this.currentFilter === 'archive' && archive.length === 0)) {
            html += '<div class="empty-events"><p>Нет событий в этой категории</p></div>';
        }
        
        this.container.innerHTML = html;
        
        // Добавляем обработчики
        this.attachEventHandlers();
    }
    
    /**
     * Привязать обработчики событий
     */
    attachEventHandlers() {
        console.log('🎯 EventsList.attachEventHandlers вызван');
        // Фильтры
        const filterButtons = this.container.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.filterEvents(filter);
            });
        });
        
        // Клик по событию
        const eventItems = this.container.querySelectorAll('.event-item');
        eventItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Игнорируем клик по кнопке редактирования
                if (e.target.closest('.event-edit-btn')) return;
                
                const eventId = item.dataset.eventId;
                this.onEventClick(eventId);
            });
        });
        
        // Кнопки редактирования
        const editButtons = this.container.querySelectorAll('.event-edit-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = btn.closest('.event-item').dataset.eventId;
                this.onEventEdit(eventId);
            });
        });
        
        // Кнопки удаления
        const deleteButtons = this.container.querySelectorAll('.event-delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = btn.closest('.event-item').dataset.eventId;
                const eventName = btn.closest('.event-item').querySelector('.event-name').textContent;
                this.onEventDelete(eventId, eventName);
            });
        });
        
        // Кнопка создания события
        const createBtn = this.container.querySelector('.btn-create-event');
        console.log('🔘 Поиск кнопки создания события:', createBtn);
        if (createBtn) {
            console.log('✅ Кнопка найдена, добавляем обработчик');
            createBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🆕 Клик по кнопке создания события');
                this.onCreateEvent();
            });
        } else {
            console.log('❌ Кнопка создания события не найдена');
        }
    }
    
    /**
     * Обработчик клика по событию (переопределяется извне)
     * @param {string} eventId - ID события
     */
    onEventClick(eventId) {
        logger.log(`Клик по событию: ${eventId}`);
    }
    
    /**
     * Обработчик редактирования события (переопределяется извне)
     * @param {string} eventId - ID события
     */
    onEventEdit(eventId) {
        logger.log(`Редактирование события: ${eventId}`);
    }
    
    /**
     * Обработчик создания события (переопределяется извне)
     */
    onCreateEvent() {
        console.log('📝 EventsList.onCreateEvent вызван');
        logger.log('Создание нового события');
    }
    
    /**
     * Обработчик удаления события (переопределяется извне)
     * @param {string} eventId - ID события
     * @param {string} eventName - Название события
     */
    onEventDelete(eventId, eventName) {
        console.log('🗑️ EventsList.onEventDelete вызван:', eventId, eventName);
        logger.log(`Удаление события: ${eventId}`);
    }
}