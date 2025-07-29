#!/usr/bin/env node
/**
 * HTTP сервер для локальной разработки Agape Worship
 * Запускает сервер на порту 8001 с поддержкой CORS
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8001;
const DIRECTORY = __dirname;

// MIME типы для правильного отображения файлов
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Обработка CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Обработка OPTIONS запросов для CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Парсим URL
    let pathname = url.parse(req.url).pathname;
    
    // Если запрашивается корень, отдаем index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Полный путь к файлу
    const filePath = path.join(DIRECTORY, pathname);

    // Проверяем существование файла
    fs.access(filePath, fs.constants.R_OK, (err) => {
        if (err) {
            // Файл не найден
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Файл не найден</h1>');
            console.log(`[404] ${pathname}`);
            return;
        }

        // Определяем MIME тип
        const ext = path.extname(filePath);
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        // Читаем и отправляем файл
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Ошибка сервера');
                console.error(`[500] Ошибка чтения файла: ${err}`);
                return;
            }

            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(data);
            console.log(`[200] ${pathname}`);
        });
    });
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║       🎵 Agape Worship - Локальный сервер 🎵        ║
╠══════════════════════════════════════════════════════╣
║  Сервер запущен на: http://localhost:${PORT}          ║
║  Для остановки нажмите: Ctrl+C                      ║
╚══════════════════════════════════════════════════════╝
    `);
});

// Обработка завершения
process.on('SIGINT', () => {
    console.log('\n\n✅ Сервер остановлен');
    process.exit(0);
});