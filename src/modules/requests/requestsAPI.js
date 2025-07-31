// ====================================
// REQUESTS API MODULE
// Модуль для работы с заявками на филиалы
// ====================================

// Firebase из глобального объекта (v8)
const getDb = () => {
    if (window.firebase && window.firebase.firestore) {
        return window.firebase.firestore();
    }
    console.error('Firebase не инициализирован!');
    return null;
};

const getServerTimestamp = () => {
    if (window.firebase && window.firebase.firestore) {
        return window.firebase.firestore.FieldValue.serverTimestamp();
    }
    return new Date();
};

// Типы заявок
export const REQUEST_TYPES = {
    BRANCH_TRANSFER: 'branch_transfer',    // Перевод в другой филиал
    BRANCH_JOIN: 'branch_join',           // Вступление в филиал
    BRANCH_CREATE: 'branch_create'        // Создание нового филиала
};

// Статусы заявок
export const REQUEST_STATUS = {
    PENDING: 'pending',     // Ожидает рассмотрения
    APPROVED: 'approved',   // Одобрена
    REJECTED: 'rejected'    // Отклонена
};

// ====================================
// СОЗДАНИЕ ЗАЯВОК
// ====================================

/**
 * Создает заявку на перевод в другой филиал
 */
export async function createTransferRequest(userId, fromBranchId, toBranchId, reason = '') {
    try {
        const requestData = {
            type: REQUEST_TYPES.BRANCH_TRANSFER,
            userId,
            fromBranchId,
            toBranchId,
            reason,
            status: REQUEST_STATUS.PENDING,
            createdAt: getServerTimestamp(),
            updatedAt: getServerTimestamp()
        };

        const docRef = await getDb().collection('requests').add(requestData);
        console.log('✅ Transfer request created:', docRef.id);
        return { success: true, requestId: docRef.id };
    } catch (error) {
        console.error('Error creating transfer request:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Создает заявку на вступление в филиал
 */
export async function createJoinRequest(userId, branchId, userData = {}) {
    try {
        console.log('📝 [createJoinRequest] Starting...', { userId, branchId, userData });
        
        const db = getDb();
        if (!db) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        const requestData = {
            type: REQUEST_TYPES.BRANCH_JOIN,
            userId,
            branchId,
            userData: {
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || ''
            },
            status: REQUEST_STATUS.PENDING,
            createdAt: getServerTimestamp(),
            updatedAt: getServerTimestamp()
        };
        
        console.log('📝 [createJoinRequest] Request data:', requestData);

        const docRef = await getDb().collection('requests').add(requestData);
        console.log('✅ Join request created:', docRef.id);
        
        // Проверяем, что заявка действительно создана
        const createdDoc = await docRef.get();
        if (!createdDoc.exists) {
            throw new Error('Заявка не была создана в базе данных');
        }
        
        console.log('✅ Join request verified:', createdDoc.data());
        
        return { success: true, requestId: docRef.id };
    } catch (error) {
        console.error('❌ Error creating join request:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return { success: false, error: error.message };
    }
}

/**
 * Создает заявку на создание нового филиала
 */
export async function createBranchRequest(userId, branchData) {
    try {
        const requestData = {
            type: REQUEST_TYPES.BRANCH_CREATE,
            userId,
            branchData: {
                name: branchData.name,
                city: branchData.city,
                address: branchData.address || '',
                contactPhone: branchData.contactPhone || '',
                contactSocial: branchData.contactSocial || ''
            },
            status: REQUEST_STATUS.PENDING,
            createdAt: getServerTimestamp(),
            updatedAt: getServerTimestamp()
        };

        const docRef = await getDb().collection('requests').add(requestData);
        console.log('✅ Branch creation request created:', docRef.id);
        return { success: true, requestId: docRef.id };
    } catch (error) {
        console.error('Error creating branch request:', error);
        return { success: false, error: error.message };
    }
}

// ====================================
// ПОЛУЧЕНИЕ ЗАЯВОК
// ====================================

/**
 * Получает заявки пользователя
 */
export async function getUserRequests(userId) {
    try {
        const querySnapshot = await getDb().collection('requests')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        
        const requests = [];
        querySnapshot.forEach((doc) => {
            requests.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return { success: true, requests };
    } catch (error) {
        console.error('Error getting user requests:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Получает все заявки определенного типа (для админов)
 */
export async function getRequestsByType(type, status = null) {
    try {
        let query = getDb().collection('requests')
            .where('type', '==', type);
        
        if (status) {
            query = query.where('status', '==', status);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        const querySnapshot = await query.get();
        const requests = [];
        
        querySnapshot.forEach((doc) => {
            requests.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return { success: true, requests };
    } catch (error) {
        console.error('Error getting requests by type:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Получает активную заявку пользователя определенного типа
 */
export async function getActiveUserRequest(userId, type) {
    try {
        const querySnapshot = await getDb().collection('requests')
            .where('userId', '==', userId)
            .where('type', '==', type)
            .where('status', '==', REQUEST_STATUS.PENDING)
            .limit(1)
            .get();
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                success: true,
                hasActiveRequest: true,
                request: {
                    id: doc.id,
                    ...doc.data()
                }
            };
        }
        
        return { success: true, hasActiveRequest: false };
    } catch (error) {
        console.error('Error checking active request:', error);
        return { success: false, error: error.message };
    }
}

// ====================================
// ОБРАБОТКА ЗАЯВОК (для админов)
// ====================================

/**
 * Одобряет заявку
 */
export async function approveRequest(requestId, adminId, additionalData = {}) {
    try {
        const updateData = {
            status: REQUEST_STATUS.APPROVED,
            approvedBy: adminId,
            approvedAt: getServerTimestamp(),
            updatedAt: getServerTimestamp(),
            ...additionalData
        };

        await getDb().collection('requests').doc(requestId).update(updateData);
        console.log('✅ Request approved:', requestId);
        return { success: true };
    } catch (error) {
        console.error('Error approving request:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Отклоняет заявку
 */
export async function rejectRequest(requestId, adminId, reason = '') {
    try {
        const updateData = {
            status: REQUEST_STATUS.REJECTED,
            rejectedBy: adminId,
            rejectedAt: getServerTimestamp(),
            rejectionReason: reason,
            updatedAt: getServerTimestamp()
        };

        await getDb().collection('requests').doc(requestId).update(updateData);
        console.log('✅ Request rejected:', requestId);
        return { success: true };
    } catch (error) {
        console.error('Error rejecting request:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Удаляет заявку
 */
export async function deleteRequest(requestId) {
    try {
        await getDb().collection('requests').doc(requestId).delete();
        console.log('✅ Request deleted:', requestId);
        return { success: true };
    } catch (error) {
        console.error('Error deleting request:', error);
        return { success: false, error: error.message };
    }
}

// ====================================
// СПЕЦИФИЧНЫЕ МЕТОДЫ ОБРАБОТКИ
// ====================================

/**
 * Одобряет заявку на вступление в филиал
 * Обновляет статус пользователя на active
 */
export async function approveJoinRequest(requestId) {
    try {
        // Получаем данные заявки
        const requestDoc = await getDb().collection('requests').doc(requestId).get();
        if (!requestDoc.exists) {
            throw new Error('Заявка не найдена');
        }
        
        const requestData = requestDoc.data();
        
        // Обновляем статус пользователя
        await getDb().collection('users').doc(requestData.userId).update({
            status: 'active',
            updatedAt: getServerTimestamp()
        });
        
        // Обновляем статус заявки
        await getDb().collection('requests').doc(requestId).update({
            status: REQUEST_STATUS.APPROVED,
            approvedAt: getServerTimestamp(),
            updatedAt: getServerTimestamp()
        });
        
        console.log('✅ Join request approved:', requestId);
        return { success: true };
    } catch (error) {
        console.error('Error approving join request:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Одобряет заявку на создание филиала
 * Создает новый филиал и делает заявителя его админом
 */
export async function approveBranchRequest(requestId) {
    try {
        // Получаем данные заявки
        const requestDoc = await getDb().collection('requests').doc(requestId).get();
        if (!requestDoc.exists) {
            throw new Error('Заявка не найдена');
        }
        
        const requestData = requestDoc.data();
        const branchData = requestData.branchData;
        
        // Создаем новый филиал
        const newBranch = {
            name: branchData.name,
            city: branchData.city,
            address: branchData.address || '',
            contactPhone: branchData.contactPhone || '',
            contactSocial: branchData.contactSocial || '',
            createdBy: requestData.userId,
            createdAt: getServerTimestamp(),
            updatedAt: getServerTimestamp()
        };
        
        const branchRef = await getDb().collection('branches').add(newBranch);
        
        // Обновляем пользователя - назначаем его в созданный филиал
        await getDb().collection('users').doc(requestData.userId).update({
            branchId: branchRef.id,
            status: 'active',
            updatedAt: getServerTimestamp()
        });
        
        // Обновляем статус заявки
        await getDb().collection('requests').doc(requestId).update({
            status: REQUEST_STATUS.APPROVED,
            approvedAt: getServerTimestamp(),
            createdBranchId: branchRef.id,
            updatedAt: getServerTimestamp()
        });
        
        console.log('✅ Branch request approved, new branch created:', branchRef.id);
        return { success: true, branchId: branchRef.id };
    } catch (error) {
        console.error('Error approving branch request:', error);
        return { success: false, error: error.message };
    }
}