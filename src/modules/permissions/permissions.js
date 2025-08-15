/**
 * @fileoverview Модуль для проверки прав доступа пользователей
 * @module permissions
 */

import { getCurrentUser } from '../auth/authCheck.js';
import logger from '../../utils/logger.js';

/**
 * Проверка, может ли пользователь управлять событиями
 * @returns {boolean}
 */
export function canManageEvents() {
    const user = getCurrentUser();
    if (!user) return false;
    
    return user.role === 'admin' || user.role === 'moderator';
}

/**
 * Проверка, может ли пользователь редактировать песни
 * @returns {boolean}
 */
export function canEditSongs() {
    const user = getCurrentUser();
    if (!user) return false;
    
    return user.role === 'admin' || user.role === 'moderator';
}

/**
 * Проверка, является ли пользователь администратором
 * @returns {boolean}
 */
export function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

/**
 * Проверка, является ли пользователь модератором
 * @returns {boolean}
 */
export function isModerator() {
    const user = getCurrentUser();
    return user && user.role === 'moderator';
}

/**
 * Проверка, имеет ли пользователь ограниченный доступ
 * @returns {boolean}
 */
export function hasLimitedAccess() {
    const user = getCurrentUser();
    if (!user) return true;
    
    return user.status === 'pending' || user.status === 'blocked' || user.status === 'guest';
}

/**
 * Проверка, может ли пользователь создавать сетлисты
 * @returns {boolean}
 */
export function canCreateSetlists() {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Администраторы и модераторы могут создавать сетлисты
    if (user.role === 'admin' || user.role === 'moderator') {
        return true;
    }
    
    // Обычные пользователи могут, если у них активный статус
    return user.status === 'active';
}

/**
 * Проверка, может ли пользователь управлять филиалами
 * @returns {boolean}
 */
export function canManageBranches() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

logger.log('🔐 Модуль permissions загружен');