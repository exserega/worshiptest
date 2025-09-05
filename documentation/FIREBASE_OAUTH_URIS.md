## Firebase OAuth Redirect URIs и разрешённые домены

Конфигурация из `firebase-init.js`:
- authDomain: `song-archive-389a6.firebaseapp.com`

Разрешённые домены в Firebase Auth → Settings:
- `agapeworship.asia`
- `song-archive-389a6.firebaseapp.com`

Google Sign-In → Authorized redirect URIs:
- `https://song-archive-389a6.firebaseapp.com/__/auth/handler`
- (опционально) `https://agapeworship.asia/__/auth/handler`

Apple Sign-In (на стороне Apple Developer и в Firebase):
- Service ID redirect URLs: те же, что и выше
- Scopes: email, name

Примечания:
- Для нативной оболочки (Capacitor) первично пробуем `signInWithRedirect` в WebView. Если понадобится, добавим схему приложения и внешнюю авторизацию через `@capacitor/browser` с возвратом по кастомной схеме.

