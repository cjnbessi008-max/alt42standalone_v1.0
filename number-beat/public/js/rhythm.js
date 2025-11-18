/**
 * Rhythm Engine
 * Handles beat patterns, timing, and rhythm accuracy calculation
 */

class RhythmEngine {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.pattern = [];
        this.currentBeat = 0;
        this.isPlaying = false;
        this.startTime = null;
        this.beatTimes = [];
        this.userTaps = [];
        this.intervalId = null;
        this.animationId = null;
    }

    /**
     * Set rhythm pattern
     * @param {string} patternStr - Comma-separated beat types (e.g., "quarter,half,quarter")
     */
    setPattern(patternStr) {
        this.pattern = patternStr.split(',').map(s => s.trim());
        this.currentBeat = 0;
        this.beatTimes = [];
        this.userTaps = [];

        // Calculate expected beat times
        let currentTime = 0;
        this.pattern.forEach(beatType => {
            this.beatTimes.push(currentTime);
            currentTime += CONFIG.RHYTHM.BEAT_DURATION[beatType] || CONFIG.RHYTHM.BEAT_DURATION.quarter;
        });

        this.renderPattern();
    }

    /**
     * Render rhythm pattern visually
     */
    renderPattern() {
        const container = document.getElementById('rhythmPattern');
        container.innerHTML = '';

        this.pattern.forEach((beatType, index) => {
            const beatDiv = document.createElement('div');
            beatDiv.className = `beat ${beatType}`;
            beatDiv.dataset.index = index;
            container.appendChild(beatDiv);
        });
    }

    /**
     * Start playing rhythm pattern
     */
    start() {
        this.isPlaying = true;
        this.currentBeat = 0;
        this.startTime = Date.now();
        this.playNextBeat();
    }

    /**
     * Play next beat in pattern
     */
    playNextBeat() {
        if (!this.isPlaying || this.currentBeat >= this.pattern.length) {
            this.stop();
            return;
        }

        // Highlight current beat
        this.highlightBeat(this.currentBeat);

        // Play sound
        this.audioManager.playBeat();

        // Get duration of current beat
        const beatType = this.pattern[this.currentBeat];
        const duration = CONFIG.RHYTHM.BEAT_DURATION[beatType] || CONFIG.RHYTHM.BEAT_DURATION.quarter;

        // Mark as completed after a short delay
        setTimeout(() => {
            this.markBeatCompleted(this.currentBeat);
        }, duration * 0.8);

        // Move to next beat
        this.currentBeat++;

        // Schedule next beat
        this.intervalId = setTimeout(() => {
            this.playNextBeat();
        }, duration);
    }

    /**
     * Highlight current beat
     */
    highlightBeat(index) {
        const beats = document.querySelectorAll('.beat');
        beats.forEach((beat, i) => {
            beat.classList.remove('active');
            if (i === index) {
                beat.classList.add('active');
            }
        });
    }

    /**
     * Mark beat as completed
     */
    markBeatCompleted(index) {
        const beats = document.querySelectorAll('.beat');
        if (beats[index]) {
            beats[index].classList.remove('active');
            beats[index].classList.add('completed');
        }
    }

    /**
     * Stop rhythm playback
     */
    stop() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Remove active state from all beats
        const beats = document.querySelectorAll('.beat');
        beats.forEach(beat => {
            beat.classList.remove('active');
        });
    }

    /**
     * Record user tap time
     */
    recordTap() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }

        const tapTime = Date.now() - this.startTime;
        this.userTaps.push(tapTime);
    }

    /**
     * Calculate rhythm accuracy
     * Returns percentage (0-100)
     */
    calculateAccuracy() {
        if (this.userTaps.length === 0 || this.beatTimes.length === 0) {
            return 0;
        }

        let totalDeviation = 0;
        let matchedTaps = 0;

        // Match each user tap to nearest expected beat time
        this.userTaps.forEach(tapTime => {
            let minDeviation = Infinity;

            this.beatTimes.forEach(beatTime => {
                const deviation = Math.abs(tapTime - beatTime);
                if (deviation < minDeviation) {
                    minDeviation = deviation;
                }
            });

            // Only count if within tolerance
            if (minDeviation <= CONFIG.RHYTHM.TOLERANCE) {
                totalDeviation += minDeviation;
                matchedTaps++;
            }
        });

        if (matchedTaps === 0) {
            return 0;
        }

        // Calculate accuracy score
        const avgDeviation = totalDeviation / matchedTaps;
        const accuracy = Math.max(0, 100 - (avgDeviation / CONFIG.RHYTHM.TOLERANCE * 100));

        return Math.round(accuracy * 100) / 100;
    }

    /**
     * Reset rhythm engine
     */
    reset() {
        this.stop();
        this.currentBeat = 0;
        this.startTime = null;
        this.userTaps = [];
        this.pattern = [];

        const container = document.getElementById('rhythmPattern');
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * Get total pattern duration
     */
    getTotalDuration() {
        return this.beatTimes[this.beatTimes.length - 1] || 0;
    }

    /**
     * Animate progress bar
     */
    animateProgress(duration) {
        const progressBar = document.getElementById('rhythmProgressBar');
        const startTime = Date.now();

        const animate = () => {
            if (!this.isPlaying) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);

            if (progressBar) {
                progressBar.style.width = progress + '%';
            }

            if (progress < 100) {
                this.animationId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Play pattern once for demonstration
     */
    playDemo() {
        this.start();
        const totalDuration = this.getTotalDuration() + 500;
        this.animateProgress(totalDuration);
    }
}
