/**
 * @fileoverview Оверлей для отображения списка событий филиала
 * @module EventsOverlay
 */

import logger from '../../utils/logger.js';
import { getEventsByBranch } from './eventsApi.js';
import { EventsList } from './eventsList.js';
import { getCurrentUser } from '../auth/authCheck.js';

/**
 * Класс для управления оверлеем событий
 */
class EventsOverlay {
    constructor() {
        this.overlay = null;
        this.isOpen = false;
        this.events = [];
        this.eventsList = null;
        this.currentBranchId = null;
        this.init();
    }
    
    /**
     * Инициализация оверлея
     */
    init() {
        console.log('🎯 EventsOverlay: начало инициализации'); // Временный лог
        logger.log('🎯 EventsOverlay: начало инициализации');
        this.createOverlayHTML();
        this.attachEventListeners();
        console.log('✅ EventsOverlay инициализирован'); // Временный лог
        logger.log('✅ EventsOverlay инициализирован');
    }
    
    /**
     * Создание HTML структуры оверлея
     */
    createOverlayHTML() {
        const overlayHTML = `
            <div id="events-overlay" class="songs-overlay">
                <div class="songs-overlay-backdrop"></div>
                <div class="songs-overlay-content">
                    <!-- Шапка -->
                    <div class="songs-overlay-header">
                        <h2 class="songs-overlay-title">События филиала</h2>
                        <button class="songs-overlay-close" aria-label="Закрыть">
                            <span class="close-icon"></span>
                        </button>
                    </div>
                    
                    <!-- Контент событий -->
                    <div class="events-content">
                        <!-- Здесь будет список событий -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        this.overlay = document.getElementById('events-overlay');
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        // Закрытие оверлея
        const closeBtn = this.overlay.querySelector('.songs-overlay-close');
        const backdrop = this.overlay.querySelector('.songs-overlay-backdrop');
        
        closeBtn.addEventListener('click', () => this.close());
        backdrop.addEventListener('click', () => this.close());
        
        // Закрытие по Escape
        this.escapeHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
    }
    
    /**
     * Загрузить события текущего филиала
     */
    async loadEvents() {
        try {
            // Получаем текущего пользователя
            const currentUser = getCurrentUser();
            if (!currentUser) {
                logger.warn('Пользователь не авторизован');
                this.showEmptyState('Необходима авторизация');
                return;
            }
            
            if (!currentUser.branchId) {
                logger.warn('У пользователя не установлен филиал');
                this.showEmptyState('Филиал не выбран');
                return;
            }
            
            this.currentBranchId = currentUser.branchId;
            logger.log(`Загрузка событий для филиала: ${this.currentBranchId}`);
            
            // Показываем индикатор загрузки
            const contentEl = this.overlay.querySelector('.events-content');
            contentEl.innerHTML = '<div class="loading-indicator">Загрузка событий...</div>';
            
            // Загружаем события
            this.events = await getEventsByBranch(this.currentBranchId);
            
            // Создаем компонент списка если еще не создан
            if (!this.eventsList) {
                this.eventsList = new EventsList(contentEl);
                
                // Устанавливаем обработчики
                this.eventsList.onEventClick = (eventId) => {
                    this.handleEventClick(eventId);
                };
                
                this.eventsList.onEventEdit = (eventId) => {
                    this.handleEventEdit(eventId);
                };
            }
            
            // Отображаем события
            this.eventsList.setEvents(this.events);
            
        } catch (error) {
            logger.error('Ошибка загрузки событий:', error);
            this.showEmptyState('Ошибка загрузки событий');
        }
    }
    
    /**
     * Показать пустое состояние
     * @param {string} message - Сообщение
     */
    showEmptyState(message) {
        const contentEl = this.overlay.querySelector('.events-content');
        contentEl.innerHTML = `
            <div class="empty-events">
                <p>${message}</p>
            </div>
        `;
    }
    
    /**
     * Обработчик клика по событию
     * @param {string} eventId - ID события
     */
    handleEventClick(eventId) {
        logger.log(`Открытие события: ${eventId}`);
        // TODO: Открыть детали события
        alert('Детали события будут реализованы в следующей фазе');
    }
    
    /**
     * Обработчик редактирования события
     * @param {string} eventId - ID события
     */
    handleEventEdit(eventId) {
        logger.log(`Редактирование события: ${eventId}`);
        // TODO: Открыть редактор события
        alert('Редактирование событий будет реализовано в следующей фазе');
    }
    
    /**
     * Открытие оверлея
     */
    open() {
        console.log('📂 EventsOverlay: вызван метод open()'); // Временный лог
        logger.log('📂 EventsOverlay: вызван метод open()');
        
        if (!this.overlay) {
            console.error('❌ EventsOverlay: overlay элемент не найден!'); // Временный лог
            logger.error('❌ EventsOverlay: overlay элемент не найден!');
            return;
        }
        
        this.overlay.classList.add('visible');
        this.isOpen = true;
        document.addEventListener('keydown', this.escapeHandler);
        console.log('✅ EventsOverlay открыт'); // Временный лог
        logger.log('✅ EventsOverlay открыт');
        
        // Загружаем события при открытии
        this.loadEvents();
    }
    
    /**
     * Закрытие оверлея
     */
    close() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('visible');
        this.isOpen = false;
        document.removeEventListener('keydown', this.escapeHandler);
        logger.log('EventsOverlay закрыт');
    }
}

// Создаем и экспортируем функции
let eventsOverlayInstance = null;

export function initEventsOverlay() {
    if (!eventsOverlayInstance) {
        eventsOverlayInstance = new EventsOverlay();
    }
    return eventsOverlayInstance;
}

export function openEventsOverlay() {
    console.log('🚀 openEventsOverlay вызвана'); // Временный лог для диагностики
    logger.log('🚀 openEventsOverlay вызвана');
    
    if (!eventsOverlayInstance) {
        console.log('📦 Создаем новый экземпляр EventsOverlay'); // Временный лог
        logger.log('📦 Создаем новый экземпляр EventsOverlay');
        initEventsOverlay();
    }
    
    console.log('📞 Вызываем open() на экземпляре:', eventsOverlayInstance); // Временный лог
    eventsOverlayInstance.open();
}

export function closeEventsOverlay() {
    if (eventsOverlayInstance) {
        eventsOverlayInstance.close();
    }
}