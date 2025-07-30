// ====================================
// 🔐 LOGIN MODULE
// ====================================
// Обработка входа, регистрации и авторизации

// Firebase imports
const auth = firebase.auth();
const db = firebase.firestore();
const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
const RecaptchaVerifier = firebase.auth.RecaptchaVerifier;

// ====================================
// DOM ELEMENTS
// ====================================

const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
    phone: document.getElementById('phone-form')
};

const elements = {
    googleBtn: document.getElementById('google-login-btn'),
    phoneBtn: document.getElementById('phone-login-btn'),
    guestBtn: document.getElementById('guest-login-btn'),
    showRegister: document.getElementById('show-register'),
    showLogin: document.getElementById('show-login'),
    backToLogin: document.getElementById('back-to-login'),
    verifyCodeBtn: document.getElementById('verify-code-btn'),
    verificationGroup: document.getElementById('verification-code-group'),
    authMessage: document.getElementById('auth-message'),
    loading: document.getElementById('auth-loading')
};

// ====================================
// STATE
// ====================================

let phoneConfirmationResult = null;
let recaptchaVerifier = null;
let inviteId = null;

// Check for invite in URL
const urlParams = new URLSearchParams(window.location.search);
inviteId = urlParams.get('invite');

if (inviteId) {
    console.log('Invite ID found:', inviteId);
    // Show invite message
    setTimeout(() => {
        showMessage('You have been invited! Please sign up to accept the invitation.', 'info');
    }, 500);
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

function showLoading(show = true) {
    elements.loading.style.display = show ? 'flex' : 'none';
}

function showMessage(message, type = 'error') {
    elements.authMessage.textContent = message;
    elements.authMessage.className = `auth-message show ${type}`;
    
    setTimeout(() => {
        elements.authMessage.classList.remove('show');
    }, 5000);
}

function switchForm(formName) {
    Object.keys(forms).forEach(key => {
        forms[key].style.display = key === formName ? 'block' : 'none';
    });
}

// ====================================
// CREATE USER PROFILE
// ====================================

async function createUserProfile(user, additionalData = {}) {
    const userRef = db.collection('users').doc(user.uid);
    
    // ВАЖНО: Проверяем, не существует ли уже профиль
    const existingDoc = await userRef.get();
    if (existingDoc.exists) {
        console.warn('⚠️ Profile already exists, skipping creation');
        return existingDoc.data();
    }
    
    // Check if there's an invite
    if (inviteId) {
        try {
            const inviteDoc = await db.collection('invites').doc(inviteId).get();
            
            if (inviteDoc.exists) {
                const invite = inviteDoc.data();
                
                // Validate invite
                if (invite.status === 'pending' && 
                    invite.email === user.email && 
                    new Date(invite.expiresAt.toDate()) > new Date()) {
                    
                    // Apply invite role
                    additionalData.role = invite.role;
                    additionalData.status = 'active';
                    additionalData.invitedBy = invite.invitedBy;
                    
                    // Mark invite as accepted
                    await db.collection('invites').doc(inviteId).update({
                        status: 'accepted',
                        acceptedBy: user.uid,
                        acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('Invite accepted successfully');
                }
            }
        } catch (error) {
            console.error('Error processing invite:', error);
        }
    }
    
    const userData = {
        id: user.uid,
        name: user.displayName || additionalData.name || 'Новый пользователь',
        email: user.email,
        phone: user.phoneNumber,
        photoURL: user.photoURL,
        role: additionalData.role || 'user',
        branchId: null,
        status: additionalData.status || 'active', // Новые пользователи сразу активны
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...additionalData
    };
    
    await userRef.set(userData, { merge: true });
}

// ====================================
// AUTH HANDLERS
// ====================================

// Email/Password Login
async function handleEmailLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        console.log('🔐 Login successful:', result.user.email);
        
        // Redirect to main app
        window.location.href = '/';
    } catch (error) {
        console.error('Login error:', error);
        showMessage(getErrorMessage(error.code));
    } finally {
        showLoading(false);
    }
}

// Registration
async function handleRegister(e) {
    e.preventDefault();
    showLoading();
    
    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;
    
    if (password !== confirmPassword) {
        showMessage('Пароли не совпадают');
        showLoading(false);
        return;
    }
    
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update display name
        await result.user.updateProfile({ displayName: name });
        
        // Create user profile
        await createUserProfile(result.user, { name });
        
        console.log('🔐 Registration successful:', result.user.email);
        showMessage('Регистрация успешна! Перенаправление...', 'success');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(getErrorMessage(error.code));
    } finally {
        showLoading(false);
    }
}

// Google Login
async function handleGoogleLogin() {
    showLoading();
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        // Create/update user profile
        await createUserProfile(result.user);
        
        // Проверяем, нужен ли выбор филиала
        const userDoc = await db.collection('users').doc(result.user.uid).get();
        const userData = userDoc.data();
        
        if (!userData.branchId && userData.role !== 'admin') {
            console.log('🏢 New user needs to select branch');
            const { showNewUserBranchSelection } = await import('./branchSelectionModal.js');
            await showNewUserBranchSelection(result.user.uid, userData);
            showLoading(false);
            return;
        }
        
        console.log('🔐 Google login successful:', result.user.email);
        window.location.href = '/';
    } catch (error) {
        console.error('Google login error:', error);
        showMessage(getErrorMessage(error.code));
        showLoading(false);
    }
}

// Guest Login
async function handleGuestLogin() {
    showLoading();
    
    try {
        // Импортируем модуль гостевой авторизации
        const { createGuestSession, showBranchSelectionModal } = await import('/src/modules/auth/guestAuth.js');
        
        // Создаем гостевую сессию
        const result = await createGuestSession();
        
        if (result.success) {
            // Загружаем список филиалов
            const branchesSnapshot = await db.collection('branches').get();
            const branches = [];
            branchesSnapshot.forEach(doc => {
                branches.push({ id: doc.id, ...doc.data() });
            });
            
            // Показываем модальное окно выбора филиала
            await showBranchSelectionModal(branches, (selectedBranchId) => {
                console.log('Guest selected branch:', selectedBranchId);
                // Перенаправляем на главную страницу
                window.location.replace('/');
            });
            
            showLoading(false);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Guest login error:', error);
        showMessage('Ошибка при входе как гость: ' + error.message);
        showLoading(false);
    }
}

// Phone Login - Step 1: Send SMS
async function handlePhoneSend(e) {
    e.preventDefault();
    showLoading();
    
    const phoneNumber = e.target.phone.value;
    
    try {
        // Initialize reCAPTCHA
        if (!recaptchaVerifier) {
            recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                size: 'normal',
                callback: () => {
                    console.log('reCAPTCHA solved');
                }
            });
        }
        
        phoneConfirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
        
        console.log('📱 SMS sent to:', phoneNumber);
        showMessage('Код отправлен на ваш телефон', 'success');
        
        // Show verification code input
        elements.verificationGroup.style.display = 'block';
    } catch (error) {
        console.error('Phone login error:', error);
        showMessage(getErrorMessage(error.code));
        
        // Reset reCAPTCHA on error
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }
    } finally {
        showLoading(false);
    }
}

// Phone Login - Step 2: Verify Code
async function handlePhoneVerify() {
    showLoading();
    
    const code = document.getElementById('verification-code').value;
    
    if (!phoneConfirmationResult) {
        showMessage('Сначала запросите код');
        showLoading(false);
        return;
    }
    
    try {
        const result = await phoneConfirmationResult.confirm(code);
        
        // Create user profile
        await createUserProfile(result.user);
        
        console.log('📱 Phone login successful:', result.user.phoneNumber);
        window.location.href = '/';
    } catch (error) {
        console.error('Verification error:', error);
        showMessage('Неверный код подтверждения');
    } finally {
        showLoading(false);
    }
}

// ====================================
// ERROR MESSAGES
// ====================================

function getErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'Email уже используется',
        'auth/invalid-email': 'Неверный формат email',
        'auth/operation-not-allowed': 'Операция не разрешена',
        'auth/weak-password': 'Слишком слабый пароль',
        'auth/user-disabled': 'Пользователь заблокирован',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/invalid-phone-number': 'Неверный формат номера телефона',
        'auth/invalid-verification-code': 'Неверный код подтверждения',
        'auth/popup-closed-by-user': 'Окно входа было закрыто',
        'auth/network-request-failed': 'Ошибка сети. Проверьте подключение',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже'
    };
    
    return messages[errorCode] || 'Произошла ошибка. Попробуйте еще раз';
}

// ====================================
// EVENT LISTENERS
// ====================================

// Form submissions
forms.login.addEventListener('submit', handleEmailLogin);
forms.register.addEventListener('submit', handleRegister);
forms.phone.addEventListener('submit', handlePhoneSend);

// Button clicks
elements.googleBtn.addEventListener('click', handleGoogleLogin);
elements.phoneBtn.addEventListener('click', () => switchForm('phone'));
elements.guestBtn.addEventListener('click', handleGuestLogin);
elements.showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm('register');
});
elements.showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm('login');
});
elements.backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm('login');
});
elements.verifyCodeBtn.addEventListener('click', handlePhoneVerify);

// ====================================
// CHECK AUTH STATE
// ====================================

// Check if we just came from auth redirect
if (sessionStorage.getItem('auth_redirecting') === 'true') {
    console.log('⚠️ Clearing auth redirect flag');
    sessionStorage.removeItem('auth_redirecting');
}

// If already logged in, redirect to main app
let redirecting = false;
let checkingAuth = false;

auth.onAuthStateChanged(async (user) => {
    // Избегаем множественных проверок
    if (checkingAuth || redirecting) return;
    
    if (user) {
        checkingAuth = true;
        console.log('🔐 User already logged in:', user.email || user.phoneNumber);
        
        // Добавляем небольшую задержку чтобы избежать гонки состояний
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Проверяем есть ли профиль в Firestore
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Проверяем статус пользователя
                if (userData.status === 'banned' || userData.status === 'blocked') {
                    console.warn('🚫 User is blocked');
                    await auth.signOut();
                    alert('Ваш аккаунт заблокирован. Обратитесь к администратору.');
                    checkingAuth = false;
                    return;
                }
                
                // Проверяем, есть ли у пользователя филиал
                if (!userData.branchId && userData.role !== 'admin') {
                    console.log('🏢 User needs to select branch');
                    // Импортируем и показываем выбор филиала
                    const { showNewUserBranchSelection } = await import('./branchSelectionModal.js');
                    await showNewUserBranchSelection(user.uid, userData);
                    checkingAuth = false;
                    return;
                }
                
                console.log('✅ User profile exists, redirecting...');
                redirecting = true;
                // Сохраняем флаг что идет редирект
                sessionStorage.setItem('auth_redirecting', 'true');
                // Используем replace чтобы не было истории для возврата
                window.location.replace('/');
                    } else {
            console.log('⚠️ User profile not found, creating...');
            
            // ВАЖНО: Проверяем количество ВСЕХ пользователей, а не только админов
            // чтобы избежать race conditions
            const allUsersQuery = await db.collection('users')
                .limit(1)
                .get();
                
            const isFirstUserEver = allUsersQuery.empty;
            
            // Создаем профиль
            await createUserProfile(user);
            
            // Делаем админом ТОЛЬКО если это самый первый пользователь в системе
            if (isFirstUserEver) {
                console.log('🌟 Very first user in system - setting up as founder');
                await db.collection('users').doc(user.uid).update({
                    role: 'admin',
                    status: 'active',
                    isFounder: true,
                    permissions: ['*']
                });
            } else {
                console.log('📝 Regular user profile created');
            }
            
            console.log('✅ Profile created, redirecting...');
                redirecting = true;
                // Сохраняем флаг что идет редирект
                sessionStorage.setItem('auth_redirecting', 'true');
                window.location.replace('/');
            }
        } catch (error) {
            console.error('Error checking user profile:', error);
            checkingAuth = false;
        }
    }
});

console.log('🔐 Login module initialized');