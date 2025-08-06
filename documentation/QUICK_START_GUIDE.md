# 🚀 БЫСТРЫЙ СТАРТ - AGAPE WORSHIP

## 📋 ПЕРВЫЕ ШАГИ (5 минут)

### 1. Прочитать документацию
```
ОБЯЗАТЕЛЬНО:
1. AI_AGENT_CRITICAL_GUIDE.md - критически важная информация
2. AI_AGENT_GUIDE.md - детальное руководство
3. Этот файл - быстрый старт
```

### 2. Понять архитектуру
- **Гибридная система**: Legacy (ui.js, script.js) + Модули (/src/modules/)
- **Firebase v8** через CDN + адаптер для v9 синтаксиса
- **НЕ ТРОГАТЬ**: корневые файлы (ui.js, script.js, sw.js)
- **Модульность**: файлы < 300 строк для Cursor
- **Логирование**: ВСЕГДА использовать logger.js

### 3. Запустить локально
```bash
# Проект - статический сайт
python3 -m http.server 8000
# Открыть http://localhost:8000

# Проверить в консоли:
# ✅ Firebase инициализирован
# ✅ Logger активен (в dev режиме)
# ✅ Service Worker зарегистрирован
```

## 🔧 ЧАСТЫЕ ЗАДАЧИ

### Добавить новую функцию
```javascript
// ✅ ПРАВИЛЬНО - в модульной части
// Создать файл в /src/modules/ваш-модуль/
import { logger } from '../../utils/logger.js';
import { db } from '../../utils/firebase-v8-adapter.js';

export async function myFunction() {
    logger.log('Начало работы функции');
    // Ваш код
}

// ❌ НЕПРАВИЛЬНО - в legacy коде
// НЕ добавлять в ui.js или script.js
```

### Работа с Firebase
```javascript
// ✅ ПРАВИЛЬНО (v8)
const snapshot = await docRef.get();
if (snapshot.exists) { // НЕ exists()!
    const data = snapshot.data();
}

// Работа с репертуаром
const repertoireRef = db.collection('users')
    .doc(userId)
    .collection('repertoire'); // ВАЖНО: подколлекция!

// ❌ НЕПРАВИЛЬНО
if (snapshot.exists()) // ОШИБКА!
// Добавление в корень users
db.collection('users').doc(songId).set(data); // НЕТ!
```

### Обновить UI
1. Проверить существующие стили в styles.css и /styles/
2. Использовать CSS переменные для цветов
3. Обновить Service Worker после изменений
4. Тестировать в обеих темах
5. НЕ забыть про data-song-loaded для управления видимостью

### Работа с авторизацией
```javascript
// Проверка гостя
import { isUserGuest } from '/src/modules/auth/authCheck.js';
if (isUserGuest()) {
    // Показать сообщение для гостя
    alert('Войдите в систему для доступа к этой функции');
    return;
}

// Проверка ограниченного доступа
import { hasLimitedAccess } from '/src/modules/auth/authCheck.js';
if (hasLimitedAccess()) {
    // pending или guest
    const message = isUserGuest() 
        ? 'Войдите в систему' 
        : 'Ваша заявка на рассмотрении';
    alert(`Недоступно. ${message}`);
}

// Проверка прав филиала
import { canEditInCurrentBranch } from '/src/modules/branches/branchSelector.js';
const canEdit = await canEditInCurrentBranch();
if (!canEdit) {
    element.classList.add('branch-disabled');
    element.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Недоступно. Вы не состоите в этом филиале');
    });
}
```

### Создание оверлея
```javascript
// Используй паттерн из songsOverlay.js
const overlay = document.createElement('div');
overlay.className = 'songs-overlay'; // или свой класс
overlay.innerHTML = `
    <div class="songs-overlay-content">
        <div class="overlay-header">
            <h2>Заголовок</h2>
            <button class="close-btn">
                <span class="close-icon"></span>
            </button>
        </div>
        <div class="overlay-body">
            <!-- Контент -->
        </div>
    </div>
`;
document.body.appendChild(overlay);

// Анимация открытия
requestAnimationFrame(() => {
    overlay.classList.add('active');
});
```

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### "Cannot find module"
- Проверить путь импорта
- Использовать относительные пути ../
- Проверить регистр букв в имени файла

### "doc.exists is not a function"  
- Использовать .exists вместо .exists()
- Это Firebase v8!

### "404 после изменений"
- Обновить версию Service Worker в sw.js
- Увеличить CACHE_NAME версию
- Очистить кэш браузера

### UI мигание при загрузке
- Использовать атрибут data-song-loaded на body
- Критические стили в <head>

### Кнопки не видны в теме
- Проверить CSS переменные
- Добавить !important где критично
- Тестировать в обеих темах

### Репертуар виден всем
- ВСЕГДА использовать подколлекцию repertoire
- Путь: users/[uid]/repertoire/[songId]
- НЕ добавлять в корень users

## 📁 ГДЕ ЧТО ИСКАТЬ

```
Авторизация → /src/modules/auth/
Филиалы → /src/modules/branches/
Админка → /src/modules/admin/
Песни → /src/modules/songs/
├── songsOverlay.js - оверлей "Все песни"
└── repertoireOverlay.js - оверлей "Репертуар"
Сетлисты → /src/api/ и ui.js
Стили → styles.css и /styles/
├── overlays.css - стили оверлеев
├── buttons.css - стили кнопок
└── responsive.css - мобильная адаптация
Логирование → /src/utils/logger.js
Firebase адаптер → /src/utils/firebase-v8-adapter.js
```

## 🚦 ЧЕКЛИСТ ПЕРЕД РАБОТОЙ

- [ ] Прочитал AI_AGENT_CRITICAL_GUIDE.md
- [ ] Понял разницу Legacy vs Модули
- [ ] Знаю что НЕ трогать (ui.js, script.js)
- [ ] Помню про Firebase v8
- [ ] Знаю предпочтения пользователя (НЕ коммитить автоматически)
- [ ] Помню про ограничение 300 строк на файл
- [ ] Буду использовать logger.js вместо console.log
- [ ] Буду тестировать в обеих темах

## 💡 ГЛАВНЫЕ ПРАВИЛА

1. **НЕ коммитить автоматически** - спрашивать пользователя
2. **НЕ менять Firebase версию** - только v8
3. **НЕ перемещать корневые файлы**
4. **Обновлять Service Worker** при изменениях
5. **Использовать logger.js** вместо console.log
6. **Файлы < 300 строк** - разделять большие модули
7. **Спрашивать при сомнениях**
8. **Тестировать в обеих темах**
9. **Проверять права доступа**
10. **Репертуар в подколлекции** users/[uid]/repertoire

## 🆕 НОВЫЕ ВОЗМОЖНОСТИ

### Оверлей выбора песен
- Кнопка "Все песни" → полноэкранный список
- Двухуровневые фильтры категорий
- Отображение тональности и BPM
- Красивая анимация

### Репертуар пользователя
- Кнопка "Репертуар" в мобильном меню
- Личные тональности для каждой песни
- Фильтры по категориям и тональностям
- Кнопка микрофона для добавления
- Красная кнопка удаления

### Гостевой вход
- Анонимная авторизация
- Ограниченный функционал
- Без профиля в Firestore
- Специальные сообщения

### Apple авторизация
- Sign in with Apple
- Полная интеграция
- Работает на всех устройствах

### Улучшения UI
- Защита от мигания при загрузке
- Двухуровневые фильтры
- Правильные цвета в обеих темах
- Alert-сообщения для защищенных действий
- Мобильная адаптация

## 🎯 ПРАКТИЧЕСКИЕ ПРИМЕРЫ

### Защищенная кнопка
```javascript
// В HTML
<button id="protected-action" class="btn">Действие</button>

// В JS
document.getElementById('protected-action').addEventListener('click', async () => {
    // Проверка статуса
    if (window.state.user.status === 'pending') {
        alert('Недоступно. Ваша заявка на рассмотрении');
        return;
    }
    
    // Проверка филиала
    const canEdit = await canEditInCurrentBranch();
    if (!canEdit) {
        alert('Недоступно. Вы не состоите в этом филиале');
        return;
    }
    
    // Основная логика
    logger.log('Выполняем защищенное действие');
});
```

### Работа с CSS переменными
```css
/* Использовать переменные из variables.css */
.my-element {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

/* Для критичных цветов */
.important-text {
    color: var(--primary-color) !important;
}
```

---
**Следующий шаг**: Начни с простой задачи в /src/modules/
**Последнее обновление**: 5 августа 2025
**Service Worker**: v146