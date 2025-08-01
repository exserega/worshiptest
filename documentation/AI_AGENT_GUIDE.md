# 📚 ДЕТАЛЬНОЕ РУКОВОДСТВО ДЛЯ AI АГЕНТОВ - AGAPE WORSHIP

## 🎯 О ПРОЕКТЕ
**Agape Worship** - веб-приложение для управления песнями прославления с поддержкой филиалов, ролей и офлайн режима.

- **URL**: https://agapeworship.asia/
- **GitHub**: https://github.com/exserega/worshiptest
- **Архитектура**: Гибридная (Legacy + Модульная)
- **Firebase**: v8.10.0 (CDN)
- **UI Framework**: Vanilla JS + CSS
- **Шрифт**: Montserrat (кроме текста песен)

## 📁 СТРУКТУРА ПРОЕКТА

### Корневые файлы (КРИТИЧНО - НЕ ПЕРЕМЕЩАТЬ!)
```
/ (корень)
├── index.html          # Главная страница
├── script.js           # Главный контроллер (912 строк)
├── ui.js               # UI функции (1551 строк)
├── firebase-init.js    # Firebase v8 инициализация
├── styles.css          # Основные стили (5039 строк)
├── sw.js               # Service Worker для PWA
├── manifest.json       # PWA манифест
└── CNAME               # GitHub Pages домен
```

### Модульная архитектура
```
/src/
├── modules/           # Новый функционал
│   ├── auth/         # Авторизация и права
│   ├── branches/     # Управление филиалами
│   ├── admin/        # Админ панель
│   └── settings/     # Настройки пользователя
├── api/              # API функции
├── utils/            # firebase-v8-adapter.js (КРИТИЧНО!)
└── main/             # Инициализация
```

### Другие директории
```
/public/              # HTML страницы
├── admin.html       # Админ панель
├── login.html       # Авторизация
└── settings.html    # Настройки

/css/                # Стили страниц
/assets/             # Изображения, звуки
/js/                 # Переэкспортированные модули
```

## 🔥 FIREBASE АДАПТЕР

**КРИТИЧНО**: Используется адаптер для v9-подобного синтаксиса с v8 API:

```javascript
// Импорт через адаптер
import { db, collection, addDoc } from 'src/utils/firebase-v8-adapter.js';

// v8 синтаксис для документов
if (snapshot.exists) { // НЕ exists()!
    const data = snapshot.data();
}
```

## 🔐 СИСТЕМА АВТОРИЗАЦИИ

### Роли пользователей
- **admin** - полный доступ, управление пользователями
- **user** - стандартный пользователь
- **guest** - ограниченный доступ

### Статусы пользователей  
- **active** - полный доступ к функционалу
- **pending** - ожидает одобрения (ограничения)
- **blocked** - заблокирован

### Основатель
- Email в коллекции `appConfig/founder`
- Неизменяемая роль admin
- Защита от удаления

## 🏢 СИСТЕМА ФИЛИАЛОВ

### Структура
- **branchId** - основной филиал пользователя
- **additionalBranchIds[]** - дополнительные филиалы
- Селектор в панели сетлистов
- Ограничения редактирования вне своих филиалов

### Заявки
- На вступление в филиал (новые пользователи)
- На смену основного филиала
- На добавление дополнительного филиала
- Управление через админ панель

## 🎵 ФУНКЦИОНАЛ ПЕСЕН

### Основные возможности
- Категории песен (листы)
- Транспонирование тональности
- Подсветка аккордов
- YouTube ссылки
- Режим презентации
- Поиск через Web Worker

### Сетлисты
- Привязаны к филиалам
- Создание/редактирование (для active)
- Ограничения для pending пользователей
- Drag & drop сортировка

## 🎨 UI/UX

### Темы
- Темная тема по умолчанию (#111827)
- Светлая тема
- Сохранение в localStorage

### PWA
- Офлайн режим
- Установка на устройство
- Service Worker кэширование

### Адаптивность
- Mobile-first подход
- Боковые панели
- Модальные окна

## ⚡ ОПТИМИЗАЦИЯ

### Web Workers
- Поиск песен в отдельном потоке
- Обновление базы при загрузке

### Lazy Loading
- Динамическая загрузка модулей
- Загрузка изображений по требованию

### Кэширование
- Service Worker для офлайн
- localStorage для настроек
- Версионирование кэша

## 🛠️ РАЗРАБОТКА

### Добавление функционала
1. Создавать в `/src/modules/`
2. Использовать ES6 модули
3. Следовать существующим паттернам
4. Обновлять Service Worker

### Тестирование
```bash
# Локальный сервер
python3 -m http.server 8000

# Очистка кэша
DevTools → Application → Clear Storage
```

### Деплой
- Автоматический через GitHub Pages
- Ветка main
- Домен через CNAME

## 📝 СОГЛАШЕНИЯ

### Код
- ES6+ синтаксис
- async/await для промисов
- Комментарии на русском
- JSDoc для функций

### Стили
- CSS переменные для тем
- BEM-подобная нотация
- Mobile-first медиа запросы

### Коммиты
- Conventional Commits
- feat/fix/docs/style/refactor
- Описание на английском

---
**См. также**: AI_AGENT_CRITICAL_GUIDE.md для критически важной информации