/**
 * Slope Sound - Audio Engine
 * Converts slope values to sound using Web Audio API
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;

        // Sound mapping parameters
        this.baseFrequency = 440; // A4 note
        this.minFrequency = 220;  // A3
        this.maxFrequency = 880;  // A5
        this.duration = 200; // milliseconds

        // Slope to frequency mapping range
        this.slopeRange = { min: -10, max: 10 };
    }

    /**
     * Initialize Audio Context (requires user interaction)
     */
    initialize() {
        if (this.isInitialized) return;

        try {
            // Create AudioContext (cross-browser)
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.isInitialized = true;
            console.log('Audio Engine initialized');
        } catch (error) {
            console.error('Web Audio API not supported:', error);
        }
    }

    /**
     * Map slope value to frequency
     * Positive slope = higher frequency
     * Negative slope = lower frequency
     * @param {number} slope - Derivative value
     * @returns {number} - Frequency in Hz
     */
    slopeToFrequency(slope) {
        // Clamp slope to expected range
        const clampedSlope = Math.max(
            this.slopeRange.min,
            Math.min(this.slopeRange.max, slope)
        );

        // Normalize to 0-1 range
        const normalized = (clampedSlope - this.slopeRange.min) /
                          (this.slopeRange.max - this.slopeRange.min);

        // Map to frequency range (logarithmic scale for better perception)
        const minLog = Math.log(this.minFrequency);
        const maxLog = Math.log(this.maxFrequency);
        const frequency = Math.exp(minLog + normalized * (maxLog - minLog));

        return Math.round(frequency);
    }

    /**
     * Play tone for given slope
     * @param {number} slope - Derivative value
     * @param {number} duration - Duration in milliseconds
     */
    playSlope(slope, duration = this.duration) {
        if (!this.isInitialized) {
            this.initialize();
        }

        if (!this.audioContext) {
            console.error('Audio context not available');
            return null;
        }

        const frequency = this.slopeToFrequency(slope);
        this.playTone(frequency, duration);

        return frequency;
    }

    /**
     * Play a tone at specified frequency
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in milliseconds
     */
    playTone(frequency, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Configure oscillator
        oscillator.type = 'sine'; // Smooth sine wave
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Configure envelope (ADSR)
        const now = this.audioContext.currentTime;
        const attackTime = 0.01;  // 10ms attack
        const releaseTime = 0.05; // 50ms release
        const sustainTime = duration / 1000 - attackTime - releaseTime;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + attackTime);
        gainNode.gain.setValueAtTime(0.3, now + attackTime + sustainTime);
        gainNode.gain.linearRampToValueAtTime(0, now + attackTime + sustainTime + releaseTime);

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Play
        oscillator.start(now);
        oscillator.stop(now + duration / 1000);
    }

    /**
     * Play a sequence of slopes (for animation)
     * @param {Array} slopes - Array of slope values
     * @param {number} interval - Time between notes (ms)
     */
    playSequence(slopes, interval = 250) {
        slopes.forEach((slope, index) => {
            setTimeout(() => {
                this.playSlope(slope);
            }, index * interval);
        });
    }

    /**
     * Get audio description for slope
     * @param {number} slope - Derivative value
     * @returns {string} - Human-readable description
     */
    getSlopeDescription(slope) {
        if (slope > 5) return '매우 가파른 증가 ↗↗↗';
        if (slope > 2) return '가파른 증가 ↗↗';
        if (slope > 0.5) return '완만한 증가 ↗';
        if (slope > -0.5) return '평평함 →';
        if (slope > -2) return '완만한 감소 ↘';
        if (slope > -5) return '가파른 감소 ↘↘';
        return '매우 가파른 감소 ↘↘↘';
    }

    /**
     * Suspend audio context (for battery saving)
     */
    suspend() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    /**
     * Resume audio context
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Export for use in other modules
window.AudioEngine = AudioEngine;
