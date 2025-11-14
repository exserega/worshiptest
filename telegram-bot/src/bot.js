// =====================================================
// 🤖 AGAPE WORSHIP TELEGRAM BOT
// =====================================================
// Главный файл бота для интеграции с Agape Worship PWA
// =====================================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { initializeFirebase } = require('./services/firebase');
const { handleStart } = require('./commands/start');
const { handleHelp } = require('./commands/help');
const { handleSong } = require('./commands/song');
const { handleEvents } = require('./commands/events');

// =====================================================
// КОНФИГУРАЦИЯ
// =====================================================

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!TOKEN) {
    console.error('❌ ОШИБКА: TELEGRAM_BOT_TOKEN не найден в .env файле!');
    console.error('📝 Создайте файл .env и добавьте токен от @BotFather');
    process.exit(1);
}

// =====================================================
// ИНИЦИАЛИЗАЦИЯ БОТА
// =====================================================

console.log('🚀 Запуск Agape Worship Telegram Bot...');
console.log(`📝 Режим: ${NODE_ENV}`);

// Создание бота с polling режимом (для разработки)
const bot = new TelegramBot(TOKEN, { 
    polling: true,
    filepath: false // Отключаем автоматическую загрузку файлов
});

// Инициализация Firebase
initializeFirebase()
    .then(() => {
        console.log('✅ Firebase инициализирован');
    })
    .catch((error) => {
        console.error('❌ Ошибка инициализации Firebase:', error);
        // Бот может работать без Firebase, но с ограниченной функциональностью
    });

// =====================================================
// ОБРАБОТЧИКИ КОМАНД
// =====================================================

// Команда /start - Приветствие и главное меню
bot.onText(/\/start/, (msg) => handleStart(bot, msg));

// Команда /help - Справка
bot.onText(/\/help/, (msg) => handleHelp(bot, msg));

// Команда /song [название] - Поиск песни
bot.onText(/\/song(?:\s+(.+))?/, (msg, match) => handleSong(bot, msg, match));

// Команда /events - Список событий
bot.onText(/\/events/, (msg) => handleEvents(bot, msg));

// =====================================================
// ОБРАБОТЧИК CALLBACK QUERIES
// =====================================================

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    try {
        // Подтверждаем получение callback
        await bot.answerCallbackQuery(query.id);
        
        // Обрабатываем различные callback'и
        if (data === 'help') {
            handleHelp(bot, query.message);
        } else if (data === 'search_songs') {
            bot.sendMessage(chatId, 
                '🔍 Для поиска песни используйте:\n' +
                '/song Название песни\n\n' +
                'Например:\n' +
                '/song Благая весть'
            );
        } else if (data === 'view_events') {
            handleEvents(bot, query.message);
        } else if (data.startsWith('song_')) {
            // Обработка выбора конкретной песни
            const songId = data.replace('song_', '');
            // TODO: показать детали песни
            bot.sendMessage(chatId, `📄 Загрузка деталей песни ${songId}...`);
        }
    } catch (error) {
        console.error('❌ Ошибка обработки callback query:', error);
    }
});

// =====================================================
// ОБРАБОТЧИК НЕИЗВЕСТНЫХ КОМАНД
// =====================================================

bot.on('message', (msg) => {
    const text = msg.text;
    
    // Игнорируем уже обработанные команды
    if (!text || text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    
    // Простой текстовый поиск (если пользователь просто пишет название)
    if (text.length > 2) {
        bot.sendMessage(chatId,
            '🔍 Ищете песню?\n' +
            'Используйте команду:\n' +
            `/song ${text}\n\n` +
            'Или нажмите кнопку "Открыть Agape Worship" для полного доступа',
            {
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🎵 Открыть Agape Worship',
                            web_app: { url: process.env.WEB_APP_URL }
                        }
                    ]]
                }
            }
        );
    }
});

// =====================================================
// ОБРАБОТЧИК ОШИБОК
// =====================================================

bot.on('polling_error', (error) => {
    console.error('❌ Polling ошибка:', error.code, error.message);
    
    if (error.code === 'ETELEGRAM' && error.response?.statusCode === 401) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Неверный токен бота!');
        console.error('📝 Проверьте TELEGRAM_BOT_TOKEN в .env файле');
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// =====================================================
// ИНФОРМАЦИЯ О ЗАПУСКЕ
// =====================================================

bot.getMe().then((botInfo) => {
    console.log('✅ Бот успешно запущен!');
    console.log(`👤 Имя бота: ${botInfo.first_name}`);
    console.log(`🔗 Username: @${botInfo.username}`);
    console.log('📱 Бот готов к приему команд');
    console.log('');
    console.log('📋 Доступные команды:');
    console.log('  /start   - Главное меню');
    console.log('  /help    - Справка');
    console.log('  /song    - Поиск песни');
    console.log('  /events  - Список событий');
    console.log('');
    console.log('🔗 Найдите бота в Telegram: https://t.me/' + botInfo.username);
}).catch((error) => {
    console.error('❌ Ошибка получения информации о боте:', error);
});

// Экспорт для тестов
module.exports = { bot };
