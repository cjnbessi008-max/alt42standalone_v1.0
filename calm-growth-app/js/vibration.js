/**
 * Calm Growth Vibration Algorithm
 * Log-based dampening: As log value increases, vibration intensity decreases
 */

class CalmGrowthVibration {
    constructor(options = {}) {
        this.baseIntensity = options.baseIntensity || 100;
        this.dampingFactor = options.dampingFactor || 1.5;
        this.minIntensity = options.minIntensity || 10;
        this.enabled = options.enabled !== false;
        this.logValue = 1.0;
        this.activityHistory = [];
    }

    /**
     * Calculate vibration intensity based on log value
     * Formula: intensity = baseIntensity / (1 + dampingFactor * log(logValue))
     * As logValue increases, intensity decreases (calming effect)
     */
    calculateIntensity() {
        if (!this.enabled) return 0;

        // Calm Growth formula
        const intensity = this.baseIntensity / (1 + this.dampingFactor * Math.log(this.logValue + 1));
        return Math.max(intensity, this.minIntensity);
    }

    /**
     * Calculate vibration frequency (Hz)
     * Higher log values result in lower, calmer frequencies
     */
    calculateFrequency() {
        const baseFrequency = 200; // Hz
        return baseFrequency / (1 + Math.log(this.logValue + 1));
    }

    /**
     * Calculate vibration duration (ms)
     * Slightly increases with log value for smoother feedback
     */
    calculateDuration() {
        const baseDuration = 100; // ms
        return baseDuration + (Math.log(this.logValue + 1) * 10);
    }

    /**
     * Add activity to increase log value
     * @param {number} value - Activity weight (default 1.0)
     */
    addActivity(value = 1.0) {
        this.logValue += value;
        this.activityHistory.push({
            value: value,
            timestamp: Date.now(),
            cumulativeLog: this.logValue
        });

        // Keep only last 100 activities
        if (this.activityHistory.length > 100) {
            this.activityHistory.shift();
        }
    }

    /**
     * Get current vibration parameters
     */
    getVibrationParams() {
        return {
            intensity: this.calculateIntensity(),
            frequency: this.calculateFrequency(),
            duration: this.calculateDuration(),
            logValue: this.logValue,
            enabled: this.enabled
        };
    }

    /**
     * Trigger vibration effect (visual + haptic if available)
     * @param {HTMLElement} element - Element to vibrate
     */
    async vibrate(element) {
        if (!this.enabled) return;

        const params = this.getVibrationParams();

        // Visual vibration effect
        if (element) {
            element.classList.add('vibrating');

            // Duration based on calculated params
            setTimeout(() => {
                element.classList.remove('vibrating');
            }, params.duration);
        }

        // Haptic feedback (if browser supports Vibration API)
        if ('vibrate' in navigator) {
            // Create pattern: [vibrate, pause] repeated
            // Intensity affects vibration length
            const vibrationLength = Math.floor(params.intensity / 2);
            const pattern = [vibrationLength, 50, vibrationLength];

            navigator.vibrate(pattern);
        }

        // Show indicator
        this.showIndicator(params);

        return params;
    }

    /**
     * Show vibration indicator
     */
    showIndicator(params) {
        let indicator = document.getElementById('vibration-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'vibration-indicator';
            indicator.className = 'vibration-indicator';
            document.body.appendChild(indicator);
        }

        const message = `
            <div>🌊 Calm Growth Active</div>
            <div class="vibration-intensity">
                Log: ${params.logValue.toFixed(2)} →
                Intensity: ${params.intensity.toFixed(1)}%
            </div>
        `;

        indicator.innerHTML = message;
        indicator.classList.add('active');

        // Hide after duration
        setTimeout(() => {
            indicator.classList.remove('active');
        }, params.duration + 1000);
    }

    /**
     * Reset log value
     */
    reset() {
        this.logValue = 1.0;
        this.activityHistory = [];
    }

    /**
     * Set log value directly
     */
    setLogValue(value) {
        this.logValue = Math.max(1.0, value);
    }

    /**
     * Get activity history
     */
    getHistory() {
        return this.activityHistory;
    }

    /**
     * Get statistics
     */
    getStats() {
        const params = this.getVibrationParams();

        return {
            currentLogValue: this.logValue,
            currentIntensity: params.intensity,
            currentFrequency: params.frequency,
            currentDuration: params.duration,
            activityCount: this.activityHistory.length,
            dampingPercentage: ((this.baseIntensity - params.intensity) / this.baseIntensity * 100).toFixed(1),
            enabled: this.enabled
        };
    }

    /**
     * Toggle enabled state
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
        if (settings.baseIntensity !== undefined) {
            this.baseIntensity = settings.baseIntensity;
        }
        if (settings.dampingFactor !== undefined) {
            this.dampingFactor = settings.dampingFactor;
        }
        if (settings.minIntensity !== undefined) {
            this.minIntensity = settings.minIntensity;
        }
        if (settings.enabled !== undefined) {
            this.enabled = settings.enabled;
        }
    }

    /**
     * Simulate calm growth over time
     * For demonstration purposes
     */
    simulateGrowth(steps = 10, interval = 1000) {
        let count = 0;

        const simulation = setInterval(() => {
            this.addActivity(Math.random() * 2 + 0.5);
            const smartphone = document.querySelector('.smartphone-container');
            this.vibrate(smartphone);

            count++;
            if (count >= steps) {
                clearInterval(simulation);
            }
        }, interval);

        return simulation;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalmGrowthVibration;
}
