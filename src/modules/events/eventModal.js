/**
 * @fileoverview Модальное окно создания/редактирования события
 * @module EventModal
 */

import logger from '../../utils/logger.js';
import { createEvent, updateEvent } from './eventsApi.js';
import { getCurrentUser } from '../auth/authCheck.js';
import { db } from '../../utils/firebase-v8-adapter.js';

let modalInstance = null;

/**
 * Открыть модальное окно события
 * @param {Object} options - Опции модального окна
 * @param {Date} options.date - Предустановленная дата
 * @param {Object} options.event - Существующее событие для редактирования
 * @param {Function} options.onSave - Коллбек после сохранения
 */
export function openEventModal(options = {}) {
    const { date = new Date(), event = null, onSave } = options;
    
    logger.log('📝 Открытие модального окна события:', { date, event });
    
    // Создаем модальное окно
    if (!modalInstance) {
        modalInstance = new EventModal();
    }
    
    modalInstance.open({ date, event, onSave });
}

class EventModal {
    constructor() {
        this.modal = null;
        this.form = null;
        this.participantsList = [];
        this.selectedParticipants = [];
        this.onSave = null;
    }
    
    open({ date, event, onSave }) {
        this.event = event;
        this.onSave = onSave;
        this.createModal();
        this.populateForm(date, event);
        this.attachEventListeners();
        this.showModal();
    }
    
    createModal() {
        const modalHTML = `
            <div class="modal" id="eventModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${this.event ? 'Редактировать событие' : 'Создать событие'}</h2>
                        <button class="close-modal" onclick="window.eventModal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="eventForm" class="modal-body">
                        <div class="form-group">
                            <label for="eventName">Название события</label>
                            <input type="text" id="eventName" class="form-control" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="eventDate">Дата</label>
                                <input type="date" id="eventDate" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="eventTime">Время</label>
                                <input type="time" id="eventTime" class="form-control" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="eventComment">Комментарий</label>
                            <textarea id="eventComment" class="form-control" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Участники</label>
                            <div class="participants-section">
                                <div class="participant-search">
                                    <input type="text" id="participantSearch" class="form-control" 
                                           placeholder="Поиск участников...">
                                </div>
                                <div id="participantsList" class="participants-list"></div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="window.eventModal.close()">
                                Отмена
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${this.event ? 'Сохранить' : 'Создать'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Добавляем в DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('eventModal');
        this.form = document.getElementById('eventForm');
        
        // Делаем доступным глобально для onclick
        window.eventModal = this;
    }
    
    populateForm(date, event) {
        const user = getCurrentUser();
        
        if (event) {
            // Редактирование
            document.getElementById('eventName').value = event.name || '';
            document.getElementById('eventComment').value = event.comment || '';
            
            if (event.date) {
                const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
                document.getElementById('eventDate').value = eventDate.toISOString().split('T')[0];
                document.getElementById('eventTime').value = eventDate.toTimeString().slice(0, 5);
            }
            
            this.selectedParticipants = event.participants || [];
        } else {
            // Новое событие
            document.getElementById('eventDate').value = date.toISOString().split('T')[0];
            document.getElementById('eventTime').value = '19:00'; // Время по умолчанию
            
            // Добавляем текущего пользователя как участника по умолчанию
            this.selectedParticipants = [{
                userId: user.uid,
                userName: user.displayName || user.email,
                instrument: '',
                instrumentName: ''
            }];
        }
        
        this.renderParticipants();
    }
    
    attachEventListeners() {
        // Отправка формы
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
        
        // Поиск участников
        const searchInput = document.getElementById('participantSearch');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchParticipants(e.target.value);
            }, 300);
        });
    }
    
    async searchParticipants(query) {
        if (query.length < 2) {
            this.participantsList = [];
            return;
        }
        
        try {
            const user = getCurrentUser();
            if (!user || !user.branchId) {
                logger.warn('Пользователь не авторизован или не выбран филиал');
                return;
            }
            
            // Ищем пользователей в том же филиале
            const usersRef = db.collection('users');
            const snapshot = await usersRef
                .where('branchId', '==', user.branchId)
                .where('status', '==', 'active')
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                const userData = doc.data();
                const name = userData.name || userData.displayName || userData.email || '';
                
                // Фильтруем по запросу
                if (name.toLowerCase().includes(query.toLowerCase())) {
                    users.push({
                        id: doc.id,
                        name: name,
                        email: userData.email
                    });
                }
            });
            
            this.participantsList = users;
            this.renderSearchResults();
        } catch (error) {
            logger.error('Ошибка поиска участников:', error);
        }
    }
    
    renderSearchResults() {
        const container = document.getElementById('participantsList');
        
        if (this.participantsList.length === 0) {
            container.innerHTML = '<div class="no-results">Участники не найдены</div>';
            return;
        }
        
        container.innerHTML = this.participantsList.map(user => `
            <div class="participant-item" onclick="window.eventModal.addParticipant('${user.id}')">
                <span>${user.name || user.email}</span>
                <button type="button" class="btn-add">+</button>
            </div>
        `).join('');
    }
    
    addParticipant(userId) {
        const user = this.participantsList.find(u => u.id === userId);
        if (!user) return;
        
        // Проверяем что участник еще не добавлен
        if (this.selectedParticipants.find(p => p.userId === userId)) {
            alert('Участник уже добавлен');
            return;
        }
        
        this.selectedParticipants.push({
            userId: user.id,
            userName: user.name || user.email,
            instrument: '',
            instrumentName: ''
        });
        
        this.renderParticipants();
        document.getElementById('participantSearch').value = '';
        document.getElementById('participantsList').innerHTML = '';
    }
    
    renderParticipants() {
        const container = document.createElement('div');
        container.className = 'selected-participants';
        
        container.innerHTML = `
            <h4>Выбранные участники:</h4>
            ${this.selectedParticipants.map((p, index) => `
                <div class="selected-participant">
                    <span>${p.userName}</span>
                    <select onchange="window.eventModal.updateInstrument(${index}, this.value)">
                        <option value="">Выберите инструмент</option>
                        <option value="vocals" ${p.instrument === 'vocals' ? 'selected' : ''}>Вокал</option>
                        <option value="guitar" ${p.instrument === 'guitar' ? 'selected' : ''}>Гитара</option>
                        <option value="bass" ${p.instrument === 'bass' ? 'selected' : ''}>Бас-гитара</option>
                        <option value="keys" ${p.instrument === 'keys' ? 'selected' : ''}>Клавиши</option>
                        <option value="drums" ${p.instrument === 'drums' ? 'selected' : ''}>Барабаны</option>
                        <option value="sound" ${p.instrument === 'sound' ? 'selected' : ''}>Звукооператор</option>
                    </select>
                    <button type="button" onclick="window.eventModal.removeParticipant(${index})">×</button>
                </div>
            `).join('')}
        `;
        
        // Вставляем перед поиском
        const searchSection = document.querySelector('.participant-search');
        searchSection.parentNode.insertBefore(container, searchSection);
        
        // Удаляем старый список если есть
        const oldList = document.querySelector('.selected-participants');
        if (oldList && oldList !== container) {
            oldList.remove();
        }
    }
    
    updateInstrument(index, instrument) {
        const instrumentNames = {
            'vocals': 'Вокал',
            'guitar': 'Гитара',
            'bass': 'Бас-гитара',
            'keys': 'Клавиши',
            'drums': 'Барабаны',
            'sound': 'Звукооператор'
        };
        
        this.selectedParticipants[index].instrument = instrument;
        this.selectedParticipants[index].instrumentName = instrumentNames[instrument] || '';
    }
    
    removeParticipant(index) {
        this.selectedParticipants.splice(index, 1);
        this.renderParticipants();
    }
    
    async handleSave() {
        const user = getCurrentUser();
        
        const eventData = {
            name: document.getElementById('eventName').value,
            date: new Date(`${document.getElementById('eventDate').value}T${document.getElementById('eventTime').value}`),
            comment: document.getElementById('eventComment').value,
            participants: this.selectedParticipants,
            participantCount: this.selectedParticipants.length,
            branchId: user.branchId,
            leaderId: user.uid,
            leaderName: user.displayName || user.email
        };
        
        try {
            if (this.event) {
                await updateEvent(this.event.id, eventData);
                logger.log('✅ Событие обновлено');
            } else {
                await createEvent(eventData);
                logger.log('✅ Событие создано');
            }
            
            this.close();
            
            if (this.onSave) {
                this.onSave(eventData);
            }
        } catch (error) {
            logger.error('Ошибка сохранения события:', error);
            alert('Ошибка сохранения события: ' + error.message);
        }
    }
    
    showModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        document.body.style.overflow = '';
        window.eventModal = null;
    }
}

export default EventModal;