/**
 * Модальное окно создания/редактирования архивного сет-листа
 */

import logger from '../../utils/logger.js';
import { createArchiveSetlist, updateArchiveSetlist } from './archiveApi.js';

export class ArchiveSetlistModal {
    constructor() {
        this.modal = null;
        this.form = null;
        this.editingSetlistId = null;
        this.onSave = null;
        this.selectedGroups = new Set();
    }
    
    /**
     * Инициализация модального окна
     */
    init() {
        this.createModal();
        this.attachEventListeners();
    }
    
    /**
     * Создание HTML структуры модального окна
     */
    createModal() {
        const modalHtml = `
            <div id="archive-setlist-modal" class="modal-overlay">
                <div class="modal-content archive-setlist-modal">
                    <div class="modal-header">
                        <h2 id="modal-title">Новый архивный сет-лист</h2>
                        <button class="modal-close" aria-label="Закрыть">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <form id="archive-setlist-form" class="modal-body">
                        <div class="form-group">
                            <label for="setlist-name">Название сет-листа</label>
                            <input 
                                type="text" 
                                id="setlist-name" 
                                class="form-control" 
                                placeholder="Введите название"
                                required
                                maxlength="100"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="setlist-notes">Заметки</label>
                            <textarea 
                                id="setlist-notes" 
                                class="form-control" 
                                placeholder="Дополнительная информация (необязательно)"
                                rows="3"
                                maxlength="500"
                            ></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Группы</label>
                            <div id="groups-list" class="groups-checkbox-list">
                                <!-- Группы будут добавлены динамически -->
                            </div>
                            <div class="form-hint">Выберите группы для категоризации сет-листа</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="setlist-tags">Теги</label>
                            <input 
                                type="text" 
                                id="setlist-tags" 
                                class="form-control" 
                                placeholder="Введите теги через запятую"
                            >
                            <div class="form-hint">Например: быстрые, медленные, молодежь</div>
                        </div>
                    </form>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-btn">
                            Отмена
                        </button>
                        <button type="submit" class="btn btn-primary" id="save-btn" form="archive-setlist-form">
                            <span id="save-btn-text">Создать</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        this.modal = document.getElementById('archive-setlist-modal');
        this.form = document.getElementById('archive-setlist-form');
    }
    
    /**
     * Обработчики событий
     */
    attachEventListeners() {
        // Закрытие модального окна
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('#cancel-btn').addEventListener('click', () => this.close());
        
        // Клик вне модального окна
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Отправка формы
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
        
        // ESC для закрытия
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.close();
            }
        });
    }
    
    /**
     * Открытие модального окна
     * @param {Object} options - Опции
     */
    open(options = {}) {
        const { setlist, groups = [], onSave } = options;
        
        this.editingSetlistId = setlist?.id || null;
        this.onSave = onSave;
        
        // Обновляем заголовок
        document.getElementById('modal-title').textContent = 
            this.editingSetlistId ? 'Редактировать сет-лист' : 'Новый архивный сет-лист';
        
        // Обновляем текст кнопки
        document.getElementById('save-btn-text').textContent = 
            this.editingSetlistId ? 'Сохранить' : 'Создать';
        
        // Заполняем форму
        if (setlist) {
            document.getElementById('setlist-name').value = setlist.name || '';
            document.getElementById('setlist-notes').value = setlist.notes || '';
            document.getElementById('setlist-tags').value = (setlist.tags || []).join(', ');
            this.selectedGroups = new Set(setlist.groupIds || []);
        } else {
            this.form.reset();
            this.selectedGroups.clear();
        }
        
        // Отображаем группы
        this.renderGroups(groups);
        
        // Показываем модальное окно
        this.modal.classList.add('show');
        
        // Фокус на первом поле
        setTimeout(() => {
            document.getElementById('setlist-name').focus();
        }, 100);
    }
    
    /**
     * Отображение списка групп
     * @param {Array} groups - Массив групп
     */
    renderGroups(groups) {
        const container = document.getElementById('groups-list');
        
        if (groups.length === 0) {
            container.innerHTML = '<div class="empty-groups">Нет доступных групп</div>';
            return;
        }
        
        container.innerHTML = groups.map(group => `
            <label class="checkbox-group">
                <input 
                    type="checkbox" 
                    value="${group.id}" 
                    ${this.selectedGroups.has(group.id) ? 'checked' : ''}
                    onchange="window.archiveSetlistModal.toggleGroup('${group.id}')"
                >
                <span class="checkbox-label">
                    <span class="group-color" style="background-color: ${group.color}"></span>
                    ${group.name}
                </span>
            </label>
        `).join('');
    }
    
    /**
     * Переключение выбора группы
     * @param {string} groupId - ID группы
     */
    toggleGroup(groupId) {
        if (this.selectedGroups.has(groupId)) {
            this.selectedGroups.delete(groupId);
        } else {
            this.selectedGroups.add(groupId);
        }
    }
    
    /**
     * Обработка отправки формы
     */
    async handleSubmit() {
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.innerHTML;
        
        try {
            // Блокируем кнопку
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner"></span> Сохранение...';
            
            // Собираем данные
            const formData = {
                name: document.getElementById('setlist-name').value.trim(),
                notes: document.getElementById('setlist-notes').value.trim(),
                groupIds: Array.from(this.selectedGroups),
                tags: document.getElementById('setlist-tags').value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag)
            };
            
            // Валидация
            if (!formData.name) {
                throw new Error('Введите название сет-листа');
            }
            
            // Сохраняем
            let setlistId;
            if (this.editingSetlistId) {
                await updateArchiveSetlist(this.editingSetlistId, formData);
                setlistId = this.editingSetlistId;
            } else {
                setlistId = await createArchiveSetlist(formData);
            }
            
            // Вызываем callback
            if (this.onSave) {
                await this.onSave(setlistId);
            }
            
            // Закрываем модальное окно
            this.close();
            
        } catch (error) {
            logger.error('Error saving archive setlist:', error);
            alert(error.message || 'Ошибка при сохранении сет-листа');
        } finally {
            // Восстанавливаем кнопку
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
    
    /**
     * Закрытие модального окна
     */
    close() {
        this.modal.classList.remove('show');
        this.form.reset();
        this.editingSetlistId = null;
        this.selectedGroups.clear();
    }
    
    /**
     * Удаление модального окна из DOM
     */
    destroy() {
        if (this.modal) {
            this.modal.remove();
        }
    }
}

// Создаем глобальный экземпляр
window.archiveSetlistModal = new ArchiveSetlistModal();