# 📂 План реорганизации файлов проекта

## ✅ ВЫПОЛНЕНО (коммит cebcbfc)

### Перемещены в `/public/`:
- ✅ `admin.html` (полная версия, 614 строк)
- ✅ `login.html` (полная версия, 223 строки)
- ✅ `settings.html` (полная версия, 150 строк)

### Перемещены в `/js/`:
- ✅ `constants.js` 
- ✅ `state.js` (реэкспорт из src/js/state/)
- ✅ `core.js` (реэкспорт из src/js/core/)
- ✅ `api.js` (реэкспорт из src/api/)
- ✅ `metronome.js` (602 строки)
- ✅ `firebase-config.js` (реэкспорт из firebase-init.js)

### Перемещены в `/assets/`:
- ✅ `zvuk-metronom.mp3`
- ✅ `/images/` (иконки PWA)

### Перемещены в `/config/`:
- ✅ `firebase.json`
- ✅ `firestore.rules`
- ✅ `firestore.indexes.json`
- ✅ `cors.json`
- ✅ `package.json`

### Перемещены в `/documentation/`:
- ✅ Все `.md` файлы (кроме README.md)
- ✅ `/docs/`

### Созданы редиректы в корне:
- ✅ `admin.html` → `/public/admin.html`
- ✅ `login.html` → `/public/login.html`
- ✅ `settings.html` → `/public/settings.html`

## 🔴 НЕ ВЫПОЛНЕНО (решено оставить в корне):

### Остались в корне по техническим причинам:
1. `script.js` (934 строки) - главный файл, много зависимостей
2. `ui.js` (1431 строка) - legacy код, высокий риск
3. `firebase-init.js` (40 строк) - критичен для инициализации
4. `styles.css` (4963 строки) - можно переместить, но низкий приоритет

### Должны остаться в корне по стандартам:
1. `index.html` - главная страница
2. `sw.js` - Service Worker (требует корневого scope)
3. `manifest.json` - манифест PWA
4. `favicon.ico` - иконка сайта
5. `CNAME` - домен GitHub Pages
6. `.gitignore` - настройки Git
7. `.nojekyll` - для GitHub Pages
8. `README.md` - главное описание проекта

## 📊 Результат реорганизации:
- **Было**: 45+ файлов в корне
- **Стало**: ~15 файлов в корне
- **Достигнуто**: 70% от плана
- **Service Worker**: версия v22

## 🎯 Рекомендация:
Дальнейшая реорганизация не рекомендуется из-за высоких рисков и малой выгоды.