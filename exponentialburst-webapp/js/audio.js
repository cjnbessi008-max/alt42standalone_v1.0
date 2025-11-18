/**
 * Audio Module
 * Handles sound effects using Web Audio API
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.masterVolume = 0.3;

        // Initialize audio context on first user interaction
        this.initialized = false;
    }

    /**
     * Initialize audio context (requires user gesture)
     */
    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.initialized = true;
            console.log('Audio initialized');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    /**
     * Create oscillator for sound effects
     */
    createOscillator(frequency, type = 'sine', duration = 0.1) {
        if (!this.context || !this.enabled) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);

        return oscillator;
    }

    /**
     * Play correct answer sound
     */
    playCorrect(base, exponent) {
        if (!this.context || !this.enabled) return;

        const value = Math.pow(base, exponent);
        const frequency = 440 + (value * 10); // Higher pitch for larger values

        // Main tone
        this.createOscillator(frequency, 'sine', 0.2);

        // Harmony
        setTimeout(() => {
            this.createOscillator(frequency * 1.25, 'sine', 0.15);
        }, 50);

        // Celebration
        setTimeout(() => {
            this.createOscillator(frequency * 1.5, 'triangle', 0.1);
        }, 100);
    }

    /**
     * Play incorrect answer sound
     */
    playIncorrect() {
        if (!this.context || !this.enabled) return;

        // Descending tones
        this.createOscillator(300, 'square', 0.1);
        setTimeout(() => {
            this.createOscillator(200, 'square', 0.15);
        }, 100);
    }

    /**
     * Play burst sound (exponential stages)
     */
    playBurst(stage) {
        if (!this.context || !this.enabled) return;

        const baseFreq = 200;
        const frequency = baseFreq * Math.pow(1.2, stage);

        this.createOscillator(frequency, 'sine', 0.08);

        // Add sparkle effect
        setTimeout(() => {
            this.createOscillator(frequency * 2, 'triangle', 0.05);
        }, 30);
    }

    /**
     * Play level up sound
     */
    playLevelUp() {
        if (!this.context || !this.enabled) return;

        const notes = [262, 330, 392, 523]; // C, E, G, C (octave)

        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.createOscillator(freq, 'sine', 0.15);
            }, index * 100);
        });
    }

    /**
     * Play combo sound
     */
    playCombo(comboLevel) {
        if (!this.context || !this.enabled) return;

        const frequency = 440 * Math.pow(1.1, comboLevel);
        this.createOscillator(frequency, 'triangle', 0.12);

        // Echo effect
        setTimeout(() => {
            this.createOscillator(frequency * 0.5, 'sine', 0.08);
        }, 50);
    }

    /**
     * Play button click sound
     */
    playClick() {
        if (!this.context || !this.enabled) return;

        this.createOscillator(800, 'square', 0.05);
    }

    /**
     * Play timer tick sound
     */
    playTick() {
        if (!this.context || !this.enabled) return;

        this.createOscillator(440, 'sine', 0.03);
    }

    /**
     * Play timer warning sound (low time)
     */
    playTimerWarning() {
        if (!this.context || !this.enabled) return;

        this.createOscillator(880, 'square', 0.08);
    }

    /**
     * Enable/disable sound
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Resume audio context (for browsers that suspend it)
     */
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}

// Create and export singleton instance
const audio = new AudioManager();
export default audio;
