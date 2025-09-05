# 🎨 РУКОВОДСТВО ПО СТИЛЯМ И ДИЗАЙНУ - AGAPE WORSHIP

## ⚠️ КРИТИЧЕСКИ ВАЖНО: ТОЛЬКО ТЕМНАЯ ТЕМА!

**ВСЯ РАЗРАБОТКА ВЕДЕТСЯ ТОЛЬКО ДЛЯ ТЕМНОЙ ТЕМЫ!**
- Темная тема - ЕДИНСТВЕННАЯ активная тема
- НЕ создавайте стили для светлой темы
- НЕ тестируйте светлую тему
- НЕ используйте CSS медиа-запросы для светлой темы
- Игнорируйте все упоминания светлой темы в старом коде

## 📚 СВЯЗАННАЯ ДОКУМЕНТАЦИЯ

- [UI_VISUAL_PROBLEMS_GUIDE.md](./UI_VISUAL_PROBLEMS_GUIDE.md) - Подробное руководство по решению визуальных проблем UI

## 📚 ОСНОВНЫЕ ПРИНЦИПЫ

### Дизайн система
- **Минимализм и компактность** - особенно для мобильных устройств  
- **Только темная тема** - единственная поддерживаемая тема
- **Мобильно-ориентированный** - основной приоритет смартфоны (400-460px)
- **Единообразие** - используем общие паттерны во всем приложении

### Цветовая схема

#### Темная тема (по умолчанию)
```css
--primary-color: #22d3ee;      /* Основной голубой */
--secondary-color: #06b6d4;    /* Вторичный голубой */
--accent-color: #67e8f9;       /* Акцентный светло-голубой */
--background-color: #111827;   /* Основной фон */
--bg-secondary: #1f2937;       /* Вторичный фон */
--bg-tertiary: #1a1f2e;        /* Третичный фон */
--text-primary: #e5e7eb;       /* Основной текст */
--text-secondary: #9ca3af;     /* Вторичный текст */
--border-color: #374151;       /* Цвет границ */
--hover-bg: #374151;           /* Фон при наведении */
```

#### ⚠️ Светлая тема - НЕ ИСПОЛЬЗУЕТСЯ
Все упоминания светлой темы в коде должны игнорироваться.
Разработка ведется исключительно для темной темы.

## 🎯 КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА

### 1. Контрастность
- **ВСЕГДА** проверяйте видимость элементов в ТЕМНОЙ теме
- Используйте достаточный контраст между текстом и фоном
- Критическая ошибка: элементы сливаются с фоном
- НЕ тестируйте в светлой теме - она отключена!

#### Решение проблем с контрастностью:
```css
/* Если элемент не виден, используйте !important */
.critical-element {
    color: var(--text-primary) !important;
    background: var(--bg-tertiary) !important;
    border: 1px solid var(--border-color) !important;
}

/* Увеличивайте специфичность селекторов */
.parent .child.specific {
    /* стили с высоким приоритетом */
}

/* Для критичных элементов можно использовать конкретные цвета */
.song-key {
    background-color: #0f172a !important; /* темный фон */
    color: #9ca3af !important; /* светлый текст */
}
```

### 2. CSS Переменные
- **ВСЕГДА** используйте CSS переменные для цветов
- НЕ хардкодьте цвета напрямую (кроме критических случаев)
- Исключение: специфичные цвета брендинга (#00b2bc для Agape)

### 3. Проверка темы
- Разработка ведётся только в тёмной теме
- Тестируйте hover‑эффекты на тёмном фоне; обеспечивайте контраст

### 4. RGB значения для прозрачности
Для использования в rgba() функциях:
```css
:root {
    --accent-color-rgb: 103, 232, 249; /* Для темной темы */
    --bg-secondary-rgb: 31, 41, 55;
    --border-color-rgb: 55, 65, 81;
}

[data-theme="light"] {
    --bg-secondary-rgb: 243, 244, 246;
    --border-color-rgb: 229, 231, 235;
}
```

## 🔘 СТАНДАРТИЗИРОВАННЫЕ КНОПКИ (v580-612)

### Типы кнопок и их стили

#### 1. Кнопка "Назад" (Back)
```css
.icon-button-back {
    width: 40px;
    height: 40px;
    background: transparent;
    border: 1px solid #374151;
    color: #9ca3af !important;  /* КРИТИЧНО: светлая иконка */
    border-radius: 8px;
}
```

#### 2. Кнопка "Закрыть" (Close) 
```css
.icon-button-close {
    width: 40px;
    height: 40px;
    /* Идентично кнопке "Назад", но с иконкой fa-times */
}
```

#### 3. Кнопка "Удалить" (Delete)
```css
.icon-button-delete {
    width: 28px;  /* Меньше для компактных зон */
    height: 28px;
    background: transparent;
    border: 1px solid #374151;
    color: #9ca3af !important;
}
.icon-button-delete:hover {
    border-color: #ef4444;
    color: #ef4444 !important;
}
```

#### 4. Кнопка "Добавить" (Add)
```css
.icon-button-add {
    width: 40px !important;
    height: 40px !important;
    /* Темный вариант */
    background: transparent;
    color: #9ca3af !important;
    
    /* Голубой вариант (primary) */
    &.primary {
        background: #22d3ee;
        color: #111827 !important;  /* КРИТИЧНО: темная иконка */
    }
}
```

#### 5. Кнопки "Сохранить/Отмена" (Save/Cancel)
```css
/* CSS-only override подход */
.btn-style-save {
    background: #22d3ee !important;
    color: #111827 !important;
    border: 1px solid #22d3ee !important;
}

.btn-style-cancel {
    background: transparent !important;
    color: #9ca3af !important;
    border: 1px solid #374151 !important;
}
```

### КРИТИЧЕСКИЕ ПРАВИЛА ЦВЕТОВ

#### ✅ ПРАВИЛЬНО:
```css
/* Темный фон → Светлые иконки/текст */
.dark-background {
    background: #1a1f2e;
    color: #9ca3af !important;
}

/* Голубой фон → Темные иконки/текст */
.primary-background {
    background: #22d3ee;
    color: #111827 !important;
}
```

#### ❌ НЕПРАВИЛЬНО:
```css
/* НИКОГДА не делай темный текст на темном фоне */
.dark-background {
    color: #111827;  /* НЕ ВИДНО! */
}

/* НИКОГДА не делай светлый текст на светлом фоне */
.light-background {
    color: #e5e7eb;  /* НЕ ВИДНО! */
}
```

### Размеры кнопок
- **Стандартный**: 40x40px (основные действия)
- **Компактный**: 32x32px (в модалках, панелях)
- **Мини**: 28x28px (удаление в карточках)

### Важные детали реализации

1. **Всегда используй `!important` для цветов** - предотвращает переопределение
2. **CSS-only подход для Save/Cancel** - сохраняет оригинальные размеры
3. **Проверяй hover состояния** - должны быть видны в темной теме
4. **gap: 8px для иконка+текст** - стандартный отступ

## 📝 Паттерн: Редактор песен (обновлено)
- Верхняя правая кнопка закрытия `icon-button-small`, фиксированная, без смещений при hover
- Две строки кнопок действий (2+2), одинаковая высота (min-height: 40px), компактные отступы
- Подтверждения перед критичными действиями: сохранить глобально, удалить персональную, восстановить оригинал
- «Восстановить оригинал» удаляет глобальную и персональную версии, возвращая текст из Google Sheets (base)
- Мобильный приоритет: минимальные отступы, textarea занимает максимум высоты, `font-size: 16px` для ввода

### Документация
- Полный план: `UI_BUTTONS_STANDARDIZATION_PLAN.md`
- Анализ проблем: `UI_BUTTONS_ANALYSIS.md`  
- Критические правила: `CRITICAL_COLOR_RULE.md`

## 🔹 Специальные правила (обновлено)

### Кнопка очистки поиска (Clear-X)
- Размер: 32x32, `padding: 0`, `box-sizing: border-box`, `border-radius: 8px`.
- Цвета: на темном фоне — светлая иконка; на голубом фоне — темная.
- Центрирование: `display: flex; align-items: center; justify-content: center;`, иконка `line-height: 1; margin: 0`.
- Скрытие лупы: контейнер со строкой поиска должен скрывать лупу при появлении крестика через `:has(.clear-search-btn:not([style*="display: none"])) .search-icon { display: none !important; }`.

### Поиск (главная)
- Результаты: приоритет совпадений по НАЗВАНИЮ над совпадениями в тексте (`searchSongsWithCache`).

### Копирование текста песни
- Копируется только ВИДИМЫЙ контент из `#song-display` (`innerText`), с учетом режимов (только аккорды/только текст/оба) + fallback для буфера обмена.

### Заголовки блоков песни
- На главной странице у заголовков блоков (legend) убраны иконки/эмодзи — только текст.

## 🎹 ПОРЯДОК ОТОБРАЖЕНИЯ ИНСТРУМЕНТОВ

Единый порядок во всем приложении:
1. Вокал
2. Клавиши
3. Электрогитара
4. Барабаны/Кахон (взаимоисключающие)
5. Бас-гитара
6. Акустическая гитара
7. Звукооператор
8. Другое

```javascript
function getInstrumentOrder(instrument) {
    const order = {
        'вокал': 1,
        'клавиши': 2,
        'электрогитара': 3,
        'барабаны': 4,
        'кахон': 4,
        'бас-гитара': 5,
        'акустическая гитара': 6,
        'звукооператор': 7
    };
    return order[instrument.toLowerCase()] || 8;
}
```

## 🎨 КНОПКИ

### Основная кнопка
```css
.btn-primary {
    background: var(--primary-color);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
```

### Вторичная кнопка
```css
.btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}
```

### Иконочная кнопка
```css
.icon-button {
    width: 40px;
    height: 40px;
    padding: 0;
    background: var(--bg-tertiary);
    border: none;
    border-radius: 10px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.icon-button:hover {
    background: var(--primary-color);
    color: white;
    transform: translateY(-1px);
}
```

### Прозрачная кнопка с primary оттенком
```css
.btn-transparent {
    background: rgba(34, 211, 238, 0.1); /* Темная тема */
    border: 1px solid rgba(34, 211, 238, 0.2);
    color: var(--primary-color);
}

[data-theme="light"] .btn-transparent {
    background: rgba(51, 154, 240, 0.08); /* Светлая тема */
    border-color: rgba(51, 154, 240, 0.2);
}

.btn-transparent:hover {
    background: rgba(34, 211, 238, 0.2);
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
}
```

## 🔘 КНОПКИ С ИКОНКАМИ - КРИТИЧЕСКИЕ ПРАВИЛА

### ⚠️ ГЛАВНАЯ ПРОБЛЕМА: Темные иконки на темном фоне
**НЕДОПУСТИМО:** Создавать кнопки с темными иконками на темном фоне - они становятся невидимыми!

### ✅ ПРАВИЛЬНЫЙ ПОДХОД для темной темы:

```css
/* ПРАВИЛЬНО: Базовые стили кнопки с иконкой */
.icon-btn {
    /* Размеры и форма */
    width: 36px;
    height: 36px;
    padding: 0;  /* ВАЖНО: убирает дефолтные отступы */
    display: flex;
    align-items: center;
    justify-content: center;
    
    /* Фон и границы */
    background: var(--bg-tertiary);  /* Темный фон */
    border: 1px solid var(--border-color);
    border-radius: 8px;
    
    /* КРИТИЧЕСКИ ВАЖНО: Светлый цвет иконки */
    color: var(--text-secondary) !important;  /* Светло-серый */
    
    /* Прочее */
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;  /* Сохраняет квадратную форму */
}

/* ОБЯЗАТЕЛЬНО: Иконки внутри наследуют цвет и центрированы */
.icon-btn i,
.icon-btn svg {
    color: inherit !important;
    font-size: 0.875rem;  /* Контролируемый размер */
    line-height: 1;       /* Убирает лишнее пространство */
    margin: 0;            /* Нет внешних отступов */
    padding: 0;           /* Нет внутренних отступов */
}
```

### 📋 Чек-лист для кнопок с иконками:
1. ✅ Темный фон: `var(--bg-tertiary)` или `var(--bg-secondary)`
2. ✅ Светлая иконка: `var(--text-secondary)` или `var(--text-primary)`
3. ✅ Используйте `!important` для цвета, чтобы переопределить стили FontAwesome
4. ✅ Добавьте `color: inherit !important` для вложенных иконок
5. ✅ Центрирование: `display: flex; align-items: center; justify-content: center;`
6. ✅ Обязательно: `padding: 0` для кнопки
7. ✅ Для иконок: `line-height: 1; margin: 0; padding: 0;`
8. ✅ Добавьте `flex-shrink: 0` чтобы кнопка оставалась квадратной

### 🎨 Состояния кнопок:

```css
/* Hover состояние - меняем и фон, и цвет */
.icon-btn:hover {
    background: rgba(34, 211, 238, 0.1);
    border-color: var(--primary-color);
    color: var(--primary-color) !important;
}

/* Активное состояние */
.icon-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white !important;
}

/* Кнопка удаления - красная по умолчанию */
.icon-btn.delete {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444 !important;
}

.icon-btn.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    transform: scale(1.05);
}
```

### ❌ ЧАСТЫЕ ОШИБКИ:
```css
/* НЕПРАВИЛЬНО: Темная иконка на темном фоне */
.bad-button {
    background: #1a1f2e;
    color: #374151;  /* Темно-серый - НЕ ВИДНО! */
}

/* НЕПРАВИЛЬНО: Забыли !important */
.bad-button {
    color: var(--text-secondary);  /* FontAwesome может переопределить */
}

/* НЕПРАВИЛЬНО: Неправильное центрирование */
.bad-button {
    text-align: center;  /* Не работает для flex */
    vertical-align: middle;  /* Не работает для flex */
}
```

### 🔧 Отладка проблем с видимостью:
1. Проверьте контраст в браузере (DevTools → Accessibility)
2. Убедитесь, что `color` применяется с `!important`
3. Проверьте, что иконка наследует цвет родителя
4. Используйте инспектор для проверки computed styles

## 🎨 ИКОНКИ

### Правила для SVG иконок
1. **ВСЕГДА** используйте `currentColor` для stroke/fill
2. Размер по умолчанию: 20x20 или 24x24
3. Стиль: outline (не filled)
4. Толщина линий: stroke-width="2"

```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="..." stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### CSS для иконок
```css
.icon-button svg {
    width: 20px;
    height: 20px;
}

.icon-button svg path {
    stroke: currentColor !important;
    fill: none !important;
}
```

## 🃏 КАРТОЧКИ СОБЫТИЙ

### Структура карточки в режиме списка
```html
<div class="event-card">
    <div class="event-info">
        <div class="event-header-redesigned">
            <div class="event-title-block">
                <h3 class="event-name">Название события</h3>
            </div>
            <div class="event-datetime">
                <div class="event-date">15 янв</div>
                <div class="event-time">19:00</div>
            </div>
        </div>
        <!-- Ведущий и участники -->
    </div>
    <div class="event-footer">
        <!-- Количество песен и действия -->
    </div>
</div>
```

### Стили карточки
```css
.event-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
}

.event-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
```

### Интерактивный список участников
```css
.event-participants-toggle {
    cursor: pointer;
    user-select: none;
}

.participants-summary:hover {
    color: var(--primary-color);
}

.toggle-icon {
    transition: transform 0.2s;
}

/* Развернутое состояние */
.event-participants-detail {
    animation: slideDown 0.2s ease-out;
}
```

## 🎵 ПЛЕЕР СОБЫТИЙ

### Структура шапки плеера
```html
<!-- Структура из 2 строк -->
<div class="player-header-row-1">
    <!-- Левая часть: закрытие и переключатель панели -->
    <div class="player-header-left">
        <button class="player-close-btn">×</button>
        <button class="player-toggle-controls-btn">≡/↑</button>
    </div>
    <!-- Центр: номер песни -->
    <span class="player-song-number">Песня 1/6</span>
    <!-- Правая часть: навигация -->
    <div class="player-nav-compact">
        <button>←</button>
        <button>→</button>
    </div>
</div>
<div class="player-header-row-2">
    <span class="player-song-name">Название песни</span>
    <div class="player-song-key-bpm">
        <span class="player-key">C</span>
        <span class="divider">|</span>
        <span class="player-bpm">120 BPM</span>
    </div>
</div>
```

### Стили плеера
```css
/* Использование safe-area для iPhone */
.event-player-header {
    padding-top: env(safe-area-inset-top, 0);
}

/* Grid layout для выравнивания */
.player-header-row-1 {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
}

/* Блок тональности/BPM */
.player-song-key-bpm {
    background: rgba(var(--accent-color-rgb), 0.1);
    padding: 4px 12px;
    border-radius: 16px;
    border: 1px solid rgba(var(--accent-color-rgb), 0.2);
}
```

### Критические стили плеера (ОБНОВЛЕНО)
```css
/* ВАЖНО: Форсированные цвета для единообразия */
.event-player-overlay {
    --bg-primary: #111827 !important;
    --text-primary: #f3f4f6 !important;
}

/* Выпадающий список тональностей - ФИКСИРОВАННЫЕ размеры */
.player-key-dropdown {
    width: 150px !important;
    min-width: 150px !important;
    max-width: 150px !important;
    height: 420px !important;
    background: #1f2937 !important;
}

/* Иконки в кнопках - ОБЯЗАТЕЛЬНО с !important */
.player-control-btn i,
.player-control-btn .fas {
    color: var(--text-primary) !important;
}

/* Активное состояние кнопок */
.player-control-btn.active i {
    color: var(--bg-primary) !important;
}
```

### Управление видимостью панели инструментов
- Кнопка-переключатель меняет иконку: ↑ (скрыть) / ≡ (показать)
- Состояние сохраняется в localStorage
- Избегаем визуального конфликта двух крестиков

### Базовый размер шрифта песен
- Мобильные устройства: 12px (увеличен с 10px)
- Десктоп: 16px
- Пользователь может изменять размер кнопками

## 📱 МОДАЛЬНЫЕ ОКНА

### Структура
```html
<div class="modal-overlay"></div>
<div class="modal-content">
    <div class="modal-header">
        <h2>Заголовок</h2>
        <button class="close-btn">×</button>
    </div>
    <div class="modal-body">
        <!-- Контент -->
    </div>
    <div class="modal-footer">
        <button class="btn btn-secondary">Отмена</button>
        <button class="btn btn-primary">Сохранить</button>
    </div>
</div>
```

### Стили модального окна
```css
.modal-content {
    background: var(--bg-secondary);
    border-radius: 12px;
    max-width: 520px;
    width: 100%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Мобильная адаптация */
@media (max-width: 480px) {
    .modal-content {
        max-width: calc(100vw - 1rem);
        margin: 0.5rem;
    }
}
```

## 🎶 СПИСОК ПЕСЕН

### Карточка песни
```css
.song-item {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 14px 16px;
    transition: all 0.2s ease;
}

/* Hover эффект с полосой-индикатором */
.song-item:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.song-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--accent-color);
    transform: scaleX(0);
    transition: transform 0.2s ease;
}

.song-item:hover::before {
    transform: scaleX(1);
}
```

### Метки тональности и BPM
```css
/* Тональность с квадратной формой */
.song-key {
    background: rgba(var(--accent-color-rgb), 0.15);
    color: var(--accent-color);
    padding: 2px 6px;
    border-radius: 4px; /* Квадратная форма с закругленными краями */
    font-size: 11px;
    font-weight: 600;
    border: 1px solid rgba(var(--accent-color-rgb), 0.3);
}

/* BPM без фона */
.song-bpm {
    color: var(--text-secondary);
    font-size: 11px;
}
```

## 📋 ФОРМЫ

### Поля ввода
```css
.form-control {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.9375rem;
    transition: all 0.2s;
    line-height: 1.4;
    min-height: 48px;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
}
```

### Select элементы
```css
select.form-control {
    appearance: none;
    background-image: url("data:image/svg+xml,...");
    background-position: right 1rem center;
    padding-right: 2.5rem;
    line-height: 1.4;
    /* Важно для правильного отображения текста */
    display: block;
    box-sizing: border-box;
}
```

### Labels
```css
.form-group label {
    display: block;
    margin-bottom: 0.25rem; /* Близко к полю */
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}
```

### Отступы между группами
```css
.form-group {
    margin-bottom: 1.5rem; /* Достаточный отступ между блоками */
}

/* Мобильная версия */
@media (max-width: 480px) {
    .form-group {
        margin-bottom: 1rem;
    }
}
```

## 🔍 DROPDOWN И ПОИСК

### Подсветка совпадений
```javascript
function highlightMatch(text, query) {
    if (!query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return `${before}<strong>${match}</strong>${after}`;
}
```

### Стили для подсветки
```css
.user-item strong,
.leader-item strong {
    color: var(--primary-color);
    font-weight: 600;
}
```

### Важно для dropdown
- Используйте DOM манипуляцию вместо innerHTML для избежания пробелов
- НЕ добавляйте переносы строк в HTML шаблоны
- Генерируйте HTML в одну строку

## 📐 ОТСТУПЫ И РАЗМЕРЫ

### Стандартные отступы
- **Минимальный**: 0.25rem (4px)
- **Малый**: 0.5rem (8px)
- **Средний**: 0.75rem (12px)
- **Обычный**: 1rem (16px)
- **Большой**: 1.5rem (24px)
- **Очень большой**: 2rem (32px)

### Радиусы скругления
- **Малый**: 4px
- **Средний**: 6px
- **Обычный**: 8px
- **Большой**: 10px
- **Очень большой**: 12px

### Высота элементов
- **Кнопка**: min-height: 40px
- **Поле ввода**: min-height: 48px (desktop), 44px (mobile)
- **Иконочная кнопка**: 40x40px (desktop), 36x36px (mobile)

## 🚀 АНИМАЦИИ

### Стандартные переходы
```css
transition: all 0.2s ease;
```

### Hover эффекты
```css
/* Поднятие */
transform: translateY(-1px);

/* Масштабирование */
transform: scale(1.05);

/* При клике */
:active {
    transform: scale(0.95);
}
```

### Появление модальных окон
```css
@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

## 📱 МОБИЛЬНАЯ АДАПТАЦИЯ

### Брейкпоинты
- **Планшет**: 768px
- **Мобильный**: 480px
- **Маленький мобильный**: 390px

### Правила для мобильных
1. Уменьшайте отступы, но сохраняйте читаемость
2. Увеличивайте зону клика до минимум 44x44px
3. Используйте `font-size: 16px` для input чтобы избежать зума на iOS
4. При открытой клавиатуре поднимайте модальные окна

```css
/* Пример адаптации при клавиатуре */
.modal:has(input:focus) .modal-content {
    transform: translateY(-20vh);
    transition: transform 0.3s ease;
}
```

## ⚠️ ЧАСТЫЕ ОШИБКИ

### 1. Невидимые элементы в одной из тем
**Проблема**: Элемент сливается с фоном
**Решение**: Всегда проверяйте обе темы

### 2. Обрезанный текст в селекторах
**Проблема**: Буквы с выносными элементами (p, y, g) обрезаются
**Решение**: Правильная line-height и padding

### 3. Пробелы в подсветке поиска
**Проблема**: Лишние пробелы между `<strong>` и остальным текстом
**Решение**: Генерировать HTML без переносов строк

### 4. Кнопка не двигается при hover
**Проблема**: Конфликт transform в hover и основном состоянии
**Решение**: Убрать transform из hover или использовать другой эффект

### 5. Неправильное отображение даты из календаря
**Проблема**: Дата смещается на день назад при передаче в модальное окно
**Решение**: Использовать локальные компоненты даты вместо toISOString()

### 6. Отсутствие данных в dataset элементов
**Проблема**: Некоторые поля (например, songCount) не сохраняются в dataset
**Решение**: Включить все необходимые поля при формировании данных для dataset

## 🔧 ОТЛАДКА СТИЛЕЙ

### Инструменты
```css
/* Временная подсветка для отладки */
* {
    outline: 1px solid red !important;
}

/* Проверка контрастности */
.test-contrast {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
}
```

## 📦 ВЕРСИОНИРОВАНИЕ И ДЕПЛОЙ

### Service Worker
При каждом изменении ОБЯЗАТЕЛЬНО обновляйте версию:
```javascript
// Service Worker v463 - описание изменений
const CACHE_NAME = 'agape-worship-cache-v463';
```

### CSS версионирование
При изменении стилей добавляйте версию в HTML:
```html
<link rel="stylesheet" href="styles.css?v=463">
```

### Формат коммитов
```bash
# Исправления
git commit -m "fix: описание проблемы (v463)"

# Новые функции  
git commit -m "feat: новая функция (v463)"

# Стили
git commit -m "style: изменения стилей (v463)"
```

### Процесс деплоя
1. Внести изменения
2. Обновить версию Service Worker
3. Обновить версию CSS в HTML (если менялись стили)
4. Коммит с описательным сообщением
5. Push в main ветку
6. Проверить деплой через 1-2 минуты

### Команды для проверки
```bash
# Найти хардкод цветов
grep -r "#[0-9a-fA-F]\{3,6\}" --include="*.css"

# Найти !important
grep -r "!important" --include="*.css" | wc -l

# Проверить размер CSS файлов
find . -name "*.css" -exec wc -l {} + | sort -n
```

---
**Последнее обновление**: Январь 2025
**Автор**: AI Agent для Agape Worship
**Критичность**: ВЫСОКАЯ
