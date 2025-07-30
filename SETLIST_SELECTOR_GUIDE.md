# 📋 Руководство по работе с системой добавления в сет-листы

## 🎯 Обзор функциональности

Система добавления песен в сет-листы предоставляет удобный интерфейс для быстрого добавления текущей песни в любой существующий сет-лист или создания нового.

## 📍 Компоненты системы

### 1. **Кнопка "СЕТ ЛИСТ" в основном интерфейсе**
- **Расположение**: В контейнере отображения песни, рядом с кнопками "МОИ" и "РЕПЕРТУАР"
- **Функция**: Открывает overlay для выбора сет-листа
- **Обработчик**: `window.handleAddSongToSetlist()`

### 2. **Overlay выбора сет-листа (setlist-select-overlay)**
- **Модуль**: `src/ui/setlist-selector.js`
- **Стили**: `styles/modals.css` (класс `.setlist-select-modal`)
- **Особенность**: Использует класс `visible` для отображения (не `show`!)

## 🏗️ Архитектура

### Структура модуля
```javascript
// src/ui/setlist-selector.js
class SetlistSelector {
    constructor() {
        // DOM элементы
        this.overlay = document.getElementById('setlist-select-overlay');
        this.songNameDisplay = document.getElementById('adding-song-name');
        this.songKeyDisplay = document.getElementById('adding-song-key');
        this.setlistsGrid = document.getElementById('setlists-grid');
        // ...
    }
    
    open(song, key) // Открытие с данными песни
    close()         // Закрытие overlay
    loadSetlists()  // Загрузка списка сет-листов
    selectSetlist() // Выбор сет-листа одним кликом
    addToSetlist()  // Добавление песни в сет-лист
    handleCreateNew() // Создание нового сет-листа
}
```

### Интеграция с системой
```javascript
// script.js
window.handleAddSongToSetlist = async function() {
    const songId = ui.songSelect?.value;
    const selectedKey = ui.keySelect?.value;
    const currentSong = window.state?.allSongs?.find(s => s.id === songId);
    
    if (currentSong) {
        window.openSetlistSelector(currentSong, selectedKey);
    }
};

// Глобальный доступ
window.openSetlistSelector = (song, key) => selector.open(song, key);
```

## 🎨 UI/UX особенности

### Компактный дизайн
- **Заголовок**: "Добавить в сет-лист" с кнопкой закрытия
- **Информация о песне**: Название и выбранная тональность
- **Список сет-листов**: Grid layout с указанием количества песен
- **Создание нового**: Минималистичное поле внизу

### Визуальные индикаторы
```css
/* Выбранный сет-лист */
.setlist-item.selected {
    background: var(--hover-color);
    border-color: var(--accent-color);
}

/* Тональность песни */
.song-key #adding-song-key {
    padding: 0.2rem 0.6rem;
    background: var(--hover-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    text-transform: none !important;
}
```

## 🔄 Динамическое обновление

### Механизм обновления
1. **Добавление песни** → API вызов `addSongToSetlist(setlistId, songId, key)`
2. **Локальное обновление** → Если добавили в текущий сет-лист
3. **Событие обновления** → Dispatch `setlist-updated` event
4. **Обновление UI** → `handleSetlistSelect()` обновляет список песен

### Особенности реализации
```javascript
// Обновление НЕЗАВИСИМО от открытой панели
if (window.state?.currentSetlistId === setlistId) {
    setTimeout(async () => {
        const setlists = await loadSetlists();
        const updatedSetlist = setlists.find(s => s.id === setlistId);
        if (updatedSetlist && window.handleSetlistSelect) {
            window.handleSetlistSelect(updatedSetlist);
        }
    }, 300);
}
```

## ⚠️ Важные моменты

### 1. **Класс visible vs show**
```javascript
// ❌ НЕПРАВИЛЬНО
this.overlay?.classList.add('show');

// ✅ ПРАВИЛЬНО
this.overlay?.classList.add('visible');
```

### 2. **Формат вызова API**
```javascript
// ❌ НЕПРАВИЛЬНО - передача объекта
await addSongToSetlist(setlistId, songObject);

// ✅ ПРАВИЛЬНО - три параметра
await addSongToSetlist(setlistId, songId, selectedKey);
```

### 3. **Обновление без перевыбора**
- Список песен обновляется автоматически
- Не требуется перевыбирать сет-лист
- Задержка 300мс для синхронизации с Firebase

### 4. **Сохранение тональности**
- Песня добавляется в выбранной тональности
- Тональность отображается в overlay
- Сохраняется в поле `key` в Firebase

## 🧪 Тестирование

### Сценарии проверки
1. **Добавление в новый сет-лист**
   - Создать новый сет-лист
   - Проверить добавление песни
   - Убедиться в корректном счетчике

2. **Добавление в текущий сет-лист**
   - Выбрать сет-лист в панели
   - Добавить песню через кнопку
   - Проверить мгновенное обновление

3. **Отображение тональности**
   - Выбрать разные тональности
   - Проверить отображение в overlay
   - Убедиться в сохранении в Firebase

## 📝 Отладка

### Полезные логи
```javascript
// В консоли при добавлении
📋 [SetlistSelector] Opening with key: G
📋 [SetlistSelector] Adding song: ... to setlist: ... in key: G
📋 [SetlistSelector] Current setlist was updated, refreshing display
📋 [EventHandlers] Updating songs for current setlist: ...
```

### Частые проблемы
1. **Overlay не открывается** → Проверить импорт модуля в `initialization.js`
2. **Тональность не видна** → Проверить CSS и элемент `#adding-song-key`
3. **Список не обновляется** → Проверить `currentSetlistId` в state

---

**Последнее обновление:** 21.01.2025
**Версия:** 1.0