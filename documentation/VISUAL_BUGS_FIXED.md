# Исправление визуальных багов в панели сет-листов

## Исправленные баги

### 1. Проблема с шириной фона BPM
**Проблема:** Текст "123 BPM" выходил за границы фона справа - буквы "p" и "m" были частично вне фона.

**Решение:**
```css
#setlists-panel .song-bpm {
    padding: 3px 10px !important;  /* Было: 3px 7px */
    min-width: 60px !important;     /* Было: 50px */
}
```

### 2. Проблема со стилем кнопки закрытия попапа филиала
**Проблема:** Иконка крестика была черной, не соответствовала стандарту светлых иконок.

**Решение:**
```css
.close-branch-popup {
    border: 1px solid var(--border-color, #374151);
    border-radius: 4px;
    color: #9ca3af !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-branch-popup i {
    color: #9ca3af !important;
}

.close-branch-popup:hover {
    background: var(--bg-secondary, #374151);
    border-color: #ef4444;
}

.close-branch-popup:hover i {
    color: #ef4444 !important;
}
```

## Визуальные улучшения

### BPM значок
- ✅ Увеличен внутренний отступ справа
- ✅ Увеличена минимальная ширина 
- ✅ Текст полностью помещается в фон

### Кнопка закрытия
- ✅ Светлая иконка на темном фоне
- ✅ Тонкая граница для видимости
- ✅ Красная подсветка при наведении
- ✅ Соответствует общему стилю кнопок

## Service Worker
Версия: v606