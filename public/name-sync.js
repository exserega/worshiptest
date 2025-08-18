// Модуль синхронизации имени пользователя в событиях

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initNameSync();
    }, 2000);
});

function initNameSync() {
    if (!window.firebase || !window.firebase.firestore) {
        console.error('Firebase не загружен, повтор через 1 сек');
        setTimeout(initNameSync, 1000);
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
    
    // Перехватываем оригинальную функцию updateUserProfile
    if (window.updateUserProfile) {
        console.log('🎯 Найдена функция updateUserProfile, добавляем синхронизацию');
        const originalUpdateUserProfile = window.updateUserProfile;
        
        window.updateUserProfile = async function(updates) {
            const oldName = window.currentUser?.name;
            
            await originalUpdateUserProfile(updates);
            
            if (updates.name && updates.name !== oldName && window.currentUser?.id) {
                console.log('🔄 Обнаружено изменение имени, запускаем синхронизацию...');
                try {
                    const updateCount = await syncUserNameInEvents(window.currentUser.id, updates.name);
                    if (updateCount > 0) {
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
        console.log('✅ Синхронизация имен успешно подключена');
    } else {
        console.warn('⚠️ Функция updateUserProfile не найдена, повтор через 1 сек');
        setTimeout(initNameSync, 1000);
    }
}

console.log('📦 Модуль синхронизации имен загружен');