## Локальная подготовка окружения для сборок (Android/iOS)

Android:
1) Установить Android Studio (последняя версия)
2) Установить SDK Platform и Build-Tools (через SDK Manager)
3) Установить Java 17 (Temurin)
4) Установить переменные среды:
   - ANDROID_SDK_ROOT → путь к SDK (~/Android/Sdk)
   - JAVA_HOME → путь к JDK 17
5) Команды:
   - Установка зависимостей: `npm i`
   - Синхронизация Capacitor: `npx cap sync`
   - Открыть проект: `npx cap open android`

iOS (macOS):
1) Установить Xcode (последняя стабильная)
2) Установить CocoaPods: `sudo gem install cocoapods`
3) Команды:
   - `npm i`
   - `npx cap sync`
   - `npx cap open ios`

Примечания:
- Папки `android/` и `ios/` игнорируются Git; генерируются локально при `npx cap add <platform>`
- Для генерации ассетов: `npx @capacitor/assets generate` (необязательно на первом шаге)

