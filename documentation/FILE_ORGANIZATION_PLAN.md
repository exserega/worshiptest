# 📂 План реорганизации файлов проекта

## 🔴 Проблема
В корне проекта находится 45+ файлов, что затрудняет навигацию и понимание структуры.

## ✅ Файлы, которые ДОЛЖНЫ остаться в корне:
1. `index.html` - главная страница
2. `sw.js` - Service Worker (должен быть в корне для PWA)
3. `manifest.json` - манифест PWA
4. `favicon.ico` - иконка сайта
5. `CNAME` - домен GitHub Pages
6. `.gitignore` - настройки Git
7. `.nojekyll` - для GitHub Pages
8. `README.md` - главное описание проекта

## 📁 Предлагаемая структура:

### `/public/` - публичные HTML страницы
- `admin.html`
- `login.html`
- `settings.html`

### `/assets/` - медиа файлы
- `zvuk-metronom.mp3`
- `/images/` (переместить существующую папку)

### `/config/` - конфигурационные файлы
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `cors.json`
- `package.json`

### `/js/` - старые JavaScript файлы
- `api.js`
- `ui.js`
- `script.js`
- `core.js`
- `state.js`
- `constants.js`
- `metronome.js`
- `firebase-config.js`
- `firebase-init.js`

### `/documentation/` - вся документация
- Все `.md` файлы (кроме README.md)
- `/docs/` (переместить существующую папку)

## 🚫 НЕ перемещать:
- `/src/` - уже организован правильно
- `/css/` - уже организован
- `/styles/` - уже организован
- `/functions/` - Cloud Functions
- `/tests/` - тесты
- `/templates/` - шаблоны
- `/backups/` - резервные копии

## 🎯 Результат:
В корне останется только 8 критически важных файлов вместо 45+