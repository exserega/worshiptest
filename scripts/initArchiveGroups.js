/**
 * Скрипт инициализации коллекции archive_groups
 * Запустить один раз для создания начальных групп
 */

import { db } from '../firebase-init.js';
import { createArchiveGroup } from '../src/modules/archive/archiveGroupsApi.js';

const Timestamp = window.firebase.firestore.Timestamp;

// Начальные группы для создания
const initialGroups = [
    {
        name: 'Рождественские',
        color: '#ef4444',
        icon: '🎄',
    },
    {
        name: 'Пасхальные',
        color: '#f59e0b',
        icon: '🐣',
    },
    {
        name: 'Поклонение',
        color: '#22c55e',
        icon: '🙏',
    },
    {
        name: 'Молодежные',
        color: '#3b82f6',
        icon: '🎸',
    },
    {
        name: 'Детские',
        color: '#a855f7',
        icon: '🌈',
    },
    {
        name: 'Особые события',
        color: '#ec4899',
        icon: '🎉',
    }
];

async function initializeArchiveGroups() {
    console.log('🚀 Начинаем инициализацию групп архива...');
    
    try {
        // Ждем инициализации Firebase
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (window.firebase && window.firebase.auth() && window.firebase.auth().currentUser) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
        
        const user = window.firebase.auth().currentUser;
        if (!user) {
            console.error('❌ Пользователь не авторизован');
            return;
        }
        
        console.log('✅ Пользователь авторизован:', user.email);
        
        // Получаем данные пользователя для branchId
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            console.error('❌ Документ пользователя не найден');
            return;
        }
        
        const userData = userDoc.data();
        const branchId = userData.branchId;
        
        if (!branchId) {
            console.error('❌ У пользователя нет филиала');
            return;
        }
        
        console.log('📍 Филиал пользователя:', branchId);
        
        // Проверяем существующие группы
        const existingGroups = await db.collection('archive_groups')
            .where('branchId', '==', branchId)
            .get();
        
        if (!existingGroups.empty) {
            console.log(`⚠️ В филиале уже есть ${existingGroups.size} групп`);
            const confirm = window.confirm('В вашем филиале уже есть группы. Добавить дополнительные примеры?');
            if (!confirm) {
                console.log('❌ Отменено пользователем');
                return;
            }
        }
        
        // Создаем группы
        let created = 0;
        for (const groupData of initialGroups) {
            try {
                // Проверяем, нет ли уже группы с таким именем
                const existing = await db.collection('archive_groups')
                    .where('branchId', '==', branchId)
                    .where('name', '==', groupData.name)
                    .get();
                
                if (!existing.empty) {
                    console.log(`⚠️ Группа "${groupData.name}" уже существует, пропускаем`);
                    continue;
                }
                
                const docRef = await db.collection('archive_groups').add({
                    ...groupData,
                    branchId: branchId,
                    createdBy: user.uid,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    setlistCount: 0
                });
                
                console.log(`✅ Создана группа "${groupData.name}" с ID: ${docRef.id}`);
                created++;
            } catch (error) {
                console.error(`❌ Ошибка при создании группы "${groupData.name}":`, error);
            }
        }
        
        console.log(`\n🎉 Инициализация завершена! Создано групп: ${created}`);
        alert(`Успешно создано ${created} групп для архива!`);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        alert('Ошибка при создании групп: ' + error.message);
    }
}

// Запускаем инициализацию
initializeArchiveGroups();