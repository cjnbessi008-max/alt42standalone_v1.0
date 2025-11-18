/**
 * Cross Wave Animation System
 * Creates expanding circular ripple effects
 */

class CrossWave {
    constructor(options = {}) {
        this.options = {
            color: options.color || '#4CAF50',
            duration: options.duration || 2000,
            maxRadius: options.maxRadius || 500,
            intensity: options.intensity || 100,
            particleCount: options.particleCount || 24,
            showMessage: options.showMessage !== false,
            message: options.message || '정답입니다! 🎉',
            ...options
        };

        this.container = null;
        this.activeWaves = [];
        this.init();
    }

    init() {
        // Create wave container if it doesn't exist
        this.container = document.querySelector('.wave-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'wave-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Trigger wave effect at specific position
     */
    trigger(x, y, customOptions = {}) {
        const options = { ...this.options, ...customOptions };

        // Create wave element
        const wave = this.createWave(x, y, options);
        this.container.appendChild(wave);
        this.activeWaves.push(wave);

        // Show success message if enabled
        if (options.showMessage) {
            this.showSuccessMessage(options.message);
        }

        // Remove wave after animation completes
        setTimeout(() => {
            this.removeWave(wave);
        }, options.duration + 500);

        return wave;
    }

    /**
     * Create wave element with all effects
     */
    createWave(x, y, options) {
        const wave = document.createElement('div');
        wave.className = 'cross-wave';
        wave.style.left = `${x}px`;
        wave.style.top = `${y}px`;
        wave.style.setProperty('--wave-color', options.color);
        wave.style.setProperty('--wave-duration', `${options.duration}ms`);
        wave.style.setProperty('--wave-max-radius', `${options.maxRadius}px`);
        wave.style.setProperty('--wave-scale', Math.floor(options.maxRadius / 12.5));

        // Add multiple wave rings
        this.addWaveRings(wave, options);

        // Add filled wave
        this.addWaveFill(wave, options);

        // Add center pulse
        this.addWavePulse(wave, options);

        // Add particle burst
        if (options.intensity >= 70) {
            this.addParticleBurst(wave, options);
        }

        // Add cross lines
        if (options.intensity >= 50) {
            this.addCrossLines(wave, options);
        }

        // Add shimmer effect
        if (options.intensity >= 80) {
            this.addShimmer(wave, options);
        }

        return wave;
    }

    /**
     * Add concentric wave rings
     */
    addWaveRings(wave, options) {
        const rings = ['wave-ring', 'wave-ring-secondary', 'wave-ring-tertiary'];

        rings.forEach((className, index) => {
            const ring = document.createElement('div');
            ring.className = className;
            ring.style.borderColor = options.color;
            ring.style.width = '20px';
            ring.style.height = '20px';
            ring.style.left = '0';
            ring.style.top = '0';
            wave.appendChild(ring);
        });
    }

    /**
     * Add filled expanding circle
     */
    addWaveFill(wave, options) {
        const fill = document.createElement('div');
        fill.className = 'wave-fill';
        fill.style.width = '20px';
        fill.style.height = '20px';
        fill.style.left = '0';
        fill.style.top = '0';
        wave.appendChild(fill);
    }

    /**
     * Add center pulse effect
     */
    addWavePulse(wave, options) {
        const pulse = document.createElement('div');
        pulse.className = 'wave-pulse';
        pulse.style.width = '30px';
        pulse.style.height = '30px';
        pulse.style.left = '0';
        pulse.style.top = '0';
        wave.appendChild(pulse);
    }

    /**
     * Add particle burst effect
     */
    addParticleBurst(wave, options) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'wave-particles';

        const angleStep = (Math.PI * 2) / options.particleCount;
        const particleDistance = options.maxRadius * 0.6;

        for (let i = 0; i < options.particleCount; i++) {
            const angle = angleStep * i;
            const particle = document.createElement('div');
            particle.className = 'wave-particle';

            const x = Math.cos(angle) * particleDistance;
            const y = Math.sin(angle) * particleDistance;

            particle.style.setProperty('--particle-x', `${x}px`);
            particle.style.setProperty('--particle-y', `${y}px`);
            particle.style.animation = `particleBurst ${options.duration}ms ease-out ${i * 20}ms forwards`;

            particlesContainer.appendChild(particle);
        }

        wave.appendChild(particlesContainer);
    }

    /**
     * Add cross pattern lines
     */
    addCrossLines(wave, options) {
        const horizontal = document.createElement('div');
        horizontal.className = 'wave-cross-line horizontal';
        wave.appendChild(horizontal);

        const vertical = document.createElement('div');
        vertical.className = 'wave-cross-line vertical';
        wave.appendChild(vertical);
    }

    /**
     * Add shimmer overlay
     */
    addShimmer(wave, options) {
        const shimmer = document.createElement('div');
        shimmer.className = 'wave-shimmer';
        shimmer.style.width = '40px';
        shimmer.style.height = '40px';
        shimmer.style.left = '0';
        shimmer.style.top = '0';
        wave.appendChild(shimmer);
    }

    /**
     * Show success message overlay
     */
    showSuccessMessage(message) {
        const existingMessage = document.querySelector('.wave-success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'wave-success-message';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.remove();
        }, 2000);
    }

    /**
     * Remove wave from DOM
     */
    removeWave(wave) {
        const index = this.activeWaves.indexOf(wave);
        if (index > -1) {
            this.activeWaves.splice(index, 1);
        }
        if (wave && wave.parentNode) {
            wave.parentNode.removeChild(wave);
        }
    }

    /**
     * Clear all active waves
     */
    clearAll() {
        this.activeWaves.forEach(wave => {
            if (wave && wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        });
        this.activeWaves = [];
    }

    /**
     * Trigger wave at element center
     */
    triggerAtElement(element, customOptions = {}) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return this.trigger(x, y, customOptions);
    }

    /**
     * Create preset effects
     */
    static presets = {
        success: {
            color: '#4CAF50',
            duration: 2000,
            maxRadius: 500,
            intensity: 100,
            message: '정답입니다! 🎉'
        },
        excellent: {
            color: '#FFD700',
            duration: 2500,
            maxRadius: 600,
            intensity: 100,
            particleCount: 32,
            message: '완벽합니다! ⭐'
        },
        correct: {
            color: '#2196F3',
            duration: 1800,
            maxRadius: 400,
            intensity: 80,
            message: '맞았습니다! ✓'
        },
        achievement: {
            color: '#9C27B0',
            duration: 2200,
            maxRadius: 550,
            intensity: 90,
            message: '업적 달성! 🏆'
        }
    };

    /**
     * Quick trigger with preset
     */
    triggerPreset(x, y, presetName) {
        const preset = CrossWave.presets[presetName] || CrossWave.presets.success;
        return this.trigger(x, y, preset);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossWave;
}
