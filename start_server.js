#!/usr/bin/env node

/**
 * Локальный сервер для разработки Agape Worship
 * Порт: 8001
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8001;

// MIME типы для правильной отдачи файлов
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // CORS headers для работы с Firebase
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Определяем путь к файлу
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // Получаем расширение файла
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Читаем и отдаем файл
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Файл не найден
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        // Другая ошибка сервера
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      // Успешный ответ
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache' // Отключаем кэш для разработки
      });
      res.end(content, 'utf-8');
    }
  });

  // Логирование запросов
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
});

server.listen(PORT, () => {
  console.log('');
  console.log('🎵 Agape Worship Local Server');
  console.log('=============================');
  console.log(`✅ Server running at http://localhost:${PORT}/`);
  console.log('📁 Serving files from:', process.cwd());
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});