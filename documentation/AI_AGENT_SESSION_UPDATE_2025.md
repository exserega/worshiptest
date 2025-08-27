# 📋 ОБНОВЛЕНИЕ ДОКУМЕНТАЦИИ - СЕССИЯ ЯНВАРЬ 2025

## 🎯 КРИТИЧЕСКИЕ ИЗМЕНЕНИЯ И НОВЫЙ ФУНКЦИОНАЛ

### 🔐 Система ролей - КРИТИЧЕСКИЕ ИЗМЕНЕНИЯ

#### Новая роль: `moderator`
```javascript
// Роли теперь: admin, moderator, user, guest
// Модераторы могут:
- ✅ Создавать и управлять событиями
- ✅ Видеть кнопки управления событиями
- ❌ НЕ имеют доступа к админ-панели
- ❌ НЕ могут менять роли пользователей
```

#### Обновленная система permissions
**ВАЖНО**: Создан новый модуль `/src/modules/permissions/permissions.js`
```javascript
// Централизованные проверки прав:
export function canManageEvents() // admin + moderator
export function canEditSongs() // admin + moderator + active users
export function hasLimitedAccess() // pending + guest
export function isAdmin() // только admin
export function isModerator() // только moderator
export function canCreateSetlists() // НЕ pending/guest
export function canManageBranches() // admin only
```

**КРИТИЧНО**: Все импорты permissions переехали из `authCheck.js` в `permissions.js`!

#### Изменения в админах и филиалах
```javascript
// canEditInCurrentBranch() теперь ЯВНО разрешает админам редактировать ЛЮБОЙ филиал
if (currentUser.role === 'admin') return true; // Админ может всё везде
```

### 📅 КАЛЕНДАРЬ СОБЫТИЙ - НОВАЯ СТРАНИЦА

#### Архитектура
```
/events/
├── index.html - отдельная страница календаря
├── events-calendar.js - логика календаря
├── events-page.css - стили календаря
└── eventCreationModal.js - модальное окно создания
```

#### Особенности реализации
1. **Отдельная страница** вместо оверлея (по запросу пользователя для производительности)
2. **Месячный вид** с квадратными ячейками дат
3. **Расширяемые карточки событий** при клике на дату
4. **Модальное окно создания** с предустановленными названиями событий
5. **Отображение участников** по инструментам с иконками

#### Известные проблемы Safari/iOS
```javascript
// КРИТИЧНО: Safari блокирует Firestore streaming из-за CORS
// Ошибка: XMLHttpRequest cannot load .../Listen/channel due to access control checks

// РЕШЕНИЕ (не реализовано из-за отката):
// Для Safari использовать .get() вместо .onSnapshot()
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
    // Использовать одноразовую загрузку вместо streaming
}
```

### 🎨 UI/UX ИЗМЕНЕНИЯ

#### Setlist Selector (добавление песен в сетлист)
1. **box-shadow вместо border** для предотвращения обрезки в скроллируемых контейнерах
2. **alert() вместо кастомных уведомлений** для надежности
3. **Проверка дубликатов** с разными сценариями для одинаковых/разных тональностей

#### CSS решения для видимости иконок
```css
/* КРИТИЧНО для темной темы */
.icon-button svg path {
    stroke: currentColor !important;
    color: var(--text-primary) !important;
}

/* Safari требует !important для перезаписи inline стилей */
```

#### Модальные окна и формы
```css
/* Исправление обрезки текста в select элементах */
select.form-control {
    padding: 12px 40px 12px 16px;
    line-height: 1.2;
    min-height: 48px;
    display: flex;
    align-items: center;
}
```

### 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

#### Service Worker версионирование
**КРИТИЧНО**: ВСЕГДА увеличивайте версию при изменениях!
```javascript
// Текущая версия: v366 (после добавления презентации)
const CACHE_NAME = 'agape-worship-cache-v366';
```

#### Firebase структура для событий
```javascript
// participants теперь ОБЪЕКТ, не массив!
participants: {
    'userId_instrument_0': {
        userId: 'xxx',
        userName: 'Имя',
        instrument: 'vocals',
        instrumentName: 'Вокал'
    },
    // Позволяет несколько участников на одном инструменте
}
```

#### Обработка данных участников
```javascript
// ВАЖНО: При загрузке преобразовывать объект в массив
if (eventData.participants && typeof eventData.participants === 'object') {
    participantsArray = Object.values(eventData.participants);
}
// participantCount = Object.keys(eventData.participants).length
```

### ⚠️ ВАЖНЫЕ ОТКАТЫ И УРОКИ

#### Откат редизайна панели сет-листов (коммит c90eb36)
**ПРОБЛЕМА**: Попытка модернизации панели сет-листов привела к:
- Слишком большим карточкам песен
- Некорректному отображению названия сет-листа
- Потере компактности интерфейса

**РЕШЕНИЕ**: Полный откат с сохранением только функции скрытия нижней панели
```bash
git reset --hard c90eb36
git push --force origin main
```

**УРОК**: При изменении UI критически важно сохранять компактность и функциональность

### 🚨 КРИТИЧЕСКИЕ ОШИБКИ И РЕШЕНИЯ

#### 1. Отсутствующие экспорты
```javascript
// ПРОБЛЕМА: The requested module does not provide an export named 'signInWithGoogle'
// РЕШЕНИЕ: Добавить недостающие экспорты в authCheck.js
export async function signInWithGoogle() { ... }
export async function signOut() { ... }
```

#### 2. Branch selector на странице событий
```javascript
// ПРОБЛЕМА: Branch selector not found на /events
// ПРИЧИНА: На странице событий нет UI выбора филиала
// РЕШЕНИЕ: Использовать currentUser.branchId напрямую
```

#### 3. Logger vs Console
```javascript
// ПРОБЛЕМА: logger не определен в некоторых контекстах
// РЕШЕНИЕ: Заменить все logger.log на console.log в events-calendar.js
```

#### 4. Отсутствующий экспорт updateSetlistName
```javascript
// ПРОБЛЕМА: api.updateSetlistName is not a function
// ПРИЧИНА: Функция не экспортирована в legacy compatibility слое
// РЕШЕНИЕ: Добавить в js/api.js:
export const updateSetlistName = api.updateSetlistName;
```

### 💡 РАБОТА С ПОЛЬЗОВАТЕЛЕМ

#### Предпочтения (обновлено):
1. **Откаты при проблемах** - не бояться откатиться на рабочую версию
2. **Тестирование на разных устройствах** - особое внимание к iOS Safari
3. **Пошаговая реализация** - с проверкой после каждого шага
4. **Визуальная обратная связь** - важность правильного отображения

#### Процесс деплоя:
```bash
# ВСЕГДА в таком порядке:
1. git add -A
2. git commit -m "описание изменений"
3. git push origin main
4. Обновить Service Worker версию
5. Проверить на продакшене
6. При проблемах - git reset --hard <commit> && git push --force
```

### 📱 МОБИЛЬНАЯ ОТЛАДКА

#### Mobile Console (создан, но не заработал из-за отката)
```javascript
// Визуальная консоль для отладки на мобильных
// Перехватывает console методы и отображает в UI
// Активируется на мобильных или с ?debug в URL
```

#### Safari-specific fixes (создан, но не применен)
```javascript
// Полифилы для старых Safari
// Touch event поддержка
// Focus fixes для iOS
// Предотвращение двойного тапа
```

### 🎯 НЕРЕШЕННЫЕ ЗАДАЧИ

1. **iOS Safari Firestore streaming** - требует переписывания на .get()
2. **Кнопка "Запустить просмотр"** в календаре - не реализована
3. **Визуальная консоль** - создана, но не отлажена
4. **Полная поддержка Safari** - требует комплексного подхода

### 🎭 ФУНКЦИЯ ПРЕЗЕНТАЦИИ (ДОБАВЛЕНО ЯНВАРЬ 2025)

#### Реализация плеера презентации из сет-листов
```javascript
// Кнопка "Презентация" в панели сет-листов теперь запускает полноэкранный плеер
// Использует тот же модуль eventPlayer.js, что и страница события
```

**Важные детали реализации:**
1. **Подключение стилей**: Добавлен `event-player.css` на главную страницу
2. **Формат данных песен**: Такой же как на странице события
3. **Обработка eventId**: Передается `null` вместо ID события

#### Проблемы со стилями плеера
**КРИТИЧНО**: Стили плеера требуют форсированных значений:
```css
/* Выпадающий список тональностей */
.player-key-dropdown {
    width: 150px !important;
    min-width: 150px !important;
    max-width: 150px !important;
    background: #1f2937 !important;
}

/* Иконки в кнопках плеера */
.player-control-btn i,
.player-control-btn .fas {
    color: var(--text-primary) !important;
}
```

### 🔧 ИСПРАВЛЕНИЯ UI/UX (ЯНВАРЬ 2025)

#### 1. Восстановление нижней панели при свайпе
```javascript
// В setupSwipeToClose() добавлено восстановление нижней панели
if (panel.id === 'setlists-panel') {
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) {
        bottomNav.style.transform = 'translateY(0)';
    }
}
```

#### 2. Унификация списка тональностей
- Фиксированная ширина: 150px (десктоп), 130px (мобильные)
- Высота с прокруткой: 420px (десктоп), 350px (мобильные)
- Вертикальный список вместо сетки для удобства выбора

### 📝 РЕКОМЕНДАЦИИ ДЛЯ СЛЕДУЮЩЕГО АГЕНТА

1. **Safari/iOS** - приоритет №1, использовать .get() вместо streaming
2. **Не трогать основной функционал** при исправлении Safari
3. **Тестировать каждое изменение** отдельно
4. **Service Worker** - всегда обновлять версию
5. **Откаты** - не бояться откатываться при проблемах
6. **Документировать** все изменения подробно
7. **Стили плеера** - использовать !important для гарантии применения

---
**Последняя рабочая версия**: commit c8b422b
**Текущая версия Service Worker**: v366
**Проблема Safari**: iOS Safari блокирует Firestore streaming (не решена)