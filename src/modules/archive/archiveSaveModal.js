/**
 * Модальное окно для сохранения сет-листа в архив
 */

import { db } from '../../utils/firebase-v8-adapter.js';
import { getCurrentUser } from '../auth/authCheck.js';

class ArchiveSaveModal {
    constructor() {
        this.modal = null;
        this.groups = [];
        this.selectedGroups = new Set();
        this.onSave = null;
        this.setlistData = null;
    }

    async init() {
        if (!this.modal) {
            this.createModal();
            await this.loadGroups();
        }
    }

    createModal() {
        const modalHTML = `
            <div id="archive-save-modal" class="modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Сохранить в архив</h2>
                        <button class="close-btn" data-action="close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="save-info">
                            <p class="setlist-name-preview"></p>
                            <p class="songs-count-preview"></p>
                        </div>
                        
                        <div class="form-group">
                            <label>Выберите группы (опционально)</label>
                            <div class="groups-selection" id="archive-groups-selection">
                                <div class="loading">Загрузка групп...</div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="archive-comment">Комментарий (опционально)</label>
                            <textarea 
                                id="archive-comment" 
                                class="form-control" 
                                rows="3" 
                                placeholder="Добавьте комментарий к сохранению"
                            ></textarea>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-action="cancel">Отмена</button>
                        <button class="btn btn-primary" data-action="save">
                            <i class="fas fa-save"></i>
                            Сохранить в архив
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('archive-save-modal');

        // Добавляем обработчики событий
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Закрытие модального окна
        this.modal.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
        this.modal.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.close());

        // Сохранение
        this.modal.querySelector('[data-action="save"]').addEventListener('click', () => this.save());
    }

    async loadGroups() {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            // Загружаем группы из архива
            const groupsSnapshot = await db.collection('archive_groups')
                .where('branchId', '==', user.branchId)
                .get();

            this.groups = [];
            groupsSnapshot.forEach(doc => {
                this.groups.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Сортируем по имени
            this.groups.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

            // Отображаем группы
            this.renderGroups();
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    renderGroups() {
        const container = document.getElementById('archive-groups-selection');
        
        if (this.groups.length === 0) {
            container.innerHTML = '<p class="no-groups">Нет доступных групп</p>';
            return;
        }

        container.innerHTML = this.groups.map(group => `
            <label class="group-checkbox">
                <input type="checkbox" value="${group.id}" ${this.selectedGroups.has(group.id) ? 'checked' : ''}>
                <span class="group-icon">${group.icon || '📁'}</span>
                <span class="group-name">${group.name}</span>
            </label>
        `).join('');

        // Добавляем обработчики для чекбоксов
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedGroups.add(e.target.value);
                } else {
                    this.selectedGroups.delete(e.target.value);
                }
            });
        });
    }

    async open(setlistData, onSave) {
        this.setlistData = setlistData;
        this.onSave = onSave;
        this.selectedGroups.clear();

        await this.init();

        // Обновляем превью
        this.modal.querySelector('.setlist-name-preview').textContent = `Сет-лист: ${setlistData.name}`;
        this.modal.querySelector('.songs-count-preview').textContent = `Песен: ${setlistData.songs?.length || 0}`;

        // Очищаем комментарий
        document.getElementById('archive-comment').value = '';

        // Показываем модальное окно
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    async save() {
        try {
            const user = await getCurrentUser();
            if (!user) {
                alert('Ошибка авторизации');
                return;
            }

            const comment = document.getElementById('archive-comment').value.trim();

            // Подготавливаем данные для сохранения
            const archiveData = {
                ...this.setlistData,
                groups: Array.from(this.selectedGroups),
                comment: comment,
                savedAt: new Date(),
                savedBy: user.uid,
                createdBy: user.uid, // В архиве createdBy - это строка UID
                branchId: user.branchId,
                usageCount: 0,
                source: 'worship_setlist' // Помечаем источник
            };

            // Удаляем ненужные поля
            delete archiveData.id;

            // Сохраняем в archive_setlists
            const docRef = await db.collection('archive_setlists').add(archiveData);

            console.log('✅ Сет-лист сохранен в архив:', docRef.id);

            // Вызываем callback
            if (this.onSave) {
                this.onSave(docRef.id);
            }

            this.close();
        } catch (error) {
            console.error('Error saving to archive:', error);
            alert('Ошибка при сохранении в архив');
        }
    }
}

// Синглтон
let instance = null;

export function getArchiveSaveModal() {
    if (!instance) {
        instance = new ArchiveSaveModal();
    }
    return instance;
}