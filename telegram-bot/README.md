# 🤖 Agape Worship Telegram Bot

Telegram бот для быстрого доступа к Agape Worship PWA и получения уведомлений.

## 📋 Функции

### Текущие возможности:
- ✅ Команда `/start` - приветствие и главное меню
- ✅ Команда `/help` - справка по командам
- ✅ Кнопка "Открыть Agape Worship" - запуск PWA в Telegram
- ⏳ Команда `/song [название]` - поиск песни (в разработке)
- ⏳ Команда `/events` - список ближайших событий (в разработке)
- ⏳ Уведомления о новых событиях (в разработке)

## 🚀 Быстрый старт

### Шаг 1: Создание бота в Telegram

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Придумайте имя для бота (например: "Agape Worship Bot")
4. Придумайте username (должен заканчиваться на `bot`, например: `agape_worship_bot`)
5. BotFather даст вам **токен** - сохраните его!

### Шаг 2: Установка зависимостей

```bash
cd telegram-bot
npm install
```

### Шаг 3: Настройка переменных окружения

Создайте файл `.env` в папке `telegram-bot`:

```env
# Telegram Bot Token (получили от BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Firebase Service Account (путь к JSON файлу)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# URL вашего приложения
WEB_APP_URL=https://agapeworship.asia
```

### Шаг 4: Настройка Firebase Admin

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект "song-archive-389a6"
3. Перейдите в **Project Settings** → **Service Accounts**
4. Нажмите **Generate New Private Key**
5. Сохраните JSON файл как `serviceAccountKey.json` в папку `telegram-bot`

⚠️ **ВАЖНО**: Файл `serviceAccountKey.json` НЕ должен попасть в git! Он уже добавлен в `.gitignore`

### Шаг 5: Запуск бота

```bash
# Для разработки (с автоперезагрузкой)
npm run dev

# Для продакшена
npm start
```

## 📚 Команды бота

| Команда | Описание | Статус |
|---------|----------|--------|
| `/start` | Главное меню и приветствие | ✅ Готово |
| `/help` | Справка по всем командам | ✅ Готово |
| `/song [название]` | Поиск песни по названию | ⏳ В разработке |
| `/events` | Список ближайших событий | ⏳ В разработке |
| `/setlist [название]` | Просмотр сет-листа | ⏳ Планируется |

## 🔧 Структура проекта

```
telegram-bot/
├── src/
│   ├── bot.js                 # Основной файл бота
│   ├── commands/              # Обработчики команд
│   │   ├── start.js          # Команда /start
│   │   ├── help.js           # Команда /help
│   │   ├── song.js           # Команда /song (поиск)
│   │   └── events.js         # Команда /events
│   ├── services/              # Сервисы
│   │   ├── firebase.js       # Интеграция с Firebase
│   │   └── search.js         # Поиск песен
│   └── utils/                 # Утилиты
│       └── keyboards.js      # Клавиатуры для бота
├── .env                       # Переменные окружения (не в git!)
├── .env.example              # Пример .env
├── serviceAccountKey.json    # Firebase ключ (не в git!)
├── package.json              # Зависимости
└── README.md                 # Эта документация
```

## 📱 Web App интеграция

Бот использует Telegram Web App API для открытия PWA прямо в Telegram:

```javascript
bot.sendMessage(chatId, 'Нажмите кнопку ниже:', {
  reply_markup: {
    inline_keyboard: [[
      {
        text: '🎵 Открыть Agape Worship',
        web_app: { url: 'https://agapeworship.asia' }
      }
    ]]
  }
});
```

## 🔔 Уведомления (будущая функция)

Планируется добавить уведомления через Firebase Cloud Functions:
- Новое событие создано
- Изменения в сет-листе
- Напоминание перед служением

## 🐛 Отладка

### Логи бота
```bash
# Смотреть логи в реальном времени
npm run dev
```

### Тестирование команд
1. Найдите вашего бота в Telegram по username
2. Отправьте `/start`
3. Проверьте все команды

### Частые проблемы

**Ошибка: "401 Unauthorized"**
- Проверьте токен бота в `.env`
- Убедитесь что токен правильный

**Ошибка: "Firebase не инициализирован"**
- Проверьте путь к `serviceAccountKey.json`
- Убедитесь что файл существует

**Бот не отвечает**
- Проверьте что бот запущен (`npm start`)
- Проверьте интернет соединение

## 🚀 Деплой на сервер

### Вариант 1: VPS (Ubuntu)

```bash
# Установить Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Клонировать проект
cd /home/your-user/
git clone https://github.com/your-repo/agape-worship.git
cd agape-worship/telegram-bot

# Установить зависимости
npm install

# Настроить .env и serviceAccountKey.json
nano .env

# Установить PM2 для автозапуска
sudo npm install -g pm2
pm2 start src/bot.js --name agape-bot
pm2 save
pm2 startup
```

### Вариант 2: Firebase Cloud Functions

```bash
# Перейти в папку functions
cd functions

# Добавить код бота в functions/index.js
# Деплой
firebase deploy --only functions
```

### Вариант 3: Heroku

```bash
# Создать приложение на Heroku
heroku create agape-worship-bot

# Добавить переменные окружения
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set WEB_APP_URL=https://agapeworship.asia

# Деплой
git push heroku main
```

## 📊 Мониторинг

### Статистика бота
- Количество пользователей
- Популярные команды
- Время отклика

(Будет добавлено позже)

## 🔒 Безопасность

- ✅ Токен бота хранится в `.env` (не в коде)
- ✅ Firebase ключ не попадает в git
- ✅ Все секреты в `.gitignore`
- ⚠️ Рекомендуется: Rate limiting для команд
- ⚠️ Рекомендуется: Авторизация пользователей

## 📝 Roadmap

### Версия 1.0 (текущая)
- [x] Базовая структура
- [x] Команда /start
- [x] Команда /help
- [x] Web App кнопка

### Версия 1.1
- [ ] Команда /song (поиск)
- [ ] Команда /events
- [ ] Интеграция с Firebase

### Версия 1.2
- [ ] Уведомления о событиях
- [ ] Команда /setlist
- [ ] Inline поиск

### Версия 2.0
- [ ] Telegram Mini App (упрощенная версия)
- [ ] Авторизация через Telegram
- [ ] Персональные настройки

## 🤝 Поддержка

Вопросы? Проблемы?
- Проверьте этот README
- Посмотрите логи: `npm run dev`
- Проверьте `.env` файл

## 📄 Лицензия

Этот бот является частью проекта Agape Worship.

---

**Последнее обновление**: 2025-01-14
**Версия**: 1.0.0
**Статус**: В разработке 🚧
