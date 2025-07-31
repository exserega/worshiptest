// ====================================
// ⚙️ SETTINGS MODULE
// ====================================
// Управление страницей настроек пользователя

const auth = firebase.auth();
const db = firebase.firestore();

// ====================================
// STATE
// ====================================

let currentUser = null;

// ====================================
// INITIALIZATION
// ====================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚙️ Settings page loading...');
    
    // Применяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Проверка авторизации
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log('❌ Not authenticated, redirecting...');
            window.location.href = '/public/login.html';
            return;
        }
        
        // Загружаем профиль пользователя
        await loadUserProfile(user.uid);
    });
});

// ====================================
// LOAD USER PROFILE
// ====================================

async function loadUserProfile(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            console.error('User profile not found');
            return;
        }
        
        currentUser = {
            id: userId,
            ...userDoc.data()
        };
        
        console.log('✅ User profile loaded:', currentUser);
        updateUI();
        
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// ====================================
// UPDATE UI
// ====================================

function updateUI() {
    if (!currentUser) return;
    
    // User Info
    document.getElementById('user-name').textContent = currentUser.name || 'Пользователь';
    document.getElementById('user-email').textContent = currentUser.email || currentUser.phone || '';
    document.getElementById('display-name').textContent = currentUser.name || '-';
    
    // Badges
    const roleEl = document.getElementById('user-role');
    const statusEl = document.getElementById('user-status');
    const branchEl = document.getElementById('user-branch');
    
    // Role badge
    const isAdmin = currentUser.role === 'admin';
    
    if (isAdmin) {
        roleEl.textContent = 'Администратор';
        roleEl.className = 'badge admin';
        // Показываем админ секцию
        document.getElementById('admin-section').style.display = 'block';
        
        // Убираем старую логику с токеном - Firebase Auth сохраняет сессию автоматически
    } else {
        roleEl.textContent = 'Пользователь';
        roleEl.className = 'badge';
    }
    
    // Status badge
    if (currentUser.status === 'pending') {
        statusEl.textContent = 'Ожидает подтверждения';
        statusEl.className = 'badge pending';
    } else if (currentUser.status === 'active') {
        statusEl.textContent = 'Активен';
        statusEl.className = 'badge';
    }
    
    // Branch badge
    if (currentUser.branchId) {
        loadBranchName(currentUser.branchId);
    } else {
        branchEl.style.display = 'none';
        document.getElementById('current-branch').textContent = 'Не назначен';
    }
}

// ====================================
// LOAD BRANCH NAME
// ====================================

async function loadBranchName(branchId) {
    try {
        const branchDoc = await db.collection('branches').doc(branchId).get();
        if (branchDoc.exists) {
            const branchData = branchDoc.data();
            document.getElementById('user-branch').textContent = branchData.name;
            document.getElementById('current-branch').textContent = branchData.name;
        }
    } catch (error) {
        console.error('Error loading branch:', error);
    }
}

// ====================================
// EDIT NAME
// ====================================

window.editName = function() {
    const newName = prompt('Введите новое имя:', currentUser.name || '');
    
    if (newName && newName !== currentUser.name) {
        updateUserProfile({ name: newName });
    }
};

// ====================================
// UPDATE PROFILE
// ====================================

async function updateUserProfile(updates) {
    try {
        await db.collection('users').doc(currentUser.id).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Обновляем локальные данные
        currentUser = { ...currentUser, ...updates };
        updateUI();
        
        alert('Профиль обновлен!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Ошибка при обновлении профиля');
    }
}

// ====================================
// REQUEST TRANSFER
// ====================================

window.requestTransfer = async function() {
    alert('Функция переводов будет доступна позже');
    // TODO: Implement transfer request
};

// ====================================
// LOGOUT
// ====================================

window.handleLogout = async function() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        try {
            await auth.signOut();
            window.location.href = '/public/login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
};

console.log('⚙️ Settings module loaded');