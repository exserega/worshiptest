# Agape Worship — локальная разработка и PWA‑памятка

## Локальный запуск (Windows PowerShell)
- Перейти в папку проекта:
  - `cd "C:\Users\BM DESIGN\Desktop\Worship site\worshiptest-main"`
- Запустить сервер:
  - `py -m http.server 8001`
- Открыть в браузере:
  - Главная: `http://localhost:8001/`
  - Логин: `http://localhost:8001/public/login.html`
  - Настройки: `http://localhost:8001/public/settings.html`
  - Админ: `http://localhost:8001/public/admin.html`

Примечание: в PowerShell не используйте `&&`. Команды выполнять по очереди.

## Firebase инициализация (единая)
- На всех страницах в `public/` подключается только общий `firebase-init.js` (без дублирующих конфигов).
- Порядок: сначала CDN SDK v8 (если нужно), затем `firebase-init.js`, затем ваши модули.

## Service Worker (PWA)
- Текущая версия: v148.
- При изменении путей/критичных ресурсов — увеличьте `CACHE_NAME` в `sw.js` (например, `v149`).
- После обновления: в браузере DevTools → Application → Clear storage → Clear site data → перезагрузить страницу.

## Мобильное приложение (TWA)
- Изменения сайта (HTML/CSS/JS) после деплоя на `agapeworship.asia` попадают в приложение автоматически.
- APK/AAB пересобирать НЕ нужно для контент‑изменений. Обязательно повышайте версию кэша в `sw.js`.
- Адресная строка в TWA исчезает при корректном `/.well-known/assetlinks.json` (см. `documentation/MOBILE_RELEASE_GUIDE.md`).

## Офлайн режим
- Включена офлайн‑персистентность Firestore; ранее загруженные песни/списки/репертуар доступны офлайн.
- При отсутствии сети чтение идёт из кэша; изменения (запись) выполняются только онлайн.

## Диагностика
- Если видите `Firebase: No Firebase App '[DEFAULT]'` — проверьте, что `firebase-init.js` загружается раньше модулей страницы.
- Сообщения вида `Unchecked runtime.lastError: The message port closed...` приходят от расширений браузера и не относятся к сайту.

## Логи
- Для логов используйте `src/utils/logger.js`. На localhost логи видны, в продакшене — скрыты.
