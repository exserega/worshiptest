// =====================================================
// 🎵 КОМАНДА /SONG
// =====================================================
// Поиск песен в базе данных
// =====================================================

const { searchSongs } = require('../services/search');

/**
 * Обработчик команды /song [название]
 */
async function handleSong(bot, msg, match) {
    const chatId = msg.chat.id;
    const query = match && match[1] ? match[1].trim() : null;

    // Если не указан запрос
    if (!query) {
        await bot.sendMessage(chatId,
            '🔍 **Как использовать поиск:**\n\n' +
            'Отправьте команду:\n' +
            '`/song Название песни`\n\n' +
            '**Примеры:**\n' +
            '• `/song Благая весть`\n' +
            '• `/song Иисус жив`\n' +
            '• `/song Величит душа`',
            { 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🎵 Открыть все песни',
                            web_app: { url: process.env.WEB_APP_URL }
                        }
                    ]]
                }
            }
        );
        return;
    }

    // Показываем индикатор "печатает..."
    await bot.sendChatAction(chatId, 'typing');

    try {
        // Поиск песен
        const songs = await searchSongs(query);

        if (!songs || songs.length === 0) {
            await bot.sendMessage(chatId,
                `🔍 Песни не найдены по запросу: "${query}"\n\n` +
                `Попробуйте:\n` +
                `• Проверить написание\n` +
                `• Использовать другие слова\n` +
                `• Открыть полное приложение для расширенного поиска`,
                {
                    reply_markup: {
                        inline_keyboard: [[
                            {
                                text: '🎵 Открыть все песни',
                                web_app: { url: process.env.WEB_APP_URL }
                            }
                        ]]
                    }
                }
            );
            return;
        }

        // Показываем результаты
        if (songs.length === 1) {
            // Одна песня - показываем подробно
            await sendSongDetails(bot, chatId, songs[0]);
        } else {
            // Несколько песен - показываем список
            await sendSongsList(bot, chatId, songs, query);
        }

    } catch (error) {
        console.error('❌ Ошибка поиска песни:', error);
        await bot.sendMessage(chatId,
            '❌ Произошла ошибка при поиске.\n\n' +
            'Попробуйте:\n' +
            '• Повторить запрос позже\n' +
            '• Использовать полное приложение',
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
}

/**
 * Отправка деталей одной песни
 */
async function sendSongDetails(bot, chatId, song) {
    const message = 
        `🎵 **${song.name}**\n\n` +
        `🎸 Тональность: ${song.defaultKey || 'Не указана'}\n` +
        `📂 Категория: ${song.sheet || 'Не указана'}\n` +
        (song.BPM || song.bpm ? `⏱ BPM: ${song.BPM || song.bpm}\n` : '') +
        (song.youtubeLink ? `\n🎬 [Видео на YouTube](${song.youtubeLink})` : '');

    const keyboard = {
        inline_keyboard: [
            [{
                text: '📄 Открыть песню',
                web_app: { 
                    url: `${process.env.WEB_APP_URL}?song=${encodeURIComponent(song.name)}` 
                }
            }]
        ]
    };

    if (song.youtubeLink) {
        keyboard.inline_keyboard.push([{
            text: '▶️ Смотреть на YouTube',
            url: song.youtubeLink
        }]);
    }

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        disable_web_page_preview: false
    });
}

/**
 * Отправка списка песен
 */
async function sendSongsList(bot, chatId, songs, query) {
    const MAX_SONGS = 5;
    const displaySongs = songs.slice(0, MAX_SONGS);
    const hasMore = songs.length > MAX_SONGS;

    let message = `🔍 Найдено ${songs.length} ${getSongWord(songs.length)} по запросу "${query}":\n\n`;

    displaySongs.forEach((song, index) => {
        message += `${index + 1}. **${song.name}**\n`;
        message += `   🎸 ${song.defaultKey || '?'} • 📂 ${song.sheet || 'Без категории'}\n\n`;
    });

    if (hasMore) {
        message += `\n...и еще ${songs.length - MAX_SONGS} ${getSongWord(songs.length - MAX_SONGS)}\n\n`;
    }

    message += `Выберите песню ниже или откройте приложение для просмотра всех результатов`;

    // Кнопки для первых 3 песен
    const keyboard = {
        inline_keyboard: []
    };

    displaySongs.slice(0, 3).forEach((song) => {
        keyboard.inline_keyboard.push([{
            text: `📄 ${song.name}`,
            web_app: { 
                url: `${process.env.WEB_APP_URL}?song=${encodeURIComponent(song.name)}` 
            }
        }]);
    });

    // Кнопка "Показать все"
    keyboard.inline_keyboard.push([{
        text: '🎵 Открыть все результаты',
        web_app: { 
            url: `${process.env.WEB_APP_URL}?search=${encodeURIComponent(query)}` 
        }
    }]);

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
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

module.exports = { handleSong };
