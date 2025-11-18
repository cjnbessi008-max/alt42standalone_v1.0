/**
 * Slope Sensor Simulation Module
 * Simulates device orientation and manages sensor data
 */

class SlopeSensor {
    constructor() {
        this.alpha = 0;   // Z-axis rotation (0-360)
        this.beta = 0;    // X-axis rotation (-180 to 180)
        this.gamma = 0;   // Y-axis rotation (-90 to 90)

        this.isRecording = false;
        this.sensorData = [];
        this.startTime = null;
        this.recordingInterval = null;
        this.batchSize = 10; // Send data in batches

        this.sessionId = null;
        this.targetBetaMin = null;
        this.targetBetaMax = null;
        this.targetGammaMin = null;
        this.targetGammaMax = null;

        this.initializeUI();
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        // Get slider elements
        this.alphaSlider = document.getElementById('alpha-slider');
        this.betaSlider = document.getElementById('beta-slider');
        this.gammaSlider = document.getElementById('gamma-slider');

        // Get value display elements
        this.alphaDisplay = document.getElementById('alpha-value');
        this.betaDisplay = document.getElementById('beta-value');
        this.gammaDisplay = document.getElementById('gamma-value');

        // Get tilt indicator
        this.tiltIndicator = document.getElementById('tilt-indicator');

        // Add event listeners
        this.alphaSlider.addEventListener('input', (e) => this.updateAlpha(parseFloat(e.target.value)));
        this.betaSlider.addEventListener('input', (e) => this.updateBeta(parseFloat(e.target.value)));
        this.gammaSlider.addEventListener('input', (e) => this.updateGamma(parseFloat(e.target.value)));

        // Try to use device orientation API if available
        if (window.DeviceOrientationEvent) {
            this.enableDeviceOrientation();
        }
    }

    /**
     * Enable real device orientation (if on mobile)
     */
    enableDeviceOrientation() {
        // Check if permission is needed (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // Will be requested when user starts
            console.log('Device orientation permission required');
        } else {
            // Non-iOS device or older iOS
            window.addEventListener('deviceorientation', (event) => {
                if (this.isRecording) {
                    this.updateFromDevice(event);
                }
            });
        }
    }

    /**
     * Request device orientation permission (iOS)
     */
    async requestOrientationPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', (event) => {
                        if (this.isRecording) {
                            this.updateFromDevice(event);
                        }
                    });
                    return true;
                }
            } catch (error) {
                console.error('Permission denied:', error);
            }
            return false;
        }
        return true; // Not iOS or already granted
    }

    /**
     * Update sensor values from device
     */
    updateFromDevice(event) {
        if (event.alpha !== null) this.updateAlpha(event.alpha);
        if (event.beta !== null) this.updateBeta(event.beta);
        if (event.gamma !== null) this.updateGamma(event.gamma);
    }

    /**
     * Update alpha value
     */
    updateAlpha(value) {
        this.alpha = value;
        this.alphaDisplay.textContent = value.toFixed(1);
        this.alphaSlider.value = value;
    }

    /**
     * Update beta value
     */
    updateBeta(value) {
        this.beta = value;
        this.betaDisplay.textContent = value.toFixed(1);
        this.betaSlider.value = value;
        this.updateVisualIndicator();
    }

    /**
     * Update gamma value
     */
    updateGamma(value) {
        this.gamma = value;
        this.gammaDisplay.textContent = value.toFixed(1);
        this.gammaSlider.value = value;
        this.updateVisualIndicator();
    }

    /**
     * Update visual tilt indicator
     */
    updateVisualIndicator() {
        // Map beta (-180 to 180) and gamma (-90 to 90) to circle position
        // Center is at (100, 100), radius is 80

        // Normalize beta and gamma to -1 to 1
        const betaNorm = this.beta / 180;  // -1 to 1
        const gammaNorm = this.gamma / 90; // -1 to 1

        // Calculate position (inverted for natural feel)
        const x = 100 + (gammaNorm * 70);  // -70 to +70 from center
        const y = 100 + (betaNorm * 70);   // -70 to +70 from center

        // Update indicator position
        this.tiltIndicator.setAttribute('cx', x);
        this.tiltIndicator.setAttribute('cy', y);

        // Change color based on target achievement
        if (this.isInTargetRange()) {
            this.tiltIndicator.setAttribute('fill', '#4CAF50'); // Green
        } else {
            this.tiltIndicator.setAttribute('fill', '#FF9800'); // Orange
        }
    }

    /**
     * Check if current values are in target range
     */
    isInTargetRange() {
        if (this.targetBetaMin === null) return true;

        const betaInRange = this.beta >= this.targetBetaMin && this.beta <= this.targetBetaMax;
        const gammaInRange = this.gamma >= this.targetGammaMin && this.gamma <= this.targetGammaMax;

        return betaInRange && gammaInRange;
    }

    /**
     * Set target range
     */
    setTarget(betaMin, betaMax, gammaMin, gammaMax) {
        this.targetBetaMin = betaMin;
        this.targetBetaMax = betaMax;
        this.targetGammaMin = gammaMin;
        this.targetGammaMax = gammaMax;

        // Update UI
        const targetIndicator = document.getElementById('target-indicator');
        if (betaMin !== null) {
            targetIndicator.style.display = 'block';
            document.getElementById('target-beta').textContent =
                `Beta: ${betaMin}° ~ ${betaMax}°`;
            document.getElementById('target-gamma').textContent =
                `Gamma: ${gammaMin}° ~ ${gammaMax}°`;
        } else {
            targetIndicator.style.display = 'none';
        }
    }

    /**
     * Start recording sensor data
     */
    async startRecording(sessionId) {
        this.isRecording = true;
        this.sessionId = sessionId;
        this.sensorData = [];
        this.startTime = Date.now();

        // Request device orientation permission if needed
        await this.requestOrientationPermission();

        // Record data every 100ms
        this.recordingInterval = setInterval(() => {
            this.recordDataPoint();
        }, 100);

        console.log('Started recording sensor data');
    }

    /**
     * Record a single data point
     */
    recordDataPoint() {
        const dataPoint = {
            timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
            alpha: this.alpha,
            beta: this.beta,
            gamma: this.gamma,
            absolute: 1
        };

        this.sensorData.push(dataPoint);

        // Send data in batches
        if (this.sensorData.length >= this.batchSize) {
            this.sendBatch();
        }
    }

    /**
     * Send batch of sensor data to server
     */
    async sendBatch() {
        if (this.sensorData.length === 0) return;

        const batch = [...this.sensorData];
        this.sensorData = [];

        try {
            await window.slopeAPI.saveSensorData(this.sessionId, batch);
            console.log(`Sent ${batch.length} data points`);
        } catch (error) {
            console.error('Failed to send sensor data:', error);
            // Put failed data back
            this.sensorData = batch.concat(this.sensorData);
        }
    }

    /**
     * Stop recording sensor data
     */
    async stopRecording() {
        this.isRecording = false;

        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }

        // Send remaining data
        await this.sendBatch();

        console.log('Stopped recording sensor data');
    }

    /**
     * Reset sensor to default position
     */
    reset() {
        this.updateAlpha(0);
        this.updateBeta(0);
        this.updateGamma(0);
    }

    /**
     * Get recording duration in seconds
     */
    getDuration() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

// Create global sensor instance
window.slopeSensor = new SlopeSensor();
