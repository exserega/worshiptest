// =====================================================
// 🔥 FIREBASE SERVICE
// =====================================================
// Интеграция с Firebase для доступа к Firestore
// =====================================================

const admin = require('firebase-admin');
const path = require('path');

let db = null;
let isInitialized = false;

/**
 * Инициализация Firebase Admin SDK
 */
async function initializeFirebase() {
    if (isInitialized) {
        console.log('✅ Firebase уже инициализирован');
        return db;
    }

    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
        const fullPath = path.resolve(serviceAccountPath);

        console.log('🔥 Инициализация Firebase Admin...');
        console.log(`📄 Путь к ключу: ${fullPath}`);

        // Проверяем существование файла
        const fs = require('fs');
        if (!fs.existsSync(fullPath)) {
            throw new Error(
                `Файл serviceAccountKey.json не найден!\n` +
                `Путь: ${fullPath}\n\n` +
                `Как получить файл:\n` +
                `1. Откройте Firebase Console: https://console.firebase.google.com/\n` +
                `2. Выберите проект "song-archive-389a6"\n` +
                `3. Project Settings → Service Accounts\n` +
                `4. Generate New Private Key\n` +
                `5. Сохраните файл как serviceAccountKey.json в папку telegram-bot/`
            );
        }

        const serviceAccount = require(fullPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });

        db = admin.firestore();
        
        // Настройки Firestore
        db.settings({
            ignoreUndefinedProperties: true
        });

        isInitialized = true;
        console.log('✅ Firebase Admin успешно инициализирован');
        console.log(`📊 Проект: ${serviceAccount.project_id}`);

        return db;
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error.message);
        throw error;
    }
}

/**
 * Получить Firestore instance
 */
function getFirestore() {
    if (!isInitialized) {
        throw new Error('Firebase не инициализирован! Вызовите initializeFirebase() сначала');
    }
    return db;
}

/**
 * Проверка инициализации
 */
function isFirebaseInitialized() {
    return isInitialized;
}

module.exports = {
    initializeFirebase,
    getFirestore,
    isFirebaseInitialized,
    admin
};
