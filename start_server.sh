#!/bin/bash

echo ""
echo "==============================="
echo " Agape Worship Local Server"
echo "==============================="
echo ""

# Функция для проверки команды
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Проверяем наличие Python
if command_exists python; then
    echo "[+] Python найден. Запускаем Python сервер..."
    python start_server.py
    exit 0
fi

# Проверяем наличие Python3
if command_exists python3; then
    echo "[+] Python3 найден. Запускаем Python сервер..."
    python3 start_server.py
    exit 0
fi

# Проверяем наличие Node.js
if command_exists node; then
    echo "[+] Node.js найден. Запускаем Node.js сервер..."
    node start_server.js
    exit 0
fi

# Если ничего не найдено
echo "[!] Ошибка: Не найден Python или Node.js"
echo ""
echo "Пожалуйста, установите один из них:"
echo "- Python: https://www.python.org/"
echo "- Node.js: https://nodejs.org/"
echo ""
echo "Для macOS можно использовать Homebrew:"
echo "  brew install python3"
echo "  brew install node"
echo ""
exit 1