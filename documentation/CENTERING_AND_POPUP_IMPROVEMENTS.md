# Улучшение центрирования текста и попапа филиала

## Исправленные проблемы

### 1. Центрирование текста в значках
**Проблема:** Текст в значках тональности и BPM был смещен вправо.

**Решение:** Использование flexbox для точного центрирования.

#### Значок тональности
```css
#setlists-panel .song-key {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 3px 8px !important;
    min-width: 30px !important;
}
```

#### Значок BPM  
```css
#setlists-panel .song-bpm {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 3px 10px !important;
    min-width: 60px !important;
}
```

### 2. Попап выбора филиала
**Проблема:** Текст "Выберите филиал:" переносился на две строки.

**Решение:** Увеличение ширины и оптимизация компоновки.

```css
.branch-selector-popup {
    width: 250px;  /* Было: 200px */
}

.branch-popup-header {
    white-space: nowrap;  /* Запрет переноса текста */
}
```

### 3. Кнопка закрытия попапа
**Улучшения:**
```css
.close-branch-popup {
    width: 28px;   /* Было: 24px */
    height: 28px;  /* Было: 24px */
    border-radius: 6px;  /* Более мягкое закругление */
    flex-shrink: 0;  /* Не сжимается при нехватке места */
}
```

## Визуальный результат

### Значки в списке песен
```
Тональность:     BPM:
┌────┐        ┌──────────┐
│ Am │        │ 120 BPM  │
└────┘        └──────────┘
  ↑               ↑
Центр          Центр
```

### Попап филиала
```
┌──────────────────────────────────┐
│ Выберите филиал:            [✖] │ ← Одна строка
├──────────────────────────────────┤
│ ▼ Алматы (Основной)             │
│   Астана                        │
│   Шымкент                       │
└──────────────────────────────────┘
```

## Технические детали

### Flexbox для центрирования
- `display: inline-flex` - позволяет использовать flexbox для inline элементов
- `align-items: center` - вертикальное центрирование
- `justify-content: center` - горизонтальное центрирование

### Оптимизация попапа
- Увеличена ширина на 50px для размещения текста
- `white-space: nowrap` предотвращает перенос заголовка
- `flex-shrink: 0` защищает кнопку от сжатия

## Service Worker
Версия: v607