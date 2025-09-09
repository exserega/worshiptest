# 📋 Полное руководство по панели сет-листов - AGAPE WORSHIP

## 📑 Оглавление
1. [Общий обзор](#общий-обзор)
2. [Архитектура и структура](#архитектура-и-структура)
3. [Визуальный дизайн](#визуальный-дизайн)
4. [HTML структура](#html-структура)
5. [CSS стили](#css-стили)
6. [JavaScript модули](#javascript-модули)
7. [Интеграция с Firebase](#интеграция-с-firebase)
8. [Кнопки и их функционал](#кнопки-и-их-функционал)
9. [Анимации и взаимодействие](#анимации-и-взаимодействие)
10. [Известные проблемы и решения](#известные-проблемы-и-решения)
11. [История изменений](#история-изменений)

## 🎯 Общий обзор

Панель сет-листов - это выдвижная боковая панель справа, предоставляющая быстрый доступ к управлению сет-листами. С январь 2025 года панель использует карточный дизайн вместо выпадающего списка.

### Ключевые характеристики:
- **Карточный интерфейс** - каждый сет-лист представлен отдельной карточкой
- **Раскрывающиеся карточки** - показывают песни и действия при клике
- **Два тоновый дизайн** - визуальное разделение заголовка и списка песен
- **Полная ширина** - оптимальное использование пространства (отступы 2px)
- **Фиксированная прокрутка** - только область карточек прокручивается

## 🏗️ Архитектура и структура

### Файловая структура:
```
/
├── index.html                    # HTML структура панели
├── styles.css                    # Основные стили (строки 5085-5530)
├── ui.js                        # Legacy интеграция
├── src/
│   ├── ui/
│   │   └── setlist-cards.js    # Модуль управления карточками
│   ├── main/
│   │   └── event-handlers.js   # Инициализация обработчиков
│   └── js/
│       └── state/
│           └── appState.js     # Централизованное управление состоянием
└── documentation/
    ├── SETLIST_PANEL_COMPLETE_GUIDE.md     # Этот файл
    ├── SETLIST_PANEL_NEW_DESIGN.md         # Базовое описание
    ├── SETLIST_PANEL_BACKUP.md             # Старая реализация
    └── [другие файлы документации]
```

### Модульная архитектура:
- **setlist-cards.js** - ES6 модуль с функциями для карточек
- **appState.js** - централизованное хранилище состояния
- **Динамическая загрузка** - модуль загружается по требованию
- **Обратная совместимость** - fallback на старую реализацию

## 🎨 Визуальный дизайн

### Структура панели:
```
┌────────────────────────────┐
│  Сет-листы    🏛️ Алматы    │ ← Заголовок с филиалом
├────────────────────────────┤
│  [➕ Создать сет-лист]      │ ← Кнопка создания
├────────────────────────────┤
│┌──────────────────────────┐│ ↑
││  📋 Воскресное служение  ││ │
││  👤 Иван Иванов          ││ │ Прокручиваемая
││  5 песен • 29.12.2024    ││ │ область карточек
│└──────────────────────────┘│ │
│┌──────────────────────────┐│ │
││  📋 Молодежное собрание  ││ ↓
│└──────────────────────────┘│
└────────────────────────────┘
```

### Развернутая карточка:
```
╔══════════════════════════════╗ ← Усиленная подсветка (2px border + glow)
║  📋 Воскресное служение  [🗑️] ║
║  👤 Иван Иванов               ║
║  5 песен • 29.12.2024         ║
╠══════════════════════════════╣ ← Двухтоновый дизайн
║  ♪ Славьте Господа   [D] 120 ║ ← Темный фон (#0f172a)
║  ♪ Ты достоин        [G] 96  ║
║  ♪ Святый Бог        [C] 72  ║
╠══════════════════════════════╣
║ [✏️ Изменить] [▶️] [📅] [📦]  ║ ← Кнопки действий
╚══════════════════════════════╝
```

### Цветовая схема (темная тема):
- **Фон панели**: `#0f172a` (--bg-primary)
- **Фон карточки**: `#1a1f2e` (--bg-tertiary)
- **Фон песен**: `#0f172a` (самый темный)
- **Граница**: `#374151` (--border-color)
- **Акцент**: `#22d3ee` (--primary-color)
- **Текст**: `#e5e7eb` (основной), `#9ca3af` (вторичный)

## 📝 HTML структура

```html
<div id="setlists-panel" class="slide-panel right-panel">
    <!-- Заголовок панели -->
    <div class="panel-header-section">
        <div class="panel-header-row">
            <div class="panel-title-group">
                <h3 class="panel-title">Сет-листы</h3>
                <button id="setlist-branch-btn" class="icon-button-header branch-button">
                    <i class="fas fa-church"></i>
                    <span id="current-branch-name">Алматы</span>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Кнопка создания -->
    <div class="panel-create-section">
        <button id="create-new-setlist-header-btn" class="icon-button-header primary full-width">
            <i class="fas fa-plus"></i>
            <span>Создать сет-лист</span>
        </button>
    </div>
    
    <!-- Попап филиала (скрыт) -->
    <div id="branch-selector-popup" class="branch-selector-popup" style="display: none;">
        <select id="setlist-branch-selector" class="branch-selector">
            <!-- Опции загружаются динамически -->
        </select>
    </div>
    
    <!-- Контейнер карточек -->
    <div id="setlists-cards-container" class="setlists-cards-container">
        <!-- Карточки генерируются динамически -->
    </div>
    
    <!-- Скрытые элементы для обратной совместимости -->
    <div style="display: none;">
        <!-- Старые элементы для legacy кода -->
    </div>
</div>
```

## 🎨 CSS стили

### Критические стили панели:
```css
/* Основная панель */
#setlists-panel {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    overflow: hidden !important;  /* Важно для правильной прокрутки */
}

/* Контейнер карточек */
.setlists-cards-container {
    flex: 1;                      /* Занимает всё доступное место */
    overflow-y: auto;             /* Прокрутка при переполнении */
    overflow-x: hidden;
    padding: 2px;                 /* Минимальные отступы */
    padding-bottom: 20px;         /* Отступ для последней карточки */
    min-height: 0;                /* КРИТИЧНО для flex + overflow */
}

/* Развернутая карточка */
#setlists-panel .setlist-card.expanded {
    border: 2px solid var(--primary-color) !important;
    background: linear-gradient(to bottom, #1a1f2e 85px, #0f172a 85px) !important;
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.3),
                0 0 40px rgba(34, 211, 238, 0.1),
                inset 0 0 1px rgba(34, 211, 238, 0.5) !important;
}
```

### Важные CSS правила:
1. **min-height: 0** - критично для работы flexbox с overflow
2. **linear-gradient** - создает двухтоновый эффект
3. **box-shadow** - усиленная подсветка для развернутой карточки
4. **!important** - необходим для переопределения legacy стилей

## 💻 JavaScript модули

### src/ui/setlist-cards.js:
```javascript
// Основные экспорты
export function renderSetlistCards(setlists, onSelect, onDelete)
export function createSetlistCard(setlist, onSelect, onDelete)
export function toggleCard(cardId)
export function activateSetlist(setlist)
export function initCardHandlers()

// Внутренние функции
function updateCurrentBranchName()     // Обновление названия филиала
function updateBranchSelector()        // Заполнение селектора филиалов
function canManageEvents()             // Проверка прав на календарь
function formatDate(timestamp)         // Форматирование даты
function getSongCountText(count)       // Склонение слова "песня"
```

### Интеграция с ui.js:
```javascript
// Динамическая загрузка модуля
const module = await import('/src/ui/setlist-cards.js');
if (module && module.renderSetlistCards) {
    module.renderSetlistCards(setlists, onSetlistSelect, onSetlistDelete);
} else {
    // Fallback на старую реализацию
    renderLegacySetlists();
}
```

## 🔥 Интеграция с Firebase

### Структура данных сет-листа:
```javascript
{
    id: "setlist123",
    name: "Воскресное служение",
    createdBy: "userId",
    createdByName: "Иван Иванов",    // Денормализовано
    createdAt: Timestamp,
    branchId: "almaty",
    songs: [
        {
            songId: "song1",
            order: 0,
            preferredKey: "D",         // Тональность из сет-листа
            key: "D"                   // Альтернативное поле
        }
    ]
}
```

### Синхронизация имени автора

При смене имени пользователя (страница settings) его новое имя автоматически
синхронизируется во всех сет‑листах, где он автор:

- Активные: коллекция `worship_setlists` — поле `createdByName` обновляется для всех документов, где `createdBy == uid`.
- Архивные: коллекция `archive_setlists` — также обновляется `createdByName` по совпадению `createdBy`.

Это обеспечивает корректное отображение автора в карточках без дополнительных запросов к профилю.


### Маппинг данных в карточке:
```javascript
// Правильное извлечение данных
const creator = setlist.createdByName || setlist.creatorName || 'Неизвестно';
const date = setlist.createdAt?.toDate ? 
    setlist.createdAt.toDate() : 
    new Date(setlist.createdAt);

// Получение тональности и BPM
const displayKey = setlistSong.preferredKey || setlistSong.key;
const displayBpm = songDetails?.BPM || songDetails?.bpm;
```

## 🔘 Кнопки и их функционал

### Кнопки в заголовке:
| Кнопка | Класс | Функция | Права |
|--------|-------|---------|-------|
| 🏛️ Филиал | `branch-button` | Выбор филиала | Все |
| ➕ Создать | `create-setlist-button` | Новый сет-лист | user+ |

### Кнопки в карточке:
| Кнопка | Класс | Функция | Права |
|--------|-------|---------|-------|
| 🗑️ Удалить | `card-delete-btn` | Удаление | owner/admin |
| ✏️ Изменить | `card-action-btn` | Редактирование песен | user+ |
| ▶️ Презентация | `card-action-btn` | Запуск плеера | Все |
| 📅 В календарь | `card-action-btn` | Добавить в событие | admin/moderator |
| 📦 В архив | `card-action-btn` | Архивировать | user+ |

### Стандартизация кнопок:
- Все кнопки используют стандартизированные классы
- Темный фон → светлые иконки/текст
- Голубой фон → темные иконки/текст
- Размеры: 40x40px (обычные), 32x32px (компактные), 28x28px (удаление)

## 🎭 Анимации и взаимодействие

### Анимации:
```css
/* Раскрытие карточки */
.card-songs, .card-actions {
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.2s ease;
}

.setlist-card.expanded .card-songs {
    max-height: 600px;
    opacity: 1;
}
```

### Состояния карточки:
1. **Обычное** - компактный вид с основной информацией
2. **Hover** - легкая подсветка границы
3. **Expanded** - полная информация + действия
4. **Active** - текущий активный сет-лист

## ⚠️ Известные проблемы и решения

### 1. Обрезание последней карточки
**Проблема**: При множестве карточек последняя обрезалась
**Решение**: 
- `padding-bottom: 20px` в контейнере
- `min-height: 0` для правильной работы flex
- `height: 100%` на панели

### 2. Темные иконки на темном фоне
**Проблема**: Иконки не видны на темном фоне
**Решение**: 
- Строгое правило: темный фон → светлые иконки (#9ca3af)
- Использование `!important` в критических местах
- Документирование в CRITICAL_COLOR_RULE.md

### 3. TypeError: object is not extensible
**Проблема**: Невозможно изменить state объект
**Решение**: 
- Централизованное управление через appState.js
- Использование setter функций (setBranches, etc.)

### 4. Тональность и BPM не отображаются
**Проблема**: Данные есть, но не показываются
**Решение**:
- Правильный маппинг: preferredKey из сет-листа
- BPM из глобальных данных песни
- Отладочные логи для диагностики

## 📅 История изменений

### v612 (Январь 2025) - Текущая версия
- ✅ Усиленная подсветка развернутых карточек
- ✅ Упрощенный селектор филиала
- ✅ Расширенные карточки (отступы 2px)
- ✅ Исправлена прокрутка последней карточки

### v600-611 (Январь 2025)
- ✅ Двухтоновый дизайн карточек
- ✅ Правильное отображение тональности/BPM
- ✅ Центрированные badges
- ✅ Исправлены проблемы с цветами кнопок

### v580-599 (Декабрь 2024)
- ✅ Переход на карточный дизайн
- ✅ Интеграция с календарем
- ✅ Стандартизация кнопок
- ✅ Модульная архитектура

## 🚀 Рекомендации для будущих разработчиков

### При добавлении функционала:
1. Используй модульную архитектуру в /src/ui/
2. Следуй паттерну карточек из setlist-cards.js
3. Обновляй Service Worker версию
4. Документируй изменения

### При исправлении багов:
1. Проверь import пути (особенно logger.js)
2. Используй Firebase v8 синтаксис
3. Тестируй с разными правами доступа
4. Проверяй контрастность цветов

### При стилизации:
1. Используй CSS переменные
2. Добавляй !important для критичных стилей
3. Проверяй min-height: 0 для flex контейнеров
4. Следуй двухтоновому дизайну

## 📚 Связанная документация

- [AI_AGENT_CRITICAL_GUIDE.md](./AI_AGENT_CRITICAL_GUIDE.md) - Основное руководство
- [STYLE_GUIDE.md](./STYLE_GUIDE.md) - Руководство по стилям
- [UI_BUTTONS_STANDARDIZATION_PLAN.md](./UI_BUTTONS_STANDARDIZATION_PLAN.md) - Стандартизация кнопок
- [CRITICAL_COLOR_RULE.md](./CRITICAL_COLOR_RULE.md) - Правила цветов
- [STATE_MANAGEMENT_FIX.md](./STATE_MANAGEMENT_FIX.md) - Управление состоянием

---
**Последнее обновление**: Январь 2025
**Service Worker**: v612
**Статус**: Полностью функциональна