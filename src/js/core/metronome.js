// Agape Worship App - metronome.js
// Модуль для работы с метрономом и аудио
// Версия 2.1 - Улучшенный звук метронома

// --- AUDIO CONTEXT & METRONOME ---

let audioContext = null;
let isMetronomeActive = false;
let metronomeInterval = null;
let nextNoteTime = 0.0;
let currentBeat = 0;
let lookahead = 25.0; // Интервал планирования в миллисекундах
let scheduleAheadTime = 0.1; // Насколько вперед планировать аудио (в секундах)
let timerWorker = null;

// Настройки звука - классический метроном
const SOUND_CONFIG = {
    // Используем более низкие частоты для более приятного звука
    frequencies: {
        high: 440,    // A4 - для сильной доли (классическая нота Ля)
        low: 220      // A3 - для слабых долей (октавой ниже)
    },
    
    // Настройки для разных типов звука
    woodblock: {
        high: 800,    // Более высокий тон для акцента
        low: 400      // Более низкий для обычных долей
    },
    
    click: {
        high: 600,    // Компромиссный вариант
        low: 300      // Не слишком высокий, не слишком низкий
    },
    
    // Параметры огибающей для более мягкого звука
    envelope: {
        attackTime: 0.001,    // Очень быстрая атака (1мс)
        decayTime: 0.01,      // Быстрое затухание (10мс)
        sustainLevel: 0.3,    // Уровень поддержки
        releaseTime: 0.03     // Общее время звучания (30мс)
    },
    
    // Громкость
    volume: {
        accent: 1.0,          // Громкость акцентированной доли
        normal: 0.7,          // Громкость обычной доли
        master: 0.5           // Общая громкость (снижена для комфорта)
    }
};

// Текущий тип звука
let currentSoundType = 'click'; // 'click', 'woodblock', или 'classic'

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
 * Создание одного клика метронома с улучшенным звуком
 */
function createClick(isAccent, time) {
    if (!audioContext || audioContext.state !== 'running') return;
    
    try {
        // Выбираем частоты в зависимости от типа звука
        const frequencies = SOUND_CONFIG[currentSoundType] || SOUND_CONFIG.click;
        const frequency = isAccent ? frequencies.high : frequencies.low;
        const volume = isAccent ? SOUND_CONFIG.volume.accent : SOUND_CONFIG.volume.normal;
        
        // Создаем осциллятор
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Добавляем фильтр для более мягкого звука
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000; // Срезаем высокие частоты для мягкости
        filter.Q.value = 1;
        
        // Настройка осциллятора
        oscillator.frequency.value = frequency;
        
        // Используем разные типы волн для разных звуков
        if (currentSoundType === 'woodblock') {
            oscillator.type = 'square'; // Более резкий звук
        } else if (currentSoundType === 'classic') {
            oscillator.type = 'sine'; // Чистый тон
        } else {
            oscillator.type = 'triangle'; // Мягкий клик
        }
        
        // Настройка огибающей громкости (ADSR) для естественного звука
        const env = SOUND_CONFIG.envelope;
        const finalVolume = volume * SOUND_CONFIG.volume.master;
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(finalVolume, time + env.attackTime);
        gainNode.gain.exponentialRampToValueAtTime(
            finalVolume * env.sustainLevel, 
            time + env.attackTime + env.decayTime
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001, 
            time + env.attackTime + env.decayTime + env.releaseTime
        );
        
        // Подключение узлов
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Запуск и остановка
        oscillator.start(time);
        oscillator.stop(time + env.attackTime + env.decayTime + env.releaseTime);
        
        // Добавляем небольшой "щелчок" для реалистичности
        if (currentSoundType === 'click' || currentSoundType === 'woodblock') {
            const clickOsc = audioContext.createOscillator();
            const clickGain = audioContext.createGain();
            
            clickOsc.type = 'square';
            clickOsc.frequency.value = isAccent ? 80 : 60; // Низкочастотный щелчок
            
            clickGain.gain.setValueAtTime(finalVolume * 0.5, time);
            clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.005);
            
            clickOsc.connect(clickGain);
            clickGain.connect(audioContext.destination);
            
            clickOsc.start(time);
            clickOsc.stop(time + 0.005);
        }
        
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
    
    createClick(isAccent, time);
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
        
        console.log(`Метроном запущен: ${bpm} BPM, тип звука: ${currentSoundType}`);
        return { isActive: true };
    }
}

/**
 * Изменение типа звука метронома
 */
function setSoundType(type) {
    if (['click', 'woodblock', 'classic'].includes(type)) {
        currentSoundType = type;
        console.log(`Тип звука метронома изменен на: ${type}`);
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
        soundType: currentSoundType,
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
    initAudioOnUserGesture,
    setSoundType
};

// Экспортируем переменные состояния для совместимости
export { audioContext, isMetronomeActive, currentBeat };
export const audioBuffer = null; // Больше не используется 