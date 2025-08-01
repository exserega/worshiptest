@echo off
echo.
echo ===============================
echo  Agape Worship Local Server
echo ===============================
echo.

:: Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [+] Python найден. Запускаем Python сервер...
    python start_server.py
    goto end
)

:: Проверяем наличие Python3
python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo [+] Python3 найден. Запускаем Python сервер...
    python3 start_server.py
    goto end
)

:: Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [+] Node.js найден. Запускаем Node.js сервер...
    node start_server.js
    goto end
)

:: Если ничего не найдено
echo [!] Ошибка: Не найден Python или Node.js
echo.
echo Пожалуйста, установите один из них:
echo - Python: https://www.python.org/
echo - Node.js: https://nodejs.org/
echo.
pause
exit /b 1

:end
pause