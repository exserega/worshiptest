// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyBdReqK7n6QxKFm_o9g6Ejrj7JDSu6PJIc",
    authDomain: "agape-worship-app.firebaseapp.com",
    projectId: "agape-worship-app",
    storageBucket: "agape-worship-app.appspot.com",
    messagingSenderId: "639974006584",
    appId: "1:639974006584:web:19e7e78c8103a09cf87595"
};

// Инициализация Firebase только если еще не инициализирован
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    console.log('✅ Firebase уже был инициализирован');
}

// Сокращения для удобства
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Делаем доступными глобально
window.firebase = firebase;
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebaseConfig = firebaseConfig;

console.log('✅ Firebase инициализирован');

// Включаем поддержку offline для Firestore с синхронизацией вкладок
if (typeof window !== 'undefined' && window.indexedDB) {
    try {
        db.enablePersistence({ 
            synchronizeTabs: true 
        }).then(() => {
            console.log('✅ Firestore persistence enabled with tab sync');
        }).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Firestore persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Firestore persistence not available in this browser');
            } else {
                console.error('❌ Firestore persistence error:', err);
            }
        });
    } catch (e) {
        console.warn('⚠️ Firestore persistence setup failed:', e);
    }
}