/**
 * Audio Manager
 * Handles all game sounds
 */

class AudioManager {
    constructor() {
        this.sounds = {
            beat: document.getElementById('beatSound'),
            success: document.getElementById('successSound'),
            fail: document.getElementById('failSound'),
            tap: document.getElementById('tapSound')
        };

        this.enabled = CONFIG.AUDIO.ENABLED;
        this.volume = CONFIG.AUDIO.VOLUME;

        // Set initial volume
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.volume;
            }
        });
    }

    /**
     * Play a sound
     */
    play(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {
                console.warn('Audio playback failed:', e);
            });
        }
    }

    /**
     * Play beat sound (for rhythm)
     */
    playBeat() {
        this.play('beat');
    }

    /**
     * Play tap sound (when number is selected)
     */
    playTap() {
        this.play('tap');
    }

    /**
     * Play success sound
     */
    playSuccess() {
        this.play('success');
    }

    /**
     * Play fail sound
     */
    playFail() {
        this.play('fail');
    }

    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.volume;
            }
        });
    }

    /**
     * Create simple beat sound using Web Audio API
     * (fallback if audio files are not available)
     */
    createBeep(frequency = 440, duration = 100) {
        if (!this.enabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.warn('Web Audio API failed:', e);
        }
    }
}
