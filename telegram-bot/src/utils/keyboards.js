// =====================================================
// ⌨️ KEYBOARDS UTILITY
// =====================================================
// Генерация клавиатур для Telegram бота
// =====================================================

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://agapeworship.asia';

/**
 * Главная клавиатура (inline keyboard)
 */
function getMainKeyboard() {
    return {
        inline_keyboard: [
            [
                {
                    text: '🎵 Открыть Agape Worship',
                    web_app: { url: WEB_APP_URL }
                }
            ],
            [
                {
                    text: '🔍 Искать песню',
                    callback_data: 'search_songs'
                },
                {
                    text: '📅 События',
                    callback_data: 'view_events'
                }
            ],
            [
                {
                    text: 'ℹ️ Справка',
                    callback_data: 'help'
                }
            ]
        ]
    };
}

/**
 * Клавиатура для результатов поиска песен
 */
function getSongResultsKeyboard(songs) {
    const keyboard = {
        inline_keyboard: []
    };

    // Добавляем кнопки для песен (максимум 3)
    songs.slice(0, 3).forEach((song) => {
        keyboard.inline_keyboard.push([{
            text: `📄 ${song.name}`,
            web_app: { 
                url: `${WEB_APP_URL}?song=${encodeURIComponent(song.name)}` 
            }
        }]);
    });

    // Кнопка "Показать все"
    if (songs.length > 3) {
        keyboard.inline_keyboard.push([{
            text: '📋 Показать все результаты',
            web_app: { url: WEB_APP_URL }
        }]);
    }

    // Кнопка "Назад"
    keyboard.inline_keyboard.push([{
        text: '◀️ Назад',
        callback_data: 'back_to_main'
    }]);

    return keyboard;
}

/**
 * Клавиатура для детальной информации о песне
 */
function getSongDetailsKeyboard(song) {
    const keyboard = {
        inline_keyboard: [
            [{
                text: '📄 Открыть песню',
                web_app: { 
                    url: `${WEB_APP_URL}?song=${encodeURIComponent(song.name)}` 
                }
            }]
        ]
    };

    // Добавляем кнопку YouTube если есть ссылка
    if (song.youtubeLink) {
        keyboard.inline_keyboard.push([{
            text: '▶️ Смотреть на YouTube',
            url: song.youtubeLink
        }]);
    }

    // Кнопка "Назад"
    keyboard.inline_keyboard.push([{
        text: '◀️ Назад к поиску',
        callback_data: 'search_songs'
    }]);

    return keyboard;
}

/**
 * Клавиатура для списка событий
 */
function getEventsKeyboard(events) {
    const keyboard = {
        inline_keyboard: []
    };

    // Добавляем кнопки для событий (максимум 3)
    events.slice(0, 3).forEach((event) => {
        keyboard.inline_keyboard.push([{
            text: `📄 ${event.name}`,
            web_app: { 
                url: `${WEB_APP_URL}/public/event/?id=${event.id}` 
            }
        }]);
    });

    // Кнопка "Открыть календарь"
    keyboard.inline_keyboard.push([{
        text: '📅 Открыть календарь',
        web_app: { 
            url: `${WEB_APP_URL}/public/events/` 
        }
    }]);

    // Кнопка "Назад"
    keyboard.inline_keyboard.push([{
        text: '◀️ Назад',
        callback_data: 'back_to_main'
    }]);

    return keyboard;
}

/**
 * Клавиатура с кнопкой "Открыть приложение"
 */
function getOpenAppKeyboard(text = '🎵 Открыть Agape Worship') {
    return {
        inline_keyboard: [[
            {
                text: text,
                web_app: { url: WEB_APP_URL }
            }
        ]]
    };
}

module.exports = {
    getMainKeyboard,
    getSongResultsKeyboard,
    getSongDetailsKeyboard,
    getEventsKeyboard,
    getOpenAppKeyboard
};
