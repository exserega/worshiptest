# 🎨 РУКОВОДСТВО ПО UI РАЗРАБОТКЕ ДЛЯ CURSOR AI

## 🚨 КРИТИЧЕСКИ ВАЖНО ПРОЧИТАТЬ ПЕРЕД ЛЮБЫМИ UI ИЗМЕНЕНИЯМИ

### 🎯 **ОСНОВНЫЕ ПРИНЦИПЫ**

1. **НИКОГДА НЕ ИСПОЛЬЗУЙ ХАРДКОД ЦВЕТОВ**
   ```css
   ❌ НЕПРАВИЛЬНО:
   color: white;
   color: black;
   color: #ffffff;
   color: #000000;
   
   ✅ ПРАВИЛЬНО:
   color: var(--text-primary);
   color: var(--icon-primary);
   color: var(--text-on-primary);
   ```

2. **ИСПОЛЬЗУЙ СИСТЕМУ РАЗМЕРОВ**
   ```css
   ❌ НЕПРАВИЛЬНО:
   padding: 13px 17px;
   margin: 11px;
   gap: 9px;
   
   ✅ ПРАВИЛЬНО:
   padding: var(--space-md) var(--space-lg);
   margin: var(--space-md);
   gap: var(--space-sm);
   ```

3. **СЛЕДУЙ МОДУЛЬНОЙ СТРУКТУРЕ**
   ```
   ❌ НЕ ПИШИ В styles.css
   ✅ НАЙДИ ПРАВИЛЬНЫЙ МОДУЛЬ:
   - Кнопки → styles/buttons.css
   - Панели → styles/panels.css
   - Цвета → styles/color-system.css
   ```

---

## 🎨 **СИСТЕМА ЦВЕТОВ**

### **📋 ОСНОВНЫЕ ПЕРЕМЕННЫЕ:**
```css
/* Текст */
--text-primary    /* Основной текст */
--text-secondary  /* Вторичный текст */
--text-on-primary /* Текст на цветном фоне */

/* Иконки */
--icon-primary    /* Основные иконки */
--icon-secondary  /* Вторичные иконки */
--icon-on-primary /* Иконки на кнопках */

/* Фон */
--surface-primary   /* Основной фон */
--surface-secondary /* Фон контейнеров */
```

### **🎯 ПРАВИЛА ДЛЯ ИКОНОК:**
```css
/* На обычном фоне */
.icon { color: var(--icon-primary); }

/* На кнопках */
.button .icon { color: var(--icon-on-primary); }

/* Вторичные элементы */
.secondary .icon { color: var(--icon-secondary); }
```

---

## 📏 **СИСТЕМА РАЗМЕРОВ**

### **📋 ОСНОВНЫЕ ПЕРЕМЕННЫЕ:**
```css
/* Отступы */
--space-xs  /* 4px  - очень маленькие */
--space-sm  /* 8px  - маленькие */
--space-md  /* 12px - средние */
--space-lg  /* 16px - большие */
--space-xl  /* 24px - очень большие */

/* Размеры кнопок */
--size-button-sm /* 32px высота */
--size-button-md /* 40px высота */
--size-button-lg /* 48px высота */
```

### **🎯 UTILITY КЛАССЫ:**
```css
/* Padding */
.p-sm, .p-md, .p-lg
.px-sm, .py-md /* горизонтальный/вертикальный */

/* Margin */
.m-sm, .m-md, .m-lg
.mx-sm, .my-md

/* Размеры кнопок */
.btn-sm, .btn-md, .btn-lg

/* Размеры иконок */
.icon-sm, .icon-md, .icon-lg
```

---

## 🗺️ **НАВИГАЦИЯ ПО ФАЙЛАМ**

### **📁 ОСНОВНЫЕ МОДУЛИ:**
```
🎮 КНОПКИ
└── styles/buttons.css:6-20 (основные)
└── styles/buttons.css:22-30 (иконки)

📱 ПАНЕЛИ  
└── styles/panels.css:1-100 (сетлисты)
└── styles/panels.css:200-300 (репертуар)

🎵 ПЕСНИ
└── styles/song-display.css:1-100
└── styles/components.css:30-100 (блоки)

📱 АДАПТИВНОСТЬ
└── styles/responsive.css:1-200 (мобильные)
└── styles/responsive.css:300-500 (панели)
```

### **🔍 ПОИСК ПО МАРКЕРАМ:**
```css
/* В CSS файлах ищи: */
/* CURSOR_MARKER: BUTTON_название */
/* CURSOR_MARKER: SIZE_элемент */
/* CURSOR_MARKER: COLOR_компонент */
```

---

## 🛠️ **АЛГОРИТМ РАБОТЫ С UI**

### **1️⃣ ПЕРЕД ИЗМЕНЕНИЯМИ:**
```
1. Определи тип элемента (кнопка/панель/текст)
2. Найди правильный CSS модуль
3. Проверь существующие переменные
4. Используй систему размеров
```

### **2️⃣ ИЗМЕНЕНИЕ РАЗМЕРОВ:**
```css
/* Увеличить кнопку */
❌ padding: 15px 20px;
✅ class="btn-lg" или padding: var(--space-lg) var(--space-xl);

/* Изменить отступ */
❌ margin: 18px;
✅ margin: var(--space-lg); /* или .m-lg */

/* Изменить иконку */
❌ font-size: 22px;
✅ class="icon-lg" или font-size: var(--size-icon-lg);
```

### **3️⃣ ИЗМЕНЕНИЕ ЦВЕТОВ:**
```css
/* Цвет текста */
❌ color: #333333;
✅ color: var(--text-primary);

/* Цвет иконки */
❌ color: white;
✅ color: var(--icon-on-primary);

/* Фон элемента */
❌ background: #f0f0f0;
✅ background: var(--surface-secondary);
```

### **4️⃣ АДАПТИВНОСТЬ:**
```css
/* Мобильная версия */
@media (max-width: 768px) {
  .element {
    padding: var(--space-sm); /* меньше на мобильном */
    font-size: var(--font-sm);
  }
}
```

---

## 🚨 **ЧАСТЫЕ ОШИБКИ И РЕШЕНИЯ**

### **❌ ПРОБЛЕМА: Иконка не видна на светлом фоне**
```css
❌ color: white; /* Белая иконка на белом фоне */
✅ color: var(--icon-primary); /* Автоматически подберет цвет */
```

### **❌ ПРОБЛЕМА: Элемент слишком маленький**
```css
❌ padding: 8px; font-size: 12px;
✅ class="btn-md" или padding: var(--space-md);
```

### **❌ ПРОБЛЕМА: Не могу найти стили элемента**
```
1. Открой styles/cursor-navigation.css
2. Найди карту компонентов
3. Перейди в указанный файл и строки
```

---

## 📋 **ЧЕКЛИСТ ПЕРЕД КОММИТОМ**

- [ ] Использовал только CSS переменные для цветов
- [ ] Применил систему размеров (--space-*, --size-*)
- [ ] Проверил работу в обеих темах (светлой/темной)
- [ ] Протестировал на мобильном устройстве
- [ ] Добавил комментарии для сложных изменений
- [ ] Использовал правильный CSS модуль

---

## 🎯 **БЫСТРАЯ СПРАВКА**

### **🔧 Как увеличить кнопку:**
```css
/* Вариант 1: Utility класс */
<button class="btn-lg">

/* Вариант 2: CSS переменные */
button { 
  height: var(--size-button-lg);
  padding: var(--space-md) var(--space-xl);
}
```

### **🎨 Как поменять цвет иконки:**
```css
/* На обычном фоне */
.icon { color: var(--icon-primary); }

/* На кнопке */
.button .icon { color: var(--icon-on-primary); }
```

### **📱 Как сделать адаптивным:**
```css
@media (max-width: 768px) {
  .element {
    /* Используй меньшие размеры */
    padding: var(--space-sm);
    font-size: var(--font-sm);
  }
}
```

---

## 🏆 **ПОМНИ ГЛАВНОЕ**

1. **СИСТЕМА ЦВЕТОВ** решает проблемы с темами
2. **СИСТЕМА РАЗМЕРОВ** упрощает масштабирование  
3. **МОДУЛЬНАЯ СТРУКТУРА** помогает найти нужный код
4. **ДОКУМЕНТАЦИЯ** всегда под рукой в cursor-navigation.css

**Следуй этим правилам, и UI разработка станет простой и предсказуемой! 🚀**