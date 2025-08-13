/**
 * @fileoverview Компонент выбора участников события
 * @module ParticipantsSelector
 */

import logger from '../../utils/logger.js';

/**
 * Предустановленные инструменты
 */
const INSTRUMENTS = [
    { id: 'vocals', name: 'Вокал', icon: '🎤' },
    { id: 'electric_guitar', name: 'Электрогитара', icon: '🎸' },
    { id: 'acoustic_guitar', name: 'Акустическая гитара', icon: '🎸' },
    { id: 'bass', name: 'Бас-гитара', icon: '🎸' },
    { id: 'keys', name: 'Клавиши', icon: '🎹' },
    { id: 'drums', name: 'Барабаны', icon: '🥁' },
    { id: 'other', name: 'Другое', icon: '🎵' }
];

/**
 * Класс для управления выбором участников
 */
export class ParticipantsSelector {
    constructor(container, users) {
        this.container = container;
        this.users = users; // Список пользователей филиала
        this.participants = [];
        this.onChange = null; // Callback при изменении
        
        this.init();
    }
    
    /**
     * Инициализация компонента
     */
    init() {
        this.render();
    }
    
    /**
     * Отрисовка компонента
     */
    render() {
        const html = `
            <div class="participants-selector">
                <h3 class="participants-title">Участники</h3>
                <div class="instruments-list">
                    ${INSTRUMENTS.map(instrument => this.renderInstrument(instrument)).join('')}
                </div>
                <button type="button" class="add-instrument-btn">
                    <i class="fas fa-plus"></i> Добавить инструмент
                </button>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachEventHandlers();
    }
    
    /**
     * Отрисовка блока инструмента
     */
    renderInstrument(instrument) {
        const participantsForInstrument = this.participants.filter(p => p.instrument === instrument.id);
        
        return `
            <div class="instrument-block" data-instrument="${instrument.id}">
                <div class="instrument-header">
                    <span class="instrument-icon">${instrument.icon}</span>
                    <span class="instrument-name">${instrument.name}:</span>
                </div>
                <div class="instrument-participants">
                    ${participantsForInstrument.map(p => `
                        <div class="participant-chip" data-user-id="${p.userId}">
                            <span>${p.userName}</span>
                            <button type="button" class="remove-participant" data-user-id="${p.userId}" data-instrument="${instrument.id}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                    <button type="button" class="add-participant-btn" data-instrument="${instrument.id}">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Привязка обработчиков событий
     */
    attachEventHandlers() {
        // Добавление участника
        const addButtons = this.container.querySelectorAll('.add-participant-btn');
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const instrumentId = btn.dataset.instrument;
                this.showUserSelector(instrumentId);
            });
        });
        
        // Удаление участника
        const removeButtons = this.container.querySelectorAll('.remove-participant');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const userId = btn.dataset.userId;
                const instrumentId = btn.dataset.instrument;
                this.removeParticipant(userId, instrumentId);
            });
        });
    }
    
    /**
     * Показать селектор пользователей
     */
    showUserSelector(instrumentId) {
        const instrument = INSTRUMENTS.find(i => i.id === instrumentId);
        
        // Создаем простой dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'user-selector-dropdown';
        dropdown.innerHTML = `
            <div class="user-selector-header">
                Выберите участника для ${instrument.name}
            </div>
            <div class="user-selector-list">
                ${this.users.map(user => {
                    // Проверяем, не добавлен ли уже
                    const isAdded = this.participants.some(p => 
                        p.userId === user.id && p.instrument === instrumentId
                    );
                    
                    return `
                        <div class="user-selector-item ${isAdded ? 'disabled' : ''}" 
                             data-user-id="${user.id}"
                             data-instrument="${instrumentId}">
                            ${user.name || user.displayName || user.email}
                            ${isAdded ? '<span class="added-label">Добавлен</span>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <button type="button" class="close-dropdown">Закрыть</button>
        `;
        
        // Добавляем в DOM
        document.body.appendChild(dropdown);
        
        // Позиционируем рядом с кнопкой
        const btn = this.container.querySelector(`[data-instrument="${instrumentId}"].add-participant-btn`);
        const rect = btn.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.zIndex = '10000';
        
        // Обработчики
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('user-selector-item') && !e.target.classList.contains('disabled')) {
                const userId = e.target.dataset.userId;
                const user = this.users.find(u => u.id === userId);
                
                this.addParticipant({
                    userId: user.id,
                    userName: user.name || user.displayName || user.email,
                    instrument: instrumentId,
                    instrumentName: instrument.name
                });
                
                document.body.removeChild(dropdown);
            }
            
            if (e.target.classList.contains('close-dropdown')) {
                document.body.removeChild(dropdown);
            }
        });
    }
    
    /**
     * Добавить участника
     */
    addParticipant(participant) {
        this.participants.push(participant);
        this.render();
        
        if (this.onChange) {
            this.onChange(this.participants);
        }
    }
    
    /**
     * Удалить участника
     */
    removeParticipant(userId, instrumentId) {
        this.participants = this.participants.filter(p => 
            !(p.userId === userId && p.instrument === instrumentId)
        );
        this.render();
        
        if (this.onChange) {
            this.onChange(this.participants);
        }
    }
    
    /**
     * Получить список участников
     */
    getParticipants() {
        return this.participants;
    }
    
    /**
     * Установить список участников
     */
    setParticipants(participants) {
        this.participants = participants || [];
        this.render();
    }
}