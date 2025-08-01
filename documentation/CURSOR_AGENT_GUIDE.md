# 🎯 **МЕТОДИЧКА ДЛЯ АГЕНТА CURSOR - ПРОЕКТ AGAPE WORSHIP**

## 📋 **КРИТИЧЕСКИ ВАЖНО ДЛЯ ПОНИМАНИЯ ПРОЕКТА**

### 🏗️ **АРХИТЕКТУРА ПРОЕКТА (МОДУЛЬНАЯ)**

Проект прошел **ПОЛНУЮ РЕСТРУКТУРИЗАЦИЮ** из монолитной архитектуры в модульную. Это **НЕ ОБЫЧНЫЙ ПРОЕКТ** - это результат глубокой оптимизации для работы с Cursor AI.

### 🎯 **ЦЕЛЬ РЕСТРУКТУРИЗАЦИИ**
- **Максимальная эффективность работы Cursor AI**
- **Устранение проблем с пониманием кода**
- **Модульность и читаемость**
- **Безопасность изменений**

---

## 🏛️ **СТРУКТУРА ПРОЕКТА**

### **📁 КОРНЕВЫЕ ФАЙЛЫ (LEGACY + ENTRY POINTS)**
```
/
├── script.js           ⭐ ГЛАВНАЯ ТОЧКА ВХОДА (934 строки)
├── ui.js              ⭐ LEGACY UI ФУНКЦИИ (1431 строк)
├── firebase-init.js   🔥 ИНИЦИАЛИЗАЦИЯ FIREBASE v8
├── index.html        🌐 HTML СТРУКТУРА
├── styles.css        🎨 СТИЛИ (4963 строки)
├── sw.js             📦 SERVICE WORKER
├── manifest.json     📱 PWA МАНИФЕСТ
└── [HTML редиректы: admin.html, login.html, settings.html]
```

### **📁 МОДУЛЬНАЯ СТРУКТУРА src/**
```
src/
├── core/              🏛️ ЯДРО СИСТЕМЫ
│   ├── index.js       ⭐ ЦЕНТРАЛЬНЫЙ ЭКСПОРТ ВСЕХ МОДУЛЕЙ
│   ├── event-bus.js   📡 СИСТЕМА СОБЫТИЙ
│   └── state-manager.js 🗃️ УПРАВЛЕНИЕ СОСТОЯНИЕМ
├── main/              🎮 ОСНОВНЫЕ КОНТРОЛЛЕРЫ
│   ├── initialization.js 🚀 ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
│   ├── event-handlers.js 🎮 ВСЕ ОБРАБОТЧИКИ СОБЫТИЙ
│   └── controller.js     🎯 ОСНОВНАЯ ЛОГИКА
├── ui/                🎨 UI КОМПОНЕНТЫ
│   ├── dom-refs.js    📋 ССЫЛКИ НА DOM ЭЛЕМЕНТЫ
│   ├── search.js      🔍 ПОИСК (основной)
│   ├── search-manager.js 🔍 ПОИСК В OVERLAY
│   ├── song-display.js   📺 ОТОБРАЖЕНИЕ ПЕСЕН
│   ├── overlay-manager.js 🎭 УПРАВЛЕНИЕ OVERLAY
│   ├── setlist-manager.js 🎵 УПРАВЛЕНИЕ СЕТЛИСТАМИ
│   ├── setlist-selector.js 📋 ДОБАВЛЕНИЕ В СЕТЛИСТ (NEW)
│   ├── modal-manager.js   🎭 МОДАЛЬНЫЕ ОКНА
│   └── utils.js          🛠️ UI УТИЛИТЫ
├── api/               🔌 API СЛОЙ
│   └── index.js       ⭐ ВЕСЬ API В ОДНОМ ФАЙЛЕ
├── js/                📦 ДОПОЛНИТЕЛЬНЫЕ МОДУЛИ
│   ├── state/         🗃️ МОДУЛЬНОЕ СОСТОЯНИЕ
│   ├── workers/       👷 WEB WORKERS
│   ├── utils/         🛠️ УТИЛИТЫ
│   └── core/          🏛️ CORE МОДУЛИ
│       └── metronome.js 🎵 МЕТРОНОМ CORE (Web Audio API)
└── config/            ⚙️ КОНФИГУРАЦИЯ
    └── firebase.js    🔥 FIREBASE CONFIG
```

---

## 🔗 **СИСТЕМА ИМПОРТОВ И ЗАВИСИМОСТЕЙ**

### **⭐ ЦЕНТРАЛЬНЫЙ ЭКСПОРТ: `src/core/index.js`**
```javascript
// ВСЕ МОДУЛИ ЭКСПОРТИРУЮТСЯ ЧЕРЕЗ ЭТОТ ФАЙЛ!
export { default as eventBus } from './event-bus.js';
export { default as stateManager } from './state-manager.js';
export { /* UI modules */ } from '../ui/dom-refs.js';
export { /* Search modules */ } from '../ui/search.js';
// ... и т.д.
```

### **🎯 ГЛАВНАЯ ТОЧКА ВХОДА: `script.js`**
```javascript
// ОСНОВНЫЕ ИМПОРТЫ
import * as state from './state.js';          // → src/js/state/index.js
import * as api from './api.js';              // → Legacy API
import * as ui from './ui.js';                // → Legacy UI
import { initializeApp } from './src/main/initialization.js';

// МОДУЛЬНЫЕ ИМПОРТЫ (для совместимости)
import { 
  showNotificationModule,
  startAddingSongsModule,
  filterAndDisplaySongsModule
} from './src/core/index.js';

// ГЛОБАЛЬНЫЕ ЭКСПОРТЫ (для обратной совместимости)
window.showNotification = function(message, type) { /* ... */ };
window.handleSetlistSelect = function(setlist) { /* ... */ };
// ... и другие legacy функции
```

### **🚀 ИНИЦИАЛИЗАЦИЯ: `src/main/initialization.js`**
```javascript
// ИМПОРТЫ СИСТЕМЫ
import { setupEventListeners } from './event-handlers.js';
import * as api from '../api/index.js';       // → Модульный API
import * as ui from '../../ui.js';            // → Legacy UI
import searchWorkerManager from '../../src/js/workers/workerManager.js';

// ПОСЛЕДОВАТЕЛЬНОСТЬ ИНИЦИАЛИЗАЦИИ:
// 1. setupTheme()
// 2. setupUI()
// 3. setupEventListeners()
// 4. loadInitialData()
// 5. setupMobileOptimizations()
```

---

## 🎮 **СИСТЕМА ОБРАБОТКИ СОБЫТИЙ**

### **📍 ЦЕНТРАЛЬНЫЙ ФАЙЛ: `src/main/event-handlers.js` (1131 строка)**

**КРИТИЧЕСКИ ВАЖНО:** Все обработчики событий находятся в этом файле!

```javascript
// СТРУКТУРА ОБРАБОТЧИКОВ:
setupEventListeners() {
  setupUIEventHandlers();      // Основные UI элементы
  setupSearchEventHandlers();  // Поиск
  setupModalEventHandlers();   // Модальные окна
  setupKeyboardEventHandlers(); // Клавиатура
  setupSetlistEventHandlers(); // Сетлисты и панели
  setupSongEventHandlers();    // Песни
}
```

### **🎭 ПАНЕЛИ И OVERLAY**
```javascript
// ПАНЕЛИ (боковые)
- setlists-panel     → Сетлисты
- my-list-panel      → Избранное
- repertoire-panel   → Репертуар

// OVERLAY (полноэкранные)
- add-songs-overlay         → Добавление песен
- key-selection-modal       → Выбор тональности
- mobile-song-preview-overlay → Мобильный просмотр
- create-setlist-modal      → Создание сетлиста
- setlist-select-overlay    → Выбор сетлиста для добавления (NEW)
```

---

## 🎵 **СИСТЕМА МЕТРОНОМА**

### **📍 АРХИТЕКТУРА МЕТРОНОМА**
```javascript
// ДВУХУРОВНЕВАЯ СИСТЕМА:
1. metronome.js (корень)       → UI и управление
2. src/js/core/metronome.js    → Core логика (Web Audio API)

// ОСОБЕННОСТИ:
- Web Audio API для точного тайминга
- Визуальная синхронизация (beat indicators)
- Сохранение настроек в localStorage
- Поддержка различных размеров (2/4, 3/4, 4/4, 6/8)
- Переключение акцента сильной доли
```

### **🔊 WEB AUDIO API КОНФИГУРАЦИЯ**
```javascript
// ЗВУКОВЫЕ ПАРАМЕТРЫ:
const SOUND_CONFIG = {
    frequencies: {
        high: 880,  // Акцентированная нота
        low: 440    // Обычная нота
    },
    volume: {
        accent: 0.3,  // Громкость акцента
        normal: 0.15  // Обычная громкость
    }
};

// ВИЗУАЛЬНАЯ СИНХРОНИЗАЦИЯ:
- scheduleNote() → планирует звук и событие
- 'metronome-beat' event → обновляет UI
- Компенсация задержки через lookahead
```

---

## 🗃️ **СИСТЕМА СОСТОЯНИЯ**

### **📋 МОДУЛЬНОЕ СОСТОЯНИЕ: `src/js/state/`**
```javascript
// ФАЙЛЫ СОСТОЯНИЯ:
appState.js         → Основное состояние приложения
metronomeState.js   → Состояние метронома
presentationState.js → Презентационный режим
repertoireState.js  → Репертуар
setlistState.js     → Сетлисты

// ДОСТУП К СОСТОЯНИЮ:
import * as state from './state.js';
// или
window.state.currentSong
window.state.allSongs
window.state.currentSetlistId
```

### **🎯 КРИТИЧЕСКИЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ**
```javascript
// В window.state:
- allSongs              → Все песни из Firebase
- currentSong           → Текущая выбранная песня
- currentSetlistId      → ID текущего сетлиста
- currentSetlistName    → Имя текущего сетлиста
- currentVocalistId     → ID текущего вокалиста
- currentRepertoireSongsData → Песни репертуара
- favoriteSongs         → Избранные песни
- addedSongsToCurrentSetlist → Добавленные песни (Set)
```

---

## 🔌 **API СИСТЕМА**

### **⭐ ЦЕНТРАЛЬНЫЙ API: `src/api/index.js` (512 строк)**

**ВСЕ API ФУНКЦИИ В ОДНОМ ФАЙЛЕ!**

```javascript
// ОСНОВНЫЕ API ФУНКЦИИ:
- loadAllSongsFromFirestore()    → Загрузка всех песен
- createSetlist(name)            → Создание сетлиста
- addSongToSetlist(id, songId, key) → Добавление песни
- loadSetlists()                 → Загрузка сетлистов
- loadRepertoire(vocalistId, callback) → Загрузка репертуара
- addToFavorites(song)           → Добавление в избранное
- saveSongEdit(songId, updates)  → Сохранение изменений

// FIREBASE КОЛЛЕКЦИИ:
- "worship_songs"     → Песни
- "worship_setlists"  → Сетлисты
- "vocalists"         → Вокалисты
  - "repertoire"      → Подколлекция репертуара
```

### **🔥 FIREBASE КОНФИГУРАЦИЯ**
```javascript
// ОСНОВНОЙ: src/config/firebase.js
// LEGACY: firebase-config.js (переходный)

// ИМПОРТ:
import { db, auth } from '../config/firebase.js';
```

---

## 🎨 **UI СИСТЕМА**

### **📋 DOM ЭЛЕМЕНТЫ: `src/ui/dom-refs.js`**
```javascript
// ЭКСПОРТ ВСЕХ DOM ЭЛЕМЕНТОВ:
export const elements = {
  // Основные селекторы
  sheetSelect: document.getElementById('sheet-select'),
  songSelect: document.getElementById('song-select'),
  keySelect: document.getElementById('key-select'),
  
  // Панели
  setlistsPanel: document.getElementById('setlists-panel'),
  myListPanel: document.getElementById('my-list-panel'),
  repertoirePanel: document.getElementById('repertoire-panel'),
  
  // Overlay
  addSongsOverlay: document.getElementById('add-songs-overlay'),
  keySelectionModal: document.getElementById('key-selection-modal'),
  
  // ... и множество других
};
```

### **🔍 СИСТЕМА ПОИСКА**
```javascript
// ОСНОВНОЙ ПОИСК: src/ui/search.js
- searchSongs()              → Поиск песен
- displaySearchResults()     → Отображение результатов
- highlightText()            → Подсветка текста

// ПОИСК В OVERLAY: src/ui/search-manager.js
- performOverlayDropdownSearch() → Поиск в overlay
- showOverlaySearchResults()     → Показ результатов
- filterAndDisplaySongs()        → Фильтрация песен
```

---

## ⚠️ **КРИТИЧЕСКИЕ ПРАВИЛА ДЛЯ АГЕНТА**

### **🚨 1. HYBRID АРХИТЕКТУРА**
Проект использует **ГИБРИДНУЮ АРХИТЕКТУРУ**:
- **Новые модули** в `src/`
- **Legacy код** в корне
- **Переходные файлы** для совместимости

**НЕ УДАЛЯЙ LEGACY ФАЙЛЫ БЕЗ АНАЛИЗА ЗАВИСИМОСТЕЙ!**

### **🚨 2. ГЛОБАЛЬНЫЕ ФУНКЦИИ В script.js**
```javascript
// КРИТИЧЕСКИ ВАЖНЫЕ ГЛОБАЛЬНЫЕ ФУНКЦИИ:
window.showNotification()           → Уведомления
window.handleSetlistSelect()        → Выбор сетлиста
window.handleFavoriteOrRepertoireSelect() → Выбор из панели
window.handleVocalistChange()       → Смена вокалиста
window.handleRepertoireUpdate()     → Обновление репертуара
window.handleAddSongToSetlist()     → Открытие overlay добавления (NEW)
window.openSetlistSelector()        → Прямое открытие селектора (NEW)
```

**ЭТИ ФУНКЦИИ НЕЛЬЗЯ УДАЛЯТЬ - ОНИ ИСПОЛЬЗУЮТСЯ В event-handlers.js!**

### **🚨 3. ИМПОРТЫ И ПУТИ**
```javascript
// ПРАВИЛЬНЫЕ ПУТИ:
'./state.js'                    → Корневой state
'./src/core/index.js'          → Центральный экспорт
'./src/main/initialization.js' → Инициализация
'./src/api/index.js'          → API
'../../ui.js'                 → Legacy UI (из src/)

// НЕПРАВИЛЬНЫЕ ПУТИ (404 ОШИБКИ):
'./core.js'                   → Удален
'./firebase-config.js'        → Используй src/config/firebase.js
'./workerManager.js'          → Используй src/js/workers/workerManager.js
```

### **🚨 4. СОСТОЯНИЕ LOADING АНИМАЦИЙ**
```javascript
// ВСЕГДА УБИРАЙ LOADING ПОСЛЕ ОПЕРАЦИЙ:
ui.toggleRepertoireButton.classList.add('loading');    // Показать
// ... операция ...
ui.toggleRepertoireButton.classList.remove('loading'); // ОБЯЗАТЕЛЬНО убрать!
```

### **🚨 5. ОБРАБОТЧИКИ СОБЫТИЙ**
- **ВСЕ** обработчики в `src/main/event-handlers.js`
- **НЕ ДУБЛИРУЙ** обработчики в разных местах
- **ПРОВЕРЯЙ** на существование элементов: `if (element) { ... }`

### **🚨 6. ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ СЕТЛИСТОВ**
```javascript
// ПОСЛЕ ДОБАВЛЕНИЯ ПЕСНИ:
1. Вызывается handleSetlistSelect() для обновления UI
2. Отправляется событие 'setlist-updated'
3. Обновление происходит НЕЗАВИСИМО от открытой панели

// ВАЖНО: Обработчик события обновляет список ВСЕГДА,
// если сет-лист выбран (не только при открытой панели)
```

---

## 🛠️ **ТИПИЧНЫЕ ЗАДАЧИ И РЕШЕНИЯ**

### **🔧 ДОБАВЛЕНИЕ НОВОЙ ФУНКЦИИ**
1. **Определи модуль**: UI → `src/ui/`, API → `src/api/index.js`
2. **Добавь в центральный экспорт**: `src/core/index.js`
3. **Импортируй в нужном месте**
4. **Добавь обработчик событий** в `event-handlers.js`

### **🔧 ИСПРАВЛЕНИЕ ОШИБОК**
1. **404 ошибки** → проверь пути импортов
2. **ReferenceError** → проверь глобальные экспорты в `script.js`
3. **Зависшие анимации** → добавь `.classList.remove('loading')`
4. **Дублирующие обработчики** → проверь `event-handlers.js`

### **🔧 РАБОТА С ПАНЕЛЯМИ**
```javascript
// ОТКРЫТИЕ ПАНЕЛИ:
ui.closeAllSidePanels();              // Закрыть все
panel.classList.add('open');          // Открыть нужную

// ЗАГРУЗКА ДАННЫХ:
button.classList.add('loading');      // Показать загрузку
await api.loadData();                 // Загрузить
ui.renderData();                      // Отобразить
button.classList.remove('loading');   // Убрать загрузку
```

### **🔧 РАБОТА С OVERLAY**
```javascript
// ПОКАЗ OVERLAY:
overlay.classList.add('show');     // Для старых overlay
overlay.classList.add('visible');  // Для новых (setlist-select-overlay)

// СКРЫТИЕ OVERLAY:
overlay.classList.remove('show');
overlay.classList.remove('visible');

// ОБРАБОТЧИКИ КНОПОК:
// Всегда добавляй в setupModalEventHandlers()

// ВАЖНО: setlist-select-overlay использует класс 'visible'!
```

### **🔧 РАБОТА С SETLIST SELECTOR**
```javascript
// ОТКРЫТИЕ СЕЛЕКТОРА:
window.openSetlistSelector(song, selectedKey);

// МОДУЛЬ: src/ui/setlist-selector.js
// ОСОБЕННОСТИ:
- Автоматическая загрузка сет-листов
- Отображение выбранной тональности
- Создание нового сет-листа inline
- Динамическое обновление после добавления

// ВАЖНО: Использует modal-overlay с классом 'visible'
```

---

## 🧪 **ТЕСТИРОВАНИЕ**

### **📊 ПРОВЕРКА РАБОТОСПОСОБНОСТИ**
1. **Загрузка страницы** → нет ошибок в консоли
2. **Панели** → открываются, загружают данные, закрываются
3. **Поиск** → работает в главном меню и overlay
4. **Добавление песен** → overlay открывается, песни добавляются
5. **Репертуар** → выбор вокалиста загружает его песни

### **🔍 ОТЛАДКА**
```javascript
// ПОЛЕЗНЫЕ ЛОГИ:
console.log('🎭 [Debug] Current state:', window.state);
console.log('🎭 [Debug] All songs:', window.state.allSongs?.length);
console.log('🎭 [Debug] Current setlist:', window.state.currentSetlistId);
```

---

## 📈 **ПРОИЗВОДИТЕЛЬНОСТЬ**

### **⚡ WEB WORKERS**
- **Search Worker**: `src/js/workers/workerManager.js`
- **Используется для поиска** в больших объемах данных
- **Fallback** на основной поток при ошибках

### **🎯 ОПТИМИЗАЦИИ**
- **Debounce** для поиска (300ms)
- **Кэширование** результатов поиска
- **Ленивая загрузка** overlay контента
- **Мобильные оптимизации** в `initialization.js`

---

## 🚀 **РАЗВЕРТЫВАНИЕ**

### **📦 GitHub Pages**
- **Репозиторий**: `https://github.com/exserega/worshiptest`
- **URL**: `https://exserega.github.io/worshiptest/`
- **Ветка**: `main`
- **Автодеплой** при push

### **🔄 Процесс обновления**
```bash
git add -A
git commit -m "Описание изменений"
git push origin main
# Автоматический деплой через 2-3 минуты
```

---

## 🎯 **ЗАКЛЮЧЕНИЕ ДЛЯ АГЕНТА**

### **✅ ПОМНИ:**
1. **Проект МОДУЛЬНЫЙ** - используй правильные импорты
2. **Legacy код ВАЖЕН** - не удаляй без анализа
3. **Глобальные функции КРИТИЧНЫ** - они связывают модули
4. **Обработчики в ОДНОМ МЕСТЕ** - `event-handlers.js`
5. **Всегда убирай LOADING** анимации
6. **Тестируй ВСЕ ПАНЕЛИ** после изменений

### **🚨 НИКОГДА НЕ:**
- Не удаляй `script.js`, `ui.js`, `state.js` - это основа
- Не дублируй обработчики событий
- Не забывай про обратную совместимость
- Не изменяй структуру без понимания зависимостей

### **🎉 ЦЕЛЬ ДОСТИГНУТА:**
Проект оптимизирован для **максимальной эффективности работы Cursor AI**. Модульная архитектура, четкие зависимости, подробная документация - всё для твоей успешной работы!

**УДАЧИ В РАЗРАБОТКЕ! 🚀**