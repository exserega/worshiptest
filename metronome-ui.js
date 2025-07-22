// New Metronome Module with roundSlider
import * as core from './core.js';

class MetronomeController {
    constructor() {
        this.currentBPM = 120;
        this.originalBPM = null;
        this.isActive = false;
        this.slider = null;
        
        // DOM elements
        this.elements = {
            bpmInput: document.getElementById('bpm-input'),
            decreaseBtn: document.getElementById('bpm-decrease'),
            increaseBtn: document.getElementById('bpm-increase'),
            playButton: document.getElementById('metronome-button'),
            playIcon: document.querySelector('#metronome-button i'),
            timeSignature: document.getElementById('time-signature'),
            knobContainer: document.getElementById('professional-knob-container'),
            knobTrack: document.getElementById('knob-track'),
            knobProgress: document.getElementById('knob-progress'),
            knobCenter: document.getElementById('knob-center'),
            knobIndicator: document.getElementById('knob-indicator')
        };
    }

    async init() {
        console.log('Initializing new metronome...');
        
        // Wait for libraries with timeout
        try {
            await this.waitForLibraries();
        } catch (error) {
            console.error('Error waiting for libraries:', error);
        }
        
        // Initialize components
        this.initProfessionalKnob();
        this.setupEventListeners();
        this.updateDisplay();
        
        console.log('Metronome initialized successfully');
    }

    async waitForLibraries() {
        // No libraries needed anymore, just resolve immediately
        return Promise.resolve();
    }

    initProfessionalKnob() {
        if (!this.elements.knobContainer || !this.elements.knobCenter) {
            console.error('Professional knob elements not found');
            return;
        }

        console.log('Initializing professional knob...');
        
        // Initialize drag state
        this.isDragging = false;
        this.startX = 0;
        this.startBPM = this.currentBPM;
        
        // Setup events
        this.setupKnobEvents();
        this.updateKnobVisuals();
        
        console.log('Professional knob initialized successfully');
    }

    setupKnobEvents() {
        const knobCenter = this.elements.knobCenter;
        if (!knobCenter) return;

        // Mouse events
        knobCenter.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));

        // Touch events
        knobCenter.addEventListener('touchstart', this.startDrag.bind(this));
        document.addEventListener('touchmove', this.handleDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
        
        // Prevent context menu on knob
        knobCenter.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startBPM = this.currentBPM;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        this.startX = clientX;
        
        // Visual feedback
        this.elements.knobCenter.style.cursor = 'grabbing';
        document.body.style.cursor = 'grabbing';
        this.elements.knobCenter.style.transform = 'scale(0.95)';
        
        console.log('Started dragging knob at BPM:', this.startBPM);
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const deltaX = clientX - this.startX;
        
        // Convert horizontal movement to BPM change (1px = 1 BPM)
        const sensitivity = 1;
        const bpmChange = deltaX * sensitivity;
        let newBPM = Math.round(this.startBPM + bpmChange);
        
        // Clamp to valid range
        newBPM = Math.max(40, Math.min(200, newBPM));
        
        // Update display and visuals in real-time
        this.updateBPMDisplay(newBPM);
        this.updateKnobVisuals();
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Reset visual feedback
        this.elements.knobCenter.style.cursor = 'grab';
        document.body.style.cursor = '';
        this.elements.knobCenter.style.transform = 'scale(1)';
        
        // Final BPM update
        this.setBPM(this.currentBPM, true, false);
        
        console.log('Finished dragging knob at BPM:', this.currentBPM);
    }

    updateKnobVisuals() {
        if (!this.elements.knobProgress || !this.elements.knobIndicator) return;
        
        // Calculate angle based on BPM (0-180 degrees for semicircle)
        const normalizedValue = (this.currentBPM - 40) / 160; // 0 to 1
        const angle = normalizedValue * 180; // 0 to 180 degrees
        
        // Update progress arc
        const centerX = 80;
        const centerY = 60;
        const radius = 40;
        
        const startAngle = 180; // Start from left (180°)
        const endAngle = startAngle - angle; // Sweep clockwise
        
        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 90 ? 1 : 0;
        const pathData = `M ${startX},${startY} A ${radius},${radius} 0 ${largeArc},0 ${endX},${endY}`;
        
        this.elements.knobProgress.setAttribute('d', pathData);
        
        // Update indicator dot position
        const indicatorAngle = -90 + angle; // Start from top (-90°) and rotate
        const indicatorRadius = 15; // Distance from center
        const indicatorX = centerX + indicatorRadius * Math.cos((indicatorAngle * Math.PI) / 180);
        const indicatorY = centerY + indicatorRadius * Math.sin((indicatorAngle * Math.PI) / 180);
        
        this.elements.knobIndicator.setAttribute('cx', indicatorX);
        this.elements.knobIndicator.setAttribute('cy', indicatorY);
    }



    createFallbackSlider() {
        console.log('Creating fallback HTML5 range slider');
        
        const fallbackHTML = `
            <div class="fallback-slider-container">
                <input type="range" 
                       id="bpm-fallback-slider" 
                       class="fallback-slider" 
                       min="40" 
                       max="200" 
                       step="1" 
                       value="${this.currentBPM}">
                <div class="fallback-slider-track"></div>
            </div>
        `;
        
        this.elements.sliderContainer.innerHTML = fallbackHTML;
        
        const fallbackSlider = document.getElementById('bpm-fallback-slider');
        if (fallbackSlider) {
            fallbackSlider.addEventListener('input', (e) => {
                const newBPM = parseInt(e.target.value, 10);
                this.setBPM(newBPM, true, false);
            });
        }
        
        this.slider = { isFallback: true, element: fallbackSlider };
    }

    setupEventListeners() {
        // BPM Input
        if (this.elements.bpmInput) {
            this.elements.bpmInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 40 && value <= 200) {
                    this.setBPM(value, false, true);
                }
            });
        }

        // Decrease/Increase buttons
        if (this.elements.decreaseBtn) {
            this.elements.decreaseBtn.addEventListener('click', () => {
                this.adjustBPM(-1);
            });
        }

        if (this.elements.increaseBtn) {
            this.elements.increaseBtn.addEventListener('click', () => {
                this.adjustBPM(1);
            });
        }

        // Play button
        if (this.elements.playButton) {
            this.elements.playButton.addEventListener('click', () => {
                this.toggleMetronome();
            });
        }
    }

    setBPM(bpm, updateInput = true, updateSlider = true) {
        this.currentBPM = Math.max(40, Math.min(200, bpm));
        
        if (updateInput && this.elements.bpmInput) {
            this.elements.bpmInput.value = this.currentBPM;
        }
        
        if (updateSlider) {
            // Update our knob visuals
            this.updateKnobVisuals();
        }

        if (this.isActive) {
            this.restartMetronome();
        }
    }

    adjustBPM(increment) {
        this.setBPM(this.currentBPM + increment, true, true);
    }

    async toggleMetronome() {
        try {
            const beats = parseInt(this.elements.timeSignature?.value || '4', 10);
            const result = await core.toggleMetronome(this.currentBPM, beats);
            
            if (result.error) {
                alert(`Ошибка метронома: ${result.error}`);
                return;
            }
            
            this.isActive = result.isActive;
            this.updatePlayButton();
            
        } catch (error) {
            console.error('Metronome toggle error:', error);
            alert('Не удалось переключить метроном');
        }
    }

    async restartMetronome() {
        if (this.isActive) {
            await core.toggleMetronome(0, 4);
            const beats = parseInt(this.elements.timeSignature?.value || '4', 10);
            const result = await core.toggleMetronome(this.currentBPM, beats);
            this.isActive = result.isActive;
        }
    }

    updatePlayButton() {
        if (!this.elements.playButton || !this.elements.playIcon) return;
        
        if (this.isActive) {
            this.elements.playButton.classList.add('active');
            this.elements.playIcon.className = 'fas fa-stop';
        } else {
            this.elements.playButton.classList.remove('active');
            this.elements.playIcon.className = 'fas fa-play';
        }
    }

    updateDisplay() {
        this.setBPM(this.currentBPM, true, true);
        this.updatePlayButton();
    }

    // Update only BPM display without restarting metronome (for live drag updates)
    updateBPMDisplay(bpm) {
        this.currentBPM = Math.max(40, Math.min(200, bpm));
        
        if (this.elements.bpmInput && document.activeElement !== this.elements.bpmInput) {
            this.elements.bpmInput.value = this.currentBPM;
        }
    }

    updateBPMFromSong(bpm) {
        if (bpm && !isNaN(bpm) && bpm > 0) {
            this.originalBPM = bpm;
            this.setBPM(bpm, true, true);
        } else {
            this.originalBPM = null;
            this.setBPM(120, true, true);
        }
    }

    getCurrentBPM() {
        return this.currentBPM;
    }

    stopMetronome() {
        if (this.isActive) {
            this.toggleMetronome();
        }
    }
}

// Create singleton
const metronome = new MetronomeController();

// Make metronome instance globally accessible for roundSlider callback
window.metronomeInstance = metronome;

// Export API
export function initMetronomeUI() {
    return metronome.init();
}

export function updateBPMFromSong(bpm) {
    metronome.updateBPMFromSong(bpm);
}

export function getCurrentBPM() {
    return metronome.getCurrentBPM();
}

export function stopMetronome() {
    metronome.stopMetronome();
}

export function updateBPM(newBPM) {
    metronome.updateBPMFromSong(newBPM);
}

export function updateMetronomeButtonState(isActive) {
    metronome.isActive = isActive;
    metronome.updatePlayButton();
}

export function resetBPMToOriginal() {
    if (metronome.originalBPM) {
        metronome.setBPM(metronome.originalBPM, true, true);
    }
}
