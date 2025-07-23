// =====================================================================
// New Metronome Module - Overlay Interface
// =====================================================================

import * as core from './core.js';

class MetronomeController {
    constructor() {
        this.currentBPM = 120;
        this.originalBPM = null;
        this.isActive = false;
        this.isDragging = false;
        this.currentSongBPM = null;
        
        // DOM elements
        this.elements = {
            // Overlay elements
            overlay: document.getElementById('metronome-overlay'),
            closeBtn: document.getElementById('close-metronome-overlay'),
            bpmInput: document.getElementById('metronome-bpm-input'),
            timeSignature: document.getElementById('metronome-time-signature'),
            decreaseBtn: document.getElementById('metronome-bpm-decrease'),
            increaseBtn: document.getElementById('metronome-bpm-increase'),
            playButton: document.getElementById('metronome-play-button'),
            playIcon: document.querySelector('#metronome-play-button i'),
            
            // Slider elements
            sliderTrack: document.querySelector('.bpm-slider-track'),
            sliderProgress: document.getElementById('bpm-slider-progress'),
            sliderHandle: document.getElementById('bpm-slider-handle'),
            
            // Navigation elements
            openBtn: document.getElementById('open-metronome-overlay'),
            navBpmDisplay: document.getElementById('nav-bpm-display'),
            navToggleBtn: document.getElementById('nav-metronome-toggle'),
            navToggleIcon: document.querySelector('#nav-metronome-toggle i')
        };
        
        this.init();
    }

    init() {
        console.log('Initializing new metronome...');
        this.setupEventListeners();
        this.updateDisplay();
        this.updateSliderVisuals();
        console.log('Metronome initialized successfully');
    }

    setupEventListeners() {
        // Overlay controls
        if (this.elements.openBtn) {
            this.elements.openBtn.addEventListener('click', () => this.openOverlay());
        }
        
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.closeOverlay());
        }
        
        // Close overlay on background click
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', (e) => {
                if (e.target === this.elements.overlay) {
                    this.closeOverlay();
                }
            });
        }
        
        // BPM Input
        if (this.elements.bpmInput) {
            this.elements.bpmInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 40 && value <= 200) {
                    this.setBPM(value, false, true);
                }
            });
            
            // Allow manual input by clicking on the field
            this.elements.bpmInput.addEventListener('focus', () => {
                this.elements.bpmInput.select();
            });
        }

        // Control buttons
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

        // Play buttons (both overlay and navigation)
        if (this.elements.playButton) {
            this.elements.playButton.addEventListener('click', () => {
                this.toggleMetronome();
            });
        }
        
        if (this.elements.navToggleBtn) {
            this.elements.navToggleBtn.addEventListener('click', () => {
                this.toggleMetronome();
            });
        }

        // Slider events
        this.setupSliderEvents();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.elements.overlay && this.elements.overlay.style.display === 'flex') {
                if (e.key === 'Escape') {
                    this.closeOverlay();
                } else if (e.key === ' ') {
                    e.preventDefault();
                    this.toggleMetronome();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.adjustBPM(1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.adjustBPM(-1);
                }
            }
        });
    }

    setupSliderEvents() {
        if (!this.elements.sliderTrack || !this.elements.sliderHandle) return;

        // Mouse events
        this.elements.sliderHandle.addEventListener('mousedown', this.startDrag.bind(this));
        this.elements.sliderTrack.addEventListener('mousedown', this.handleTrackClick.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));

        // Touch events
        this.elements.sliderHandle.addEventListener('touchstart', this.startDrag.bind(this));
        this.elements.sliderTrack.addEventListener('touchstart', this.handleTrackClick.bind(this));
        document.addEventListener('touchmove', this.handleDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
        
        // Prevent context menu
        this.elements.sliderHandle.addEventListener('contextmenu', (e) => e.preventDefault());
        this.elements.sliderTrack.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    startDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
        this.startBPM = this.currentBPM;
        
        const rect = this.elements.sliderTrack.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        this.startX = clientX - rect.left;
        
        // Visual feedback
        this.elements.sliderHandle.style.transform = 'scale(1.1)';
        document.body.style.cursor = 'grabbing';
        
        console.log('Started dragging slider at BPM:', this.startBPM);
    }

    handleTrackClick(e) {
        if (e.target === this.elements.sliderHandle) return;
        
        const rect = this.elements.sliderTrack.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clickX = clientX - rect.left;
        const trackWidth = rect.width;
        
        // Calculate BPM based on click position
        const percentage = Math.max(0, Math.min(1, clickX / trackWidth));
        const newBPM = Math.round(40 + (160 * percentage));
        
        this.setBPM(newBPM, true, true);
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const rect = this.elements.sliderTrack.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const currentX = clientX - rect.left;
        const trackWidth = rect.width;
        
        // Calculate percentage and new BPM
        const percentage = Math.max(0, Math.min(1, currentX / trackWidth));
        const newBPM = Math.round(40 + (160 * percentage));
        
        // Update display in real-time
        this.updateBPMDisplay(newBPM);
        this.updateSliderVisuals();
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Reset visual feedback
        this.elements.sliderHandle.style.transform = 'scale(1)';
        document.body.style.cursor = '';
        
        // Final BPM update
        this.setBPM(this.currentBPM, true, false);
        
        console.log('Finished dragging slider at BPM:', this.currentBPM);
    }

    openOverlay() {
        if (this.elements.overlay) {
            this.elements.overlay.style.display = 'flex';
            // Force reflow and add animation class
            this.elements.overlay.offsetHeight;
            this.elements.overlay.classList.add('active');
            
            // Focus on BPM input for keyboard control
            if (this.elements.bpmInput) {
                setTimeout(() => {
                    this.elements.bpmInput.focus();
                    this.elements.bpmInput.select();
                }, 100);
            }
        }
    }

    closeOverlay() {
        if (this.elements.overlay) {
            this.elements.overlay.classList.remove('active');
            setTimeout(() => {
                this.elements.overlay.style.display = 'none';
            }, 300);
        }
    }

    setBPM(bpm, updateInput = true, updateSlider = true) {
        this.currentBPM = Math.max(40, Math.min(200, bpm));
        
        if (updateInput && this.elements.bpmInput) {
            this.elements.bpmInput.value = this.currentBPM;
        }
        
        if (updateSlider) {
            this.updateSliderVisuals();
        }
        
        // Update navigation display
        this.updateNavigationDisplay();

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
            this.updatePlayButtons();
            
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

    updatePlayButtons() {
        // Update overlay play button
        if (this.elements.playButton && this.elements.playIcon) {
            if (this.isActive) {
                this.elements.playButton.classList.add('active');
                this.elements.playIcon.className = 'fas fa-stop';
            } else {
                this.elements.playButton.classList.remove('active');
                this.elements.playIcon.className = 'fas fa-play';
            }
        }
        
        // Update navigation play button
        if (this.elements.navToggleBtn && this.elements.navToggleIcon) {
            if (this.isActive) {
                this.elements.navToggleBtn.classList.add('active');
                this.elements.navToggleIcon.className = 'fas fa-stop';
            } else {
                this.elements.navToggleBtn.classList.remove('active');
                this.elements.navToggleIcon.className = 'fas fa-play';
            }
        }
    }

    updateSliderVisuals() {
        if (!this.elements.sliderProgress || !this.elements.sliderHandle) return;
        
        // Calculate percentage (0-1) based on BPM range 40-200
        const percentage = (this.currentBPM - 40) / 160;
        const percentageStr = `${percentage * 100}%`;
        
        // Update progress bar
        this.elements.sliderProgress.style.width = percentageStr;
        
        // Update handle position
        this.elements.sliderHandle.style.left = percentageStr;
    }

    updateNavigationDisplay() {
        if (this.elements.navBpmDisplay) {
            if (this.currentSongBPM !== null) {
                this.elements.navBpmDisplay.textContent = this.currentBPM.toString();
            } else {
                this.elements.navBpmDisplay.textContent = 'NA';
            }
        }
    }

    updateDisplay() {
        this.setBPM(this.currentBPM, true, true);
        this.updatePlayButtons();
        this.updateNavigationDisplay();
    }

    // Update only BPM display without restarting metronome (for live drag updates)
    updateBPMDisplay(bpm) {
        this.currentBPM = Math.max(40, Math.min(200, bpm));
        
        if (this.elements.bpmInput && document.activeElement !== this.elements.bpmInput) {
            this.elements.bpmInput.value = this.currentBPM;
        }
        
        this.updateNavigationDisplay();
    }

    updateBPMFromSong(bpm) {
        if (bpm && !isNaN(bpm) && bpm > 0) {
            this.originalBPM = bpm;
            this.currentSongBPM = bpm;
            this.setBPM(bpm, true, true);
        } else {
            this.originalBPM = null;
            this.currentSongBPM = null;
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

// Export API
export function initMetronomeUI() {
    return Promise.resolve();
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
    metronome.updatePlayButtons();
}

export function resetBPMToOriginal() {
    if (metronome.originalBPM) {
        metronome.setBPM(metronome.originalBPM, true, true);
    }
}