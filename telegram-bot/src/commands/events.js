// =====================================================
// 📅 КОМАНДА /EVENTS
// =====================================================
// Просмотр ближайших событий/служений
// =====================================================

const { getUpcomingEvents } = require('../services/search');

/**
 * Обработчик команды /events
 */
async function handleEvents(bot, msg) {
    const chatId = msg.chat.id;

    // Показываем индикатор "печатает..."
    await bot.sendChatAction(chatId, 'typing');

    try {
        const events = await getUpcomingEvents();

        if (!events || events.length === 0) {
            await bot.sendMessage(chatId,
                '📅 Ближайших событий пока нет\n\n' +
                'Проверьте позже или откройте приложение для просмотра всего календаря',
                {
                    reply_markup: {
                        inline_keyboard: [[
                            {
                                text: '📅 Открыть календарь',
                                web_app: { 
                                    url: `${process.env.WEB_APP_URL}/public/events/` 
                                }
                            }
                        ]]
                    }
                }
            );
            return;
        }

        // Формируем сообщение
        let message = `📅 **Ближайшие события** (${events.length}):\n\n`;

        events.forEach((event, index) => {
            const date = formatEventDate(event.date);
            const songsText = event.songCount ? ` • 🎵 ${event.songCount} ${getSongWord(event.songCount)}` : '';
            const participantsText = event.participantCount ? ` • 👥 ${event.participantCount}` : '';

            message += `**${index + 1}. ${event.name}**\n`;
            message += `📆 ${date}${songsText}${participantsText}\n\n`;
        });

        // Кнопки для событий
        const keyboard = {
            inline_keyboard: []
        };

        // Кнопки для первых 3 событий
        events.slice(0, 3).forEach((event) => {
            keyboard.inline_keyboard.push([{
                text: `📄 ${event.name}`,
                web_app: { 
                    url: `${process.env.WEB_APP_URL}/public/event/?id=${event.id}` 
                }
            }]);
        });

        // Кнопка "Открыть календарь"
        keyboard.inline_keyboard.push([{
            text: '📅 Открыть полный календарь',
            web_app: { 
                url: `${process.env.WEB_APP_URL}/public/events/` 
            }
        }]);

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });

    } catch (error) {
        console.error('❌ Ошибка получения событий:', error);
        await bot.sendMessage(chatId,
            '❌ Произошла ошибка при загрузке событий\n\n' +
            'Попробуйте позже или откройте приложение',
            {
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '📅 Открыть календарь',
                            web_app: { 
                                url: `${process.env.WEB_APP_URL}/public/events/` 
                            }
                        }
                    ]]
                }
            }
        );
    }
}

/**
 * Форматирование даты события
 */
function formatEventDate(dateValue) {
    try {
        let date;
        
        if (dateValue && typeof dateValue.toDate === 'function') {
            // Firebase Timestamp
            date = dateValue.toDate();
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            return 'Дата не указана';
        }

        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const options = { 
            day: 'numeric', 
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        };
        const formattedDate = date.toLocaleDateString('ru-RU', options);

        if (diffDays === 0) {
            return `Сегодня, ${formattedDate}`;
        } else if (diffDays === 1) {
            return `Завтра, ${formattedDate}`;
        } else if (diffDays > 0 && diffDays <= 7) {
            return `Через ${diffDays} ${getDayWord(diffDays)}, ${formattedDate}`;
        } else {
            return formattedDate;
        }
    } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return 'Дата не указана';
    }
}

/**
 * Правильное склонение слова "день"
 */
function getDayWord(count) {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return 'дней';
    }

    if (lastDigit === 1) {
        return 'день';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'дня';
    }

    return 'дней';
}

/**
 * Правильное склонение слова "песня"
 */
function getSongWord(count) {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return 'песен';
    }

    if (lastDigit === 1) {
        return 'песня';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'песни';
    }

    return 'песен';
}

module.exports = { handleEvents };
