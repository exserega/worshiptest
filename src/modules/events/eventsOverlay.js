/**
 * @fileoverview Оверлей для отображения списка событий филиала
 * @module EventsOverlay
 */

import logger from '../../utils/logger.js';
import { getEventsByBranch, deleteEvent, getEvent } from './eventsApi.js';
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
        console.log('🔄 loadEvents: начало загрузки событий'); // Временный лог
        try {
            // Получаем текущего пользователя
            const currentUser = getCurrentUser();
            console.log('👤 Текущий пользователь:', currentUser); // Временный лог
            
            if (!currentUser) {
                console.warn('⚠️ Пользователь не авторизован'); // Временный лог
                logger.warn('Пользователь не авторизован');
                this.showEmptyState('Необходима авторизация');
                return;
            }
            
            if (!currentUser.branchId) {
                console.warn('⚠️ У пользователя не установлен филиал'); // Временный лог
                logger.warn('У пользователя не установлен филиал');
                this.showEmptyState('Филиал не выбран');
                return;
            }
            
            this.currentBranchId = currentUser.branchId;
            console.log(`📅 Загрузка событий для филиала: ${this.currentBranchId}`); // Временный лог
            logger.log(`Загрузка событий для филиала: ${this.currentBranchId}`);
            
            // Показываем индикатор загрузки
            const contentEl = this.overlay.querySelector('.events-content');
            contentEl.innerHTML = '<div class="loading-indicator">Загрузка событий...</div>';
            
            // Загружаем события
            console.log('🔍 Вызываем getEventsByBranch...'); // Временный лог
            const events = await getEventsByBranch(this.currentBranchId);
            console.log('📊 События загружены:', events); // Временный лог
            
            // Добавляем права на редактирование для каждого события
            this.events = events.map(event => {
                const canEdit = event.createdBy === currentUser.uid || currentUser.role === 'admin';
                console.log('🔐 Проверка прав:', {
                    eventId: event.id,
                    eventCreatedBy: event.createdBy,
                    currentUserId: currentUser.uid,
                    currentUserRole: currentUser.role,
                    canEdit
                });
                return {
                    ...event,
                    canEdit
                };
            });
            
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
                
                this.eventsList.onCreateEvent = () => {
                    console.log('🔔 EventsList.onCreateEvent переопределен в eventsOverlay');
                    this.handleCreateEvent();
                };
                
                this.eventsList.onEventDelete = (eventId, eventName) => {
                    console.log('🗑️ EventsList.onEventDelete переопределен в eventsOverlay');
                    this.handleEventDelete(eventId, eventName);
                };
            }
            
            // Отображаем события
            this.eventsList.setEvents(this.events);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки событий:', error); // Временный лог
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
        // Переход на страницу события
        window.location.href = `/public/event/?id=${eventId}`;
    }
    
    /**
     * Обработчик создания события
     */
    async handleCreateEvent() {
        console.log('🆕 Открываем модальное окно создания события');
        
        // Закрываем оверлей событий для лучшего UX
        this.close();
        
        try {
            const { getEventModal } = await import('./eventModal.js');
            const modal = getEventModal();
            
            modal.openForCreate(async (eventId) => {
                console.log('✅ Событие создано, обновляем список');
                // Открываем оверлей обратно и перезагружаем события
                this.open();
                await this.loadEvents();
            });
            
            // При закрытии модального окна без сохранения - открываем оверлей обратно
            const originalClose = modal.close.bind(modal);
            modal.close = () => {
                originalClose();
                // Если оверлей был закрыт, открываем его обратно
                if (!this.isOpen) {
                    this.open();
                }
            };
        } catch (error) {
            console.error('Ошибка при открытии модального окна:', error);
            alert('Не удалось открыть форму создания события');
            // В случае ошибки тоже открываем оверлей обратно
            this.open();
        }
    }
    
    /**
     * Обработчик удаления события
     * @param {string} eventId - ID события
     * @param {string} eventName - Название события
     */
    async handleEventDelete(eventId, eventName) {
        console.log('🗑️ Удаление события:', eventId, eventName);
        
        // Подтверждение удаления
        const confirmMessage = `Вы уверены, что хотите удалить событие "${eventName}"?\n\nЭто действие нельзя отменить.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            // Удаляем событие
            await deleteEvent(eventId);
            console.log('✅ Событие удалено');
            
            // Перезагружаем список событий
            await this.loadEvents();
            
        } catch (error) {
            console.error('Ошибка при удалении события:', error);
            alert('Не удалось удалить событие: ' + error.message);
        }
    }
    
    /**
     * Обработчик редактирования события
     * @param {string} eventId - ID события
     */
    async handleEventEdit(eventId) {
        logger.log(`Редактирование события: ${eventId}`);
        
        try {
            // Загружаем данные события
            const eventDoc = await getEvent(eventId);
            if (!eventDoc.exists) {
                console.error('Событие не найдено');
                return;
            }
            
            const eventData = { id: eventDoc.id, ...eventDoc.data() };
            
            // Закрываем overlay событий
            this.close();
            
            // Открываем модальное окно в режиме редактирования
            const { eventModal } = await import('./eventModal.js');
            eventModal.open(eventData);
            
            // Устанавливаем callback для обновления данных после сохранения
            eventModal.onSave = async () => {
                // Перезагружаем события для обновления всех данных
                await this.loadEvents();
            };
            
            // При закрытии модалки открываем обратно overlay
            eventModal.onClose = () => {
                this.open();
            };
            
        } catch (error) {
            console.error('Ошибка при редактировании события:', error);
            alert('Не удалось загрузить данные события');
        }
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