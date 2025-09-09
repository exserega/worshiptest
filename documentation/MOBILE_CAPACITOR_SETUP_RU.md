## Capacitor: мобильная сборка (Android/iOS) для Agape Worship

Ниже — максимально детальная, пошаговая инструкция по подготовке и сборке мобильной версии приложения (Android и iOS) на базе существующего веб‑кода и Capacitor. Ориентирована на текущую архитектуру проекта: Firebase v8 (через CDN), PWA (sw.js), модульная структура `src/`.

Важно:
- Firebase — строго v8 (не модульный v9).
- Тёмная тема и цветовые правила — без изменений.
- При каждом релизе увеличивайте версию `CACHE_NAME` в `sw.js` (см. раздел «Сервис‑воркер и кэш»).

---

### 1) Предварительные требования (локальная среда)

- Node.js 18+ и npm 9+ (проверьте `node -v`, `npm -v`).
- Capacitor CLI: `npm i -g @capacitor/cli`
- Android Studio (SDK Platform 34+, Build Tools), Java 17 (Temurin), Gradle через Android Studio.
- macOS для iOS: Xcode 15+, CocoaPods: `sudo gem install cocoapods`.
- Git настроен (user.name/user.email), доступ к репозиторию.

Папка проекта: сам корень репозитория (webDir у нас — `.`).

---

### 2) Быстрая проверка структуры и конфигов

- Проверьте наличие `capacitor.config.json`:
  - `appId`: `com.agapeworship.app`
  - `appName`: `Agape Worship`
  - `webDir`: `.` (корень репозитория)
  - `server.androidScheme` и `server.iosScheme`: `https`

- Firebase v8 SDK подключён в HTML (index, login, admin, event): строки вида:
  ```html
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
  ```
- Инициализация Firebase: `firebase-init.js` (не менять на v9!).

---

### 3) Инициализация и добавление платформ Capacitor

Если платформа ещё не добавлена (первый раз):
```bash
npx cap add android
npx cap add ios
```

Синхронизация веб‑ресурсов в нативные проекты (выполнять после любых правок в веб‑коде):
```bash
npx cap sync
```

Открыть проекты:
```bash
npx cap open android
npx cap open ios
```

---

### 4) Подготовка Firebase для мобильной авторизации

Проект уже использует Firebase v8. Для корректной авторизации на устройствах:

#### 4.1 Android (Google Sign‑In)
1. В Firebase Console добавьте Android‑приложение:
   - Package name: `com.agapeworship.app`
2. Добавьте SHA‑ключи отпечатков (debug и release) в то же приложение:
   - Debug SHA‑1: запустите из папки `android/`:
     ```bash
     ./gradlew signingReport | grep SHA-1 | | cat
     ```
     Скопируйте значение `SHA-1` для `debug` варианта.
   - Release SHA‑1/256: для релизного keystore (если есть). Иначе добавите позднее перед публикацией.
3. Скачайте `google-services.json` из Firebase Console и положите в `android/app/google-services.json`.
4. Подключите плагин Google Services в Gradle (если не подключён):
   - В `android/build.gradle` (project):
     ```gradle
     buildscript {
       dependencies {
         classpath 'com.google.gms:google-services:4.3.15'
       }
     }
     ```
   - В `android/app/build.gradle` (module) в конце файла:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```
5. Включите нужные провайдеры входа (Google, Email/Password) в Firebase Auth → Sign‑in method.
6. В Firebase Auth → Settings → Authorized domains убедитесь, что присутствуют:
   - `song-archive-389a6.firebaseapp.com` (и `*.web.app` при необходимости)
   - `localhost` (для отладки) — обычно есть по умолчанию.

Примечание: в нашем коде для WebView используется `signInWithRedirect` при обнаружении нативного WebView. Это рабочая связка с добавленным `SHA-1` и `google-services.json`.

#### 4.2 iOS
1. В Firebase Console добавьте iOS‑приложение:
   - Bundle ID: `com.agapeworship.app`
2. Скачайте `GoogleService-Info.plist` и добавьте в Xcode: `ios/App/App/GoogleService-Info.plist` (Ensure “Copy items if needed”).
3. Убедитесь, что включены провайдеры входа (Google, Email/Password) как и для Android.
4. Authorized domains — аналогично Android (см. выше).

Дополнительно (опционально, если будете использовать нативные плагины авторизации):
- Добавьте URL Types в Xcode (URL Schemes на основе `REVERSED_CLIENT_ID` из `GoogleService-Info.plist`). Для текущего web‑потока обычно не требуется.

---

### 5) Сервис‑воркер и кэш

- Проект — PWA. На мобильных (Capacitor) `sw.js` может кэшировать старые ресурсы. Обязательно увеличивайте `CACHE_NAME` при каждом релизе, чтобы форсировать обновление.
- Если после авторизации страницы загружают только стили/пустой контент (частая жалоба при кэш‑конфликте):
  - Увеличьте версию в `sw.js` (в этом коммите уже повышена).
  - Пересоберите приложение, выполните `npx cap sync` и переустановите.

Опционально (если захотите полностью исключить SW на мобильных):
- Можно условно не регистрировать SW в `index.html` для нативной среды (Capacitor), определяя это по `window.Capacitor`.

---

### 6) Особенности страниц после авторизации (events)

Симптом из опыта: после успешной авторизации страница `public/event/` отображает стили, но не показывает данные.

Проверьте по порядку:
1. Отладка в WebView:
   - Android: `chrome://inspect/#devices` → выбрать WebView приложения → смотрим консоль и сети.
   - iOS: Safari → Develop → устройство → WebView.
2. Ошибки загрузки модулей:
   - В `public/event/event-page.js` есть динамический импорт:
     ```js
     import('/src/modules/events/eventPlayer.js')
     ```
     Если видите 404 на этот путь в WebView, замените на устойчивый к контексту путей вариант:
     ```js
     const url = new URL('../../src/modules/events/eventPlayer.js', import.meta.url).href;
     const { openEventPlayer } = await import(url);
     ```
     Это исключает проблемы с абсолютным `/` в среде WebView.
3. Права чтения Firestore для `events`:
   - В `config/firestore.rules` нет явных правил для коллекции `events`. Для публичного просмотра событий добавьте (пример, настроить под вашу политику):
     ```
     match /events/{eventId} {
       allow read: if true;        // или: isAuthenticated()
       allow create, update, delete: if isModerator();
     }
     ```
   - После изменения правил — `firebase deploy --only firestore:rules`.
4. Токен/claims после одобрения роли:
   - В проекте Cloud Functions обновляют `claimsUpdatedAt` → клиенту нужен рефреш токена.
   - Если UI «зависает» по правам после одобрения, принудительно вызовите `user.getIdToken(true)` или выполните `signOut/signIn`.

---

### 7) Сборка и запуск Android

1. Синхронизируйте изменения:
   ```bash
   npx cap sync android
   ```
2. Откройте проект:
   ```bash
   npx cap open android
   ```
3. Android Studio:
   - Выберите модуль `app` → запустите на эмуляторе/устройстве.
   - Если видите ошибку google‑services — проверьте `google-services.json` и плагины Gradle.
4. Тесты входа:
   - Откройте `/public/login.html` → Google/Email → далее проверьте `/public/event/?id=...`.

---

### 8) Сборка и запуск iOS (macOS)

1. Синхронизируйте изменения:
   ```bash
   npx cap sync ios
   ```
2. Установите pods:
   ```bash
   (cd ios/App && pod install)
   ```
3. Откройте проект:
   ```bash
   npx cap open ios
   ```
4. Xcode:
   - Выберите таргет `App` → устройство/симулятор → Build & Run.
5. Тесты входа и просмотр событий — аналогично Android.

---

### 9) Чек‑лист перед релизом

- [ ] Версия `CACHE_NAME` в `sw.js` увеличена
- [ ] `google-services.json` (Android) и/или `GoogleService-Info.plist` (iOS) на месте
- [ ] Firebase Auth провайдеры включены (Google, Email/Password)
- [ ] Authorized domains в Firebase Auth корректны
- [ ] SHA‑1 (и SHA‑256 для release) добавлены в Android‑приложение в Firebase
- [ ] Динамические импорты проверены/устойчивы (см. раздел 6.2)
- [ ] Правила Firestore для `events` настроены (см. раздел 6.3)
- [ ] `npx cap sync` выполнен перед запуском

---

### 10) Типичные проблемы и решения

- «После логина страница пустая/только стили»: увеличьте `CACHE_NAME`, выполните `npx cap sync`, переустановите приложение; проверьте динамические импорты и права чтения `events`.
- Google Sign‑In не возвращает в приложение на Android: проверьте `SHA-1` в Firebase и наличие `google-services.json`; убедитесь, что используется `signInWithRedirect` в WebView (в коде уже так).
- 404 на модули в WebView: используйте импорт через `import.meta.url` (см. раздел 6.2).
- iOS не открывает внешние ссылки/шаринг: используйте `window.open(url, '_blank')`; проверьте, что схема `https`.

---

### 11) Команды для CI/локальной сборки (памятка)

```bash
# Синхронизация платформ перед сборкой
npx cap sync

# Android
npx cap sync android && npx cap open android

# iOS (macOS)
npx cap sync ios && (cd ios/App && pod install) && npx cap open ios
```

---

Готово. Следуйте шагам сверху. Вопросы по авторизации через Firebase v8 в WebView и доступам `events` смотрите в разделах 4 и 6.

