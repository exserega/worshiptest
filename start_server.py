#!/usr/bin/env python3

"""
Локальный сервер для разработки Agape Worship
Порт: 8001
"""

import http.server
import socketserver
import os
import sys
from http.server import SimpleHTTPRequestHandler

PORT = 8001

class CORSRequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler с поддержкой CORS для работы с Firebase"""
    
    def end_headers(self):
        # Добавляем CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Обработка preflight запросов"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Кастомный формат логов"""
        sys.stderr.write("[%s] %s\n" %
                         (self.log_date_time_string(),
                          format % args))

def run_server():
    """Запуск сервера"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or '.')
    
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print("")
        print("🎵 Agape Worship Local Server")
        print("=============================")
        print(f"✅ Server running at http://localhost:{PORT}/")
        print(f"📁 Serving files from: {os.getcwd()}")
        print("")
        print("Press Ctrl+C to stop the server")
        print("")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n⏹️  Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    run_server()