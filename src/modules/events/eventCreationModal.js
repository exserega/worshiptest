/**
 * @fileoverview Модальное окно создания события
 * @module EventCreationModal
 */

import logger from '../../utils/logger.js';
import { createEvent, updateEvent } from './eventsApi.js';
import { getCurrentUser } from '../auth/authCheck.js';
import { db } from '../../utils/firebase-v8-adapter.js';

class EventCreationModal {
    constructor() {
        this.modal = null;
        this.selectedDate = new Date();
        this.selectedParticipants = {};
        this.onSuccess = null;
        this.editMode = false;
        this.editingEventId = null;
        this.editingEventData = null;
    }
    
    async open(dateOrEvent = new Date(), onSuccess = null) {
        // Определяем режим работы
        if (dateOrEvent && typeof dateOrEvent === 'object' && dateOrEvent.id) {
            // Режим редактирования
            this.editMode = true;
            this.editingEventId = dateOrEvent.id;
            this.editingEventData = dateOrEvent;
            this.selectedDate = dateOrEvent.date instanceof Date ? dateOrEvent.date : new Date(dateOrEvent.date);
        } else {
            // Режим создания
            this.editMode = false;
            this.editingEventId = null;
            this.editingEventData = null;
            this.selectedDate = dateOrEvent instanceof Date ? dateOrEvent : new Date(dateOrEvent);
        }
        
        this.onSuccess = onSuccess;
        
        // Создаем модальное окно
        this.createModal();
        
        // Загружаем данные
        await this.loadData();
        
        // Если режим редактирования, заполняем форму
        if (this.editMode) {
            await this.fillFormWithEventData();
        }
        
        // Показываем модальное окно
        this.show();
    }
    
    createModal() {
        // Удаляем старое если есть
        if (this.modal) {
            this.modal.remove();
        }
        
        const modalHTML = `
            <div class="event-creation-modal" id="eventCreationModal">
                <div class="modal-overlay" onclick="eventCreationModal.close()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${this.editMode ? 'Редактировать событие' : 'Создать событие'}</h2>
                        <button class="close-btn" onclick="eventCreationModal.close()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Название события -->
                        <div class="form-group">
                            <label>Название события</label>
                            <select id="eventNamePreset" class="form-control" onchange="eventCreationModal.updateEventName()">
                                <option value="">Выберите или введите название</option>
                                <option value="Молодёжная молитва">Молодёжная молитва в четверг в 19:00</option>
                                <option value="Воскресное служение">Воскресное служение в воскресенье в 8:00</option>
                                <option value="Молодёжное служение">Молодёжное служение в воскресенье в 13:30</option>
                                <option value="custom">Другое...</option>
                            </select>
                            <input type="text" id="eventNameCustom" class="form-control" placeholder="Введите название" style="display:none; margin-top: 0.5rem;">
                        </div>
                        
                        <!-- Дата и время -->
                        <div class="form-row">
                            <div class="form-group">
                                <label>Дата</label>
                                <input type="date" id="eventDate" class="form-control" value="${this.selectedDate.toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Время</label>
                                <input type="time" id="eventTime" class="form-control" value="19:00">
                            </div>
                        </div>
                        
                        <!-- Ведущий -->
                        <div class="form-group">
                            <label>Ведущий прославления</label>
                            <select id="eventLeader" class="form-control">
                                <option value="">Выберите ведущего</option>
                            </select>
                        </div>
                        
                        <!-- Сетлист -->
                        <div class="form-group">
                            <label>Список песен</label>
                            <select id="eventSetlist" class="form-control">
                                <option value="">Выберите сетлист</option>
                            </select>
                        </div>
                        
                        <!-- Участники -->
                        <div class="form-group">
                            <label>Участники</label>
                            <div class="participants-section">
                                <div class="instrument-groups">
                                    ${this.createInstrumentGroups()}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Комментарий -->
                        <div class="form-group">
                            <label>Комментарий (необязательно)</label>
                            <textarea id="eventComment" class="form-control" rows="2"></textarea>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="eventCreationModal.close()">Отмена</button>
                        <button class="btn btn-primary" onclick="eventCreationModal.save()">${this.editMode ? 'Сохранить изменения' : 'Создать событие'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('eventCreationModal');
        
        // Делаем доступным глобально
        window.eventCreationModal = this;
    }
    
    createInstrumentGroups() {
        const instruments = [
            { id: 'vocals', name: 'Вокал', icon: '🎤' },
            { id: 'acoustic_guitar', name: 'Акустическая гитара', icon: '🎸' },
            { id: 'electric_guitar', name: 'Электрогитара', icon: '🎸' },
            { id: 'bass', name: 'Бас-гитара', icon: '🎸' },
            { id: 'keys', name: 'Клавиши', icon: '🎹' },
            { id: 'drums', name: 'Барабаны', icon: '🥁' },
            { id: 'cajon', name: 'Кахон', icon: '🪘' },
            { id: 'sound', name: 'Звукооператор', icon: '🎛️' },
            { id: 'other', name: 'Другое', icon: '🎵' }
        ];
        
        return instruments.map(inst => `
            <div class="instrument-group">
                <div class="instrument-header">
                    <span>${inst.icon} ${inst.name}</span>
                    <button type="button" class="add-participant-btn" onclick="eventCreationModal.showParticipantSelector('${inst.id}')">+</button>
                </div>
                <div class="instrument-participants" id="participants-${inst.id}"></div>
            </div>
        `).join('');
    }
    
    async loadData() {
        const user = getCurrentUser();
        if (!user || !user.branchId) {
            logger.error('Пользователь не авторизован или не выбран филиал');
            return;
        }
        
        try {
            // Загружаем пользователей филиала
            const usersSnapshot = await db.collection('users')
                .where('branchId', '==', user.branchId)
                .where('status', '==', 'active')
                .get();
            
            const users = [];
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    name: userData.name || userData.displayName || userData.email
                });
            });
            
            // Заполняем селект ведущих
            const leaderSelect = document.getElementById('eventLeader');
            users.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = u.name;
                leaderSelect.appendChild(option);
            });
            
            // Сохраняем для выбора участников
            this.availableUsers = users;
            
            // Загружаем сетлисты
            const setlistsSnapshot = await db.collection('worship_setlists')
                .where('branchId', '==', user.branchId)
                .get();
            
            const setlistSelect = document.getElementById('eventSetlist');
            const setlists = [];
            setlistsSnapshot.forEach(doc => {
                const setlist = doc.data();
                setlists.push({
                    id: doc.id,
                    name: setlist.name || 'Без названия'
                });
            });
            
            // Сортируем в памяти
            setlists.sort((a, b) => a.name.localeCompare(b.name));
            
            // Добавляем в селект
            setlists.forEach(setlist => {
                const option = document.createElement('option');
                option.value = setlist.id;
                option.textContent = setlist.name;
                setlistSelect.appendChild(option);
            });
            
        } catch (error) {
            logger.error('Ошибка загрузки данных:', error);
        }
    }
    
    async fillFormWithEventData() {
        if (!this.editingEventData) return;
        
        const data = this.editingEventData;
        
        // Заполняем название события
        const nameInput = document.getElementById('eventName');
        if (nameInput) nameInput.value = data.name || '';
        
        // Заполняем дату
        const dateInput = document.getElementById('eventDate');
        if (dateInput) {
            const date = data.date instanceof Date ? data.date : new Date(data.date);
            dateInput.value = date.toISOString().split('T')[0];
        }
        
        // Заполняем время
        const timeInput = document.getElementById('eventTime');
        if (timeInput) timeInput.value = data.time || '';
        
        // Заполняем ведущего
        const leaderSelect = document.getElementById('eventLeader');
        if (leaderSelect && data.leaderId) {
            leaderSelect.value = data.leaderId;
        }
        
        // Заполняем сетлист
        const setlistSelect = document.getElementById('eventSetlist');
        if (setlistSelect && data.setlistId) {
            setlistSelect.value = data.setlistId;
        }
        
        // Заполняем комментарий
        const commentTextarea = document.getElementById('eventComment');
        if (commentTextarea) commentTextarea.value = data.comment || '';
        
        // Заполняем участников
        if (data.participants && typeof data.participants === 'object') {
            // Очищаем текущих участников
            this.selectedParticipants = {};
            
            // Преобразуем объект участников в нужный формат
            Object.entries(data.participants).forEach(([key, participant]) => {
                const instrumentId = participant.instrument || key.split('_')[0];
                
                if (!this.selectedParticipants[instrumentId]) {
                    this.selectedParticipants[instrumentId] = [];
                }
                
                this.selectedParticipants[instrumentId].push({
                    userId: participant.userId || participant.id,
                    userName: participant.userName || participant.name
                });
            });
            
            // Обновляем UI для каждого инструмента
            Object.keys(this.selectedParticipants).forEach(instrumentId => {
                this.updateParticipantsList(instrumentId);
            });
        }
    }
    
    updateEventName() {
        const preset = document.getElementById('eventNamePreset');
        const custom = document.getElementById('eventNameCustom');
        
        if (preset.value === 'custom') {
            custom.style.display = 'block';
            custom.focus();
        } else {
            custom.style.display = 'none';
            custom.value = '';
        }
        
        // Автоматически подставляем время для пресетов
        if (preset.value === 'Молодёжная молитва') {
            document.getElementById('eventTime').value = '19:00';
        } else if (preset.value === 'Воскресное служение') {
            document.getElementById('eventTime').value = '08:00';
        } else if (preset.value === 'Молодёжное служение') {
            document.getElementById('eventTime').value = '13:30';
        }
    }
    
    showParticipantSelector(instrumentId) {
        // Создаем селектор участников
        const selector = document.createElement('div');
        selector.className = 'participant-selector';
        selector.innerHTML = `
            <div class="selector-content">
                <button class="selector-close-btn" onclick="this.closest('.participant-selector').remove()">×</button>
                <div class="user-list">
                    ${this.availableUsers.map(u => `
                        <div class="user-item" onclick="eventCreationModal.addParticipant('${instrumentId}', '${u.id}', '${u.name.replace(/'/g, "\\'")}')">
                            ${u.name}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(selector);
    }
    
    addParticipant(instrumentId, userId, userName) {
        // Проверяем что участник еще не добавлен к этому инструменту
        if (!this.selectedParticipants[instrumentId]) {
            this.selectedParticipants[instrumentId] = [];
        }
        
        if (this.selectedParticipants[instrumentId].find(p => p.userId === userId)) {
            alert('Участник уже добавлен к этому инструменту');
            return;
        }
        
        // Добавляем участника
        this.selectedParticipants[instrumentId].push({
            userId,
            userName,
            instrument: instrumentId,
            instrumentName: this.getInstrumentName(instrumentId)
        });
        
        // Обновляем UI
        this.updateParticipantsList(instrumentId);
        
        // Закрываем селектор
        document.querySelector('.participant-selector')?.remove();
    }
    
    getInstrumentName(instrumentId) {
        const names = {
            'vocals': 'Вокал',
            'acoustic_guitar': 'Акустическая гитара',
            'electric_guitar': 'Электрогитара',
            'bass': 'Бас-гитара',
            'keys': 'Клавиши',
            'drums': 'Барабаны',
            'cajon': 'Кахон',
            'sound': 'Звукооператор',
            'other': 'Другое'
        };
        return names[instrumentId] || instrumentId;
    }
    
    updateParticipantsList(instrumentId) {
        const container = document.getElementById(`participants-${instrumentId}`);
        const participants = this.selectedParticipants[instrumentId] || [];
        
        container.innerHTML = participants.map((p, index) => `
            <div class="participant-chip">
                ${p.userName}
                <button onclick="eventCreationModal.removeParticipant('${instrumentId}', ${index})">×</button>
            </div>
        `).join('');
    }
    
    removeParticipant(instrumentId, index) {
        this.selectedParticipants[instrumentId].splice(index, 1);
        this.updateParticipantsList(instrumentId);
    }
    
    async save() {
        try {
            const preset = document.getElementById('eventNamePreset').value;
            const customName = document.getElementById('eventNameCustom').value;
            const eventName = preset === 'custom' ? customName : preset;
            
            if (!eventName) {
                alert('Введите название события');
                return;
            }
            
            const eventDate = document.getElementById('eventDate').value;
            const eventTime = document.getElementById('eventTime').value;
            const leaderId = document.getElementById('eventLeader').value;
            const setlistId = document.getElementById('eventSetlist').value;
            const comment = document.getElementById('eventComment').value;
            
            if (!eventDate || !eventTime) {
                alert('Укажите дату и время события');
                return;
            }
            
            // Получаем текущего пользователя
            const user = getCurrentUser();
            
            // Собираем всех участников в правильном формате для Firebase
            const participantsObject = {};
            let participantIndex = 0;
            
            Object.values(this.selectedParticipants).forEach(group => {
                group.forEach(participant => {
                    // Используем уникальный ключ для каждого участника
                    const key = `${participant.userId}_${participant.instrument}_${participantIndex}`;
                    participantsObject[key] = {
                        userId: participant.userId,
                        userName: participant.userName,
                        instrument: participant.instrument,
                        instrumentName: participant.instrumentName
                    };
                    participantIndex++;
                });
            });
            
            // Если нет участников, добавляем создателя как участника
            if (Object.keys(participantsObject).length === 0) {
                participantsObject[user.uid] = {
                    userId: user.uid,
                    userName: user.displayName || user.email,
                    instrument: '',
                    instrumentName: ''
                };
            }
            
            // Добавляем отладочную информацию
            logger.log('📋 Выбранные участники:', this.selectedParticipants);
            logger.log('👥 Участники для сохранения:', participantsObject);
            
            const eventData = {
                name: eventName,
                date: new Date(`${eventDate}T${eventTime}`),
                leaderId: leaderId || user.uid,
                leaderName: leaderId ? this.availableUsers.find(u => u.id === leaderId)?.name : user.displayName || user.email,
                setlistId: setlistId || '',
                participants: participantsObject, // Firebase хранит как объект
                participantCount: Object.keys(participantsObject).length,
                comment: comment || '',
                branchId: user.branchId,
                createdBy: user.uid,
                isArchived: false
            };
            
            logger.log('💾 Создание события:', eventData);
            
            // Показываем индикатор загрузки
            const saveBtn = this.modal.querySelector('.btn-primary');
            saveBtn.disabled = true;
            saveBtn.textContent = this.editMode ? 'Сохранение...' : 'Создание...';
            
            let eventId;
            if (this.editMode) {
                // Обновляем существующее событие
                await updateEvent(this.editingEventId, eventData);
                eventId = this.editingEventId;
                logger.log('✅ Событие обновлено:', eventId);
            } else {
                // Создаем новое событие
                eventId = await createEvent(eventData);
                logger.log('✅ Событие создано:', eventId);
            }
            
            // Закрываем модальное окно
            this.close();
            
            // Вызываем callback
            if (this.onSuccess) {
                this.onSuccess(eventId);
            }
            
        } catch (error) {
            logger.error('Ошибка создания события:', error);
            alert('Ошибка при создании события: ' + error.message);
            
            // Восстанавливаем кнопку
            const saveBtn = this.modal.querySelector('.btn-primary');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Создать событие';
        }
    }
    
    show() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        document.body.style.overflow = '';
        window.eventCreationModal = null;
    }
}

// Экспортируем функцию для открытия модального окна
export function openEventCreationModal(date, onSuccess) {
    const modal = new EventCreationModal();
    modal.open(date, onSuccess);
}

export default EventCreationModal;