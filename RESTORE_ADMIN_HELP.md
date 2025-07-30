# 🔐 Восстановление прав администратора

## ⚡ Экстренное восстановление

Если у вас слетели права администратора, используйте один из методов:

### Метод 1: Утилита восстановления
1. Откройте https://agapeworship.asia/fix-admin.html
2. Нажмите "⚡ Форсировать админа"
3. Перезайдите на сайт

### Метод 2: Временное решение в коде
В код добавлена прямая проверка ID пользователя `AF5iJmVy9cd6Hat9QNxygij0RFS2`.
Этот пользователь всегда считается администратором.

## ⚠️ ВАЖНО: Как убрать временное решение

После восстановления доступа **ОБЯЗАТЕЛЬНО** удалите временные проверки ID:

### 1. В файле `src/modules/admin/adminController.js`
Найдите и удалите весь блок:
```javascript
// ВРЕМЕННОЕ РЕШЕНИЕ: Прямая проверка ID главного администратора
const MAIN_ADMIN_ID = 'AF5iJmVy9cd6Hat9QNxygij0RFS2';

if (user.uid === MAIN_ADMIN_ID) {
    // ... весь код до return;
    return;
}
```

### 2. В файле `src/modules/auth/authCheck.js`
Найдите и удалите в функции `isAdmin()`:
```javascript
// ВРЕМЕННОЕ РЕШЕНИЕ: Прямая проверка ID главного администратора
const MAIN_ADMIN_ID = 'AF5iJmVy9cd6Hat9QNxygij0RFS2';
if (auth.currentUser?.uid === MAIN_ADMIN_ID) {
    return true;
}
```

Также удалите в функции `checkAuth()`:
```javascript
// ВРЕМЕННОЕ РЕШЕНИЕ: Проверка главного админа
const MAIN_ADMIN_ID = 'AF5iJmVy9cd6Hat9QNxygij0RFS2';

if (firebaseUser.uid === MAIN_ADMIN_ID) {
    // ... весь код до resolve
} else {
```

### 3. В файле `src/modules/settings/settings.js`
Найдите и удалите:
```javascript
// ВРЕМЕННОЕ РЕШЕНИЕ: Проверка главного админа
const MAIN_ADMIN_ID = 'AF5iJmVy9cd6Hat9QNxygij0RFS2';
const isAdmin = currentUser.role === 'admin' || currentUser.id === MAIN_ADMIN_ID;
```

Замените на:
```javascript
const isAdmin = currentUser.role === 'admin';
```

## 🛡️ Правильная настройка админов

После удаления временного решения:

1. Войдите в админ-панель `/admin.html`
2. Найдите нужного пользователя
3. Нажмите кнопку "Сделать администратором"
4. Для главного админа установите флаги в Firebase:
   - `isFounder: true`
   - `isRootAdmin: true`

## 🚨 Безопасность

**НИКОГДА** не оставляйте жестко прописанные ID в продакшн коде!
Это временное решение только для экстренного восстановления доступа.