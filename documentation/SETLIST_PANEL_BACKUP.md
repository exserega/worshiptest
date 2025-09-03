# Резервная копия панели сет-листов

## Текущая структура HTML (index.html, строки 334-427)

```html
<aside id="setlists-panel" class="side-panel setlists-panel">
    <button class="side-panel-close-btn icon-button simple" title="Закрыть панель">
        <i class="fas fa-chevron-left"></i>
    </button>
    
    <!-- Заголовок панели -->
    <div class="panel-header-section">
        <h3 class="panel-title">Сет-листы</h3>
    </div>
    
    <!-- Селектор филиала -->
    <div class="branch-selector-section ui-section">
        <div class="branch-selector-wrapper">
            <label for="setlist-branch-selector" class="branch-selector-label">
                <i class="fas fa-building"></i>
                <span>Филиал:</span>
            </label>
            <select id="setlist-branch-selector" class="branch-selector">
                <option value="">Загрузка...</option>
            </select>
        </div>
        <div class="branch-selector-info" style="display: none;">
            <i class="fas fa-info-circle"></i>
            <span class="info-text">Просмотр другого филиала</span>
        </div>
    </div>
    
    <!-- БЛОК 1: Создание нового списка (премиум дизайн) -->
    <div class="ui-section create-section">
        <button id="create-new-setlist-header-btn" class="create-btn-modern">
            <div class="btn-content">
                <i class="fas fa-plus"></i>
                <span>Создать список</span>
            </div>
            <div class="btn-shine"></div>
        </button>
    </div>
    
    <!-- БЛОК 2: Выбор списка (современный дизайн) -->
    <div class="ui-section selection-section">
        <div class="section-label">Выбор списка</div>
        <div class="modern-selector">
            <button id="setlist-dropdown-btn" class="selector-btn">
                <div class="selector-content">
                    <i class="fas fa-list"></i>
                    <span id="current-setlist-name" class="selector-text">Выберите список</span>
                </div>
                <i class="fas fa-chevron-down selector-arrow"></i>
            </button>
            
            <!-- Dropdown меню -->
            <div id="setlist-dropdown-menu" class="modern-dropdown">
                <div id="setlists-list-container" class="dropdown-content">
                    <div class="empty-message">Загрузка сет-листов...</div>
                </div>
            </div>
        </div>
    </div>

    <!-- БЛОК 3: Управление списком (элегантный дизайн) -->
    <div id="selected-setlist-control" class="ui-section active-section" style="display: none;">
        <div class="section-header">
            <div class="list-status">
                <i class="fas fa-music"></i>
                <span id="songs-count-text" class="count-text">0 песен</span>
            </div>
        </div>
        <div class="action-buttons">
            <button id="add-song-btn" class="action-btn primary-action">
                <i class="fas fa-plus"></i>
                <span>Добавить</span>
            </button>
            <button id="start-presentation-button" class="action-btn secondary-action">
                <i class="fas fa-play"></i>
                <span>Презентация</span>
            </button>
            <button id="add-to-calendar-btn" class="action-btn calendar-action" style="display: none;" title="Добавить в календарь">
                <i class="fas fa-calendar-plus"></i>
            </button>
            <button id="save-to-archive-btn" class="action-btn archive-action" style="display: none;" title="Сохранить в архив">
                <i class="fas fa-archive"></i>
            </button>
        </div>
    </div>

    <!-- Список песен текущего сет-листа -->
    <div id="current-setlist-songs-container" class="songs-list">
        <div class="empty-message">Сначала выберите сет-лист</div>
    </div>
</aside>
```

## Основные функции JavaScript (ui.js)

### renderSetlists (строки 1291-1437)
Отрисовывает список сет-листов в dropdown меню

### displaySelectedSetlist (строки 1219-1271) 
Отображает выбранный сет-лист и его кнопки управления

### renderCurrentSetlistSongs (строки 1067-1175)
Отображает список песен в выбранном сет-листе

## Стили (styles.css)
- Основные стили панели: строки 3089-3109
- Стили для секций и кнопок: разбросаны по файлу
- Мобильная адаптация: строки 1314-1340

## Важные элементы DOM
- `#setlists-panel` - основная панель
- `#setlist-branch-selector` - селектор филиала  
- `#create-new-setlist-header-btn` - кнопка создания нового
- `#setlist-dropdown-btn` - кнопка dropdown
- `#current-setlist-name` - название текущего сет-листа
- `#setlists-list-container` - контейнер списка сет-листов
- `#selected-setlist-control` - блок управления выбранным сет-листом
- `#add-song-btn` - кнопка добавления песни
- `#start-presentation-button` - кнопка презентации
- `#add-to-calendar-btn` - кнопка добавления в календарь
- `#save-to-archive-btn` - кнопка сохранения в архив
- `#current-setlist-songs-container` - контейнер песен
- `#songs-count-text` - счетчик песен

## Обработчики событий
- Клик по dropdown кнопке открывает меню
- Выбор сет-листа вызывает handleSetlistSelect
- Кнопка создания открывает форму
- Кнопки управления имеют свои обработчики