// =====================================================
// 📱 КОМАНДА /START
// =====================================================
// Приветствие и главное меню бота
// =====================================================

const { getMainKeyboard } = require('../utils/keyboards');

/**
 * Обработчик команды /start
 */
async function handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'друг';

    const welcomeMessage = 
        `👋 Привет, ${firstName}!\n\n` +
        `Добро пожаловать в **Agape Worship Bot**!\n\n` +
        `🎵 Я помогу вам:\n` +
        `• Быстро найти нужную песню\n` +
        `• Посмотреть ближайшие события\n` +
        `• Получать уведомления о служениях\n` +
        `• Открыть полное приложение в один клик\n\n` +
        `Выберите действие ниже 👇`;

    try {
        await bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard()
        });
    } catch (error) {
        console.error('❌ Ошибка в команде /start:', error);
        await bot.sendMessage(chatId, 
            '❌ Произошла ошибка. Попробуйте еще раз или используйте /help'
        );
    }
}

module.exports = { handleStart };
