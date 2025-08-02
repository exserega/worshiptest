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

const screens = {
    main: document.getElementById('main-auth'),
    email: document.getElementById('email-form'),
    register: document.getElementById('register-form'),
    phone: document.getElementById('phone-form')
};

const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form-element'),
    phone: document.getElementById('phone-form-element')
};

const elements = {
    googleBtn: document.getElementById('google-login-btn'),
    phoneBtn: document.getElementById('phone-login-btn'),
    emailBtn: document.getElementById('email-login-btn'),
    showRegister: document.getElementById('show-register'),
    backFromEmail: document.getElementById('back-from-email'),
    backFromRegister: document.getElementById('back-from-register'),
    backFromPhone: document.getElementById('back-from-phone'),
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

function clearMessages() {
    elements.authMessage.classList.remove('show');
    elements.authMessage.textContent = '';
}

function switchForm(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
    
    clearMessages();
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
        status: additionalData.status || 'pending', // Новые пользователи ожидают подтверждения
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
                size: 'invisible', // Используем невидимую reCAPTCHA
                callback: (response) => {
                    console.log('reCAPTCHA solved:', response);
                },
                'error-callback': (error) => {
                    console.error('reCAPTCHA error:', error);
                    showMessage('Ошибка проверки безопасности. Попробуйте еще раз.');
                }
            });
            
            // Рендерим reCAPTCHA
            try {
                await recaptchaVerifier.render();
                console.log('reCAPTCHA rendered successfully');
            } catch (renderError) {
                console.error('reCAPTCHA render error:', renderError);
                throw new Error('Не удалось инициализировать проверку безопасности');
            }
        }
        
        console.log('Sending SMS to:', phoneNumber);
        phoneConfirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
        
        console.log('📱 SMS sent to:', phoneNumber);
        showMessage('Код отправлен на ваш телефон', 'success');
        
        // Show verification code input
        elements.verificationGroup.style.display = 'block';
    } catch (error) {
        console.error('Phone login error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Более подробные сообщения об ошибках
        if (error.code === 'auth/missing-client-identifier') {
            showMessage('Ошибка настройки: Добавьте домен в Firebase Console');
        } else if (error.code === 'auth/captcha-check-failed') {
            showMessage('Ошибка проверки безопасности. Обновите страницу и попробуйте снова');
        } else {
            showMessage(getErrorMessage(error.code) || error.message);
        }
        
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
    const errors = {
        'auth/email-already-in-use': 'Этот email уже используется',
        'auth/invalid-email': 'Неверный формат email',
        'auth/weak-password': 'Пароль должен быть не менее 6 символов',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/invalid-verification-code': 'Неверный код подтверждения',
        'auth/invalid-verification-id': 'Код подтверждения истек',
        'auth/invalid-phone-number': 'Неверный формат номера телефона',
        'auth/missing-phone-number': 'Введите номер телефона',
        'auth/quota-exceeded': 'Превышен лимит SMS. Попробуйте позже',
        'auth/captcha-check-failed': 'Ошибка проверки reCAPTCHA',
        'auth/missing-client-identifier': 'Ошибка конфигурации Firebase',
        'auth/invalid-app-credential': 'Ошибка приложения. Обновите страницу',
        'auth/missing-app-credential': 'Ошибка безопасности. Обновите страницу',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
        'default': 'Произошла ошибка. Попробуйте еще раз'
    };
    return errors[errorCode] || errors.default;
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
elements.emailBtn.addEventListener('click', () => switchForm('email'));
elements.showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm('register');
});

// Back buttons
elements.backFromEmail.addEventListener('click', () => switchForm('main'));
elements.backFromRegister.addEventListener('click', () => switchForm('main'));
elements.backFromPhone.addEventListener('click', () => switchForm('main'));

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