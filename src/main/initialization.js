/**
 * ===================================================================
 * INITIALIZATION MODULE
 * ===================================================================
 * Модуль инициализации приложения - отвечает за запуск всех систем
 * 
 * Функции:
 * - initializeApp() - главная функция инициализации
 * - loadInitialData() - загрузка данных из Firebase
 * - setupUI() - настройка UI элементов
 * - setupTheme() - настройка темы
 * - setupMobileOptimizations() - оптимизации для мобильных
 */

// Импорты
import { setupEventListeners } from './event-handlers.js';
import * as api from '../api/index.js';
import * as ui from '../../ui.js';
import { metronomeUI } from '../../metronome.js';
import { searchWorkerManager } from '../../workerManager.js';

// ====================================
// MAIN INITIALIZATION FUNCTION
// ====================================

/**
 * Главная функция инициализации приложения
 */
export async function initializeApp() {
    console.log('🚀 [Initialization] initializeApp START');
    
    try {
        // Показываем индикатор загрузки
        showLoadingIndicator();
        
        // Настройка темы (должна быть первой)
        setupTheme();
        
        // Настройка UI элементов
        setupUI();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Настройка swipe жестов
        setupSwipeToClose();
        
        // Инициализация метронома
        await initializeMetronome();
        
        // Загрузка данных
        await loadInitialData();
        
        // Настройка мобильных оптимизаций
        setupMobileOptimizations();
        
        console.log('✅ [Initialization] Инициализация приложения завершена');
        
    } catch (error) {
        console.error('❌ [Initialization] Критическая ошибка инициализации:', error);
        showCriticalError(error);
    } finally {
        hideLoadingIndicator();
    }
}

// ====================================
// THEME SETUP
// ====================================

/**
 * Настраивает тему приложения
 */
function setupTheme() {
    console.log('🎨 [Initialization] setupTheme');
    
    let initialTheme = 'dark';
    
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            initialTheme = savedTheme;
        } else {
            // Определяем по системным настройкам
            const prefersDark = !window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
            initialTheme = prefersDark ? 'dark' : 'light';
        }
    } catch (error) {
        console.error('❌ [Initialization] Ошибка определения темы:', error);
    }
    
    if (typeof ui.applyTheme === 'function') {
        ui.applyTheme(initialTheme);
    }
}

// ====================================
// UI SETUP
// ====================================

/**
 * Настраивает UI элементы
 */
function setupUI() {
    console.log('🎨 [Initialization] setupUI');
    
    // Обновляем размер шрифта
    if (typeof ui.updateFontSize === 'function') {
        ui.updateFontSize();
    }
    
    // Устанавливаем двухколоночный режим по умолчанию
    if (ui.songContent) {
        ui.songContent.classList.add('split-columns');
    }
    
    if (typeof ui.updateSplitButton === 'function') {
        ui.updateSplitButton();
    }
}

/**
 * Настраивает swipe жесты для закрытия панелей
 */
function setupSwipeToClose() {
    console.log('👆 [Initialization] setupSwipeToClose');
    
    const panels = document.querySelectorAll('.side-panel, .global-fullscreen-overlay');
    
    panels.forEach(panel => {
        let startY = 0;
        let startX = 0;
        
        panel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        });
        
        panel.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const endX = e.changedTouches[0].clientX;
            const deltaY = startY - endY;
            const deltaX = startX - endX;
            
            // Swipe up to close (вертикальные панели)
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 50) {
                if (panel.classList.contains('show') || panel.classList.contains('open')) {
                    panel.classList.remove('show', 'open');
                }
            }
            
            // Swipe left to close (боковые панели)
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                if (panel.classList.contains('show') || panel.classList.contains('open')) {
                    panel.classList.remove('show', 'open');
                }
            }
        });
    });
}

// ====================================
// METRONOME INITIALIZATION
// ====================================

/**
 * Инициализирует метроном
 */
async function initializeMetronome() {
    console.log('🥁 [Initialization] initializeMetronome');
    
    try {
        if (typeof metronomeUI?.initMetronomeUI === 'function') {
            await metronomeUI.initMetronomeUI();
        }
        
        // Делаем метроном доступным глобально для обратной совместимости
        if (typeof window !== 'undefined') {
            window.metronomeUI = metronomeUI;
        }
        
    } catch (error) {
        console.error('❌ [Initialization] Ошибка инициализации метронома:', error);
    }
}

// ====================================
// DATA LOADING
// ====================================

/**
 * Загружает начальные данные из Firebase
 */
async function loadInitialData() {
    console.log('📊 [Initialization] loadInitialData');
    
    try {
        // Загружаем все песни из Firestore
        await api.loadAllSongsFromFirestore();
        
        // Заполняем селекторы
        populateSelectors();
        
        // Загружаем вокалистов
        const vocalists = await api.loadVocalists();
        if (typeof ui.populateVocalistSelect === 'function') {
            ui.populateVocalistSelect(vocalists);
        }
        
        // Делаем search worker manager доступным глобально
        if (typeof window !== 'undefined') {
            window.searchWorkerManager = searchWorkerManager;
        }
        
    } catch (error) {
        console.error('❌ [Initialization] Ошибка загрузки данных:', error);
        throw error;
    }
}

/**
 * Заполняет селекторы данными
 */
function populateSelectors() {
    console.log('📋 [Initialization] populateSelectors');
    
    try {
        // Заполняем селектор листов
        if (typeof ui.populateSheetSelect === 'function') {
            ui.populateSheetSelect();
        }
        
        // Заполняем селектор песен
        if (typeof ui.populateSongSelect === 'function') {
            ui.populateSongSelect();
        }
        
        // Заполняем фильтр категорий (если есть функция)
        if (typeof window.populateCategoryFilter === 'function') {
            window.populateCategoryFilter();
        }
        
    } catch (error) {
        console.error('❌ [Initialization] Ошибка заполнения селекторов:', error);
    }
}

// ====================================
// MOBILE OPTIMIZATIONS
// ====================================

/**
 * Настраивает оптимизации для мобильных устройств
 */
function setupMobileOptimizations() {
    console.log('📱 [Initialization] setupMobileOptimizations');
    
    // Проверяем, является ли устройство мобильным
    const isMobile = window.innerWidth <= 480;
    
    if (!isMobile) {
        return;
    }
    
    console.log('📱 [Initialization] Применяем мобильные оптимизации');
    
    // КРИТИЧЕСКАЯ ЗАЩИТА: принудительно исправляем размеры панелей на мобильных
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.side-panel').forEach(panel => {
            if (panel.classList.contains('open')) {
                // ПРИНУДИТЕЛЬНЫЕ РАЗМЕРЫ
                const maxWidth = Math.min(280, window.innerWidth * 0.85);
                panel.style.width = maxWidth + 'px';
                panel.style.maxWidth = maxWidth + 'px';
                
                // ПРИНУДИТЕЛЬНОЕ ПОЗИЦИОНИРОВАНИЕ
                panel.style.position = 'fixed';
                panel.style.left = '0';
                panel.style.top = '0';
                panel.style.height = '100vh';
                panel.style.zIndex = '9999';
                
                console.log('📱 [MobileOptimization] Исправлены размеры панели:', maxWidth + 'px');
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
    
    // Сохраняем observer для возможной очистки
    if (typeof window !== 'undefined') {
        window.mobileOptimizationObserver = observer;
    }
}

// ====================================
// LOADING INDICATORS
// ====================================

/**
 * Показывает индикатор загрузки
 */
function showLoadingIndicator() {
    if (ui.loadingIndicator) {
        ui.loadingIndicator.style.display = 'block';
    }
}

/**
 * Скрывает индикатор загрузки
 */
function hideLoadingIndicator() {
    if (ui.loadingIndicator) {
        ui.loadingIndicator.style.display = 'none';
    }
}

/**
 * Показывает критическую ошибку
 * @param {Error} error - Объект ошибки
 */
function showCriticalError(error) {
    console.error('💥 [Initialization] КРИТИЧЕСКАЯ ОШИБКА:', error);
    
    const errorMessage = `
        <div style="
            color: #ef4444; 
            background: #1f1f1f; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px; 
            border: 1px solid #ef4444;
            font-family: monospace;
        ">
            <h2 style="color: #ef4444; margin-top: 0;">🚨 Критическая ошибка инициализации</h2>
            <p><strong>Сообщение:</strong> ${error.message}</p>
            <p><strong>Стек:</strong></p>
            <pre style="background: #000; padding: 10px; border-radius: 4px; overflow: auto;">${error.stack}</pre>
            <p style="margin-bottom: 0;">
                <strong>Действия:</strong><br>
                1. Обновите страницу (Ctrl+F5)<br>
                2. Очистите кэш браузера<br>
                3. Проверьте подключение к интернету<br>
                4. Если проблема повторяется, обратитесь к разработчику
            </p>
        </div>
    `;
    
    document.body.innerHTML = errorMessage;
}

// ====================================
// DOM READY HANDLER
// ====================================

/**
 * Обработчик готовности DOM
 */
export function onDOMContentLoaded() {
    console.log('📄 [Initialization] DOM loaded');
    console.log('📄 [Initialization] Checking key elements:');
    console.log('📄 [Initialization] confirm-key-selection element:', document.getElementById('confirm-key-selection'));
    console.log('📄 [Initialization] key-selection-modal element:', document.getElementById('key-selection-modal'));
    console.log('📄 [Initialization] add-songs-overlay element:', document.getElementById('add-songs-overlay'));
    
    // Запускаем инициализацию
    initializeApp();
}

// ====================================
// AUTO-INITIALIZATION
// ====================================

// Автоматическая инициализация при загрузке модуля
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
    } else {
        // DOM уже загружен
        onDOMContentLoaded();
    }
}

// ====================================
// MODULE METADATA
// ====================================

export const metadata = {
    name: 'Initialization',
    version: '1.0.0',
    description: 'Модуль инициализации приложения',
    functions: [
        'initializeApp',
        'setupTheme',
        'setupUI',
        'setupSwipeToClose',
        'initializeMetronome',
        'loadInitialData',
        'populateSelectors',
        'setupMobileOptimizations',
        'showLoadingIndicator',
        'hideLoadingIndicator',
        'showCriticalError',
        'onDOMContentLoaded'
    ]
};