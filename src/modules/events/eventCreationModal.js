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
            
            // Обработка даты из Firestore
            let eventDate;
            if (dateOrEvent.date) {
                if (dateOrEvent.date instanceof Date) {
                    eventDate = dateOrEvent.date;
                } else if (dateOrEvent.date.toDate && typeof dateOrEvent.date.toDate === 'function') {
                    // Firestore Timestamp
                    eventDate = dateOrEvent.date.toDate();
                } else if (dateOrEvent.date.seconds) {
                    // Firestore Timestamp as plain object
                    eventDate = new Date(dateOrEvent.date.seconds * 1000);
                } else {
                    eventDate = new Date(dateOrEvent.date);
                }
            } else {
                eventDate = new Date();
            }
            
            // Проверяем валидность даты
            if (isNaN(eventDate.getTime())) {
                console.error('Invalid date:', dateOrEvent.date);
                eventDate = new Date();
            }
            
            this.selectedDate = eventDate;
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
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${this.editMode ? 'Редактировать событие' : 'Создать событие'}</h2>
                        <button class="close-btn" data-action="close" aria-label="Закрыть">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Название события -->
                        <div class="form-group">
                            <label for="eventNamePreset">Название события</label>
                            <select id="eventNamePreset" class="form-control">
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
                                <label for="eventDate">Дата</label>
                                <input type="date" id="eventDate" class="form-control" value="${this.selectedDate && !isNaN(this.selectedDate.getTime()) ? this.selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                            </div>
                            <div class="form-group">
                                <label for="eventTime">Время</label>
                                <input type="time" id="eventTime" class="form-control" value="19:00" required>
                            </div>
                        </div>
                        
                        <!-- Ведущий -->
                        <div class="form-group">
                            <label for="eventLeader">Ведущий прославления</label>
                            <div class="leader-selector-wrapper">
                                <input type="text" 
                                       id="eventLeaderInput" 
                                       class="form-control" 
                                       placeholder="Введите имя ведущего"
                                       autocomplete="off">
                                <input type="hidden" id="eventLeader" value="">
                                <button type="button" class="leader-select-btn" data-action="open-leader-selector" aria-label="Выбрать ведущего">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                <div id="leaderDropdown" class="leader-dropdown"></div>
                            </div>
                        </div>
                        
                        <!-- Сетлист -->
                        <div class="form-group">
                            <label for="eventSetlist">Список песен</label>
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
                            <label for="eventComment">Комментарий <span style="font-weight: 400; opacity: 0.7;">(необязательно)</span></label>
                            <textarea id="eventComment" class="form-control" rows="2" placeholder="Дополнительная информация о событии"></textarea>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-action="cancel">Отмена</button>
                        <button class="btn btn-primary" data-action="save">${this.editMode ? 'Сохранить' : 'Создать событие'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('eventCreationModal');
        
        // Привязываем обработчики событий
        this.attachModalEventHandlers();
        
        // Делаем доступным глобально
        window.eventCreationModal = this;
    }
    
    attachModalEventHandlers() {
        // Обработчики закрытия
        const overlay = this.modal.querySelector('.modal-overlay');
        const closeBtn = this.modal.querySelector('[data-action="close"]');
        const cancelBtn = this.modal.querySelector('[data-action="cancel"]');
        const saveBtn = this.modal.querySelector('[data-action="save"]');
        
        overlay.addEventListener('click', () => this.close());
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        saveBtn.addEventListener('click', () => this.save());
        
        // Обработчик изменения названия события
        const namePreset = document.getElementById('eventNamePreset');
        namePreset.addEventListener('change', () => this.updateEventName());
        
        // Обработчик кнопки выбора ведущего
        const leaderSelectBtn = this.modal.querySelector('[data-action="open-leader-selector"]');
        if (leaderSelectBtn) {
            leaderSelectBtn.addEventListener('click', () => this.showLeaderSelector());
        }
        
        // Обработчики для кнопок добавления участников
        const addParticipantBtns = this.modal.querySelectorAll('.add-participant-btn');
        addParticipantBtns.forEach(btn => {
            const instrumentId = btn.dataset.instrument;
            btn.addEventListener('click', () => this.showParticipantSelector(instrumentId));
        });
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
                    <button type="button" class="add-participant-btn" data-instrument="${inst.id}" aria-label="Добавить участника">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
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
            
            // Сохраняем для выбора участников и ведущих
            this.availableUsers = users;
            
            // Инициализируем поле выбора ведущего
            this.initLeaderSelector();
            
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
        const namePreset = document.getElementById('eventNamePreset');
        const nameCustom = document.getElementById('eventNameCustom');
        
        if (namePreset && data.name) {
            // Проверяем, есть ли название в списке предустановленных
            const presetOptions = ['Молодёжная молитва', 'Воскресное служение', 'Молодёжное служение'];
            
            if (presetOptions.includes(data.name)) {
                namePreset.value = data.name;
            } else {
                // Если название не из списка, используем custom
                namePreset.value = 'custom';
                if (nameCustom) {
                    nameCustom.style.display = 'block';
                    nameCustom.value = data.name;
                }
            }
        }
        
        // Заполняем дату
        const dateInput = document.getElementById('eventDate');
        if (dateInput && data.date) {
            let date;
            if (data.date instanceof Date) {
                date = data.date;
            } else if (data.date.toDate && typeof data.date.toDate === 'function') {
                // Firestore Timestamp
                date = data.date.toDate();
            } else if (data.date.seconds) {
                // Firestore Timestamp as plain object
                date = new Date(data.date.seconds * 1000);
            } else {
                date = new Date(data.date);
            }
            
            // Проверяем валидность даты
            if (!isNaN(date.getTime())) {
                dateInput.value = date.toISOString().split('T')[0];
            }
        }
        
        // Заполняем время
        const timeInput = document.getElementById('eventTime');
        if (timeInput) {
            if (data.time) {
                // Если время сохранено отдельно
                timeInput.value = data.time;
            } else if (data.date) {
                // Пытаемся извлечь время из даты
                let date;
                if (data.date instanceof Date) {
                    date = data.date;
                } else if (data.date.toDate && typeof data.date.toDate === 'function') {
                    date = data.date.toDate();
                } else if (data.date.seconds) {
                    date = new Date(data.date.seconds * 1000);
                } else {
                    date = new Date(data.date);
                }
                
                if (!isNaN(date.getTime())) {
                    // Форматируем время в HH:MM
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    timeInput.value = `${hours}:${minutes}`;
                }
            }
        }
        
        // Заполняем ведущего
        const leaderInput = document.getElementById('eventLeaderInput');
        const leaderHidden = document.getElementById('eventLeader');
        if (leaderInput && data.leaderId) {
            // Находим имя ведущего
            const leader = this.availableUsers.find(u => u.id === data.leaderId);
            if (leader) {
                leaderInput.value = leader.name;
                leaderHidden.value = data.leaderId;
            } else if (data.leaderName) {
                // Если ведущий не найден среди пользователей, но есть имя
                leaderInput.value = data.leaderName;
                leaderHidden.value = data.leaderId;
            }
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
                    userName: participant.userName || participant.name,
                    instrument: instrumentId,
                    instrumentName: participant.instrumentName || this.getInstrumentName(instrumentId)
                });
            });
            
            // Обновляем UI для каждого инструмента
            Object.keys(this.selectedParticipants).forEach(instrumentId => {
                this.renderSelectedParticipant(instrumentId);
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
    
    initLeaderSelector() {
        const input = document.getElementById('eventLeaderInput');
        const dropdown = document.getElementById('leaderDropdown');
        const hiddenInput = document.getElementById('eventLeader');
        
        if (!input || !dropdown) return;
        
        // Обработчик ввода
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length === 0) {
                dropdown.style.display = 'none';
                hiddenInput.value = '';
                return;
            }
            
            // Фильтруем пользователей
            const filtered = this.availableUsers.filter(user => 
                user.name.toLowerCase().includes(query)
            );
            
            // Показываем результаты
            this.showLeaderDropdown(filtered, query);
        });
        
        // Обработчик фокуса
        input.addEventListener('focus', () => {
            if (input.value.trim().length > 0) {
                const query = input.value.toLowerCase().trim();
                const filtered = this.availableUsers.filter(user => 
                    user.name.toLowerCase().includes(query)
                );
                this.showLeaderDropdown(filtered, query);
            }
        });
        
        // Закрытие при клике вне
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.leader-selector-wrapper')) {
                dropdown.style.display = 'none';
            }
        });
        
        // Обработка клавиш
        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.leader-item');
            const activeItem = dropdown.querySelector('.leader-item.active');
            let index = Array.from(items).indexOf(activeItem);
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (index < items.length - 1) index++;
                else index = 0;
                this.setActiveLeaderItem(items[index]);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (index > 0) index--;
                else index = items.length - 1;
                this.setActiveLeaderItem(items[index]);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeItem) {
                    activeItem.click();
                } else if (items.length === 1) {
                    items[0].click();
                } else if (input.value.trim()) {
                    // Создаем нового пользователя
                    this.selectLeader(null, input.value.trim());
                }
            } else if (e.key === 'Escape') {
                dropdown.style.display = 'none';
            }
        });
    }
    
    showLeaderDropdown(users, query) {
        const dropdown = document.getElementById('leaderDropdown');
        
        // Очищаем dropdown
        dropdown.innerHTML = '';
        
        // Добавляем существующих пользователей
        users.forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'leader-item';
            if (index === 0) item.classList.add('active');
            item.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem; opacity: 0.5;">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${this.highlightMatch(user.name, query)}
            `;
            item.onclick = () => this.selectLeader(user.id, user.name);
            dropdown.appendChild(item);
        });
        
        // Если нет точного совпадения, показываем опцию создания
        const exactMatch = users.some(u => u.name.toLowerCase() === query);
        if (!exactMatch && query.length > 0) {
            const createItem = document.createElement('div');
            createItem.className = 'leader-item create-new';
            if (users.length === 0) createItem.classList.add('active');
            createItem.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem;">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Создать: <strong>${query}</strong>
            `;
            createItem.onclick = () => this.selectLeader(null, query);
            dropdown.appendChild(createItem);
        }
        
        // Показываем dropdown
        dropdown.style.display = users.length > 0 || query.length > 0 ? 'block' : 'none';
    }
    
    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
    
    setActiveLeaderItem(item) {
        const dropdown = document.getElementById('leaderDropdown');
        dropdown.querySelectorAll('.leader-item').forEach(el => el.classList.remove('active'));
        if (item) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        }
    }
    
    selectLeader(userId, userName) {
        const input = document.getElementById('eventLeaderInput');
        const hiddenInput = document.getElementById('eventLeader');
        const dropdown = document.getElementById('leaderDropdown');
        
        // Заполняем поля
        input.value = userName;
        hiddenInput.value = userId || `new:${userName}`;
        
        // Закрываем dropdown если он открыт
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        logger.log(`✅ Выбран ведущий: ${userName} (${userId || 'новый'})`);
    }
    
    showParticipantSelector(instrumentId) {
        // Создаем селектор участников
        const selector = document.createElement('div');
        selector.className = 'participant-selector';
        selector.dataset.instrumentId = instrumentId;
        
        selector.innerHTML = `
            <div class="selector-content">
                <div class="selector-header">
                    <h3>Добавить участника</h3>
                    <button class="selector-close-btn" data-action="close-selector" aria-label="Закрыть">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="custom-participant-input">
                    <input type="text" 
                           id="participantSearchInput" 
                           placeholder="Введите имя для поиска или создания" 
                           class="form-control"
                           autocomplete="off">
                </div>
                <div class="user-list" id="participantsList">
                    ${this.renderParticipantsList(this.availableUsers, '', instrumentId)}
                </div>
            </div>
        `;
        
        document.body.appendChild(selector);
        
        // Привязываем обработчики
        const closeBtn = selector.querySelector('[data-action="close-selector"]');
        closeBtn.addEventListener('click', () => selector.remove());
        
        // Инициализируем поиск
        this.initParticipantSearch(selector, instrumentId);
        
        // Привязываем обработчики для элементов списка
        this.attachParticipantListHandlers(selector, instrumentId);
        
        // Фокус на поле ввода
        setTimeout(() => {
            document.getElementById('participantSearchInput')?.focus();
        }, 100);
    }
    
    attachParticipantListHandlers(selector, instrumentId) {
        const list = selector.querySelector('#participantsList');
        
        // Делегирование событий для динамического списка
        list.addEventListener('click', (e) => {
            const userItem = e.target.closest('.user-item');
            if (!userItem) return;
            
            if (userItem.classList.contains('create-new')) {
                const query = userItem.dataset.query;
                this.addCustomParticipant(instrumentId, query);
            } else {
                const userId = userItem.dataset.userId;
                const userName = userItem.dataset.userName;
                this.addParticipant(instrumentId, userId, userName);
            }
            
            // Закрываем селектор
            selector.remove();
        });
    }
    
    renderParticipantsList(users, query, instrumentId) {
        if (users.length === 0 && !query) {
            return '<div class="empty-state">Нет доступных участников</div>';
        }
        
        let html = '';
        
        // Показываем отфильтрованных пользователей
        users.forEach((user, index) => {
            html += `
                <div class="user-item" data-user-id="${user.id}" data-user-name="${user.name}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem; opacity: 0.5;">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${query ? this.highlightMatch(user.name, query) : user.name}
                </div>
            `;
        });
        
        // Если есть запрос и нет точного совпадения, показываем опцию создания
        if (query) {
            const exactMatch = users.some(u => u.name.toLowerCase() === query.toLowerCase());
            if (!exactMatch) {
                html = `
                    <div class="user-item create-new" data-query="${query}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem;">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Создать: <strong>${query}</strong>
                    </div>
                ` + html;
            }
        }
        
        return html || '<div class="empty-state">Не найдено участников</div>';
    }
    
    initParticipantSearch(selector, instrumentId) {
        const input = selector.querySelector('#participantSearchInput');
        const list = selector.querySelector('#participantsList');
        
        if (!input || !list) return;
        
        // Обработчик фокуса для мобильных устройств
        if (window.innerWidth <= 480) {
            input.addEventListener('focus', () => {
                const participantSelector = document.querySelector('.participant-selector');
                if (participantSelector) {
                    participantSelector.classList.add('keyboard-open');
                }
            });
            
            input.addEventListener('blur', () => {
                const participantSelector = document.querySelector('.participant-selector');
                if (participantSelector) {
                    // Небольшая задержка чтобы успеть кликнуть по элементу списка
                    setTimeout(() => {
                        participantSelector.classList.remove('keyboard-open');
                    }, 200);
                }
            });
        }
        
        // Обработчик ввода
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length === 0) {
                list.innerHTML = this.renderParticipantsList(this.availableUsers, '', instrumentId);
            } else {
                // Фильтруем пользователей
                const filtered = this.availableUsers.filter(user => 
                    user.name.toLowerCase().includes(query)
                );
                
                // Обновляем список
                list.innerHTML = this.renderParticipantsList(filtered, query, instrumentId);
            }
        });
        
        // Обработка клавиш
        input.addEventListener('keydown', (e) => {
            const items = list.querySelectorAll('.user-item');
            const activeItem = list.querySelector('.user-item.active');
            let index = Array.from(items).indexOf(activeItem);
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (index < items.length - 1) index++;
                else index = 0;
                this.setActiveParticipantItem(items[index]);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (index > 0) index--;
                else index = items.length - 1;
                this.setActiveParticipantItem(items[index]);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeItem) {
                    activeItem.click();
                } else if (items.length === 1) {
                    items[0].click();
                } else if (input.value.trim()) {
                    // Создаем нового участника
                    this.addCustomParticipant(instrumentId, input.value.trim());
                    selector.remove();
                }
            } else if (e.key === 'Escape') {
                selector.remove();
            }
        });
    }
    
    setActiveParticipantItem(item) {
        const list = item?.closest('.user-list');
        if (!list) return;
        
        list.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
        if (item) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        }
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
        this.renderSelectedParticipant(instrumentId);
        
        // Закрываем селектор
        document.querySelector('.participant-selector')?.remove();
    }
    
    addCustomParticipant(instrumentId, name = null) {
        if (!name) {
            const input = document.getElementById('participantSearchInput') || document.getElementById('customParticipantName');
            name = input?.value.trim();
        }
        
        if (!name) {
            alert('Введите имя участника');
            return;
        }
        
        // Генерируем уникальный ID для кастомного участника
        const customId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Добавляем участника
        this.addParticipant(instrumentId, customId, name);
        
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
    
    renderSelectedParticipant(instrumentId) {
        const container = document.getElementById(`participants-${instrumentId}`);
        if (!container) return;
        
        const participants = this.selectedParticipants[instrumentId] || [];
        
        container.innerHTML = participants.map((p, index) => `
            <div class="participant-chip">
                ${p.userName}
                <button data-action="remove-participant" data-instrument="${instrumentId}" data-index="${index}" title="Удалить участника">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `).join('');
        
        // Привязываем обработчики для удаления
        container.querySelectorAll('[data-action="remove-participant"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const instrumentId = btn.dataset.instrument;
                const index = parseInt(btn.dataset.index);
                this.removeParticipant(instrumentId, index);
            });
        });
    }
    
    removeParticipant(instrumentId, index) {
        this.selectedParticipants[instrumentId].splice(index, 1);
        this.renderSelectedParticipant(instrumentId);
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
            const leaderValue = document.getElementById('eventLeader').value;
            const leaderName = document.getElementById('eventLeaderInput').value;
            const setlistId = document.getElementById('eventSetlist').value;
            const comment = document.getElementById('eventComment').value;
            
            // Обрабатываем ведущего
            let leaderId = null;
            let leaderData = null;
            if (leaderValue) {
                if (leaderValue.startsWith('new:')) {
                    // Новый ведущий - будет создан как участник
                    leaderId = 'custom_leader_' + Date.now();
                    leaderData = { name: leaderName };
                } else {
                    leaderId = leaderValue;
                }
            }
            
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

    showLeaderSelector() {
        // Создаем селектор ведущего (аналогично селектору участников)
        const selector = document.createElement('div');
        selector.className = 'participant-selector'; // Используем те же стили
        selector.dataset.type = 'leader';
        
        selector.innerHTML = `
            <div class="selector-content">
                <div class="selector-header">
                    <h3>Выбрать ведущего</h3>
                    <button class="selector-close-btn" data-action="close-selector" aria-label="Закрыть">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="custom-participant-input">
                    <input type="text" 
                           id="leaderSearchInput" 
                           placeholder="Введите имя для поиска или создания" 
                           class="form-control"
                           autocomplete="off">
                </div>
                <div class="user-list" id="leadersList">
                    ${this.renderLeadersList(this.availableUsers, '')}
                </div>
            </div>
        `;
        
        document.body.appendChild(selector);
        
        // Привязываем обработчики
        const closeBtn = selector.querySelector('[data-action="close-selector"]');
        closeBtn.addEventListener('click', () => selector.remove());
        
        // Инициализируем поиск
        this.initLeaderSearch(selector);
        
        // Привязываем обработчики для элементов списка
        this.attachLeaderListHandlers(selector);
        
        // Фокус на поле ввода
        setTimeout(() => {
            document.getElementById('leaderSearchInput')?.focus();
        }, 100);
    }
    
    renderLeadersList(users, query) {
        if (users.length === 0 && !query) {
            return '<div class="empty-state">Нет доступных пользователей</div>';
        }
        
        let html = '';
        
        // Показываем отфильтрованных пользователей
        users.forEach((user) => {
            html += `
                <div class="user-item" data-user-id="${user.id}" data-user-name="${user.name}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem; opacity: 0.5;">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${query ? this.highlightMatch(user.name, query) : user.name}
                </div>
            `;
        });
        
        // Если есть запрос и нет точного совпадения, показываем опцию создания
        if (query) {
            const exactMatch = users.some(u => u.name.toLowerCase() === query.toLowerCase());
            if (!exactMatch) {
                html = `
                    <div class="user-item create-new" data-query="${query}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem;">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Создать: <strong>${query}</strong>
                    </div>
                ` + html;
            }
        }
        
        return html || '<div class="empty-state">Не найдено пользователей</div>';
    }
    
    initLeaderSearch(selector) {
        const input = selector.querySelector('#leaderSearchInput');
        const list = selector.querySelector('#leadersList');
        
        if (!input || !list) return;
        
        // Обработчик фокуса для мобильных устройств
        if (window.innerWidth <= 480) {
            input.addEventListener('focus', () => {
                const participantSelector = document.querySelector('.participant-selector');
                if (participantSelector) {
                    participantSelector.classList.add('keyboard-open');
                }
            });
            
            input.addEventListener('blur', () => {
                const participantSelector = document.querySelector('.participant-selector');
                if (participantSelector) {
                    // Небольшая задержка чтобы успеть кликнуть по элементу списка
                    setTimeout(() => {
                        participantSelector.classList.remove('keyboard-open');
                    }, 200);
                }
            });
        }
        
        // Обработчик ввода
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length === 0) {
                list.innerHTML = this.renderLeadersList(this.availableUsers, '');
            } else {
                // Фильтруем пользователей
                const filtered = this.availableUsers.filter(user => 
                    user.name.toLowerCase().includes(query)
                );
                
                // Обновляем список
                list.innerHTML = this.renderLeadersList(filtered, query);
            }
        });
        
        // Обработка клавиш (как в селекторе участников)
        input.addEventListener('keydown', (e) => {
            const items = list.querySelectorAll('.user-item');
            const activeItem = list.querySelector('.user-item.active');
            let index = Array.from(items).indexOf(activeItem);
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (index < items.length - 1) index++;
                else index = 0;
                this.setActiveParticipantItem(items[index]);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (index > 0) index--;
                else index = items.length - 1;
                this.setActiveParticipantItem(items[index]);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeItem) {
                    activeItem.click();
                } else if (items.length === 1) {
                    items[0].click();
                } else if (input.value.trim()) {
                    // Создаем нового ведущего
                    this.selectLeader(null, input.value.trim());
                    selector.remove();
                }
            } else if (e.key === 'Escape') {
                selector.remove();
            }
        });
    }
    
    attachLeaderListHandlers(selector) {
        const list = selector.querySelector('#leadersList');
        
        // Делегирование событий для динамического списка
        list.addEventListener('click', (e) => {
            const userItem = e.target.closest('.user-item');
            if (!userItem) return;
            
            if (userItem.classList.contains('create-new')) {
                const query = userItem.dataset.query;
                this.selectLeader(null, query);
            } else {
                const userId = userItem.dataset.userId;
                const userName = userItem.dataset.userName;
                this.selectLeader(userId, userName);
            }
            
            // Закрываем селектор
            selector.remove();
        });
    }
}

// Экспортируем функцию для открытия модального окна
export function openEventCreationModal(date, onSuccess) {
    const modal = new EventCreationModal();
    modal.open(date, onSuccess);
}

export default EventCreationModal;