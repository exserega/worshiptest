// Modern Metronome UI Controller
import * as core from './core.js';

// DOM Elements
const bpmInput = document.getElementById('bpm-input');
const bpmKnob = document.getElementById('bpm-knob');
const knobProgress = document.getElementById('knob-progress');
const knobHandle = document.getElementById('knob-handle');
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
    
    if (bpmKnob) {
        setupKnobInteraction();
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

// Setup knob interaction
function setupKnobInteraction() {
    let isDragging = false;
    let startAngle = 0;
    let startBPM = 120;
    
    // Mouse events
    knobHandle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events for mobile
    knobHandle.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    
    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        startBPM = currentBPM;
        
        const rect = bpmKnob.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX && clientY) {
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            startAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        }
        
        document.body.style.cursor = 'grabbing';
    }
    
    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const rect = bpmKnob.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height; // Bottom center for semicircle
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (!clientX || !clientY) return;
        
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        
        // Calculate current angle
        let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Calculate angle difference
        let angleDiff = currentAngle - startAngle;
        
        // Normalize angle difference to -180 to 180
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff < -180) angleDiff += 360;
        
        // Convert angle change to BPM change (low sensitivity for precision)
        const bpmChange = (angleDiff / 540) * 80; // 540° = 80 BPM change (1/3 sensitivity)
        let newBPM = Math.round(startBPM + bpmChange);
        
        // Clamp to valid range
        newBPM = Math.max(40, Math.min(200, newBPM));
        
        setBPM(newBPM, 'изменено');
    }
    
    function endDrag() {
        isDragging = false;
        document.body.style.cursor = '';
    }
}

// Set BPM value
function setBPM(bpm, source = 'по умолчанию', shouldUpdateInput = true) {
    currentBPM = bpm;
    
    if (shouldUpdateInput) {
        updateInputField(bpm);
    }
    updateKnob(bpm);
    
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

// Update knob position
function updateKnob(bpm) {
    if (!knobProgress || !knobHandle || isNaN(bpm)) return;
    
    // Convert BPM (40-200) to angle (0-180 degrees for semicircle)
    const normalizedValue = (bpm - 40) / 160; // 0 to 1
    const angle = normalizedValue * 180; // 0 to 180 degrees
    
    // Update progress arc (semicircle from 180° to 0°)
    knobProgress.style.background = `conic-gradient(
        from 225deg,
        var(--primary-color) 0deg,
        var(--primary-color) ${angle}deg,
        transparent ${angle}deg
    )`;
    
    // Update handle rotation
    const rotationAngle = -90 + angle; // Start from -90° (left) to 90° (right)
    knobHandle.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
}

// Legacy function name for backward compatibility  
function updateSlider(bpm) {
    updateKnob(bpm);
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