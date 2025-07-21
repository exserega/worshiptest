// Modern Metronome UI Controller
import * as core from './core.js';

// DOM Elements
const bpmDisplay = document.getElementById('bpm-display');
const bpmSource = document.getElementById('bpm-source');
const bpmInput = document.getElementById('bpm-input');
const bpmSlider = document.getElementById('bpm-slider');
const bpmDecrease = document.getElementById('bpm-decrease');
const bpmIncrease = document.getElementById('bpm-increase');
const metronomeButton = document.getElementById('metronome-button');
const metronomeIcon = metronomeButton?.querySelector('.metronome-icon i');
const timeSignature = document.getElementById('time-signature');

// State
let currentBPM = 120;
let originalBPM = null; // BPM from Firebase
let isMetronomeActive = false;

// Initialize metronome UI
export function initMetronomeUI() {
    setupEventListeners();
    // Don't set initial BPM, wait for song to load
    updateBPMDisplay('N/A', 'по умолчанию');
}

// Setup event listeners
function setupEventListeners() {
    // BPM Controls
    if (bpmDecrease) {
        bpmDecrease.addEventListener('click', () => adjustBPM(-1));
    }
    
    if (bpmIncrease) {
        bpmIncrease.addEventListener('click', () => adjustBPM(1));
    }
    
    if (bpmInput) {
        bpmInput.addEventListener('input', handleBPMInputChange);
        bpmInput.addEventListener('blur', handleBPMInputBlur);
        bpmInput.addEventListener('keydown', handleBPMInputKeydown);
    }
    
    if (bpmSlider) {
        bpmSlider.addEventListener('input', handleBPMSliderChange);
    }
    
    // Metronome button
    if (metronomeButton) {
        metronomeButton.addEventListener('click', toggleMetronome);
    }
}

// Adjust BPM by increment
function adjustBPM(increment) {
    const newBPM = Math.max(40, Math.min(200, currentBPM + increment));
    setBPM(newBPM, 'изменено');
}

// Handle BPM input change
function handleBPMInputChange(e) {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 40 && value <= 200) {
        setBPM(value, 'изменено', false); // Don't update input to avoid cursor issues
        updateSlider(value);
    }
}

// Handle BPM input blur
function handleBPMInputBlur(e) {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 40 || value > 200) {
        e.target.value = currentBPM; // Reset to current valid value
    }
}

// Handle BPM input keydown
function handleBPMInputKeydown(e) {
    if (e.key === 'Enter') {
        e.target.blur();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustBPM(1);
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustBPM(-1);
    }
}

// Handle BPM slider change
function handleBPMSliderChange(e) {
    const value = parseInt(e.target.value, 10);
    setBPM(value, 'изменено');
}

// Set BPM value
function setBPM(bpm, source = 'по умолчанию', shouldUpdateInput = true) {
    currentBPM = bpm;
    updateBPMDisplay(bpm, source);
    
    if (shouldUpdateInput) {
        updateInputField(bpm);
    }
    updateSlider(bpm);
    
    // If metronome is active, restart with new BPM
    if (isMetronomeActive) {
        restartMetronome();
    }
}

// Update BPM display
function updateBPMDisplay(bpm, source) {
    if (bpmDisplay) {
        bpmDisplay.textContent = bpm;
    }
    if (bpmSource) {
        bpmSource.textContent = source;
    }
}

// Update input field
function updateInputField(bpm) {
    if (bpmInput && document.activeElement !== bpmInput) {
        bpmInput.value = bpm;
    }
}

// Update slider
function updateSlider(bpm) {
    if (bpmSlider) {
        bpmSlider.value = bpm;
    }
}

// Toggle metronome
async function toggleMetronome() {
    try {
        const beats = parseInt(timeSignature?.value || '4', 10);
        const { isActive, error } = await core.toggleMetronome(currentBPM, beats);
        
        if (error) {
            alert(`Ошибка метронома: ${error}`);
            return;
        }
        
        isMetronomeActive = isActive;
        updateMetronomeButton(isActive);
        
    } catch (error) {
        console.error('Metronome toggle error:', error);
        alert('Не удалось переключить метроном');
    }
}

// Restart metronome with current settings
async function restartMetronome() {
    if (isMetronomeActive) {
        // Stop current metronome
        await core.toggleMetronome(0, 4);
        // Start with new BPM
        const beats = parseInt(timeSignature?.value || '4', 10);
        const { isActive } = await core.toggleMetronome(currentBPM, beats);
        isMetronomeActive = isActive;
    }
}

// Update metronome button appearance
function updateMetronomeButton(isActive) {
    if (!metronomeButton || !metronomeIcon) return;
    
    if (isActive) {
        metronomeButton.classList.add('active');
        metronomeIcon.className = 'fas fa-stop';
        metronomeButton.setAttribute('aria-label', 'Выключить метроном');
    } else {
        metronomeButton.classList.remove('active');
        metronomeIcon.className = 'fas fa-play';
        metronomeButton.setAttribute('aria-label', 'Включить метроном');
    }
}

// Public API for updating BPM from external sources (like Firebase)
export function updateBPMFromSong(bpm) {
    if (bpm && !isNaN(bpm) && bpm > 0) {
        originalBPM = bpm;
        setBPM(bpm, 'из песни');
    } else {
        originalBPM = null;
        setBPM(120, 'по умолчанию');
    }
}

// Reset BPM to original from song
export function resetBPMToOriginal() {
    if (originalBPM) {
        setBPM(originalBPM, 'из песни');
    }
}

// Get current BPM
export function getCurrentBPM() {
    return currentBPM;
}

// Stop metronome (for external use)
export function stopMetronome() {
    if (isMetronomeActive) {
        toggleMetronome();
    }
}

// Export for backward compatibility
export function updateBPM(newBPM) {
    updateBPMFromSong(newBPM);
}

export function updateMetronomeButtonState(isActive) {
    updateMetronomeButton(isActive);
}