# 🎨 РУКОВОДСТВО ПО СТИЛЯМ И ДИЗАЙНУ - AGAPE WORSHIP

## 📚 ОСНОВНЫЕ ПРИНЦИПЫ

### Дизайн система
- **Минимализм и компактность** - особенно для мобильных устройств  
- **Двухтемная поддержка** - темная и светлая темы должны работать идеально
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

#### Светлая тема
```css
--primary-color: #339af0;      /* Основной синий */
--secondary-color: #1c7ed6;    /* Вторичный синий */
--accent-color: #1c7ed6;       /* Акцентный синий */
--background-color: #ffffff;   /* Основной фон */
--bg-secondary: #f8fafc;       /* Вторичный фон */
--bg-tertiary: #f1f5f9;        /* Третичный фон */
--text-primary: #1e293b;       /* Основной текст */
--text-secondary: #475569;     /* Вторичный текст */
--border-color: #e2e8f0;       /* Цвет границ */
--hover-bg: #e2e8f0;           /* Фон при наведении */
```

## 🎯 КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА

### 1. Контрастность
- **ВСЕГДА** проверяйте видимость элементов в ОБЕИХ темах
- Используйте достаточный контраст между текстом и фоном
- Критическая ошибка: элементы сливаются с фоном

### 2. CSS Переменные
- **ВСЕГДА** используйте CSS переменные для цветов
- НЕ хардкодьте цвета напрямую
- Исключение: специфичные цвета брендинга (#00b2bc для Agape)

### 3. Проверка тем
```css
/* Темная тема (по умолчанию) */
:root .element {
    color: var(--text-primary);
}

/* Светлая тема */
[data-theme="light"] .element {
    color: var(--text-primary);
}
```

## 🔲 КНОПКИ

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
