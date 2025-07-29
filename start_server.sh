#!/bin/bash

echo "===================================================="
echo "     Agape Worship - Запуск локального сервера"
echo "===================================================="
echo ""

# Проверяем наличие Python
if command -v python &> /dev/null; then
    echo "[OK] Python найден, запускаю сервер..."
    echo ""
    python start_server.py
elif command -v python3 &> /dev/null; then
    echo "[OK] Python3 найден, запускаю сервер..."
    echo ""
    python3 start_server.py
elif command -v node &> /dev/null; then
    echo "[OK] Node.js найден, запускаю сервер..."
    echo ""
    node start_server.js
else
    echo "[!] Python и Node.js не найдены!"
    echo "[!] Пытаюсь запустить простой HTTP сервер..."
    
    # Последняя попытка с помощью Python HTTP сервера
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8001
    else
        echo ""
        echo "===================================================="
        echo "ОШИБКА: Не удалось запустить сервер!"
        echo ""
        echo "Установите Python: sudo apt install python3"
        echo "или Node.js: sudo apt install nodejs"
        echo "===================================================="
        exit 1
    fi
fi