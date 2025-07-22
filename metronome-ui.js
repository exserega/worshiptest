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
            knobContainer: document.getElementById('snap-knob-container')
        };
        
        // Snap.svg elements
        this.snap = null;
        this.knobElements = {
            backgroundArc: null,
            progressArc: null,
            knobHandle: null,
            indicator: null
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
        this.initSnapKnob();
        this.setupEventListeners();
        this.updateDisplay();
        
        console.log('Metronome initialized successfully');
    }

    async waitForLibraries() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds maximum wait
            
            const checkLibraries = () => {
                attempts++;
                console.log(`Metronome: Checking Snap.svg... attempt ${attempts}/${maxAttempts}`);
                
                // Check if global flag is set
                if (window.librariesReady) {
                    console.log('Snap.svg ready via global flag');
                    resolve();
                    return;
                }
                
                // Direct check
                if (typeof Snap !== 'undefined') {
                    console.log('Snap.svg loaded successfully via direct check');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('Snap.svg failed to load within timeout, proceeding anyway');
                    resolve();
                } else {
                    setTimeout(checkLibraries, 100);
                }
            };
            
            // Start checking immediately
            checkLibraries();
        });
    }

    initSnapKnob() {
        if (!this.elements.knobContainer) {
            console.error('Snap knob container not found');
            return;
        }

        console.log('Initializing Snap.svg knob...');
        
        if (typeof Snap === 'undefined') {
            console.error('Snap.svg not available, creating fallback');
            this.createFallbackSlider();
            return;
        }
        
        try {
            // Create Snap.svg instance
            this.snap = Snap(160, 80);
            this.elements.knobContainer.appendChild(this.snap.node);
            
            // Create knob elements
            this.createKnobElements();
            this.setupSnapKnobEvents();
            this.updateSnapKnobVisuals();
            
            console.log('Snap.svg knob initialized successfully');
        } catch (error) {
            console.error('Failed to create Snap.svg knob:', error);
            this.createFallbackSlider();
        }
    }

    createKnobElements() {
        // Background arc (inactive track)
        this.knobElements.backgroundArc = this.snap.path("M 20,60 A 40,40 0 0,1 140,60")
            .attr({
                stroke: "#2a2a2a",
                strokeWidth: 8,
                strokeLinecap: "round",
                fill: "none"
            });

        // Progress arc (active part)
        this.knobElements.progressArc = this.snap.path("M 20,60 A 40,40 0 0,1 80,20")
            .attr({
                stroke: "var(--primary-color)",
                strokeWidth: 8,
                strokeLinecap: "round",
                fill: "none",
                filter: "drop-shadow(0 0 6px var(--glow-color))"
            });

        // Center knob handle
        this.knobElements.knobHandle = this.snap.circle(80, 60, 20)
            .attr({
                fill: "var(--container-background-color)",
                stroke: "var(--primary-color)",
                strokeWidth: 3,
                cursor: "grab",
                filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))"
            });

        // Indicator line
        this.knobElements.indicator = this.snap.line(80, 45, 80, 35)
            .attr({
                stroke: "var(--primary-color)",
                strokeWidth: 3,
                strokeLinecap: "round"
            });
    }

    setupSnapKnobEvents() {
        if (!this.knobElements.knobHandle) return;
        
        this.isDragging = false;
        this.startX = 0;
        this.startBPM = this.currentBPM;

        // Mouse events
        this.knobElements.knobHandle.mousedown(this.startSnapDrag.bind(this));
        
        // Touch events
        this.knobElements.knobHandle.touchstart(this.startSnapDrag.bind(this));
        
        // Global events
        Snap(document).mousemove(this.handleSnapDrag.bind(this));
        Snap(document).mouseup(this.endSnapDrag.bind(this));
        Snap(document).touchmove(this.handleSnapDrag.bind(this));
        Snap(document).touchend(this.endSnapDrag.bind(this));
    }

    startSnapDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startBPM = this.currentBPM;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        this.startX = clientX;
        
        this.knobElements.knobHandle.attr({ cursor: "grabbing" });
        document.body.style.cursor = 'grabbing';
        
        console.log('Started dragging Snap knob at BPM:', this.startBPM);
    }

    handleSnapDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const deltaX = clientX - this.startX;
        
        // Convert horizontal movement to BPM change
        const sensitivity = 1; // 1px = 1 BPM
        const bpmChange = deltaX * sensitivity;
        let newBPM = Math.round(this.startBPM + bpmChange);
        
        // Clamp to valid range
        newBPM = Math.max(40, Math.min(200, newBPM));
        
        // Update display in real-time
        this.updateBPMDisplay(newBPM);
        this.updateSnapKnobVisuals();
    }

    endSnapDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.knobElements.knobHandle.attr({ cursor: "grab" });
        document.body.style.cursor = '';
        
        // Final BPM update with metronome restart if needed
        this.setBPM(this.currentBPM, true, false);
        
        console.log('Finished dragging Snap knob at BPM:', this.currentBPM);
    }

    updateSnapKnobVisuals() {
        if (!this.knobElements.progressArc || !this.knobElements.indicator) return;
        
        // Calculate angle based on BPM (0-180 degrees for semicircle)
        const normalizedValue = (this.currentBPM - 40) / 160; // 0 to 1
        const angle = normalizedValue * 180; // 0 to 180 degrees
        
        // Update progress arc
        const centerX = 80;
        const centerY = 60;
        const radius = 40;
        
        const startAngle = 180; // Start from left
        const endAngle = startAngle - angle; // Sweep clockwise
        
        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 90 ? 1 : 0;
        const pathData = `M ${startX},${startY} A ${radius},${radius} 0 ${largeArc},0 ${endX},${endY}`;
        
        this.knobElements.progressArc.attr({ d: pathData });
        
        // Update indicator line rotation
        const indicatorAngle = -90 + angle; // Start from top (-90°) and rotate
        const indicatorX1 = centerX + 15 * Math.cos((indicatorAngle * Math.PI) / 180);
        const indicatorY1 = centerY + 15 * Math.sin((indicatorAngle * Math.PI) / 180);
        const indicatorX2 = centerX + 10 * Math.cos((indicatorAngle * Math.PI) / 180);
        const indicatorY2 = centerY + 10 * Math.sin((indicatorAngle * Math.PI) / 180);
        
        this.knobElements.indicator.attr({
            x1: indicatorX1,
            y1: indicatorY1,
            x2: indicatorX2,
            y2: indicatorY2
        });
    }

    setupKnobEvents() {
        const knob = this.elements.knobHandle;
        
        if (!knob) {
            console.error('Knob handle not found');
            return;
        }

        // Mouse events
        knob.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));

        // Touch events for mobile
        knob.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleDrag.bind(this), { passive: false });
        document.addEventListener('touchend', this.endDrag.bind(this));

        // Prevent context menu
        knob.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Set cursor
        knob.style.cursor = 'grab';
    }

    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startBPM = this.currentBPM;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        this.startX = clientX;
        
        document.body.style.cursor = 'grabbing';
        this.elements.knobHandle.style.cursor = 'grabbing';
        
        console.log('Started dragging knob at BPM:', this.startBPM);
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const deltaX = clientX - this.startX;
        
        // Convert horizontal movement to BPM change
        // 160 pixels = full range (200-40 = 160 BPM)
        const sensitivity = 1; // 1px = 1 BPM
        const bpmChange = deltaX * sensitivity;
        let newBPM = Math.round(this.startBPM + bpmChange);
        
        // Clamp to valid range
        newBPM = Math.max(40, Math.min(200, newBPM));
        
        // Update display in real-time
        this.updateBPMDisplay(newBPM);
        this.updateKnobVisuals();
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        document.body.style.cursor = '';
        this.elements.knobHandle.style.cursor = 'grab';
        
        // Final BPM update with metronome restart if needed
        this.setBPM(this.currentBPM, true, false);
        
        console.log('Finished dragging knob at BPM:', this.currentBPM);
    }

    updateKnobVisuals() {
        if (!this.elements.knobProgress || !this.elements.knobIndicator) return;
        
        // Calculate angle based on BPM (0-180 degrees for semicircle)
        const normalizedValue = (this.currentBPM - 40) / 160; // 0 to 1
        const angle = normalizedValue * 180; // 0 to 180 degrees
        
        // Update progress arc
        const startAngle = 180; // Start from left (180 degrees)
        const endAngle = startAngle - angle; // Sweep clockwise
        
        const centerX = 80;
        const centerY = 60;
        const radius = 40;
        
        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 90 ? 1 : 0;
        
        const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 0 ${endX} ${endY}`;
        this.elements.knobProgress.setAttribute('d', pathData);
        
        // Update indicator line rotation
        const indicatorAngle = -90 + angle; // Start from top (-90°) and rotate
        const indicatorX1 = centerX + 15 * Math.cos((indicatorAngle * Math.PI) / 180);
        const indicatorY1 = centerY + 15 * Math.sin((indicatorAngle * Math.PI) / 180);
        const indicatorX2 = centerX + 10 * Math.cos((indicatorAngle * Math.PI) / 180);
        const indicatorY2 = centerY + 10 * Math.sin((indicatorAngle * Math.PI) / 180);
        
        this.elements.knobIndicator.setAttribute('x1', indicatorX1);
        this.elements.knobIndicator.setAttribute('y1', indicatorY1);
        this.elements.knobIndicator.setAttribute('x2', indicatorX2);
        this.elements.knobIndicator.setAttribute('y2', indicatorY2);
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
            // Update our Snap.svg knob visuals
            this.updateSnapKnobVisuals();
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
