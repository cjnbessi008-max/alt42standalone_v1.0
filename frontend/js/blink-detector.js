/**
 * Blink Detector
 *
 * Detects eye blinks using facial landmarks or eye aspect ratio
 */

class BlinkDetector {
    constructor(options = {}) {
        this.threshold = options.threshold || 0.21; // Eye Aspect Ratio threshold
        this.consecutiveFrames = options.consecutiveFrames || 2; // Frames to confirm blink
        this.cooldownFrames = options.cooldownFrames || 5; // Cooldown between blinks

        this.blinkCount = 0;
        this.blinkHistory = [];
        this.frameCounter = 0;
        this.blinkStartTime = null;
        this.lastBlinkTime = 0;
        this.isBlinking = false;
        this.cooldownCounter = 0;

        this.callbacks = {
            onBlinkStart: options.onBlinkStart || (() => {}),
            onBlinkEnd: options.onBlinkEnd || (() => {}),
            onBlink: options.onBlink || (() => {})
        };

        this.lastEAR = 1.0; // Last Eye Aspect Ratio
    }

    /**
     * Calculate Eye Aspect Ratio (EAR)
     * Formula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
     */
    calculateEAR(eyeLandmarks) {
        if (!eyeLandmarks || eyeLandmarks.length < 6) {
            return 1.0; // Default open eye
        }

        // eyeLandmarks should be array of [x, y] coordinates
        // [0]=outer corner, [1]=top-outer, [2]=top-inner, [3]=inner corner, [4]=bottom-inner, [5]=bottom-outer

        const distance = (p1, p2) => {
            return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
        };

        // Vertical distances
        const v1 = distance(eyeLandmarks[1], eyeLandmarks[5]);
        const v2 = distance(eyeLandmarks[2], eyeLandmarks[4]);

        // Horizontal distance
        const h = distance(eyeLandmarks[0], eyeLandmarks[3]);

        if (h === 0) return 1.0;

        const ear = (v1 + v2) / (2.0 * h);
        return ear;
    }

    /**
     * Process frame and detect blink
     * @param {Object} faceLandmarks - Face landmarks from detection model
     * @returns {Object} Blink detection result
     */
    processFrame(faceLandmarks) {
        this.frameCounter++;

        // Handle cooldown
        if (this.cooldownCounter > 0) {
            this.cooldownCounter--;
        }

        if (!faceLandmarks || !faceLandmarks.leftEye || !faceLandmarks.rightEye) {
            return {
                blinkDetected: false,
                ear: null,
                isBlinking: this.isBlinking
            };
        }

        // Calculate EAR for both eyes
        const leftEAR = this.calculateEAR(faceLandmarks.leftEye);
        const rightEAR = this.calculateEAR(faceLandmarks.rightEye);

        // Average EAR
        const ear = (leftEAR + rightEAR) / 2.0;
        this.lastEAR = ear;

        // Detect blink
        const result = {
            blinkDetected: false,
            blinkDuration: null,
            ear: ear,
            isBlinking: this.isBlinking
        };

        // Check if eyes are closed (below threshold)
        if (ear < this.threshold && this.cooldownCounter === 0) {
            if (!this.isBlinking) {
                // Blink started
                this.isBlinking = true;
                this.blinkStartTime = Date.now();
                this.callbacks.onBlinkStart({
                    timestamp: this.blinkStartTime,
                    ear: ear
                });
            }
        } else if (ear >= this.threshold && this.isBlinking) {
            // Blink ended
            this.isBlinking = false;
            const blinkDuration = Date.now() - this.blinkStartTime;

            // Validate blink duration (typical blink: 100-400ms)
            if (blinkDuration >= 50 && blinkDuration <= 500) {
                this.blinkCount++;
                this.lastBlinkTime = Date.now();
                this.cooldownCounter = this.cooldownFrames;

                // Add to history
                this.blinkHistory.push({
                    timestamp: this.lastBlinkTime,
                    duration: blinkDuration,
                    ear: ear
                });

                // Keep only recent history (last 100 blinks)
                if (this.blinkHistory.length > 100) {
                    this.blinkHistory.shift();
                }

                result.blinkDetected = true;
                result.blinkDuration = blinkDuration;

                this.callbacks.onBlinkEnd({
                    timestamp: this.lastBlinkTime,
                    duration: blinkDuration,
                    ear: ear
                });

                this.callbacks.onBlink({
                    count: this.blinkCount,
                    duration: blinkDuration,
                    timestamp: this.lastBlinkTime
                });
            }

            this.blinkStartTime = null;
        }

        result.isBlinking = this.isBlinking;

        return result;
    }

    /**
     * Get blink rate (blinks per minute)
     */
    getBlinkRate(timeWindowMs = 60000) {
        const now = Date.now();
        const recentBlinks = this.blinkHistory.filter(
            b => now - b.timestamp <= timeWindowMs
        );

        if (recentBlinks.length === 0) return 0;

        const actualWindow = now - recentBlinks[0].timestamp;
        const rate = (recentBlinks.length / actualWindow) * 60000;

        return Math.round(rate * 10) / 10; // Round to 1 decimal
    }

    /**
     * Get average blink duration
     */
    getAverageBlinkDuration(count = 10) {
        if (this.blinkHistory.length === 0) return null;

        const recent = this.blinkHistory.slice(-count);
        const total = recent.reduce((sum, b) => sum + b.duration, 0);

        return Math.round(total / recent.length);
    }

    /**
     * Get blink irregularity (standard deviation of intervals)
     */
    getBlinkIrregularity(count = 20) {
        if (this.blinkHistory.length < 2) return null;

        const recent = this.blinkHistory.slice(-count);
        const intervals = [];

        for (let i = 1; i < recent.length; i++) {
            intervals.push(recent[i].timestamp - recent[i-1].timestamp);
        }

        if (intervals.length === 0) return null;

        const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        return Math.round(stdDev);
    }

    /**
     * Detect fatigue based on blink patterns
     */
    detectFatigue() {
        const blinkRate = this.getBlinkRate();
        const avgDuration = this.getAverageBlinkDuration();

        // Signs of fatigue:
        // - Increased blink rate (>30 bpm)
        // - Longer blink duration (>300ms)
        // - High irregularity

        const fatigueSigns = {
            excessiveBlinking: blinkRate > 30,
            longBlinks: avgDuration && avgDuration > 300,
            overallFatigue: false
        };

        fatigueSigns.overallFatigue = fatigueSigns.excessiveBlinking || fatigueSigns.longBlinks;

        return fatigueSigns;
    }

    /**
     * Detect eye strain
     */
    detectEyeStrain() {
        const blinkRate = this.getBlinkRate();
        const avgDuration = this.getAverageBlinkDuration();

        // Signs of eye strain:
        // - Reduced blink rate (<10 bpm)
        // - Rapid, short blinks (<100ms)

        return {
            insufficientBlinking: blinkRate < 10,
            rapidBlinks: avgDuration && avgDuration < 100,
            overallStrain: blinkRate < 10
        };
    }

    /**
     * Reset statistics
     */
    reset() {
        this.blinkCount = 0;
        this.blinkHistory = [];
        this.frameCounter = 0;
        this.blinkStartTime = null;
        this.lastBlinkTime = 0;
        this.isBlinking = false;
        this.cooldownCounter = 0;
    }

    /**
     * Get current statistics
     */
    getStatistics() {
        return {
            totalBlinks: this.blinkCount,
            blinkRate: this.getBlinkRate(),
            averageBlinkDuration: this.getAverageBlinkDuration(),
            blinkIrregularity: this.getBlinkIrregularity(),
            lastBlinkTime: this.lastBlinkTime,
            isCurrentlyBlinking: this.isBlinking,
            lastEAR: this.lastEAR,
            fatigue: this.detectFatigue(),
            eyeStrain: this.detectEyeStrain()
        };
    }

    /**
     * Calibrate threshold based on user's normal EAR
     */
    calibrate(normalEAR) {
        // Set threshold to 80% of normal open eye EAR
        this.threshold = normalEAR * 0.8;
        console.log(`Blink threshold calibrated to: ${this.threshold.toFixed(3)}`);
    }

    /**
     * Get recent blink history
     */
    getRecentHistory(count = 10) {
        return this.blinkHistory.slice(-count);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlinkDetector;
}
