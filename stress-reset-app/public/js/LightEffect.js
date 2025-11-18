/**
 * Light Effect Animation System
 * Gentle gradient reset effect for stress relief
 */

class LightEffect {
    constructor(config) {
        this.config = config || {};
        this.overlay = null;
        this.messageBox = null;
        this.isPlaying = false;
        this.audio = null;

        this.defaultConfig = {
            duration_seconds: 10,
            color_sequence: [
                { r: 100, g: 150, b: 255 }, // Soft blue
                { r: 120, g: 220, b: 180 }, // Calming green
                { r: 255, g: 255, b: 255 }  // White
            ],
            transition_easing: 'ease-in-out',
            opacity_start: 0.8,
            opacity_end: 0.0,
            blur_amount: '20px',
            overlay_z_index: 9999,
            show_message: true,
            message_text: '잠시 휴식하세요 / Take a brief break',
            message_duration_seconds: 5,
            play_sound: true,
            sound_file: '/assets/sounds/gentle-chime.mp3',
            sound_volume: 0.3
        };

        this.config = { ...this.defaultConfig, ...this.config };
    }

    /**
     * Play the light effect animation
     */
    play(onComplete) {
        if (this.isPlaying) {
            console.warn('Light effect already playing');
            return;
        }

        this.isPlaying = true;
        this.createOverlay();
        this.createMessage();
        this.playSound();
        this.animate(onComplete);
    }

    /**
     * Create overlay element
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'stress-reset-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: ${this.config.overlay_z_index};
            pointer-events: none;
            opacity: 0;
            backdrop-filter: blur(${this.config.blur_amount});
            -webkit-backdrop-filter: blur(${this.config.blur_amount});
            transition: opacity 0.5s ${this.config.transition_easing};
        `;

        document.body.appendChild(this.overlay);
    }

    /**
     * Create message box
     */
    createMessage() {
        if (!this.config.show_message) return;

        this.messageBox = document.createElement('div');
        this.messageBox.id = 'stress-reset-message';
        this.messageBox.textContent = this.config.message_text;
        this.messageBox.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: ${this.config.overlay_z_index + 1};
            padding: 30px 50px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            font-size: 24px;
            font-weight: 500;
            color: #333;
            text-align: center;
            opacity: 0;
            transition: opacity 0.5s ${this.config.transition_easing};
            pointer-events: none;
        `;

        document.body.appendChild(this.messageBox);

        // Fade in message
        setTimeout(() => {
            if (this.messageBox) {
                this.messageBox.style.opacity = '1';
            }
        }, 500);

        // Fade out message after duration
        setTimeout(() => {
            if (this.messageBox) {
                this.messageBox.style.opacity = '0';
            }
        }, this.config.message_duration_seconds * 1000);
    }

    /**
     * Play soothing sound
     */
    playSound() {
        if (!this.config.play_sound) return;

        try {
            this.audio = new Audio(this.config.sound_file);
            this.audio.volume = this.config.sound_volume;
            this.audio.play().catch(err => {
                console.warn('Could not play sound:', err);
            });
        } catch (err) {
            console.warn('Audio not supported:', err);
        }
    }

    /**
     * Animate color transitions
     */
    animate(onComplete) {
        const totalDuration = this.config.duration_seconds * 1000;
        const colorCount = this.config.color_sequence.length;
        const segmentDuration = totalDuration / colorCount;

        let currentSegment = 0;
        const startTime = Date.now();

        // Fade in overlay
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.style.opacity = this.config.opacity_start;
            }
        }, 100);

        const animateSegment = () => {
            if (currentSegment >= colorCount) {
                this.fadeOut(() => {
                    this.cleanup();
                    if (onComplete) onComplete();
                });
                return;
            }

            const color = this.config.color_sequence[currentSegment];
            const nextColor = this.config.color_sequence[currentSegment + 1];

            if (nextColor) {
                this.transitionColor(color, nextColor, segmentDuration, () => {
                    currentSegment++;
                    animateSegment();
                });
            } else {
                // Last color - hold briefly then fade out
                this.setOverlayColor(color);
                setTimeout(() => {
                    this.fadeOut(() => {
                        this.cleanup();
                        if (onComplete) onComplete();
                    });
                }, segmentDuration);
            }
        };

        animateSegment();
    }

    /**
     * Transition between two colors
     */
    transitionColor(fromColor, toColor, duration, onComplete) {
        const startTime = Date.now();
        const fps = 60;
        const frameTime = 1000 / fps;

        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-in-out function
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * eased);
            const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * eased);
            const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * eased);

            this.setOverlayColor({ r, g, b });

            if (progress < 1) {
                setTimeout(step, frameTime);
            } else {
                if (onComplete) onComplete();
            }
        };

        step();
    }

    /**
     * Set overlay background color
     */
    setOverlayColor(color) {
        if (this.overlay) {
            this.overlay.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
        }
    }

    /**
     * Fade out effect
     */
    fadeOut(onComplete) {
        if (this.overlay) {
            this.overlay.style.opacity = this.config.opacity_end;
        }

        if (this.messageBox) {
            this.messageBox.style.opacity = '0';
        }

        setTimeout(() => {
            if (onComplete) onComplete();
        }, 500);
    }

    /**
     * Clean up DOM elements
     */
    cleanup() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        if (this.messageBox) {
            this.messageBox.remove();
            this.messageBox = null;
        }

        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }

        this.isPlaying = false;
    }

    /**
     * Stop effect immediately
     */
    stop() {
        this.cleanup();
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LightEffect;
}
