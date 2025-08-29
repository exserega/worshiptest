/**
 * Модуль управления группами архива
 */

import logger from '../../utils/logger.js';
import { 
    createArchiveGroup, 
    updateArchiveGroup, 
    deleteArchiveGroup,
    loadArchiveGroups 
} from './archiveGroupsApi.js';
import { getCurrentUser } from '../auth/authCheck.js';



// Предустановленные иконки для групп
const GROUP_ICONS = [
    '📁', '🎵', '🎸', '🎹', '🎤', '🎧',
    '🎄', '🎅', '🎁', '⭐', '❄️', '🕯️',
    '🐣', '🌸', '🌺', '🌻', '🌷', '🥚',
    '🙏', '✝️', '⛪', '📖', '🕊️', '💒',
    '❤️', '💚', '💙', '💜', '💛', '🧡',
    '🌟', '✨', '🎉', '🎊', '🎈', '🎂',
    '🔥', '💡', '🌈', '☀️', '🌙', '⚡'
];

class ArchiveGroupsManager {
    constructor() {
        this.currentUser = null;
        this.groups = [];
        this.selectedIcon = GROUP_ICONS[0];
        this.editingGroupId = null;
        this.onGroupsChange = null; // Callback для обновления UI
    }
    
    /**
     * Инициализация менеджера групп
     */
    async init(onGroupsChange) {
        this.currentUser = getCurrentUser();
        this.onGroupsChange = onGroupsChange;
        this.setupEventListeners();
        this.initializeIconPicker();
        await this.loadGroups();
    }
    
    /**
     * Загрузка групп из базы данных
     */
    async loadGroups() {
        try {
            if (!this.currentUser?.branchId) {
                logger.error('No branch ID for loading groups');
                return;
            }
            
            this.groups = await loadArchiveGroups(this.currentUser.branchId);
            logger.log(`Loaded ${this.groups.length} archive groups`);
            
            if (this.onGroupsChange) {
                this.onGroupsChange(this.groups);
            }
        } catch (error) {
            logger.error('Error loading groups:', error);
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Кнопка создания группы
        const addGroupBtn = document.getElementById('add-group-btn');
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', () => this.openCreateModal());
        }
        
        // Кнопка списка групп
        const listGroupsBtn = document.getElementById('list-groups-btn');
        if (listGroupsBtn) {
            listGroupsBtn.addEventListener('click', () => this.openListModal());
        }
        
        // Модальное окно создания/редактирования
        const groupModal = document.getElementById('group-modal');
        const closeBtn = document.getElementById('group-modal-close');
        const cancelBtn = document.getElementById('group-modal-cancel');
        const saveBtn = document.getElementById('group-modal-save');
        
        closeBtn?.addEventListener('click', () => this.closeModal());
        cancelBtn?.addEventListener('click', () => this.closeModal());
        saveBtn?.addEventListener('click', () => this.saveGroup());
        
        // Закрытие по клику на оверлей
        groupModal?.addEventListener('click', (e) => {
            if (e.target === groupModal) {
                this.closeModal();
            }
        });
        
        // Модальное окно списка групп
        const listModal = document.getElementById('groups-list-modal');
        const listCloseBtn = document.getElementById('groups-list-close');
        const createFromListBtn = document.getElementById('create-group-from-list');
        
        listCloseBtn?.addEventListener('click', () => this.closeListModal());
        createFromListBtn?.addEventListener('click', () => {
            this.closeListModal();
            this.openCreateModal();
        });
        
        // Закрытие по клику на оверлей
        listModal?.addEventListener('click', (e) => {
            if (e.target === listModal) {
                this.closeListModal();
            }
        });
    }
    

    
    /**
     * Инициализация выбора иконки
     */
    initializeIconPicker() {
        const iconPicker = document.getElementById('icon-picker');
        if (!iconPicker) return;
        
        iconPicker.innerHTML = '';
        
        GROUP_ICONS.forEach(icon => {
            const iconOption = document.createElement('div');
            iconOption.className = 'icon-option';
            iconOption.textContent = icon;
            iconOption.dataset.icon = icon;
            
            if (icon === this.selectedIcon) {
                iconOption.classList.add('selected');
            }
            
            iconOption.addEventListener('click', () => {
                // Убираем выделение с предыдущего
                iconPicker.querySelectorAll('.icon-option').forEach(opt => 
                    opt.classList.remove('selected')
                );
                // Выделяем текущий
                iconOption.classList.add('selected');
                this.selectedIcon = icon;
            });
            
            iconPicker.appendChild(iconOption);
        });
    }
    
    /**
     * Открытие модального окна создания группы
     */
    openCreateModal() {
        this.editingGroupId = null;
        
        const modal = document.getElementById('group-modal');
        const titleEl = document.getElementById('group-modal-title');
        const nameInput = document.getElementById('group-name-input');
        
        titleEl.textContent = 'Новая группа';
        nameInput.value = '';
        
        // Сбрасываем выбранную иконку
        this.selectedIcon = GROUP_ICONS[0];
        
        // Обновляем UI выбора
        this.updateIconSelection();
        
        modal.classList.add('show');
        nameInput.focus();
    }
    
    /**
     * Открытие модального окна редактирования группы
     */
    openEditModal(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        this.editingGroupId = groupId;
        
        const modal = document.getElementById('group-modal');
        const titleEl = document.getElementById('group-modal-title');
        const nameInput = document.getElementById('group-name-input');
        
        titleEl.textContent = 'Редактировать группу';
        nameInput.value = group.name;
        
        // Устанавливаем текущую иконку
        this.selectedIcon = group.icon || GROUP_ICONS[0];
        
        // Обновляем UI выбора
        this.updateIconSelection();
        
        modal.classList.add('show');
        nameInput.focus();
    }
    

    
    /**
     * Обновление выделения иконки
     */
    updateIconSelection() {
        const iconPicker = document.getElementById('icon-picker');
        if (!iconPicker) return;
        
        iconPicker.querySelectorAll('.icon-option').forEach(opt => {
            if (opt.dataset.icon === this.selectedIcon) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
    
    /**
     * Закрытие модального окна
     */
    closeModal() {
        const modal = document.getElementById('group-modal');
        modal.classList.remove('show');
    }
    
    /**
     * Сохранение группы
     */
    async saveGroup() {
        const nameInput = document.getElementById('group-name-input');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Введите название группы');
            nameInput.focus();
            return;
        }
        
        try {
            const groupData = {
                name,
                icon: this.selectedIcon
            };
            
            if (this.editingGroupId) {
                // Редактирование существующей группы
                await updateArchiveGroup(this.editingGroupId, groupData);
                logger.log('Group updated:', this.editingGroupId);
            } else {
                // Создание новой группы
                const groupId = await createArchiveGroup(groupData);
                logger.log('Group created:', groupId);
            }
            
            // Перезагружаем список групп
            await this.loadGroups();
            
            // Закрываем модальное окно
            this.closeModal();
        } catch (error) {
            logger.error('Error saving group:', error);
            alert(error.message || 'Ошибка при сохранении группы');
        }
    }
    
    /**
     * Открытие модального окна списка групп
     */
    openListModal() {
        const modal = document.getElementById('groups-list-modal');
        this.renderGroupsList();
        modal.classList.add('show');
    }
    
    /**
     * Закрытие модального окна списка
     */
    closeListModal() {
        const modal = document.getElementById('groups-list-modal');
        modal.classList.remove('show');
    }
    
    /**
     * Рендеринг списка групп
     */
    renderGroupsList() {
        const container = document.getElementById('groups-list-container');
        if (!container) return;
        
        if (this.groups.length === 0) {
            container.innerHTML = `
                <div class="groups-empty-state">
                    <i class="fas fa-folder-open groups-empty-icon"></i>
                    <h3 class="groups-empty-title">Нет групп</h3>
                    <p class="groups-empty-text">Создайте первую группу для организации сет-листов</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.groups.map(group => `
            <div class="group-list-item" data-group-id="${group.id}">
                <div class="group-list-icon">
                    ${group.icon || '📁'}
                </div>
                <div class="group-list-info">
                    <div class="group-list-name">${this.escapeHtml(group.name)}</div>
                    <div class="group-list-count">${group.setlistCount || 0} сет-листов</div>
                </div>
                <div class="group-list-actions">
                    <button class="group-edit-btn" data-group-id="${group.id}" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="group-delete-btn" data-group-id="${group.id}" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики
        container.querySelectorAll('.group-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const groupId = btn.dataset.groupId;
                this.closeListModal();
                this.openEditModal(groupId);
            });
        });
        
        container.querySelectorAll('.group-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const groupId = btn.dataset.groupId;
                this.deleteGroup(groupId);
            });
        });
    }
    
    /**
     * Удаление группы
     */
    async deleteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        const confirmText = group.setlistCount > 0 
            ? `Вы уверены, что хотите удалить группу "${group.name}"? Она содержит ${group.setlistCount} сет-листов. Сет-листы не будут удалены, но потеряют связь с этой группой.`
            : `Вы уверены, что хотите удалить группу "${group.name}"?`;
        
        if (!confirm(confirmText)) return;
        
        try {
            await deleteArchiveGroup(groupId);
            logger.log('Group deleted:', groupId);
            
            // Перезагружаем список групп
            await this.loadGroups();
            
            // Обновляем UI списка если он открыт
            const modal = document.getElementById('groups-list-modal');
            if (modal.classList.contains('show')) {
                this.renderGroupsList();
            }
        } catch (error) {
            logger.error('Error deleting group:', error);
            alert('Ошибка при удалении группы');
        }
    }
    
    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Экспортируем единственный экземпляр
export default new ArchiveGroupsManager();