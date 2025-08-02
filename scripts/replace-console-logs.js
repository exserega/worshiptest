#!/usr/bin/env node

// ====================================
// 🔧 СКРИПТ ЗАМЕНЫ CONSOLE.LOG
// ====================================
// Автоматически заменяет console.log на logger.log
// и добавляет импорт logger где нужно
// ====================================

const fs = require('fs');
const path = require('path');

// Директории для поиска
const searchDirs = [
    './src',
    './js', 
    './public',
    './functions'
];

// Исключения - файлы, которые не трогаем
const excludePatterns = [
    'node_modules',
    '.git',
    'build',
    'dist',
    '*.min.js',
    'logger.js', // сам logger не трогаем
    'tests/', // тесты могут использовать console.log
    'scripts/' // скрипты тоже
];

// Функция проверки, нужно ли обрабатывать файл
function shouldProcessFile(filePath) {
    // Проверяем исключения
    for (const pattern of excludePatterns) {
        if (filePath.includes(pattern)) {
            return false;
        }
    }
    return filePath.endsWith('.js');
}

// Функция определения правильного пути к logger
function getLoggerImportPath(filePath) {
    const depth = filePath.split('/').length - 2; // -2 т.к. начинаем с ./
    
    if (filePath.startsWith('./src/')) {
        // Для файлов в src считаем относительный путь
        const srcDepth = filePath.replace('./src/', '').split('/').length - 1;
        return '../'.repeat(srcDepth) + 'utils/logger.js';
    } else if (filePath.startsWith('./js/')) {
        // Для файлов в js
        return '../src/utils/logger.js';
    } else if (filePath.startsWith('./public/')) {
        // Для файлов в public
        return '../src/utils/logger.js';
    } else if (filePath.startsWith('./functions/')) {
        // Для Cloud Functions
        return '../src/utils/logger.js';
    }
    
    // По умолчанию
    return './src/utils/logger.js';
}

// Функция обработки файла
function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Проверяем, есть ли console.log
    if (!content.includes('console.log')) {
        return false;
    }
    
    // Проверяем, есть ли уже импорт logger
    const hasLoggerImport = content.includes('import logger from') || 
                           content.includes('import { log') ||
                           content.includes('require.*logger');
    
    // Заменяем console.log на logger.log
    const newContent = content.replace(/console\.log/g, 'logger.log');
    
    if (newContent !== content) {
        modified = true;
        content = newContent;
        
        // Добавляем импорт logger, если его нет
        if (!hasLoggerImport) {
            const loggerPath = getLoggerImportPath(filePath);
            
            // Ищем место для вставки импорта
            // После других импортов
            const importMatch = content.match(/^(import .* from .*;\n)+/m);
            if (importMatch) {
                const lastImportEnd = importMatch.index + importMatch[0].length;
                content = content.slice(0, lastImportEnd) + 
                         `import logger from '${loggerPath}';\n` +
                         content.slice(lastImportEnd);
            } else {
                // Если нет импортов, добавляем в начало после комментариев
                const firstCodeLine = content.search(/^[^\/\*\n]/m);
                if (firstCodeLine > 0) {
                    content = content.slice(0, firstCodeLine) + 
                             `import logger from '${loggerPath}';\n\n` +
                             content.slice(firstCodeLine);
                } else {
                    content = `import logger from '${loggerPath}';\n\n` + content;
                }
            }
        }
        
        // Сохраняем изменения
        fs.writeFileSync(filePath, content);
        console.log(`✅ Обработан: ${filePath}`);
        return true;
    }
    
    return false;
}

// Функция рекурсивного обхода директорий
function processDirectory(dir) {
    let totalProcessed = 0;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !excludePatterns.some(p => filePath.includes(p))) {
            totalProcessed += processDirectory(filePath);
        } else if (stat.isFile() && shouldProcessFile(filePath)) {
            if (processFile(filePath)) {
                totalProcessed++;
            }
        }
    }
    
    return totalProcessed;
}

// Основная функция
function main() {
    console.log('🔧 Начинаем замену console.log на logger.log...\n');
    
    let totalProcessed = 0;
    
    for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
            console.log(`📁 Обработка директории: ${dir}`);
            totalProcessed += processDirectory(dir);
        }
    }
    
    console.log(`\n✅ Готово! Обработано файлов: ${totalProcessed}`);
    console.log('\n⚠️  ВАЖНО: Проверьте изменения перед коммитом!');
    console.log('Некоторые console.error оставлены как есть (они должны всегда работать)');
}

// Запуск
main();