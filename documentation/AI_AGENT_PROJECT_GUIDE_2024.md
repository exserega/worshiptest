# 🎯 Методичка для AI агентов - Проект Agape Worship 2024

## 📋 Критически важная информация

### Состояние проекта
- **URL**: https://agapeworship.asia/
- **GitHub**: https://github.com/exserega/worshiptest
- **Последний стабильный коммит**: cebcbfc (после реорганизации)
- **Архитектура**: Гибридная (Legacy + Модульная)
- **Firebase версия**: v8.10.0 (CDN)

## 🗂️ Актуальная структура проекта

### Корневые файлы (НЕ ПЕРЕМЕЩАТЬ!)
```
/
├── index.html          # Главная страница
├── script.js           # Главный JS файл (934 строки)
├── ui.js              # Legacy UI функции (1431 строк)
├── firebase-init.js    # Инициализация Firebase v8
├── styles.css         # Основные стили (4963 строки)
├── sw.js              # Service Worker (ДОЛЖЕН быть в корне)
├── manifest.json      # PWA манифест
├── favicon.ico        # Иконка сайта
├── CNAME              # Домен для GitHub Pages
├── admin.html         # Редирект на /public/admin.html
├── login.html         # Редирект на /public/login.html
└── settings.html      # Редирект на /public/settings.html
```

### Папка /js/ (перемещенные файлы)
```
/js/
├── firebase-config.js  # Реэкспорт из firebase-init.js
├── metronome.js       # Метроном (602 строки)
├── api.js             # Реэкспорт API функций
├── core.js            # Реэкспорт core функций
├── state.js           # Реэкспорт state
└── constants.js       # Константы приложения
```

### Папка /public/ (HTML страницы)
```
/public/
├── admin.html         # Панель администратора (614 строк)
├── login.html         # Страница входа (223 строки)
└── settings.html      # Настройки пользователя (150 строк)
```

### Папка /src/ (модульная архитектура)
```
/src/
├── modules/           # Функциональные модули
│   ├── auth/         # Аутентификация
│   ├── admin/        # Админ панель
│   ├── settings/     # Настройки
│   └── branches/     # Управление филиалами
├── core/             # Ядро системы
├── api/              # API функции (новая архитектура)
├── ui/               # UI компоненты
├── main/             # Основные контроллеры
├── utils/            # Утилиты
└── js/               # Дополнительные модули
    ├── api/          # API (songs, setlists, etc.)
    ├── core/         # Core функции
    ├── state/        # State management
    └── workers/      # Web Workers
```

### Другие директории
```
/assets/              # Медиафайлы
├── images/          # Изображения и иконки
└── zvuk-metronom.mp3 # Звук метронома

/css/                # CSS модули
├── admin.css        # Стили админ панели
├── auth.css         # Стили аутентификации
└── settings.css     # Стили настроек

/config/             # Конфигурационные файлы
├── firebase.json
├── firestore.rules
└── firestore.indexes.json

/documentation/      # Документация проекта
/templates/         # HTML шаблоны
/tests/            # Тесты (не используются)
/backups/          # Резервные копии
```

## 🔌 Критические зависимости и импорты

### Firebase инициализация
1. **HTML подключение** (index.html):
   ```html
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js"></script>
   <script type="module" src="./firebase-init.js"></script>
   ```

2. **firebase-init.js** проверяет `window.firebase` и инициализирует
3. **firebase-config.js** реэкспортирует из firebase-init.js

### Главные импорты в script.js
```javascript
import * as state from './js/state.js';
import * as api from './js/api.js';
import * as ui from './ui.js';
import { initializeApp, onDOMContentLoaded } from './src/main/initialization.js';
```

### Критический адаптер Firebase
`/src/utils/firebase-v8-adapter.js` - обеспечивает v9-подобный синтаксис для v8 API

## ⚠️ Известные проблемы и их решения

### 1. Firebase версии
- **Проблема**: Смешение v8 (CDN) и v9 (модули)
- **Решение**: Используется только v8 через CDN + адаптер

### 2. Пути после реорганизации
- **Проблема**: Ошибки 404 после перемещения файлов
- **Решение**: Созданы HTML-редиректы в корне

### 3. `.exists()` vs `.exists`
- **Проблема**: v8 использует свойство `.exists`, не метод `.exists()`
- **Правильно**: `if (doc.exists)` 
- **Неправильно**: `if (doc.exists())`

### 4. Service Worker кэш
- **При любых изменениях путей** нужно обновить версию в sw.js
- **Текущая версия**: v22

## 🚀 Рекомендации для работы

### ✅ Делать:
1. Использовать параллельные tool calls для чтения файлов
2. Проверять все импорты при изменении файлов
3. Обновлять Service Worker при изменении путей
4. Тестировать после каждого изменения

### ❌ НЕ делать:
1. НЕ перемещать файлы из корня (особенно ui.js, script.js)
2. НЕ менять версию Firebase
3. НЕ удалять файлы-редиректы (admin.html, login.html, settings.html в корне)
4. НЕ трогать legacy код без крайней необходимости

## 📌 Ключевые особенности проекта

### Система ролей и статусов
- **Роли**: admin, user, guest
- **Статусы**: active, pending, blocked
- **Основатель**: неизменяемая роль, защищен от удаления

### Филиалы (branches)
- Пользователи привязаны к филиалам
- Сет-листы привязаны к филиалам
- Система заявок на вступление и создание филиалов

### PWA функциональность
- Service Worker для офлайн работы
- Manifest.json для установки
- Кэширование критических ресурсов

### Модульность
- Новый код в /src/modules/
- Legacy код постепенно мигрирует
- Двойная система импортов (переходный период)

## 🔍 Полезные команды для анализа

```bash
# Найти все импорты файла
grep -r "from.*firebase-init" --include="*.js" --include="*.html"

# Проверить размер файлов
wc -l *.js

# Найти использование функции
grep -r "createSetlist" --include="*.js"

# Проверить структуру
find . -type f -name "*.js" | head -20
```

## 📝 История важных изменений
1. Миграция HTML в /public/
2. Миграция JS модулей в /js/
3. Унификация Firebase на v8
4. Создание firebase-v8-adapter.js
5. Обновление всех импортов

---
**Последнее обновление**: После коммита cebcbfc
**Автор**: AI Agent для проекта Agape Worship