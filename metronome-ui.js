// Modern Metronome UI Controller
import * as core from './core.js';

// DOM Elements
const bpmInput = document.getElementById('bpm-input');
const bpmDecrease = document.getElementById('bpm-decrease');
const bpmIncrease = document.getElementById('bpm-increase');
const metronomeButton = document.getElementById('metronome-button');
const metronomeIcon = metronomeButton?.querySelector('i');
const timeSignature = document.getElementById('time-signature');

// Round Slider instance
let roundSliderInstance = null;

// State
let currentBPM = 120;
let originalBPM = null; // BPM from Firebase
let isMetronomeActive = false;

// Initialize metronome UI
export function initMetronomeUI() {
    // Wait for jQuery to be available
    if (typeof $ === 'undefined') {
        setTimeout(initMetronomeUI, 100);
        return;
    }
    
    setupRoundSlider();
    setupEventListeners();
    // Don't set initial BPM, wait for song to load
    updateBPMDisplay('N/A', 'по умолчанию');
}

// Setup round slider
function setupRoundSlider() {
    roundSliderInstance = $("#bpm-round-slider").roundSlider({
        radius: 80,
        circleShape: "half-top",
        sliderType: "min-range",
        showTooltip: false,
        value: 120,
        min: 40,
        max: 200,
        step: 1,
        width: 8,
        handleSize: 24,
        animation: true,
        change: function(e) {
            const newBPM = Math.round(e.value);
            if (newBPM !== currentBPM) {
                setBPM(newBPM, 'изменено', true, false); // Don't update slider to avoid loop
            }
        }
    });
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
    
    // Round slider is already set up in setupRoundSlider()
    
    // Metronome button
    if (metronomeButton) {
        metronomeButton.addEventListener('click', toggleMetronome);
    }
}

// Adjust BPM by increment
function adjustBPM(increment) {
    const newBPM = Math.max(40, Math.min(200, currentBPM + increment));
    setBPM(newBPM, 'изменено', true, true);
}

// Handle BPM input change
function handleBPMInputChange(e) {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 40 && value <= 200) {
        setBPM(value, 'изменено', false, true); // Don't update input to avoid cursor issues, but update slider
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



// Set BPM value
function setBPM(bpm, source = 'по умолчанию', shouldUpdateInput = true, shouldUpdateSlider = true) {
    currentBPM = bpm;
    
    if (shouldUpdateInput) {
        updateInputField(bpm);
    }
    if (shouldUpdateSlider && roundSliderInstance) {
        roundSliderInstance.roundSlider("option", "value", bpm);
    }
    
    // If metronome is active, restart with new BPM
    if (isMetronomeActive) {
        restartMetronome();
    }
}

// Update BPM display (simplified)
function updateBPMDisplay(bpm, source) {
    // Display is now handled by the input field directly
}

// Update input field
function updateInputField(bpm) {
    if (bpmInput && document.activeElement !== bpmInput) {
        bpmInput.value = bpm;
    }
}

// Legacy function name for backward compatibility
function updateInput(bpm) {
    updateInputField(bpm);
}

// Legacy function name for backward compatibility  
function updateKnob(bpm) {
    // Now handled by roundSlider
}

function updateSlider(bpm) {
    // Now handled by roundSlider
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
        setBPM(bpm, 'из песни', true, true);
    } else {
        originalBPM = null;
        setBPM(120, 'по умолчанию', true, true);
    }
}

// Reset BPM to original from song
export function resetBPMToOriginal() {
    if (originalBPM) {
        setBPM(originalBPM, 'из песни', true, true);
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