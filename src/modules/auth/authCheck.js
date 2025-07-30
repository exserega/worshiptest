// ====================================
// 🔒 AUTH CHECK MODULE
// ====================================
// Проверка авторизации и управление доступом

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../js/firebase/config.js';

// ====================================
// STATE
// ====================================

let currentUser = null;
let authCheckPromise = null;

// ====================================
// AUTH CHECK FUNCTION
// ====================================

/**
 * Проверяет авторизацию пользователя
 * @returns {Promise<{user: Object|null, isAuthenticated: boolean}>}
 */
export function checkAuth() {
    // Возвращаем существующий промис если проверка уже идет
    if (authCheckPromise) return authCheckPromise;
    
    authCheckPromise = new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Получаем профиль пользователя из Firestore
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    
                    if (userDoc.exists()) {
                        currentUser = {
                            ...userDoc.data(),
                            uid: firebaseUser.uid,
                            firebaseUser
                        };
                        
                        console.log('🔐 User authenticated:', currentUser.email || currentUser.phone);
                        
                        // Проверяем статус пользователя
                        if (currentUser.status === 'banned') {
                            console.warn('🚫 User is banned');
                            await auth.signOut();
                            resolve({ user: null, isAuthenticated: false, isBanned: true });
                        } else {
                            resolve({ user: currentUser, isAuthenticated: true });
                        }
                    } else {
                        console.warn('⚠️ User profile not found in Firestore');
                        resolve({ user: null, isAuthenticated: false });
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    resolve({ user: null, isAuthenticated: false });
                }
            } else {
                console.log('🔒 No authenticated user');
                resolve({ user: null, isAuthenticated: false });
            }
            
            unsubscribe();
        });
    });
    
    return authCheckPromise;
}

// ====================================
// ACCESS CONTROL
// ====================================

/**
 * Проверяет есть ли у пользователя доступ к ресурсу
 * @param {string} resource - Название ресурса (setlists, users, branches, songs)
 * @param {string} action - Действие (create, read, update, delete)
 * @returns {boolean}
 */
export function hasAccess(resource, action) {
    if (!currentUser) return false;
    
    // Админы имеют полный доступ
    if (currentUser.role === 'admin') return true;
    
    // Проверка прав для обычных пользователей
    const userPermissions = {
        setlists: ['read'],
        songs: ['read'],
        users: [],
        branches: []
    };
    
    return userPermissions[resource]?.includes(action) || false;
}

/**
 * Проверяет является ли пользователь админом
 * @returns {boolean}
 */
export function isAdmin() {
    return currentUser?.role === 'admin';
}

/**
 * Проверяет принадлежит ли пользователь к филиалу
 * @param {string} branchId - ID филиала
 * @returns {boolean}
 */
export function belongsToBranch(branchId) {
    if (!currentUser) return false;
    if (isAdmin()) return true; // Админы видят все филиалы
    return currentUser.branchId === branchId;
}

// ====================================
// USER GETTERS
// ====================================

/**
 * Получить текущего пользователя
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Получить ID текущего филиала пользователя
 * @returns {string|null}
 */
export function getCurrentBranchId() {
    return currentUser?.branchId || null;
}

// ====================================
// AUTH GATE
// ====================================

/**
 * Инициализирует проверку авторизации и редиректит если нужно
 * @param {Object} options - Опции проверки
 * @param {boolean} options.requireAuth - Требуется ли авторизация
 * @param {boolean} options.requireBranch - Требуется ли принадлежность к филиалу
 * @param {boolean} options.requireAdmin - Требуется ли роль админа
 * @param {string} options.redirectTo - Куда редиректить при отсутствии доступа
 */
export async function initAuthGate(options = {}) {
    const {
        requireAuth = true,
        requireBranch = false,
        requireAdmin = false,
        redirectTo = '/login.html'
    } = options;
    
    console.log('🔒 Initializing auth gate...');
    
    try {
        const { user, isAuthenticated, isBanned } = await checkAuth();
        
        // Проверка авторизации
        if (requireAuth && !isAuthenticated) {
            console.log('🚫 Authentication required, redirecting to login...');
            window.location.href = redirectTo;
            return false;
        }
        
        // Проверка бана
        if (isBanned) {
            console.log('🚫 User is banned');
            showAuthMessage('Ваш аккаунт заблокирован. Обратитесь к администратору.');
            return false;
        }
        
        // Проверка филиала
        if (requireBranch && user && !user.branchId) {
            console.log('⚠️ User not assigned to any branch');
            showAuthMessage('Ваш аккаунт еще не привязан к филиалу. Ожидайте подтверждения администратора.');
            return false;
        }
        
        // Проверка админских прав
        if (requireAdmin && user && user.role !== 'admin') {
            console.log('🚫 Admin access required');
            window.location.href = '/';
            return false;
        }
        
        console.log('✅ Auth gate passed');
        return true;
    } catch (error) {
        console.error('Auth gate error:', error);
        if (requireAuth) {
            window.location.href = redirectTo;
        }
        return false;
    }
}

// ====================================
// UI HELPERS
// ====================================

/**
 * Показывает сообщение об авторизации
 * @param {string} message
 */
function showAuthMessage(message) {
    // Создаем overlay с сообщением
    const overlay = document.createElement('div');
    overlay.className = 'auth-message-overlay';
    overlay.innerHTML = `
        <div class="auth-message-card">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button onclick="window.location.href='/login.html'">Войти заново</button>
        </div>
    `;
    
    // Добавляем стили если их еще нет
    if (!document.getElementById('auth-message-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-message-styles';
        style.textContent = `
            .auth-message-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .auth-message-card {
                background: var(--bg-secondary);
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                max-width: 400px;
            }
            .auth-message-card i {
                font-size: 48px;
                color: var(--accent-warning);
                margin-bottom: 20px;
            }
            .auth-message-card p {
                margin: 0 0 30px;
                color: var(--text-primary);
                line-height: 1.5;
            }
            .auth-message-card button {
                background: var(--accent-primary);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(overlay);
}

// ====================================
// LOGOUT FUNCTION
// ====================================

/**
 * Выход из системы
 */
export async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}