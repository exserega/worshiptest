# 🚀 Инструкции по настройке Telegram бота

## ✅ ШАГ 1: Регистрация бота в Telegram

### 1.1 Откройте BotFather
1. Откройте Telegram на любом устройстве
2. Найдите бота [@BotFather](https://t.me/BotFather)
3. Нажмите **Start**

### 1.2 Создайте нового бота
Отправьте команду:
```
/newbot
```

### 1.3 Выберите имя
BotFather спросит: **"Alright, a new bot. How are we going to call it?"**

Напишите имя (может содержать пробелы):
```
Agape Worship Bot
```

### 1.4 Выберите username
BotFather спросит: **"Now let's choose a username for your bot."**

Напишите username (должен заканчиваться на `bot`):
```
agape_worship_bot
```

Или придумайте свой, например:
- `agapeworship_bot`
- `agape_songs_bot`
- `agape_church_bot`

⚠️ **Важно**: Username должен быть уникальным! Если занят, попробуйте добавить цифры.

### 1.5 Сохраните токен
BotFather пришлет сообщение с **токеном**:
```
Done! Congratulations on your new bot...

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789

Keep your token secure and store it safely...
```

🔴 **СОХРАНИТЕ ЭТОТ ТОКЕН!** Он понадобится для настройки бота.

---

## ✅ ШАГ 2: Получение Firebase Service Account Key

### 2.1 Откройте Firebase Console
1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Войдите под вашим Google аккаунтом
3. Выберите проект **"song-archive-389a6"** (Agape Worship)

### 2.2 Перейдите в настройки
1. Нажмите на **шестеренку** ⚙️ в левом верхнем углу
2. Выберите **Project Settings** (Настройки проекта)

### 2.3 Откройте вкладку Service Accounts
1. Перейдите на вкладку **Service Accounts**
2. Прокрутите вниз до раздела **Firebase Admin SDK**

### 2.4 Сгенерируйте ключ
1. Убедитесь что выбран **Node.js**
2. Нажмите кнопку **Generate new private key** (Создать новый секретный ключ)
3. Появится предупреждение - нажмите **Generate key**
4. Файл `.json` автоматически скачается

### 2.5 Переименуйте файл
Найдите скачанный файл (обычно в папке Downloads):
```
song-archive-389a6-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
```

Переименуйте его в:
```
serviceAccountKey.json
```

🔴 **Этот файл содержит секретные ключи! НЕ публикуйте его нигде!**

---

## ✅ ШАГ 3: Установка Node.js (если еще не установлен)

### Для Windows:
1. Перейдите на [nodejs.org](https://nodejs.org/)
2. Скачайте **LTS версию** (рекомендуемая)
3. Запустите установщик
4. Следуйте инструкциям (оставьте все по умолчанию)
5. Перезагрузите компьютер

### Для macOS:
```bash
# Установите Homebrew (если еще нет)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установите Node.js
brew install node
```

### Для Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Проверка установки:
Откройте терминал/командную строку и выполните:
```bash
node --version
npm --version
```

Должны увидеть версии (например, v18.19.0 и 10.2.3)

---

## ✅ ШАГ 4: Настройка проекта

### 4.1 Откройте терминал в папке проекта

**Windows (PowerShell):**
```powershell
cd "C:\Users\YourName\Desktop\Worship site\worshiptest-main\telegram-bot"
```

**macOS/Linux:**
```bash
cd ~/Desktop/worshiptest-main/telegram-bot
```

### 4.2 Установите зависимости
```bash
npm install
```

Это займет 1-2 минуты. Вы увидите прогресс установки.

### 4.3 Скопируйте файл serviceAccountKey.json
Переместите скачанный файл `serviceAccountKey.json` в папку `telegram-bot`:

**Windows:**
```powershell
# Переместите файл из Downloads в telegram-bot
move "C:\Users\YourName\Downloads\serviceAccountKey.json" .
```

**macOS/Linux:**
```bash
mv ~/Downloads/serviceAccountKey.json .
```

### 4.4 Создайте файл .env
Скопируйте пример:

**Windows:**
```powershell
copy .env.example .env
```

**macOS/Linux:**
```bash
cp .env.example .env
```

### 4.5 Отредактируйте .env
Откройте файл `.env` в любом текстовом редакторе (Notepad, VS Code, Sublime):

```env
# Вставьте ваш токен от BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789

# Путь к ключу (обычно не нужно менять)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# URL вашего приложения (можно оставить как есть)
WEB_APP_URL=https://agapeworship.asia

# Режим разработки
NODE_ENV=development
```

🔴 **Замените токен на ваш реальный токен от BotFather!**

---

## ✅ ШАГ 5: Запуск бота

### 5.1 Запустите бота
В терминале выполните:
```bash
npm start
```

### 5.2 Проверьте вывод
Вы должны увидеть:
```
🚀 Запуск Agape Worship Telegram Bot...
📝 Режим: development
✅ Firebase инициализирован
📊 Проект: song-archive-389a6
✅ Бот успешно запущен!
👤 Имя бота: Agape Worship Bot
🔗 Username: @agape_worship_bot
📱 Бот готов к приему команд

📋 Доступные команды:
  /start   - Главное меню
  /help    - Справка
  /song    - Поиск песни
  /events  - Список событий

🔗 Найдите бота в Telegram: https://t.me/agape_worship_bot
```

✅ **Если видите такой вывод - всё работает!**

### 5.3 Тестируйте бота
1. Откройте Telegram
2. Найдите вашего бота по username
3. Отправьте `/start`
4. Попробуйте команды!

---

## ✅ ШАГ 6: Настройка Web App (опционально)

### 6.1 Настройте меню бота
Отправьте @BotFather команды:

```
/setcommands
```

Выберите вашего бота, затем отправьте:
```
start - Главное меню
help - Справка по командам
song - Поиск песни
events - Список событий
```

### 6.2 Добавьте описание
```
/setdescription
```

Выберите бота и отправьте:
```
Бот для быстрого доступа к Agape Worship - базе песен поклонения с аккордами, транспонированием и управлением сет-листами.
```

### 6.3 Добавьте короткое описание
```
/setabouttext
```

```
Agape Worship Bot - ваш помощник для поиска песен, событий и управления служениями поклонения.
```

---

## 🎉 Готово!

Ваш бот полностью настроен и работает!

### Что дальше?

1. **Тестируйте все команды**
   - `/start` - главное меню
   - `/help` - справка
   - `/song [название]` - поиск песен
   - `/events` - список событий

2. **Добавьте бота в группы** (опционально)
   - Можно добавить бота в группы церкви
   - Все участники смогут искать песни

3. **Настройте деплой на сервер** (для постоянной работы)
   - Сейчас бот работает только когда запущен на вашем компьютере
   - Для постоянной работы нужен сервер (инструкции в README.md)

---

## 🐛 Частые проблемы

### Ошибка: "401 Unauthorized"
❌ **Проблема**: Неверный токен бота
✅ **Решение**: Проверьте токен в файле `.env`

### Ошибка: "Firebase не инициализирован"
❌ **Проблема**: Файл `serviceAccountKey.json` не найден
✅ **Решение**: 
- Проверьте что файл находится в папке `telegram-bot/`
- Проверьте путь в `.env`

### Бот не отвечает
❌ **Проблема**: Бот не запущен или нет интернета
✅ **Решение**:
- Убедитесь что `npm start` запущен
- Проверьте интернет соединение

### Ошибка: "Cannot find module"
❌ **Проблема**: Зависимости не установлены
✅ **Решение**: Выполните `npm install`

---

## 📞 Нужна помощь?

Если что-то не работает:
1. Проверьте логи в терминале
2. Убедитесь что все файлы на месте:
   - `.env` (с токеном)
   - `serviceAccountKey.json`
3. Перезапустите бота (Ctrl+C, затем `npm start`)

---

**Последнее обновление**: 2025-01-14
