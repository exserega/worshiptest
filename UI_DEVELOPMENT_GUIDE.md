# 🎨 UI Development Guide - Agape Worship

## 📋 Основные правила UI разработки

### 1. **НИКОГДА не используйте жестко заданные цвета** ❌

**Неправильно:**
```css
color: white;
color: #ffffff;
color: black;
background: rgba(0, 0, 0, 0.9);
```

**Правильно:** ✅
```css
color: var(--color-text-primary);
color: var(--color-button-text);
background: var(--color-tooltip-bg);
```

### 2. **Всегда проверяйте контрастность в обеих темах** 🌓

**Проверочный список:**
- [ ] Текст читаем в темной теме
- [ ] Текст читаем в светлой теме
- [ ] Кнопки видны на фоне
- [ ] Иконки различимы

**Тестовая страница:** `http://localhost:8001/test-ui-fixes.html`

### 3. **Используйте семантические токены** 📝

```css
/* Основные тексты */
--color-text-primary      /* Основной текст */
--color-text-secondary    /* Вторичный текст */
--color-text-inverse      /* Инверсный текст на цветном фоне */

/* Кнопки и интерактивные элементы */
--color-button-text       /* Текст на кнопках */
--color-button-bg         /* Фон кнопок */

/* Состояния */
--color-success-text      /* Текст успеха */
--color-error-text        /* Текст ошибки */
--color-warning-text      /* Текст предупреждения */

/* Специальные компоненты */
--color-tooltip-bg        /* Фон тултипов */
--color-tooltip-text      /* Текст тултипов */
--color-notification-text /* Текст уведомлений */
```

## 📱 Мобильная разработка

### Размеры контейнеров
```css
/* Основной контейнер */
width: var(--mobile-container-width);      /* 430px */
max-width: var(--mobile-container-max-width);

/* Модальные окна */
width: var(--mobile-modal-width);          /* 380px */
max-width: var(--mobile-modal-max-width);
```

### Отступы и промежутки
```css
/* Горизонтальные отступы */
padding: 0 var(--mobile-padding-horizontal); /* 16px */

/* Вертикальные отступы */
padding: var(--mobile-padding-vertical) 0;   /* 12px */

/* Промежутки между элементами */
gap: var(--mobile-gap-small);    /* 8px */
gap: var(--mobile-gap-medium);   /* 16px */
gap: var(--mobile-gap-large);    /* 24px */
```

### Размеры кнопок
```css
height: var(--mobile-button-height);      /* 48px */
min-width: var(--mobile-button-min-width); /* 120px */
```

## 🛠️ Инструкции для Cursor AI

### При создании новых компонентов:

1. **ВСЕГДА начинайте с вопроса о теме:**
   ```
   "Какая тема сейчас активна? Нужно проверить контрастность."
   ```

2. **Используйте готовые классы:**
   ```html
   <button class="bg-interactive">Кнопка</button>
   <div class="bg-success">Успех</div>
   <div class="bg-error">Ошибка</div>
   ```

3. **Проверяйте файл токенов:**
   ```
   styles/color-tokens.css - все доступные цвета
   ```

### При правках существующих компонентов:

1. **Укажите точное расположение:**
   ```
   "Компонент находится в styles/metronome.css, строки 310-320"
   ```

2. **Опишите контекст:**
   ```
   "Это кнопка закрытия в метрономе, сейчас белый текст на красном фоне"
   ```

3. **Проверьте зависимости:**
   ```
   "Этот компонент также используется в модальных окнах"
   ```

## 🔍 Чеклист перед коммитом

- [ ] Все цвета используют CSS переменные
- [ ] Протестировано в темной теме
- [ ] Протестировано в светлой теме
- [ ] Проверены мобильные размеры (430px ширина)
- [ ] Нет `!important` без крайней необходимости
- [ ] Добавлены комментарии к сложным местам

## 🚨 Частые ошибки и их решения

### Ошибка 1: Белый текст на светлом фоне
```css
/* ❌ Неправильно */
.button {
    background: var(--primary-color);
    color: white; /* Не адаптируется к теме! */
}

/* ✅ Правильно */
.button {
    background: var(--primary-color);
    color: var(--color-text-inverse);
}
```

### Ошибка 2: Фиксированные размеры для мобильных
```css
/* ❌ Неправильно */
.container {
    width: 400px; /* Жестко задано */
}

/* ✅ Правильно */
.container {
    width: var(--mobile-container-width);
    max-width: var(--mobile-container-max-width);
}
```

### Ошибка 3: Игнорирование hover состояний
```css
/* ❌ Неправильно */
.button:hover {
    background: #darker-color; /* Жестко задано */
}

/* ✅ Правильно */
.button:hover {
    background: var(--color-button-hover-bg);
}
```

## 📚 Дополнительные ресурсы

- **Цветовые токены:** `styles/color-tokens.css`
- **Базовые переменные:** `styles/variables.css`
- **Тестовая страница:** `test-ui-fixes.html`
- **Руководство по откату:** `ROLLBACK_GUIDE.md`

---

**Последнее обновление:** 29.07.2025
**Версия:** 1.0