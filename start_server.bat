@echo off
echo ====================================================
echo      Agape Worship - Запуск локального сервера
echo ====================================================
echo.

:: Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python найден, запускаю сервер...
    echo.
    python start_server.py
    goto end
)

:: Если Python не найден, проверяем Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js найден, запускаю сервер...
    echo.
    node start_server.js
    goto end
)

:: Если ничего не найдено, используем встроенный Python сервер
echo [!] Python и Node.js не найдены!
echo [!] Попытка запустить с помощью python3...
python3 -m http.server 8001
if %errorlevel% neq 0 (
    echo.
    echo ====================================================
    echo ОШИБКА: Не удалось запустить сервер!
    echo.
    echo Установите Python с https://www.python.org/
    echo или Node.js с https://nodejs.org/
    echo ====================================================
    pause
)

:end