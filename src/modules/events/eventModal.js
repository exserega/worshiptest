/**
 * Обёртка для модального окна создания/редактирования события
 * Обеспечивает совместимость с существующим кодом
 */

import EventCreationModal from './eventCreationModal.js';
import logger from '../../utils/logger.js';

let modalInstance = null;

/**
 * Получить экземпляр модального окна
 */
export function getEventModal() {
    if (!modalInstance) {
        modalInstance = new EventCreationModal();
    }
    
    return {
        /**
         * Открыть для создания нового события
         */
        openForCreate(onSuccess) {
            logger.log('📅 Открываем модальное окно для создания события');
            modalInstance.open(null, onSuccess);
        },
        
        /**
         * Открыть для редактирования
         */
        open(eventData) {
            logger.log('📅 Открываем модальное окно для редактирования события');
            modalInstance.open(eventData);
        },
        
        /**
         * Закрыть модальное окно
         */
        close() {
            if (modalInstance) {
                modalInstance.close();
            }
        },
        
        // Обработчики событий
        set onSave(callback) {
            modalInstance.onSuccess = callback;
        },
        
        set onClose(callback) {
            modalInstance.onClose = callback;
        }
    };
}

// Экспорт для совместимости
export const eventModal = getEventModal();

export default getEventModal;