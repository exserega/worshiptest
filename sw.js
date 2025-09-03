// Service Worker v599 - Simplified dark background for songs
const CACHE_NAME = 'agape-worship-cache-v599';
const urlsToCache = [
  './', // Главная страница
  './index.html',
  './script.js',
  './styles.css',
  './manifest.json',
  './archive/', // Страница архива
  './archive/index.html',
  './archive/archive.js',
  './archive/archive-page.css',
  './js/api.js',
  './ui.js',
  './js/core.js',
  './js/state.js',
  './js/constants.js',
  './js/firebase-config.js',
  './firebase-init.js',
  // Модульные UI для офлайн
  './src/main/initialization.js',
  './src/main/controller.js',
  './src/core/index.js',
  './src/ui/song-display.js',
  './styles/variables.css',
  './src/modules/integration/datePickerModal.js',
  './src/modules/integration/integrationStyles.css',
  './src/modules/integration/calendarStyles.css',
  './src/modules/integration/eventChecker.js',
  './src/modules/integration/eventActionModal.js',
  './src/modules/integration/eventActionStyles.css',
  './src/modules/integration/eventSelectorModal.js',
  './src/modules/integration/eventSelectorStyles.css',
  './src/modules/events/eventModal.js',
  './styles/event-creation-fixes.css',
  './styles/event-creation-modal-complete.css',
  './assets/images/Icon-192.png', // Добавим иконки для PWA
  './assets/images/Icon-512.png',
  // Внешние ресурсы, их пути не меняются
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js'
  // Аудио файл метронома убран из кэша - токен может быть недействительным
];

// Событие 'install' (установка): открываем кэш и добавляем в него все наши файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Service Worker: Кэшируем основные файлы приложения');
        
        // Кэшируем файлы по одному, пропуская те, которые не удается загрузить
        const cachePromises = urlsToCache.map(async (url) => {
          try {
            await cache.add(url);
            console.log(`Service Worker: Успешно кэширован ${url}`);
          } catch (error) {
            console.warn(`Service Worker: Не удалось кэшировать ${url}:`, error);
          }
        });
        
        await Promise.all(cachePromises);
        return self.skipWaiting();
      })
  );
});

// Событие 'activate' (активация): удаляем старые кэши, если они есть
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Событие 'fetch' (запрос): перехватываем все запросы с сайта
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Сначала ищем ответ в кэше
    caches.match(event.request)
      .then((response) => {
        // Если ответ найден в кэше, отдаем его
        if (response) {
          return response;
        }
        // Если в кэше ничего нет, идем в интернет
        return fetch(event.request).catch((error) => {
          console.warn('Service Worker: Ошибка fetch для', event.request.url, error);
          // Возвращаем fallback-ответ для критически важных ресурсов
          if (event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
            return caches.match('./index.html');
          }
          throw error;
        });
      })
  );
});

// Событие 'message' (сообщения): обрабатываем запросы версии
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    // Отправляем версию обратно всем клиентам
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'VERSION',
          version: CACHE_NAME
        });
      });
    });
  }
});
