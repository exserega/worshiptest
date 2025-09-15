// Модуль синхронизации имени пользователя в событиях

let syncAttempts = 0;
const MAX_ATTEMPTS = 10;

// Инициализируем сразу; функция сама повторит попытки, если зависимостей нет
initNameSync();

function initNameSync() {
    if (!window.firebase || !window.firebase.firestore) {
        console.error('Firebase не загружен, повтор через 1 сек');
        if (syncAttempts < MAX_ATTEMPTS) {
            syncAttempts++;
            setTimeout(initNameSync, 1000);
        }
        return;
    }
    
    const db = firebase.firestore();
    
    async function syncUserNameInEvents(userId, newName) {
        try {
            console.log('🔄 Начинаем синхронизацию имени пользователя:', { userId, newName });
            
            // Получаем все события где пользователь является лидером
            const leaderEventsSnapshot = await db.collection('events')
                .where('leaderId', '==', userId)
                .get();
            
            console.log(`📊 Найдено событий где пользователь лидер: ${leaderEventsSnapshot.size}`);
                
            // Получаем все события для поиска участника
            const allEventsSnapshot = await db.collection('events').get();
            console.log(`📊 Всего событий для проверки участников: ${allEventsSnapshot.size}`);
            
            const batch = db.batch();
            let updateCount = 0;
            
            // Обновляем события где пользователь - лидер
            leaderEventsSnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    leaderName: newName,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                updateCount++;
                console.log(`📝 Обновляем leaderName в событии ${doc.id}`);
            });
            
            // Обновляем события где пользователь - участник
            allEventsSnapshot.forEach(doc => {
                const eventData = doc.data();
                let needsUpdate = false;
                const updatedParticipants = {};
                
                if (eventData.participants) {
                    Object.entries(eventData.participants).forEach(([key, participant]) => {
                        if (participant.userId === userId) {
                            updatedParticipants[key] = {
                                ...participant,
                                userName: newName
                            };
                            needsUpdate = true;
                            console.log(`📝 Обновляем участника ${key} в событии ${doc.id}`);
                        } else {
                            updatedParticipants[key] = participant;
                        }
                    });
                    
                    if (needsUpdate) {
                        batch.update(doc.ref, {
                            participants: updatedParticipants,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        updateCount++;
                    }
                }
            });
            
            if (updateCount > 0) {
                await batch.commit();
                console.log(`✅ Успешно обновлено ${updateCount} событий`);
            } else {
                console.log('ℹ️ Нет событий для обновления');
            }
            
            return updateCount;
            
        } catch (error) {
            console.error('❌ Ошибка синхронизации имени:', error);
            throw error;
        }
    }
    
    async function syncUserNameInSetlists(userId, newName) {
        try {
            console.log('🔄 Синхронизация имени в сет-листах:', { userId, newName });
            let totalUpdated = 0;
            // Активные
            const activeSnap = await db.collection('worship_setlists').where('createdBy', '==', userId).get();
            if (!activeSnap.empty) {
                const batch = db.batch();
                activeSnap.forEach(doc => {
                    batch.update(doc.ref, { createdByName: newName });
                    totalUpdated++;
                });
                await batch.commit();
                console.log(`📝 Обновлено активных сет-листов: ${activeSnap.size}`);
            }
            // Архивные
            const archiveSnap = await db.collection('archive_setlists').where('createdBy', '==', userId).get();
            if (!archiveSnap.empty) {
                const batch2 = db.batch();
                archiveSnap.forEach(doc => {
                    batch2.update(doc.ref, { createdByName: newName });
                    totalUpdated++;
                });
                await batch2.commit();
                console.log(`📝 Обновлено архивных сет-листов: ${archiveSnap.size}`);
            }
            return totalUpdated;
        } catch (e) {
            console.error('❌ Ошибка синхронизации имен в сет-листах:', e);
            throw e;
        }
    }
    
    // Делаем функцию синхронизации глобальной
    window.syncUserNameInEvents = syncUserNameInEvents;
    
    // Перехватываем функцию editName
    if (window.editName) {
        console.log('🎯 Найдена функция editName, добавляем синхронизацию');
        
        const originalEditName = window.editName;
        
        window.editName = async function() {
            // Получаем текущего пользователя из Firebase Auth
            const auth = firebase.auth();
            const user = auth.currentUser;
            
            if (!user) {
                console.error('❌ Пользователь не авторизован');
                originalEditName();
                return;
            }
            
            // Получаем текущие данные пользователя из Firestore
            let oldName = null;
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    oldName = userDoc.data().name;
                }
            } catch (error) {
                console.error('Ошибка получения данных пользователя:', error);
            }
            
            console.log('📝 editName вызвана. Старое имя:', oldName);
            
            // Вызываем оригинальную функцию
            originalEditName();
            
            // Ждем несколько проверок с интервалом
            let attempts = 0;
            const checkInterval = setInterval(async () => {
                attempts++;
                
                try {
                    // Получаем обновленные данные из Firestore
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const newName = userDoc.data().name;
                        console.log(`🔍 Проверка ${attempts}: name в Firestore = ${newName}, oldName = ${oldName}`);
                        
                        if (newName && newName !== oldName) {
                            clearInterval(checkInterval);
                            console.log('🔄 Обнаружено изменение имени:', oldName, '->', newName);
                            console.log('📍 userId:', user.uid);
                            
                            try {
                                const updatedEvents = await syncUserNameInEvents(user.uid, newName);
                                const updatedSetlists = await syncUserNameInSetlists(user.uid, newName);
                                console.log(`✅ Синхронизация завершена. Событий: ${updatedEvents}, сет-листов: ${updatedSetlists}`);
                                if (updatedEvents + updatedSetlists > 0) {
                                    setTimeout(() => { alert('✅ Имя обновлено во всех данных'); }, 100);
                                }
                            } catch (error) {
                                console.error('❌ Ошибка синхронизации:', error);
                                alert('⚠️ Профиль обновлен, но произошла ошибка при обновлении имени в связанных данных');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Ошибка проверки имени:', error);
                }
                
                if (attempts >= 10) {
                    clearInterval(checkInterval);
                    console.log('⏱️ Превышено количество попыток проверки изменения имени');
                }
            }, 1000); // Проверяем каждую секунду
        };
        
        console.log('✅ Синхронизация имен успешно подключена');
    } else {
        console.warn('⚠️ Функция editName не найдена');
        if (syncAttempts < MAX_ATTEMPTS) {
            syncAttempts++;
            setTimeout(initNameSync, 1000);
        }
    }
}

console.log('📦 Модуль синхронизации имен загружен');