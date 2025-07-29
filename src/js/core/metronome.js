// Agape Worship App - metronome.js
// Модуль для работы с метрономом и аудио
// Версия 2.0 - Программная генерация звука без внешних файлов

// --- AUDIO CONTEXT & METRONOME ---

let audioContext = null;
let isMetronomeActive = false;
let metronomeInterval = null;
let nextNoteTime = 0.0;
let currentBeat = 0;
let lookahead = 25.0; // Интервал планирования в миллисекундах
let scheduleAheadTime = 0.1; // Насколько вперед планировать аудио (в секундах)
let timerWorker = null;

// Настройки звука
const FREQUENCIES = {
    high: 1000, // Частота для сильной доли (Гц)
    low: 800    // Частота для слабых долей (Гц)
};

const SOUND_DURATION = 0.03; // Длительность звука в секундах
const MASTER_VOLUME = 0.8;   // Общая громкость

/**
 * Настройка AudioContext с учетом всех браузеров
 */
function setupAudioContext() {
    if (audioContext) return true;
    
    try {
        // Создаем AudioContext с учетом префиксов браузеров
        const AudioContextClass = window.AudioContext || 
                                  window.webkitAudioContext || 
                                  window.mozAudioContext || 
                                  window.oAudioContext || 
                                  window.msAudioContext;
        
        if (!AudioContextClass) {
            console.error("Web Audio API не поддерживается в этом браузере");
            return false;
        }
        
        audioContext = new AudioContextClass();
        console.log("AudioContext создан. State:", audioContext.state);
        
        // Для Safari и iOS требуется resume после взаимодействия пользователя
        if (audioContext.state === 'suspended') {
            resumeAudioContext();
        }
        
        return true;
    } catch (e) {
        console.error("Не удалось создать AudioContext:", e);
        return false;
    }
}

/**
 * Возобновление AudioContext (требуется для Safari/iOS)
 */
async function resumeAudioContext() {
    if (!audioContext) return false;
    
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
            console.log('AudioContext возобновлен');
            return true;
        } catch (error) {
            console.error('Ошибка возобновления AudioContext:', error);
            return false;
        }
    }
    return true;
}

/**
 * Создание одного клика метронома с программно сгенерированным звуком
 */
function createClick(frequency, time) {
    if (!audioContext || audioContext.state !== 'running') return;
    
    try {
        // Создаем осциллятор
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Настройка осциллятора
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine'; // Можно попробовать 'square' или 'triangle'
        
        // Настройка огибающей громкости (ADSR)
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(MASTER_VOLUME, time + 0.001); // Атака
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + SOUND_DURATION); // Затухание
        
        // Подключение узлов
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Запуск и остановка
        oscillator.start(time);
        oscillator.stop(time + SOUND_DURATION);
        
    } catch (error) {
        console.error("Ошибка создания клика:", error);
    }
}

/**
 * Планировщик нот метронома
 */
function scheduler() {
    if (!audioContext || !isMetronomeActive) return;
    
    // Планируем все ноты, которые должны прозвучать до следующего вызова
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleNote(nextNoteTime);
        nextNote();
    }
}

/**
 * Планирование одной ноты
 */
function scheduleNote(time) {
    const beatsPerMeasure = 4; // Можно сделать настраиваемым
    const isAccent = currentBeat % beatsPerMeasure === 0;
    const frequency = isAccent ? FREQUENCIES.high : FREQUENCIES.low;
    
    createClick(frequency, time);
}

/**
 * Переход к следующей ноте
 */
function nextNote() {
    const secondsPerBeat = 60.0 / currentTempo;
    nextNoteTime += secondsPerBeat;
    currentBeat = (currentBeat + 1) % 4; // Можно сделать настраиваемым
}

let currentTempo = 120; // BPM по умолчанию

/**
 * Включение/выключение метронома
 */
async function toggleMetronome(bpm = 120, beatsPerMeasure = 4) {
    if (!setupAudioContext()) {
        return { 
            isActive: false, 
            error: "Web Audio API не поддерживается в вашем браузере" 
        };
    }
    
    // Обязательно пытаемся возобновить контекст при каждом клике
    await resumeAudioContext();
    
    if (isMetronomeActive) {
        // Останавливаем метроном
        isMetronomeActive = false;
        
        if (metronomeInterval) {
            clearInterval(metronomeInterval);
            metronomeInterval = null;
        }
        
        if (timerWorker) {
            timerWorker.postMessage("stop");
        }
        
        currentBeat = 0;
        console.log("Метроном остановлен");
        return { isActive: false };
        
    } else {
        // Запускаем метроном
        if (audioContext.state !== 'running') {
            await resumeAudioContext();
            if (audioContext.state !== 'running') {
                return { 
                    isActive: false, 
                    error: "Не удалось запустить аудио контекст. Попробуйте еще раз." 
                };
            }
        }
        
        currentTempo = bpm;
        currentBeat = 0;
        nextNoteTime = audioContext.currentTime;
        isMetronomeActive = true;
        
        // Используем setInterval как основной метод
        // Web Workers не всегда доступны и могут создавать проблемы
        metronomeInterval = setInterval(scheduler, lookahead);
        
        console.log(`Метроном запущен: ${bpm} BPM`);
        return { isActive: true };
    }
}

/**
 * Получение состояния метронома
 */
function getMetronomeState() {
    return {
        isActive: isMetronomeActive,
        audioContext: audioContext,
        currentTempo: currentTempo,
        supported: !!(window.AudioContext || window.webkitAudioContext)
    };
}

/**
 * Инициализация при первом взаимодействии пользователя
 * Важно для Safari/iOS
 */
async function initAudioOnUserGesture() {
    if (!audioContext) {
        setupAudioContext();
    }
    if (audioContext) {
        await resumeAudioContext();
    }
}

// Не используется в новой версии, но оставляем для совместимости
async function loadAudioFile() {
    console.log("loadAudioFile: Больше не требуется в новой версии");
    return true;
}

function playClick(beatsPerMeasure = 4) {
    console.log("playClick: Используйте toggleMetronome для управления метрономом");
}

export {
    setupAudioContext,
    resumeAudioContext,
    loadAudioFile,
    playClick,
    toggleMetronome,
    getMetronomeState,
    initAudioOnUserGesture
};

// Экспортируем переменные состояния для совместимости
export { audioContext, isMetronomeActive, currentBeat };
export const audioBuffer = null; // Больше не используется 