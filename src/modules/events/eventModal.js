/**
 * @fileoverview Модальное окно для создания/редактирования событий
 * @module EventModal
 */

import logger from '../../utils/logger.js';
import { createEvent, updateEvent } from './eventsApi.js';
import { getCurrentUser } from '../auth/authCheck.js';
import { ParticipantsSelector } from './participantsSelector.js';

/**
 * Класс для управления модальным окном событий
 */
export class EventModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.mode = 'create'; // create или edit
        this.currentEventId = null;
        this.onSave = null; // Callback после сохранения
        this.participantsSelector = null;
        this.branchUsers = [];
        this.init();
    }
    
    /**
     * Инициализация модального окна
     */
    init() {
        this.createModalHTML();
        this.attachEventListeners();
    }
    
    /**
     * Создание HTML структуры модального окна
     */
    createModalHTML() {
        const modalHTML = `
            <div id="event-modal" class="modal-overlay event-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Новое событие</h2>
                        <button class="modal-close" aria-label="Закрыть">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="event-form" class="event-form">
                        <div class="form-group">
                            <label for="event-name">Название события *</label>
                            <input 
                                type="text" 
                                id="event-name" 
                                name="name" 
                                required 
                                placeholder="Например: Воскресное служение"
                                class="form-input"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="event-date">Дата и время *</label>
                            <input 
                                type="datetime-local" 
                                id="event-date" 
                                name="date" 
                                required 
                                class="form-input"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="event-setlist">Список песен *</label>
                            <select 
                                id="event-setlist" 
                                name="setlistId" 
                                required 
                                class="form-select"
                            >
                                <option value="">Выберите сетлист</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="event-leader">Основной лидер</label>
                            <select 
                                id="event-leader" 
                                name="leaderId" 
                                class="form-select"
                            >
                                <option value="">Не указан</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="event-comment">Комментарий</label>
                            <textarea 
                                id="event-comment" 
                                name="comment" 
                                rows="3" 
                                placeholder="Дополнительная информация о событии"
                                class="form-textarea"
                            ></textarea>
                        </div>
                        
                        <div id="participants-container"></div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">
                                Создать событие
                            </button>
                            <button type="button" class="btn-secondary cancel-btn">
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('event-modal');
        this.form = document.getElementById('event-form');
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        // Закрытие модального окна
        const closeBtn = this.modal.querySelector('.modal-close');
        const cancelBtn = this.modal.querySelector('.cancel-btn');
        
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        
        // Закрытие по клику на фон
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Отправка формы
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    /**
     * Загрузить пользователей филиала для выбора лидера
     */
    async loadBranchUsers() {
        try {
            const currentUser = getCurrentUser();
            console.log('👤 Загрузка пользователей для филиала:', currentUser?.branchId);
            if (!currentUser?.branchId) return;
            
            // Получаем пользователей филиала
            const { getBranchUsers } = await import('../../api/index.js');
            const users = await getBranchUsers(currentUser.branchId);
            console.log('👥 Загружено пользователей:', users);
            
            // Фильтруем активных пользователей
            const activeUsers = users.filter(user => user.status === 'active');
            console.log('✅ Активных пользователей:', activeUsers.length);
            
            // Сохраняем для селектора участников
            this.branchUsers = activeUsers;
            
            // Заполняем select
            const select = this.modal.querySelector('#event-leader');
            select.innerHTML = '<option value="">Не указан</option>';
            
            activeUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                // Приоритет: name -> displayName -> email
                const userName = user.name || user.displayName || user.email || 'Пользователь';
                option.textContent = userName;
                select.appendChild(option);
            });
            
            // Инициализируем селектор участников
            this.initParticipantsSelector();
            
        } catch (error) {
            console.error('Ошибка загрузки пользователей филиала:', error);
            logger.error('Ошибка загрузки пользователей филиала:', error);
        }
    }
    
    /**
     * Загрузить сетлисты для выбора
     */
    async loadSetlists() {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.branchId) return;
            
            // Получаем сетлисты филиала
            const { getSetlistsByBranch } = await import('../../api/index.js');
            const setlists = await getSetlistsByBranch(currentUser.branchId);
            
            // Заполняем select
            const select = this.modal.querySelector('#event-setlist');
            select.innerHTML = '<option value="">Выберите сетлист</option>';
            
            setlists.forEach(setlist => {
                const option = document.createElement('option');
                option.value = setlist.id;
                option.textContent = setlist.name;
                select.appendChild(option);
            });
            
        } catch (error) {
            logger.error('Ошибка загрузки сетлистов:', error);
        }
    }
    
    /**
     * Инициализировать селектор участников
     */
    initParticipantsSelector() {
        const container = this.modal.querySelector('#participants-container');
        if (!container) return;
        
        // Создаем селектор если еще не создан
        if (!this.participantsSelector) {
            this.participantsSelector = new ParticipantsSelector(container, this.branchUsers);
            
            // Callback при изменении
            this.participantsSelector.onChange = (participants) => {
                console.log('📝 Участники изменены:', participants);
            };
        }
    }
    
    /**
     * Обработка отправки формы
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const eventData = {
            name: formData.get('name'),
            date: new Date(formData.get('date')),
            setlistId: formData.get('setlistId'),
            leaderId: formData.get('leaderId') || null,
            comment: formData.get('comment') || '',
            branchId: getCurrentUser().branchId,
            participants: this.participantsSelector ? this.participantsSelector.getParticipants() : []
        };
        
        try {
            // Показываем индикатор загрузки
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Сохранение...';
            
            let eventId;
            if (this.mode === 'create') {
                eventId = await createEvent(eventData);
                console.log('✅ Событие создано:', eventId);
            } else {
                await updateEvent(this.currentEventId, eventData);
                eventId = this.currentEventId;
                console.log('✅ Событие обновлено:', eventId);
            }
            
            // Вызываем callback
            if (this.onSave) {
                this.onSave(eventId);
            }
            
            // Закрываем модальное окно
            this.close();
            
        } catch (error) {
            console.error('Ошибка сохранения события:', error);
            alert('Не удалось сохранить событие: ' + error.message);
        } finally {
            // Восстанавливаем кнопку
            const submitBtn = this.form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = this.mode === 'create' ? 'Создать событие' : 'Сохранить';
        }
    }
    
    /**
     * Открыть модальное окно для создания
     */
    openForCreate(callback) {
        this.mode = 'create';
        this.currentEventId = null;
        this.onSave = callback;
        
        // Очищаем форму
        this.form.reset();
        
        // Устанавливаем текущую дату и время
        const now = new Date();
        const dateInput = this.modal.querySelector('#event-date');
        dateInput.value = now.toISOString().slice(0, 16);
        
        // Обновляем заголовок и кнопку
        this.modal.querySelector('.modal-title').textContent = 'Новое событие';
        this.form.querySelector('button[type="submit"]').textContent = 'Создать событие';
        
        // Загружаем сетлисты и пользователей
        this.loadSetlists();
        this.loadBranchUsers();
        
        // Открываем модальное окно
        this.open();
    }
    
    /**
     * Открыть модальное окно
     */
    open() {
        this.modal.classList.add('visible');
        this.isOpen = true;
        
        // Фокус на первое поле
        setTimeout(() => {
            this.modal.querySelector('#event-name').focus();
        }, 100);
    }
    
    /**
     * Закрыть модальное окно
     */
    close() {
        this.modal.classList.remove('visible');
        this.isOpen = false;
    }
}

// Создаем и экспортируем экземпляр
let eventModalInstance = null;

export function getEventModal() {
    if (!eventModalInstance) {
        eventModalInstance = new EventModal();
    }
    return eventModalInstance;
}