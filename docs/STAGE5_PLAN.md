# 🏗️ STAGE 5: UI Component Migration Plan

## 🎯 **ЦЕЛЬ ЭТАПА**
Разделить монолитный `script.js` (2548 строк) на модульные компоненты для улучшения работы Cursor.

## 📊 **ТЕКУЩЕЕ СОСТОЯНИЕ**
- `script.js`: 2548 строк - слишком большой для эффективной работы Cursor
- Множество функций смешаны в одном файле
- Отсутствует четкое разделение ответственности

## 🗂️ **ПЛАН МИГРАЦИИ**

### **5.1 - Overlay Management Module**
**Файл:** `src/ui/overlay-manager.js`
**Функции для миграции:**
- `showMobileSongPreview()` - показ мобильного превью песни
- `hideMobileSongPreview()` - скрытие мобильного превью
- `displaySongTextInMobileOverlay()` - отображение текста в оверлее
- `setupMobileOverlayEventListeners()` - настройка слушателей событий
- `closeKeySelectionModal()` - закрытие модального окна выбора ключа
- `showKeySelectionModal()` - показ модального окна выбора ключа
- `updateSongTextInModal()` - обновление текста песни в модальном окне
- `updateKeyButtons()` - обновление кнопок ключей

### **5.2 - Search Management Module**
**Файл:** `src/ui/search-manager.js`
**Функции для миграции:**
- `performOverlayDropdownSearch()` - поиск в выпадающем списке
- `showOverlaySearchResults()` - показ результатов поиска
- `hideOverlaySearchResults()` - скрытие результатов поиска
- `createOverlaySearchResultElement()` - создание элемента результата поиска
- `filterAndDisplaySongs()` - фильтрация и отображение песен
- `cleanLyricsForSearch()` - очистка текста для поиска
- `getHighlightedTextFragment()` - получение выделенного фрагмента текста

### **5.3 - Setlist Management Module**
**Файл:** `src/ui/setlist-manager.js`
**Функции для миграции:**
- `handleCreateSetlist()` - создание сетлиста
- `startAddingSongs()` - начало добавления песен
- `addSongToSetlist()` - добавление песни в сетлист
- `removeSongFromSetlist()` - удаление песни из сетлиста
- `confirmAddSongWithKey()` - подтверждение добавления песни с ключом
- `handleSetlistSelect()` - выбор сетлиста
- `handleSetlistDelete()` - удаление сетлиста
- `refreshSetlists()` - обновление списка сетлистов
- `finishAddingSongs()` - завершение добавления песен

### **5.4 - Modal Management Module**
**Файл:** `src/ui/modal-manager.js`
**Функции для миграции:**
- `closeCreateSetlistModal()` - закрытие модального окна создания сетлиста
- `closeAddSongsConfirmModal()` - закрытие модального окна подтверждения добавления
- `closeAddSongsOverlay()` - закрытие оверлея добавления песен
- `closeNotesModal()` - закрытие модального окна заметок
- `handleSaveNote()` - сохранение заметки
- `showNotification()` - показ уведомления

### **5.5 - Event Handlers Module**
**Файл:** `src/ui/event-handlers.js`
**Функции для миграции:**
- `handleFavoriteOrRepertoireSelect()` - обработка выбора избранного/репертуара
- `handleRepertoireUpdate()` - обработка обновления репертуара
- `handleAddSongToSetlist()` - обработка добавления песни в сетлист
- `handleRemoveSongFromSetlist()` - обработка удаления песни из сетлиста
- `handleAddToRepertoire()` - обработка добавления в репертуар
- `setupSwipeToClose()` - настройка свайпа для закрытия
- `setupEventListeners()` - настройка слушателей событий

## 🔄 **ПРОЦЕДУРА МИГРАЦИИ**

### **Этап 5.1: Overlay Management**
1. Создать `src/ui/overlay-manager.js`
2. Перенести функции управления оверлеями
3. Обновить импорты в `script.js`
4. Тестирование

### **Этап 5.2: Search Management**
1. Создать `src/ui/search-manager.js`
2. Перенести функции поиска
3. Обновить импорты в `script.js`
4. Тестирование

### **Этап 5.3: Setlist Management**
1. Создать `src/ui/setlist-manager.js`
2. Перенести функции управления сетлистами
3. Обновить импорты в `script.js`
4. Тестирование

### **Этап 5.4: Modal Management**
1. Создать `src/ui/modal-manager.js`
2. Перенести функции управления модальными окнами
3. Обновить импорты в `script.js`
4. Тестирование

### **Этап 5.5: Event Handlers**
1. Создать `src/ui/event-handlers.js`
2. Перенести обработчики событий
3. Обновить импорты в `script.js`
4. Финальное тестирование

## 🎯 **ОЖИДАЕМЫЙ РЕЗУЛЬТАТ**
- `script.js` уменьшится с 2548 до ~800-1000 строк
- Четкое разделение ответственности между модулями
- Улучшенная читаемость для Cursor
- Более простое поддержание и отладка кода

## 🧪 **ТЕСТИРОВАНИЕ**
После каждого этапа:
- Проверка всех функций через браузер
- Запуск baseline тестов
- Проверка отсутствия ошибок в консоли
- Проверка работоспособности всех UI элементов