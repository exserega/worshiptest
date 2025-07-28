// =====================================================================
// 🏛️ AGAPE WORSHIP APP - MAIN ENTRY POINT
// =====================================================================
// Главная точка входа приложения - чистый и модульный код
// Все функциональность вынесена в специализированные модули
// =====================================================================

// ====================================
// 📋 RESTRUCTURE STAGE INDICATOR
// ====================================
console.log('🏗️ AGAPE WORSHIP - RESTRUCTURE STAGE 6.4 - FINAL');
console.log('📋 Current Stage: Main Entry Point Refactor - CLEAN ENTRY POINT');
console.log('🔧 Event Bus: ✅ Integrated');
console.log('🗃️ State Manager: ✅ Integrated');
console.log('⚙️ Core Index: ✅ Created');
console.log('🎨 DOM Refs: ✅ Created');
console.log('🔍 Search Module: ✅ Created');
console.log('📺 Song Display: ✅ Created');
console.log('🛠️ UI Utils: ✅ Created');
console.log('🔌 API Module: ✅ Created (saveSongEdit FIXED)');
console.log('🎭 Overlay Manager: ✅ Created (mobile preview, key selection)');
console.log('🔍 Search Manager: ✅ Created (overlay search, filtering, highlighting)');
console.log('🎵 Setlist Manager: ✅ Created (song addition, display filtering)');
console.log('🎭 Modal Manager: ✅ Created (notifications, dialogs, modals)');
console.log('🎮 Main Controller: ✅ Created (setlist, song, repertoire management)');
console.log('🎮 Event Handlers: ✅ Created (UI, search, modal, keyboard handlers)');
console.log('🚀 Initialization: ✅ Created (app startup, data loading, UI setup)');
console.log('🎯 Entry Point: ✅ CLEANED (2017 → ~100 строк!)');
console.log('🧪 Testing: Full modular architecture complete');
console.log('📊 Commit: Stage 6.4 - CLEAN ENTRY POINT FINAL');
console.log('=====================================');

// ====================================
// 📦 CORE IMPORTS
// ====================================
import * as state from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';

// ====================================
// 🚀 MAIN INITIALIZATION IMPORT
// ====================================
import { initializeApp, onDOMContentLoaded } from './src/main/initialization.js';

// ====================================
// 🔗 GLOBAL COMPATIBILITY EXPORTS
// ====================================
// Экспортируем критически важные функции для обратной совместимости
// и динамических импортов из модулей

// Импорты для глобального доступа
import { 
    // Core functions
    eventBus,
    stateManager,
    
    // Search functions
    cleanLyricsForSearch,
    getHighlightedTextFragment,
    filterAndDisplaySongs as filterAndDisplaySongsModule,
    
    // Setlist functions  
    startAddingSongs as startAddingSongsModule,
    closeAddSongsOverlay as closeAddSongsOverlayModule,
    addSongToSetlist as addSongToSetlistModule,
    
    // Modal functions
    showNotification as showNotificationModule,
    showSuccess as showSuccessModule,
    showError as showErrorModule,
    showWarning as showWarningModule,
    showConfirmDialog as showConfirmDialogModule,
    showToast as showToastModule,
    
    // Overlay functions
    showMobileSongPreview,
    hideMobileSongPreview
} from './src/core/index.js';

// ====================================
// 🌐 GLOBAL WINDOW EXPORTS
// ====================================
// Делаем функции доступными глобально для модулей и legacy кода

// Core state
window.eventBus = eventBus;
window.stateManager = stateManager;
window.state = state;
window.api = api;
window.ui = ui;

// Search functions
window.cleanLyricsForSearch = cleanLyricsForSearch;
window.getHighlightedTextFragment = getHighlightedTextFragment;
window.filterAndDisplaySongsModule = filterAndDisplaySongsModule;

// Setlist functions
window.startAddingSongsModule = startAddingSongsModule;
window.closeAddSongsOverlayModule = closeAddSongsOverlayModule;
window.addSongToSetlistModule = addSongToSetlistModule;

// Modal functions  
window.showNotificationModule = showNotificationModule;
window.showSuccessModule = showSuccessModule;
window.showErrorModule = showErrorModule;
window.showWarningModule = showWarningModule;
window.showConfirmDialogModule = showConfirmDialogModule;
window.showToastModule = showToastModule;

// Overlay functions
window.showMobileSongPreview = showMobileSongPreview;
window.hideMobileSongPreview = hideMobileSongPreview;

// ====================================
// 🎛️ FEATURE FLAGS
// ====================================
// Флаги для переключения между старыми и новыми функциями
window.USE_MODULE_FUNCTIONS = false; // По умолчанию используем старые функции для совместимости

// ====================================
// 🚀 APPLICATION STARTUP
// ====================================
// Единственная задача этого файла - запустить приложение!

console.log('🎯 [EntryPoint] script.js загружен - запуск инициализации...');

// Инициализация уже настроена в модуле initialization.js
// Она автоматически запустится при готовности DOM

// ====================================
// 📊 ENTRY POINT METADATA
// ====================================
export const metadata = {
    name: 'AgapeWorshipApp',
    version: '2.0.0',
    description: 'Главная точка входа приложения Agape Worship',
    architecture: 'Modular',
    modules: [
        'Core (Event Bus, State Manager, Utilities)',
        'UI (DOM, Search, Display, Utils, Overlays, Modals)',
        'API (Firebase operations)',
        'Main (Controller, Event Handlers, Initialization)'
    ],
    codeReduction: '2017 → ~100 строк (95% сокращение)',
    maintainability: 'Максимальная - каждый модуль < 500 строк',
    cursorEfficiency: 'Оптимизировано для AI-ассистентов'
};

console.log('✨ [EntryPoint] Agape Worship App v2.0 - Modular Architecture Ready!');