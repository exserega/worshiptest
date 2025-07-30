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
    
    const userData = {
        id: user.uid,
        name: user.displayName || additionalData.name || 'Новый пользователь',
        email: user.email,
        phone: user.phoneNumber,
        photoURL: user.photoURL,
        role: 'user',
        branchId: null,
        status: 'pending',
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
        
        console.log('🔐 Google login successful:', result.user.email);
        window.location.href = '/';
    } catch (error) {
        console.error('Google login error:', error);
        showMessage(getErrorMessage(error.code));
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

// If already logged in, redirect to main app
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('🔐 User already logged in:', user.email || user.phoneNumber);
        window.location.href = '/';
    }
});

console.log('🔐 Login module initialized');