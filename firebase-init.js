// ====================================
// FIREBASE INITIALIZATION v8
// Единая точка инициализации Firebase для всего проекта
// ====================================

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBlkjVQFtFpMRFexAi6nBqEkIfjFlU5cDo",
    authDomain: "song-archive-389a6.firebaseapp.com",
    projectId: "song-archive-389a6",
    storageBucket: "song-archive-389a6.appspot.com",
    messagingSenderId: "619735277668",
    appId: "1:619735277668:web:51d2684bd8d4444eaf3f71",
    measurementId: "G-Z6QYH5YD2E"
};

// Проверяем, не инициализирован ли уже Firebase
if (!window.firebase) {
    console.error('Firebase SDK не загружен! Убедитесь, что скрипты Firebase подключены в HTML.');
} else if (!window.firebase.apps.length) {
    // Инициализируем Firebase только если еще не инициализирован
    window.firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase инициализирован');
} else {
    console.log('✅ Firebase уже был инициализирован');
}

// Создаем локальные переменные из глобального объекта
const firebase = window.firebase;
const auth = firebase?.auth?.();
const db = firebase?.firestore?.();
const storage = firebase?.storage?.();

// Делаем доступными глобально для обратной совместимости
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

// Включаем офлайн-персистентность Firestore (чтение ранее загруженных данных офлайн)
// Определяем, является ли это Safari на iOS
const isIOSSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                   /Safari/.test(navigator.userAgent) && 
                   !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

if (isIOSSafari) {
    console.log('📱 iOS Safari detected - skipping Firestore persistence to prevent blocking');
    // НЕ включаем persistence для iOS Safari из-за известных проблем
} else {
    // Для остальных браузеров включаем persistence
    try {
        if (firebase?.firestore) {
            firebase.firestore().enablePersistence({ synchronizeTabs: true })
                .then(() => {
                    console.log('✅ Firestore persistence enabled with tab sync');
                })
                .catch((error) => {
                    console.warn('⚠️ Firestore persistence not enabled:', error?.code || error?.message || error);
                });
        }
    } catch (e) {
        console.warn('⚠️ Firestore persistence setup failed:', e);
    }
}

// Экспорт для модулей
export { firebase, auth, db, storage, firebaseConfig };

// ================================
// Global alert shim → dark toast
// ================================
try {
    (async () => {
        const url = new URL(window.location.href);
        const nativeAlertOnly = url.searchParams.get('nativeAlert') === '1';
        if (nativeAlertOnly) return;
        if (!window._nativeAlert) window._nativeAlert = window.alert.bind(window);
        const { showToast } = await import('/src/ui/notifications.js');
        window.alert = function(message) {
            try { showToast(String(message || ''), 'warning', 3000); } catch (e) { window._nativeAlert(String(message || '')); }
        };
        console.log('✅ Alert shim enabled (toast)');
    })();
} catch (e) {
    console.warn('⚠️ Alert shim failed, using native alert', e);
}