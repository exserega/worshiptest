// ====================================
// REQUESTS API MODULE
// Модуль для работы с заявками на филиалы
// ====================================

// Firebase из глобального объекта (v8)
const db = window.firebase?.firestore?.() || null;
const serverTimestamp = () => window.firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date();

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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await db.collection('requests').add(requestData);
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await db.collection('requests').add(requestData);
        console.log('✅ Join request created:', docRef.id);
        return { success: true, requestId: docRef.id };
    } catch (error) {
        console.error('Error creating join request:', error);
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await db.collection('requests').add(requestData);
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
        const querySnapshot = await db.collection('requests')
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
        let query = db.collection('requests')
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
        const querySnapshot = await db.collection('requests')
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
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...additionalData
        };

        await db.collection('requests').doc(requestId).update(updateData);
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
            rejectedAt: serverTimestamp(),
            rejectionReason: reason,
            updatedAt: serverTimestamp()
        };

        await db.collection('requests').doc(requestId).update(updateData);
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
        await db.collection('requests').doc(requestId).delete();
        console.log('✅ Request deleted:', requestId);
        return { success: true };
    } catch (error) {
        console.error('Error deleting request:', error);
        return { success: false, error: error.message };
    }
}