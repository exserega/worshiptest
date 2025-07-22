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
            sliderContainer: document.getElementById('bpm-round-slider')
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
        this.initRoundSlider();
        this.setupEventListeners();
        this.updateDisplay();
        
        console.log('Metronome initialized successfully');
    }

    async waitForLibraries() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds maximum wait
            
            const checkLibraries = () => {
                attempts++;
                console.log(`Metronome: Checking libraries... attempt ${attempts}/${maxAttempts}`);
                
                // Check if global flag is set
                if (window.librariesReady) {
                    console.log('Libraries ready via global flag');
                    resolve();
                    return;
                }
                
                // Direct check
                if (typeof $ !== 'undefined' && $.fn && $.fn.roundSlider) {
                    console.log('Libraries loaded successfully via direct check');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('Libraries failed to load within timeout, proceeding with fallback');
                    resolve();
                } else {
                    setTimeout(checkLibraries, 100);
                }
            };
            
            // Start checking immediately
            checkLibraries();
        });
    }

    initRoundSlider() {
        if (!this.elements.sliderContainer) {
            console.error('Slider container not found');
            return;
        }

        console.log('Initializing roundSlider...');
        console.log('jQuery available:', typeof $ !== 'undefined');
        console.log('roundSlider available:', typeof $.fn.roundSlider !== 'undefined');
        
        // Double check jQuery and roundSlider are available
        if (typeof $ === 'undefined') {
            console.error('jQuery not available');
            this.createFallbackSlider();
            return;
        }
        
        if (typeof $.fn.roundSlider === 'undefined') {
            console.error('roundSlider plugin not available');
            this.createFallbackSlider();
            return;
        }
        
        try {
            // Clear any existing content
            $(this.elements.sliderContainer).empty();
            
            // Initialize roundSlider with correct v1.6.1 syntax
            this.slider = $(this.elements.sliderContainer).roundSlider({
                radius: 70,
                width: 10,
                handleSize: 20,
                circleShape: "half-top",
                sliderType: "min-range",
                showTooltip: false,
                editableTooltip: false,
                min: 40,
                max: 200,
                step: 1,
                value: this.currentBPM,
                animation: true,
                
                change: function(e) {
                    console.log('Slider changed to:', e.value);
                    const newBPM = Math.round(e.value);
                    // Use a timeout to prevent circular updates
                    setTimeout(() => {
                        if (window.metronomeInstance) {
                            window.metronomeInstance.setBPM(newBPM, true, false);
                        }
                    }, 0);
                }
            });
            
            console.log('RoundSlider created successfully');
            console.log('Slider instance:', this.slider);
            
            // Test if roundSlider is working
            setTimeout(() => {
                try {
                    const currentValue = this.slider.roundSlider("option", "value");
                    console.log('RoundSlider current value:', currentValue);
                } catch (e) {
                    console.error('RoundSlider test failed:', e);
                }
            }, 100);
            
        } catch (error) {
            console.error('Failed to create roundSlider:', error);
            this.createFallbackSlider();
        }
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
        
        if (updateSlider && this.slider) {
            try {
                if (this.slider.isFallback) {
                    // Update fallback HTML5 slider
                    if (this.slider.element) {
                        this.slider.element.value = this.currentBPM;
                    }
                } else {
                    // Update roundSlider using correct v1.6.1 syntax
                    this.slider.roundSlider("option", "value", this.currentBPM);
                }
            } catch (error) {
                console.error('Error updating slider:', error);
            }
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
