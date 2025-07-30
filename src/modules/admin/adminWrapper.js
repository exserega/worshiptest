/**
 * Admin Wrapper
 * Обертка для правильной инициализации админ панели
 * Гарантирует что Firebase Auth восстановит сессию перед загрузкой контроллера
 */

console.log('🔧 Admin wrapper loading...');

// Ждем восстановления сессии Firebase Auth
const initAdminWithAuth = () => {
    return new Promise((resolve, reject) => {
        const auth = firebase.auth();
        
        // Устанавливаем таймаут на 5 секунд
        const timeout = setTimeout(() => {
            reject(new Error('Auth initialization timeout'));
        }, 5000);
        
        // Ждем когда Firebase определит состояние авторизации
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('🔐 Auth state in wrapper:', user ? `User ${user.uid}` : 'No user');
            
            // Firebase определил состояние (user или null)
            clearTimeout(timeout);
            unsubscribe(); // Отписываемся от дальнейших изменений
            
            if (user) {
                console.log('✅ User authenticated, loading admin controller...');
                // Импортируем контроллер только после авторизации
                import('./adminController.js')
                    .then(() => {
                        console.log('✅ Admin controller loaded successfully');
                        resolve();
                    })
                    .catch(error => {
                        console.error('❌ Failed to load admin controller:', error);
                        reject(error);
                    });
            } else {
                console.log('❌ No user authenticated');
                document.body.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
                        <h1>Доступ запрещен</h1>
                        <p>Требуется авторизация</p>
                        <a href="/login.html" class="button">Войти</a>
                    </div>
                `;
                reject(new Error('Not authenticated'));
            }
        });
    });
};

// Запускаем инициализацию
initAdminWithAuth().catch(error => {
    console.error('Admin initialization failed:', error);
});