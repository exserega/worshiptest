/**
 * @fileoverview Оверлей для отображения списка событий филиала
 * @module EventsOverlay
 */

import logger from '../../utils/logger.js';
import { EventsList } from './eventsList.js';
import { getEventsByBranch, deleteEvent, getEventById } from './eventsApi.js';
import { getCurrentUser } from '../auth/authCheck.js';
// Убираем импорт CalendarView - будем загружать лениво

/**
 * Класс для управления оверлеем событий с календарем
 */
class EventsOverlay {
    constructor() {
        logger.log('🎯 EventsOverlay: начало инициализации');
        this.overlay = null;
        this.isOpen = false;
        this.events = [];
        this.eventsList = null;
        this.calendarView = null;
        this.viewMode = 'calendar'; // Начинаем с календаря
        this.currentBranchId = null;
        this.CalendarView = null; // Класс будет загружен лениво
        
        logger.log('✅ EventsOverlay инициализирован');
    }
    
    /**
     * Инициализация оверлея
     */
    init() {
        this.createOverlayHTML();
        this.attachEventListeners();
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
                        <!-- Переключатель вида (временный) -->
                        <div class="view-switcher" style="margin-bottom: 1rem; text-align: center; display: none;">
                            <button class="view-btn calendar-view-btn active">Календарь</button>
                            <button class="view-btn list-view-btn">Список</button>
                        </div>
                        
                        <!-- Контейнер календаря -->
                        <div class="events-calendar-container" style="display: block;">
                            <!-- Календарь будет здесь -->
                        </div>
                        
                        <!-- Контейнер списка -->
                        <div class="events-list-container" style="display: none;">
                            <!-- Список событий будет здесь -->
                        </div>
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
                console.warn('⚠️ Пользователь не авторизован');
                logger.warn('Пользователь не авторизован');
                this.showEmptyState('Необходима авторизация');
                return;
            }
            
            if (!currentUser.branchId) {
                console.warn('⚠️ У пользователя не установлен филиал');
                logger.warn('У пользователя не установлен филиал');
                this.showEmptyState('Филиал не выбран');
                return;
            }
            
            this.currentBranchId = currentUser.branchId;
            logger.log(`Загрузка событий для филиала: ${this.currentBranchId}`);
            
            // НЕ перезаписываем весь контент, сохраняем структуру
            // Показываем индикатор загрузки только в активном контейнере
            
            // Загружаем события
            logger.log('Вызываем getEventsByBranch...');
            const events = await getEventsByBranch(this.currentBranchId);
            
            // Добавляем права на редактирование для каждого события
            this.events = events.map(event => {
                // Создатель события, администратор или модератор могут редактировать
                const canEdit = event.createdBy === currentUser.uid || 
                               currentUser.role === 'admin' || 
                               currentUser.role === 'moderator';
                logger.log('Проверка прав:', {
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
            
            // Убеждаемся что контейнеры существуют
            const eventsContent = this.overlay.querySelector('.events-content');
            if (eventsContent && !eventsContent.querySelector('.events-calendar-container')) {
                logger.log('📦 Восстанавливаем контейнеры');
                eventsContent.innerHTML = `
                    <div class="view-switcher" style="margin-bottom: 1rem; text-align: center; display: none;">
                        <button class="view-btn calendar-view-btn active">Календарь</button>
                        <button class="view-btn list-view-btn">Список</button>
                    </div>
                    <div class="events-calendar-container" style="display: block;">
                        <!-- Календарь будет здесь -->
                    </div>
                    <div class="events-list-container" style="display: none;">
                        <!-- Список событий будет здесь -->
                    </div>
                `;
            }
            
            // Отображаем события в зависимости от режима
            if (this.viewMode === 'calendar') {
                await this.showCalendarView();
            } else {
                this.showListView();
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки событий:', error);
            logger.error('Ошибка загрузки событий:', error);
            this.showEmptyState('Ошибка загрузки событий');
        }
    }
    
    /**
     * Показать пустое состояние
     * @param {string} message - Сообщение
     */
    showEmptyState(message) {
        // Не перезаписываем весь контент, а только показываем сообщение в нужном контейнере
        if (this.viewMode === 'calendar') {
            const calendarContainer = this.overlay.querySelector('.events-calendar-container');
            if (calendarContainer) {
                calendarContainer.innerHTML = `
                    <div class="empty-events">
                        <p>${message}</p>
                    </div>
                `;
            }
        } else {
            const listContainer = this.overlay.querySelector('.events-list-container');
            if (listContainer) {
                listContainer.innerHTML = `
                    <div class="empty-events">
                        <p>${message}</p>
                    </div>
                `;
            }
        }
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
        logger.log('Открываем модальное окно создания события');
        
        // Закрываем оверлей событий для лучшего UX
        this.close();
        
        try {
            const { getEventModal } = await import('./eventModal.js');
            const modal = getEventModal();
            
            modal.openForCreate(async (eventId) => {
                logger.log('✅ Событие создано, обновляем список');
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
        logger.log('Удаление события:', eventId, eventName);
        
        // Подтверждение удаления
        const confirmMessage = `Вы уверены, что хотите удалить событие "${eventName}"?\n\nЭто действие нельзя отменить.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            // Удаляем событие
            await deleteEvent(eventId);
            logger.log('✅ Событие удалено');
            
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
            const eventData = await getEventById(eventId);
            if (!eventData) {
                console.error('Событие не найдено');
                return;
            }
            
            // Закрываем overlay событий
            this.close();
            
            // Открываем модальное окно в режиме редактирования
            const { eventModal } = await import('./eventModal.js');
            eventModal.open(eventData);
            
            // Устанавливаем callback для обновления данных после сохранения
            eventModal.onSave = async () => {
                // Перезагружаем события для обновления всех данных
                await this.loadEvents();
                // Открываем overlay только если он был закрыт
                if (!this.isOpen) {
                    this.open();
                }
            };
            
            // При закрытии модалки открываем обратно overlay
            eventModal.onClose = () => {
                // Открываем overlay только если он был закрыт
                if (!this.isOpen) {
                    this.open();
                }
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
        logger.log('📂 EventsOverlay: вызван метод open()');
        
        // Создаем overlay при первом открытии
        if (!this.overlay) {
            this.init();
        }
        
        if (!this.overlay) {
            console.error('❌ EventsOverlay: не удалось создать overlay!');
            logger.error('❌ EventsOverlay: не удалось создать overlay!');
            return;
        }
        
        this.overlay.classList.add('visible');
        this.isOpen = true;
        document.addEventListener('keydown', this.escapeHandler);
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
    
    /**
     * Показать календарный вид
     */
    async showCalendarView() {
        // Проверяем наличие overlay
        if (!this.overlay) {
            logger.error('❌ Overlay не найден при попытке показать календарь');
            return;
        }
        
        // Ищем контент контейнер сначала
        const eventsContent = this.overlay.querySelector('.events-content');
        logger.log('🔍 events-content найден:', !!eventsContent);
        
        const calendarContainer = this.overlay.querySelector('.events-calendar-container');
        const listContainer = this.overlay.querySelector('.events-list-container');
        
        logger.log('🔍 Поиск контейнеров:', {
            overlay: !!this.overlay,
            eventsContent: !!eventsContent,
            calendarContainer: !!calendarContainer,
            listContainer: !!listContainer
        });
        
        if (!calendarContainer || !listContainer) {
            logger.error('❌ Контейнеры календаря/списка не найдены');
            // Попробуем создать их заново
            if (eventsContent) {
                eventsContent.innerHTML = `
                    <div class="view-switcher" style="margin-bottom: 1rem; text-align: center; display: none;">
                        <button class="view-btn calendar-view-btn active">Календарь</button>
                        <button class="view-btn list-view-btn">Список</button>
                    </div>
                    <div class="events-calendar-container" style="display: block;">
                        <!-- Календарь будет здесь -->
                    </div>
                    <div class="events-list-container" style="display: none;">
                        <!-- Список событий будет здесь -->
                    </div>
                `;
                
                // Повторно ищем контейнеры
                const newCalendarContainer = this.overlay.querySelector('.events-calendar-container');
                const newListContainer = this.overlay.querySelector('.events-list-container');
                
                if (newCalendarContainer && newListContainer) {
                    logger.log('✅ Контейнеры пересозданы успешно');
                    await this.showCalendarViewInternal(newCalendarContainer, newListContainer);
                }
            }
            return;
        }
        
        await this.showCalendarViewInternal(calendarContainer, listContainer);
    }
    
    /**
     * Внутренний метод показа календаря
     */
    async showCalendarViewInternal(calendarContainer, listContainer) {
        // Показываем календарь, скрываем список
        calendarContainer.style.display = 'block';
        listContainer.style.display = 'none';
        
        // Ленивая загрузка модуля календаря
        if (!this.CalendarView) {
            try {
                logger.log('📥 Загружаем модуль календаря...');
                const module = await import('./calendarView.js');
                this.CalendarView = module.CalendarView;
                logger.log('✅ Модуль календаря загружен');
            } catch (error) {
                logger.error('❌ Ошибка загрузки модуля календаря:', error);
                // Показываем список как fallback
                this.viewMode = 'list';
                this.showListView();
                return;
            }
        }
        
        // Создаем календарь если еще не создан
        if (!this.calendarView && this.CalendarView) {
            this.calendarView = new this.CalendarView(calendarContainer);
            
            // Обработчик клика по дню
            this.calendarView.onDayClick = (date, events) => {
                logger.log(`📅 Клик по дню: ${date.toLocaleDateString()}, событий: ${events.length}`);
                // В следующих этапах здесь будет логика создания/просмотра событий
            };
        }
        
        // Передаем события в календарь
        if (this.calendarView) {
            this.calendarView.setEvents(this.events);
        }
    }
    
    /**
     * Показать вид списка  
     */
    showListView() {
        const calendarContainer = this.overlay.querySelector('.events-calendar-container');
        const listContainer = this.overlay.querySelector('.events-list-container');
        
        // Показываем список, скрываем календарь
        calendarContainer.style.display = 'none';
        listContainer.style.display = 'block';
        
        // Создаем компонент списка если еще не создан
        if (!this.eventsList) {
            this.eventsList = new EventsList(listContainer);
            
            // Устанавливаем обработчики
            this.eventsList.onEventClick = (eventId) => {
                this.handleEventClick(eventId);
            };
            
            this.eventsList.onEventEdit = (eventId) => {
                this.handleEventEdit(eventId);
            };
            
            this.eventsList.onEventCreate = () => {
                this.handleEventCreate();
            };
            
            this.eventsList.onEventDelete = (eventId, eventName) => {
                this.handleEventDelete(eventId, eventName);
            };
        }
        
        // Отображаем события
        this.eventsList.setEvents(this.events);
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
    logger.log('🚀 openEventsOverlay вызвана');
    
    if (!eventsOverlayInstance) {
        logger.log('📦 Создаем новый экземпляр EventsOverlay');
        initEventsOverlay();
    }
    
    logger.log('📞 Вызываем open() на экземпляре:', eventsOverlayInstance);
    eventsOverlayInstance.open();
}

export function closeEventsOverlay() {
    if (eventsOverlayInstance) {
        eventsOverlayInstance.close();
    }
}