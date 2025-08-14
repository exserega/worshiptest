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
        console.log('🎸 ParticipantsSelector: привязка обработчиков');
        
        // Добавление участника
        const addButtons = this.container.querySelectorAll('.add-participant-btn');
        console.log('🔘 Найдено кнопок добавления участников:', addButtons.length);
        
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('➕ Клик по кнопке добавления участника');
                const instrumentId = btn.dataset.instrument;
                console.log('🎸 Инструмент:', instrumentId);
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
        console.log('📋 showUserSelector вызван для:', instrumentId);
        const instrument = INSTRUMENTS.find(i => i.id === instrumentId);
        console.log('🎸 Найден инструмент:', instrument);
        console.log('👥 Доступные пользователи:', this.users);
        
        // Удаляем существующий dropdown если есть
        const existing = document.querySelector('.user-selector-dropdown');
        if (existing) {
            console.log('🗑️ Удаляем существующий dropdown');
            existing.remove();
        }
        
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
        
        // Найдем модальное окно и добавим dropdown внутрь него
        const modal = document.querySelector('.event-modal');
        if (modal) {
            modal.appendChild(dropdown);
            console.log('✅ Dropdown добавлен в модальное окно');
        } else {
            // Если модальное окно не найдено, добавляем в body
            document.body.appendChild(dropdown);
            console.log('✅ Dropdown добавлен в body');
        }
        
        // Позиционируем рядом с кнопкой
        const btn = this.container.querySelector(`[data-instrument="${instrumentId}"].add-participant-btn`);
        console.log('🔘 Ищем кнопку с селектором:', `[data-instrument="${instrumentId}"].add-participant-btn`);
        console.log('🔘 Найденная кнопка:', btn);
        
        if (btn) {
            const btnRect = btn.getBoundingClientRect();
            console.log('📐 Позиция кнопки:', btnRect);
            
            // Используем абсолютное позиционирование относительно инструмента
            const instrumentBlock = btn.closest('.instrument-block');
            if (instrumentBlock) {
                instrumentBlock.style.position = 'relative';
                dropdown.style.position = 'absolute';
                dropdown.style.top = '100%';
                dropdown.style.left = '0';
                dropdown.style.marginTop = '5px';
                instrumentBlock.appendChild(dropdown);
            } else {
                // Fallback на fixed позиционирование
                dropdown.style.position = 'fixed';
                dropdown.style.top = `${btnRect.bottom + 5}px`;
                dropdown.style.left = `${Math.max(10, btnRect.left)}px`; // Минимум 10px от края
            }
            
            dropdown.style.width = '250px';
            dropdown.style.maxWidth = 'calc(100vw - 20px)'; // Отступы от краев
            dropdown.style.zIndex = '999999';
            dropdown.style.display = 'flex';
            dropdown.style.visibility = 'visible';
            dropdown.style.opacity = '1';
            
            console.log('🎯 Стили dropdown установлены:', {
                position: dropdown.style.position,
                top: dropdown.style.top,
                left: dropdown.style.left,
                width: dropdown.style.width,
                zIndex: dropdown.style.zIndex
            });
            
            // Проверка видимости после установки стилей
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(dropdown);
                console.log('🎨 Computed стили dropdown:', {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    position: computedStyle.position,
                    zIndex: computedStyle.zIndex,
                    width: computedStyle.width,
                    height: computedStyle.height
                });
                
                const rect = dropdown.getBoundingClientRect();
                console.log('📍 Позиция dropdown на экране:', rect);
                console.log('👁️ Dropdown в viewport?', 
                    rect.top >= 0 && 
                    rect.left >= 0 && 
                    rect.bottom <= window.innerHeight && 
                    rect.right <= window.innerWidth
                );
            }, 100);
        } else {
            console.error('❌ Кнопка не найдена!')
        }
        
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