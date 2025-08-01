# 🚀 Quick Start Guide - Agape Worship

## 🎯 Цель документа
Помочь новому разработчику/AI агенту быстро начать работу с проектом.

## 📋 Первые шаги

### 1. Понять архитектуру (5 минут)
```
Прочитать: documentation/AI_AGENT_GUIDE.md
Ключевое: Гибридная архитектура (Legacy + Модульная)
```

### 2. Запустить локально
```bash
# Проект работает как статический сайт
# Можно открыть index.html напрямую или:
python3 -m http.server 8000
# Открыть http://localhost:8000
```

### 3. Проверить Firebase
- Откройте консоль браузера
- Должно быть: "✅ Firebase инициализирован"
- Если ошибки - проверьте интернет соединение

## 🔧 Частые задачи

### Добавить новую функцию
1. **Модульный код** → создать в `/src/modules/`
2. **Legacy код** → добавить в `ui.js` или `script.js`
3. **Рекомендация**: всегда выбирайте модульный подход

### Изменить существующую функцию
```javascript
// 1. Найти функцию
grep -r "functionName" --include="*.js"

// 2. Проверить зависимости
// См. DEPENDENCIES_MAP.md

// 3. Обновить Service Worker после изменений
// sw.js: const CACHE_NAME = 'agape-worship-cache-vXX';
```

### Работа с Firebase
```javascript
// ПРАВИЛЬНО (v8):
const snapshot = await docRef.get();
if (snapshot.exists) { // НЕ exists()!
    const data = snapshot.data();
}

// Все операции через адаптер:
import { db, collection, addDoc } from 'src/utils/firebase-v8-adapter.js';
```

### Добавить новую страницу
1. Создать HTML в `/public/`
2. Добавить редирект в корень
3. Обновить навигацию в `src/modules/auth/userNavigation.js`

## 🐛 Типичные ошибки

### 1. "Cannot find module"
```
Проблема: Неправильный путь после реорганизации
Решение: Проверить actual path и использовать ../
```

### 2. "doc.exists is not a function"
```
Проблема: Использование v9 синтаксиса с v8 Firebase
Решение: .exists вместо .exists()
```

### 3. "404 на продакшене после изменений"
```
Проблема: Не обновлен Service Worker
Решение: Увеличить версию в sw.js
```

## 📁 Где что искать

### Пользовательский интерфейс
- Основные функции: `ui.js`
- Модальные окна: `src/ui/modal-manager.js`
- Темы: `src/js/ui/themes.js`

### Авторизация
- Вход: `src/modules/auth/login.js`
- Проверка прав: `src/modules/auth/authCheck.js`
- Роли: admin, user, guest

### Работа с песнями
- API: `src/js/api/songs.js`
- Отображение: `src/js/ui/songDisplay.js`
- Редактирование: `src/js/api/songEditing.js`

### Сет-листы
- API: `src/js/api/setlists.js`
- UI: `src/ui/setlist-manager.js`
- Селектор: `src/ui/setlist-selector.js`

## 🔍 Полезные команды

```bash
# Найти все TODO в коде
grep -r "TODO" --include="*.js"

# Найти все console.log
grep -r "console.log" --include="*.js"

# Проверить размер файлов
find . -name "*.js" -exec wc -l {} + | sort -n

# Найти импорты файла
grep -r "from.*filename" --include="*.js"
```

## 🚦 Перед началом работы

1. ✅ Прочитать AI_AGENT_GUIDE.md
2. ✅ Понять разницу Legacy vs Модульный код
3. ✅ Запомнить: НЕ трогать ui.js без крайней необходимости
4. ✅ Всегда обновлять Service Worker при изменении путей
5. ✅ Использовать firebase-v8-adapter для Firestore

## 💡 Совет
Начните с простой задачи в модульной части кода (`/src/modules/`), чтобы понять структуру проекта.