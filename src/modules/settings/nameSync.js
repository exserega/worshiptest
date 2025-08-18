/**
 * @fileoverview Модуль синхронизации имени пользователя в настройках
 * Подключается к странице settings и добавляет синхронизацию имен в событиях
 */

// Получаем ссылки на Firebase
const db = firebase.firestore();

/**
 * Синхронизирует имя пользователя во всех событиях
 */
async function syncUserNameInEvents(userId, newName) {
    try {
        console.log('🔄 Начинаем синхронизацию имени пользователя:', { userId, newName });
        
        // Получаем все события где пользователь является лидером
        const leaderEventsSnapshot = await db.collection('events')
            .where('leaderId', '==', userId)
            .get();
            
        // Получаем все события для поиска участника
        const allEventsSnapshot = await db.collection('events').get();
        
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
            
            // Проверяем все участники события
            if (eventData.participants) {
                Object.entries(eventData.participants).forEach(([key, participant]) => {
                    if (participant.userId === userId) {
                        // Обновляем имя участника
                        updatedParticipants[key] = {
                            ...participant,
                            userName: newName
                        };
                        needsUpdate = true;
                        console.log(`📝 Обновляем участника ${key} в событии ${doc.id}`);
                    } else {
                        // Оставляем без изменений
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
        
        // Выполняем все обновления одной транзакцией
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

// Перехватываем оригинальную функцию updateUserProfile
if (window.updateUserProfile) {
    const originalUpdateUserProfile = window.updateUserProfile;
    
    window.updateUserProfile = async function(updates) {
        // Сохраняем старое имя
        const oldName = window.currentUser?.name;
        
        // Вызываем оригинальную функцию
        await originalUpdateUserProfile(updates);
        
        // Если изменилось имя, синхронизируем его в событиях
        if (updates.name && updates.name !== oldName && window.currentUser?.id) {
            console.log('🔄 Обнаружено изменение имени, запускаем синхронизацию...');
            try {
                const updateCount = await syncUserNameInEvents(window.currentUser.id, updates.name);
                if (updateCount > 0) {
                    // Показываем дополнительное уведомление
                    setTimeout(() => {
                        alert(`✅ Имя успешно обновлено в ${updateCount} событиях!`);
                    }, 100);
                }
            } catch (error) {
                console.error('Ошибка синхронизации:', error);
                alert('⚠️ Профиль обновлен, но произошла ошибка при обновлении имени в событиях');
            }
        }
    };
}

// Экспортируем функцию для использования в других модулях
window.syncUserNameInEvents = syncUserNameInEvents;

console.log('✅ Модуль синхронизации имен загружен');