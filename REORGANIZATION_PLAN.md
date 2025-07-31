# 📂 План безопасной реорганизации файлов

## 🔍 Анализ зависимостей

### 1. Критические зависимости:
- **index.html** → подключает `script.js`
- **Service Worker** → кэширует все JS файлы
- **19 файлов в src/** → импортируют файлы из корня через `../../`

### 2. Граф зависимостей корневых JS файлов:
```
script.js
├── state.js
├── api.js
└── ui.js
    ├── constants.js
    ├── state.js
    ├── core.js
    │   └── constants.js
    └── api.js
        └── src/api/index.js

metronome.js
└── core.js
```

### 3. Файлы, импортирующие из корня:
- `src/api/index.js` → state.js
- `src/js/ui/general.js` → state.js, core.js
- `src/js/ui/songDisplay.js` → state.js, core.js
- `src/main/controller.js` → state.js, ui.js
- `src/main/event-handlers.js` → ui.js, state.js
- `src/main/initialization.js` → ui.js, metronome.js, constants.js
- `src/ui/overlay-manager.js` → ui.js, core.js
- `src/ui/search-manager.js` → state.js
- `src/ui/setlist-manager.js` → state.js, ui.js

## 🎯 План безопасной миграции

### Этап 1: Подготовка
1. Создать новые папки:
   ```bash
   mkdir -p js config assets public documentation
   ```

### Этап 2: Перемещение файлов БЕЗ зависимостей
1. **HTML страницы** → `/public/`
   - admin.html
   - login.html
   - settings.html
   
2. **Медиа файлы** → `/assets/`
   - zvuk-metronom.mp3
   - images/ (вся папка)

3. **Конфигурация** → `/config/`
   - firebase.json
   - firestore.rules
   - firestore.indexes.json
   - cors.json
   - package.json

4. **Документация** → `/documentation/`
   - Все .md файлы (кроме README.md)
   - docs/ (вся папка)

### Этап 3: Перемещение JS файлов (самый сложный)

#### Порядок перемещения (от меньшего количества зависимостей к большему):
1. **constants.js** → `/js/constants.js`
   - Обновить импорты в: core.js, ui.js, src/main/initialization.js
   
2. **state.js** → `/js/state.js`
   - Обновить импорты в: script.js, ui.js и 9 файлов в src/

3. **core.js** → `/js/core.js`
   - Обновить импорты в: ui.js, metronome.js и 4 файла в src/

4. **api.js** → `/js/api.js`
   - Обновить импорты в: script.js, ui.js

5. **metronome.js** → `/js/metronome.js`
   - Обновить импорты в: src/main/initialization.js

6. **ui.js** → `/js/ui.js`
   - Обновить импорты в: script.js и 5 файлов в src/

7. **script.js** → `/js/script.js`
   - Обновить в: index.html

8. **firebase-config.js** и **firebase-init.js** → `/js/`
   - Обновить импорты во всех файлах

### Этап 4: Обновление путей

#### Файлы, требующие обновления:
1. **index.html**:
   ```html
   <!-- Было -->
   <script type="module" src="script.js"></script>
   <!-- Стало -->
   <script type="module" src="js/script.js"></script>
   ```

2. **Service Worker (sw.js)**:
   ```javascript
   // Обновить все пути в URLS_TO_CACHE
   './js/api.js',
   './js/ui.js',
   './js/core.js',
   // и т.д.
   ```

3. **Все импорты в перемещенных файлах**:
   ```javascript
   // Было
   import * as state from './state.js';
   // Стало
   import * as state from './state.js'; // Не меняется, т.к. в той же папке
   
   // Было (из src/)
   import * as state from '../../state.js';
   // Стало
   import * as state from '../../js/state.js';
   ```

## ⚠️ Критические проверки после каждого шага:
1. Запустить приложение и проверить консоль на ошибки
2. Проверить, что Service Worker обновился
3. Проверить создание сет-листов
4. Проверить загрузку песен
5. Проверить работу метронома

## 🔧 Команды для безопасной миграции:
```bash
# Создание резервной копии
git add -A && git commit -m "📸 Снимок перед реорганизацией"

# Перемещение с сохранением истории Git
git mv admin.html public/
git mv login.html public/
git mv settings.html public/

# После каждого этапа
git add -A && git commit -m "🚚 Этап X: описание"
```