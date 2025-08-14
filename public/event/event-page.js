/**
 * @fileoverview Логика страницы события
 * @module EventPage
 */

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDTqPgrfZ6ACzHkL3EWqTWU0m_VCM0q2vg",
    authDomain: "song-archive-389a6.firebaseapp.com",
    projectId: "song-archive-389a6",
    storageBucket: "song-archive-389a6.appspot.com",
    messagingSenderId: "1072269559435",
    appId: "1:1072269559435:web:bf93c5a8b76a7dab1f9c07"
};

// Инициализация Firebase
if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}

// Получаем сервисы
const db = window.firebase.firestore();
const auth = window.firebase.auth();

// ID события из URL
const eventId = new URLSearchParams(window.location.search).get('id');

// Элементы страницы
const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    headerTitle: document.querySelector('.header-title'),
    
    // Информация о событии
    eventInfo: document.getElementById('event-info'),
    eventDate: document.getElementById('event-date'),
    eventLeaderInfo: document.getElementById('event-leader-info'),
    eventLeader: document.getElementById('event-leader'),
    eventParticipantsInfo: document.getElementById('event-participants-info'),
    eventParticipantsCount: document.getElementById('event-participants-count'),
    eventCommentSection: document.getElementById('event-comment-section'),
    eventComment: document.getElementById('event-comment'),
    
    // Секция песен
    songsSection: document.getElementById('songs-section'),
    songsList: document.getElementById('songs-list'),
    songsCount: document.getElementById('songs-count'),
    launchPlayer: document.getElementById('launch-player'),
    
    // Секция участников
    participantsSection: document.getElementById('participants-section'),
    participantsList: document.getElementById('participants-list'),
    
    // Секция комментариев
    commentsSection: document.getElementById('comments-section'),
    commentsList: document.getElementById('comments-list'),
    commentForm: document.getElementById('comment-form'),
    commentInput: document.getElementById('comment-input'),
    sendComment: document.getElementById('send-comment'),
    
    // Кнопки
    backBtn: document.getElementById('back-btn'),
    shareBtn: document.getElementById('share-btn'),
    
    // Модальное окно шеринга
    shareModal: document.getElementById('share-modal'),
    shareWhatsapp: document.getElementById('share-whatsapp'),
    shareTelegram: document.getElementById('share-telegram'),
    shareCopy: document.getElementById('share-copy'),
    closeShare: document.getElementById('close-share')
};

// Данные события
let eventData = null;
let currentUser = null;

/**
 * Инициализация страницы
 */
async function init() {
    console.log('🎯 Инициализация страницы события');
    
    // Применяем тему
    applyTheme();
    
    // Проверяем наличие ID события
    if (!eventId) {
        showError('ID события не указан');
        return;
    }
    
    try {
        // Проверяем аутентификацию (необязательно для просмотра)
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                console.log('👤 Пользователь авторизован:', user.email);
            } else {
                console.log('👤 Гостевой режим');
            }
            
            // Загружаем событие
            await loadEvent();
        });
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showError('Ошибка загрузки страницы');
    }
}

/**
 * Применение темы
 */
function applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * Загрузка события
 */
async function loadEvent() {
    console.log('📅 Загрузка события:', eventId);
    
    try {
        // Получаем событие
        const eventDoc = await db.collection('events').doc(eventId).get();
        
        if (!eventDoc.exists) {
            showError('Событие не найдено');
            return;
        }
        
        eventData = {
            id: eventDoc.id,
            ...eventDoc.data()
        };
        
        console.log('✅ Событие загружено:', eventData);
        
        // Отображаем данные
        displayEvent();
        
        // Загружаем дополнительные данные
        if (eventData.setlistId) {
            await loadSongs();
        }
        
        if (eventData.participants && eventData.participants.length > 0) {
            displayParticipants();
        }
        
        // Настраиваем обработчики
        setupEventHandlers();
        
        // Скрываем загрузку
        elements.loading.style.display = 'none';
        
    } catch (error) {
        console.error('❌ Ошибка загрузки события:', error);
        showError('Не удалось загрузить событие');
    }
}

/**
 * Отображение данных события
 */
function displayEvent() {
    // Заголовок
    elements.headerTitle.textContent = eventData.name || 'Событие';
    
    // Дата и время
    if (eventData.date) {
        const date = eventData.date.toDate ? eventData.date.toDate() : new Date(eventData.date);
        const options = { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        elements.eventDate.textContent = date.toLocaleDateString('ru-RU', options);
    }
    
    // Лидер
    if (eventData.leaderName) {
        elements.eventLeader.textContent = eventData.leaderName;
        elements.eventLeaderInfo.style.display = 'flex';
    }
    
    // Участники
    if (eventData.participantCount > 0) {
        elements.eventParticipantsCount.textContent = eventData.participantCount;
        elements.eventParticipantsInfo.style.display = 'flex';
    }
    
    // Комментарий
    if (eventData.comment) {
        elements.eventComment.textContent = eventData.comment;
        elements.eventCommentSection.style.display = 'block';
    }
    
    // Показываем секцию
    elements.eventInfo.style.display = 'block';
}

/**
 * Загрузка песен
 */
async function loadSongs() {
    console.log('🎵 Загрузка песен для сетлиста:', eventData.setlistId);
    
    try {
        // Получаем сетлист
        const setlistDoc = await db.collection('worship_setlists').doc(eventData.setlistId).get();
        
        if (!setlistDoc.exists) {
            console.warn('⚠️ Сетлист не найден');
            return;
        }
        
        const setlistData = setlistDoc.data();
        const setlistSongs = setlistData.songs || [];
        
        console.log(`✅ Загружено ${setlistSongs.length} песен из сетлиста`);
        
        // Загружаем полную информацию о песнях
        const songsWithDetails = await Promise.all(
            setlistSongs.map(async (setlistSong) => {
                try {
                    // Пытаемся найти песню в коллекции songs по названию
                    const songQuery = await db.collection('songs')
                        .where('name', '==', setlistSong.songId)
                        .limit(1)
                        .get();
                    
                    if (!songQuery.empty) {
                        const songData = songQuery.docs[0].data();
                        return {
                            ...songData,
                            preferredKey: setlistSong.preferredKey || songData.defaultKey,
                            order: setlistSong.order
                        };
                    }
                } catch (err) {
                    console.warn('⚠️ Не удалось загрузить детали песни:', setlistSong.songId);
                }
                
                // Если не нашли в БД, возвращаем как есть
                return {
                    name: setlistSong.songId,
                    preferredKey: setlistSong.preferredKey,
                    order: setlistSong.order
                };
            })
        );
        
        // Сортируем по order
        songsWithDetails.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Отображаем песни
        displaySongs(songsWithDetails);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки песен:', error);
    }
}

/**
 * Отображение списка песен
 */
function displaySongs(songs) {
    if (songs.length === 0) {
        elements.songsList.innerHTML = '<p class="empty-message">Нет песен в списке</p>';
        return;
    }
    
    // Обновляем счетчик
    elements.songsCount.textContent = `${songs.length} ${getSongWord(songs.length)}`;
    
    // Логируем структуру первой песни для отладки
    if (songs.length > 0) {
        console.log('🎵 Структура песни:', songs[0]);
    }
    
    // Создаем элементы песен с дизайном как в панели сетлистов
    elements.songsList.innerHTML = songs.map((song, index) => {
        // Теперь у нас есть полные данные песни
        const songName = song.name || 'Без названия';
        const songKey = song.preferredKey || song.defaultKey || 'C';
        const songBpm = song.bpm || song.BPM || '';
        
        return `
            <div class="song-item">
                <span class="song-number">${index + 1}</span>
                <div class="song-info">
                    <div class="song-name">${songName}</div>
                    <div class="song-meta">
                        <span class="song-key">${songKey}</span>
                        ${songBpm && songBpm !== 'NA' ? `
                            <span class="song-bpm">
                                <i class="fas fa-tachometer-alt"></i> ${songBpm} BPM
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Показываем секцию
    elements.songsSection.style.display = 'block';
}

/**
 * Склонение слова "песня"
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

/**
 * Отображение участников
 */
function displayParticipants() {
    const participants = eventData.participants || [];
    
    if (participants.length === 0) {
        return;
    }
    
    // Группируем по инструментам
    const grouped = {};
    participants.forEach(p => {
        if (!grouped[p.instrumentName]) {
            grouped[p.instrumentName] = [];
        }
        grouped[p.instrumentName].push(p.userName);
    });
    
    // Создаем HTML
    elements.participantsList.innerHTML = Object.entries(grouped).map(([instrument, names]) => `
        <div class="participant-group">
            <div class="participant-instrument">${instrument}:</div>
            <div class="participant-names">
                ${names.map(name => `<span class="participant-chip">${name}</span>`).join('')}
            </div>
        </div>
    `).join('');
    
    // Показываем секцию
    elements.participantsSection.style.display = 'block';
}

/**
 * Настройка обработчиков событий
 */
function setupEventHandlers() {
    // Кнопка назад
    elements.backBtn.addEventListener('click', () => {
        window.history.back();
    });
    
    // Кнопка поделиться
    elements.shareBtn.addEventListener('click', () => {
        elements.shareModal.style.display = 'flex';
    });
    
    // Закрыть модальное окно
    elements.closeShare.addEventListener('click', () => {
        elements.shareModal.style.display = 'none';
    });
    
    // Клик вне модального окна
    elements.shareModal.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) {
            elements.shareModal.style.display = 'none';
        }
    });
    
    // Поделиться в WhatsApp
    elements.shareWhatsapp.addEventListener('click', () => {
        shareEvent('whatsapp');
    });
    
    // Поделиться в Telegram
    elements.shareTelegram.addEventListener('click', () => {
        shareEvent('telegram');
    });
    
    // Скопировать ссылку
    elements.shareCopy.addEventListener('click', () => {
        copyLink();
    });
    
    // Запустить плеер
    elements.launchPlayer.addEventListener('click', () => {
        launchPlayer();
    });
}

/**
 * Поделиться событием
 */
function shareEvent(platform) {
    const url = window.location.href;
    const title = eventData.name || 'Событие';
    const date = eventData.date ? formatShareDate(eventData.date) : '';
    
    // Формируем текст с участниками
    let text = `📅 ${title}\n${date}\n`;
    
    if (eventData.leaderName) {
        text += `🎤 Лидер: ${eventData.leaderName}\n`;
    }
    
    if (eventData.participants && eventData.participants.length > 0) {
        text += '\n👥 Участники:\n';
        const grouped = {};
        eventData.participants.forEach(p => {
            if (!grouped[p.instrumentName]) {
                grouped[p.instrumentName] = [];
            }
            grouped[p.instrumentName].push(p.userName);
        });
        
        for (const [instrument, names] of Object.entries(grouped)) {
            text += `${instrument}: ${names.join(', ')}\n`;
        }
    }
    
    text += `\n🔗 ${url}`;
    
    let shareUrl;
    
    if (platform === 'whatsapp') {
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    } else if (platform === 'telegram') {
        // Для Telegram не дублируем ссылку, так как она уже в тексте
        const textWithoutLink = text.replace(`\n🔗 ${url}`, '');
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(textWithoutLink)}`;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank');
        elements.shareModal.style.display = 'none';
    }
}

/**
 * Форматирование даты для шеринга
 */
function formatShareDate(date) {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Копирование ссылки
 */
async function copyLink() {
    try {
        await navigator.clipboard.writeText(window.location.href);
        
        // Показываем уведомление
        const btn = elements.shareCopy;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
        btn.style.background = '#10b981';
        btn.style.color = 'white';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Ошибка копирования:', error);
        alert('Не удалось скопировать ссылку');
    }
}

/**
 * Запуск плеера
 */
function launchPlayer() {
    // TODO: Интеграция с плеером
    alert('Плеер будет реализован в следующей версии');
}

/**
 * Показ ошибки
 */
function showError(message) {
    elements.loading.style.display = 'none';
    elements.error.style.display = 'block';
    
    const errorText = elements.error.querySelector('p');
    if (errorText && message) {
        errorText.textContent = message;
    }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', init);