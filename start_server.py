#!/usr/bin/env python3
"""
Простой HTTP сервер для локальной разработки Agape Worship
Запускает сервер на порту 8001
"""

import http.server
import socketserver
import os
import sys

PORT = 8001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Добавляем CORS заголовки для работы с Firebase
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Красивый вывод логов
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server():
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"""
╔══════════════════════════════════════════════════════╗
║       🎵 Agape Worship - Локальный сервер 🎵        ║
╠══════════════════════════════════════════════════════╣
║  Сервер запущен на: http://localhost:{PORT}          ║
║  Для остановки нажмите: Ctrl+C                      ║
╚══════════════════════════════════════════════════════╝
        """)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ Сервер остановлен")
            sys.exit(0)

if __name__ == "__main__":
    run_server()