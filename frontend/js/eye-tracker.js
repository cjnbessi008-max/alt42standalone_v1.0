/**
 * Eye Tracker
 *
 * Main eye tracking module using WebGazer.js
 * Tracks gaze position, blinks, and face position
 */

class EyeTracker {
    constructor(options = {}) {
        this.options = {
            samplingRate: options.samplingRate || 100, // ms
            saveData: options.saveData !== false,
            showVideo: options.showVideo !== false,
            showPrediction: options.showPrediction !== false,
            ...options
        };

        this.isInitialized = false;
        this.isTracking = false;
        this.sessionStartTime = null;

        // Components
        this.blinkDetector = null;
        this.apiClient = null;
        this.batchSender = null;

        // Tracking data
        this.gazeData = [];
        this.currentGaze = { x: null, y: null };
        this.facePosition = { direction: 'center', distance: null };
        this.confidence = 0;

        // Callbacks
        this.callbacks = {
            onInit: options.onInit || (() => {}),
            onStart: options.onStart || (() => {}),
            onStop: options.onStop || (() => {}),
            onGaze: options.onGaze || (() => {}),
            onBlink: options.onBlink || (() => {}),
            onAlert: options.onAlert || (() => {}),
            onError: options.onError || ((error) => console.error(error))
        };

        // Stats
        this.stats = {
            totalFrames: 0,
            validFrames: 0,
            droppedFrames: 0
        };
    }

    /**
     * Initialize eye tracking
     */
    async init() {
        if (this.isInitialized) {
            console.warn('Eye tracker already initialized');
            return;
        }

        try {
            // Check if WebGazer is available
            if (typeof webgazer === 'undefined') {
                throw new Error('WebGazer.js library not loaded');
            }

            // Initialize WebGazer
            await webgazer
                .setRegression('ridge') // 'ridge' or 'weightedRidge'
                .setTracker('TFFacemesh') // 'TFFacemesh' (recommended) or 'clmtrackr'
                .setGazeListener((data, timestamp) => {
                    this.handleGazeData(data, timestamp);
                })
                .showVideo(this.options.showVideo)
                .showPrediction(this.options.showPrediction)
                .begin();

            // Wait for WebGazer to be ready
            await this.waitForReady();

            // Initialize blink detector
            if (typeof BlinkDetector !== 'undefined') {
                this.blinkDetector = new BlinkDetector({
                    onBlink: (data) => {
                        this.callbacks.onBlink(data);
                    }
                });
            } else {
                console.warn('BlinkDetector not available');
            }

            // Set video constraints
            webgazer.params.videoConstraints = {
                width: { ideal: 640 },
                height: { ideal: 480 }
            };

            this.isInitialized = true;
            this.callbacks.onInit();

            console.log('Eye tracker initialized successfully');

        } catch (error) {
            this.callbacks.onError(error);
            throw error;
        }
    }

    /**
     * Wait for WebGazer to be ready
     */
    async waitForReady(timeout = 5000) {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkReady = () => {
                if (webgazer.isReady()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('WebGazer initialization timeout'));
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }

    /**
     * Start tracking
     */
    async start(apiClient = null) {
        if (!this.isInitialized) {
            throw new Error('Eye tracker not initialized');
        }

        if (this.isTracking) {
            console.warn('Eye tracker already tracking');
            return;
        }

        this.apiClient = apiClient;
        this.sessionStartTime = Date.now();
        this.isTracking = true;

        // Resume WebGazer
        webgazer.resume();

        // Setup batch sender if API client is provided
        if (this.apiClient && this.options.saveData) {
            this.batchSender = this.apiClient.createBatchSender({
                batchSize: 50,
                flushInterval: 5000
            });
        }

        this.callbacks.onStart();
        console.log('Eye tracking started');
    }

    /**
     * Stop tracking
     */
    async stop() {
        if (!this.isTracking) {
            console.warn('Eye tracker not tracking');
            return;
        }

        this.isTracking = false;

        // Pause WebGazer
        webgazer.pause();

        // Flush remaining data
        if (this.batchSender) {
            await this.batchSender.flush();
        }

        this.callbacks.onStop();
        console.log('Eye tracking stopped');
    }

    /**
     * Handle gaze data from WebGazer
     */
    handleGazeData(data, timestamp) {
        if (!this.isTracking) return;

        this.stats.totalFrames++;

        if (!data || data.x === null || data.y === null) {
            this.stats.droppedFrames++;
            return;
        }

        this.stats.validFrames++;

        // Normalize gaze coordinates (0.0 to 1.0)
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const normalizedGaze = {
            x: Math.max(0, Math.min(1, data.x / screenWidth)),
            y: Math.max(0, Math.min(1, data.y / screenHeight))
        };

        this.currentGaze = normalizedGaze;

        // Check if gaze is on screen
        const gazeOnScreen = (
            data.x >= 0 && data.x <= screenWidth &&
            data.y >= 0 && data.y <= screenHeight
        );

        // Get face landmarks for blink detection
        let blinkResult = null;
        if (this.blinkDetector && webgazer.getTracker()) {
            try {
                const tracker = webgazer.getTracker();
                const faceLandmarks = this.extractFaceLandmarks(tracker);

                if (faceLandmarks) {
                    blinkResult = this.blinkDetector.processFrame(faceLandmarks);
                    this.updateFacePosition(faceLandmarks);
                }
            } catch (error) {
                // Silently handle landmark extraction errors
            }
        }

        // Create tracking event
        const event = {
            timestamp: timestamp || Date.now(),
            relative_time: Date.now() - this.sessionStartTime,
            blink_detected: blinkResult ? blinkResult.blinkDetected : false,
            blink_duration: blinkResult && blinkResult.blinkDuration ? blinkResult.blinkDuration : null,
            gaze_x: normalizedGaze.x.toFixed(4),
            gaze_y: normalizedGaze.y.toFixed(4),
            gaze_on_screen: gazeOnScreen,
            face_direction: this.facePosition.direction,
            face_distance: this.facePosition.distance,
            tracking_confidence: this.confidence,
            face_detected: true
        };

        // Save to local buffer
        this.gazeData.push(event);

        // Keep only recent data in memory
        if (this.gazeData.length > 1000) {
            this.gazeData.shift();
        }

        // Send to API
        if (this.batchSender) {
            this.batchSender.add(event);
        }

        // Trigger callback
        this.callbacks.onGaze({
            gaze: normalizedGaze,
            gazeOnScreen: gazeOnScreen,
            blink: blinkResult,
            face: this.facePosition,
            timestamp: event.timestamp
        });
    }

    /**
     * Extract face landmarks from tracker
     */
    extractFaceLandmarks(tracker) {
        try {
            // For TFFacemesh tracker
            if (tracker.predictionReady && tracker.store && tracker.store.length > 0) {
                const prediction = tracker.store[tracker.store.length - 1];

                if (prediction && prediction.keypoints) {
                    return this.parseTFFacemeshLandmarks(prediction.keypoints);
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Parse TFFacemesh landmarks
     */
    parseTFFacemeshLandmarks(keypoints) {
        // TFFacemesh landmark indices for eyes
        const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]; // outer, top-outer, top-inner, inner, bottom-inner, bottom-outer
        const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

        const leftEye = LEFT_EYE_INDICES.map(idx => {
            const point = keypoints[idx];
            return [point.x, point.y];
        });

        const rightEye = RIGHT_EYE_INDICES.map(idx => {
            const point = keypoints[idx];
            return [point.x, point.y];
        });

        return {
            leftEye: leftEye,
            rightEye: rightEye,
            keypoints: keypoints
        };
    }

    /**
     * Update face position (direction and distance)
     */
    updateFacePosition(faceLandmarks) {
        if (!faceLandmarks || !faceLandmarks.keypoints) {
            return;
        }

        const keypoints = faceLandmarks.keypoints;

        // Get nose tip (index 1) and forehead (index 10)
        const noseTip = keypoints[1];
        const forehead = keypoints[10];

        // Estimate face distance based on size (approximate)
        const faceWidth = this.calculateFaceWidth(keypoints);
        // Assume average face width is ~15cm and estimate distance
        const estimatedDistance = (15 * 500) / faceWidth; // Rough estimate in cm
        this.facePosition.distance = Math.round(estimatedDistance);

        // Determine face direction based on nose position relative to face center
        const faceCenter = this.calculateFaceCenter(keypoints);
        const horizontalOffset = noseTip.x - faceCenter.x;
        const verticalOffset = noseTip.y - faceCenter.y;

        // Thresholds for determining direction
        const hThreshold = 20;
        const vThreshold = 20;

        if (Math.abs(horizontalOffset) < hThreshold && Math.abs(verticalOffset) < vThreshold) {
            this.facePosition.direction = 'center';
        } else if (horizontalOffset < -hThreshold) {
            this.facePosition.direction = 'left';
        } else if (horizontalOffset > hThreshold) {
            this.facePosition.direction = 'right';
        } else if (verticalOffset < -vThreshold) {
            this.facePosition.direction = 'up';
        } else if (verticalOffset > vThreshold) {
            this.facePosition.direction = 'down';
        }
    }

    /**
     * Calculate face width
     */
    calculateFaceWidth(keypoints) {
        // Use left and right face contour points
        const leftPoint = keypoints[234]; // Left face contour
        const rightPoint = keypoints[454]; // Right face contour

        const width = Math.abs(rightPoint.x - leftPoint.x);
        return width;
    }

    /**
     * Calculate face center
     */
    calculateFaceCenter(keypoints) {
        // Use a few key points to estimate center
        const centerPoints = [keypoints[1], keypoints[4], keypoints[5], keypoints[6]];

        const sumX = centerPoints.reduce((sum, p) => sum + p.x, 0);
        const sumY = centerPoints.reduce((sum, p) => sum + p.y, 0);

        return {
            x: sumX / centerPoints.length,
            y: sumY / centerPoints.length
        };
    }

    /**
     * Get current tracking statistics
     */
    getStatistics() {
        const stats = {
            tracking: {
                totalFrames: this.stats.totalFrames,
                validFrames: this.stats.validFrames,
                droppedFrames: this.stats.droppedFrames,
                accuracy: this.stats.totalFrames > 0
                    ? (this.stats.validFrames / this.stats.totalFrames * 100).toFixed(2)
                    : 0
            },
            session: {
                startTime: this.sessionStartTime,
                duration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
            }
        };

        if (this.blinkDetector) {
            stats.blinks = this.blinkDetector.getStatistics();
        }

        return stats;
    }

    /**
     * Calibrate eye tracking
     */
    async calibrate() {
        // Use WebGazer's calibration system
        console.log('Starting calibration...');
        // User should click on 9 points on the screen
        // WebGazer will automatically handle calibration
    }

    /**
     * Clear calibration data
     */
    clearCalibration() {
        if (webgazer) {
            webgazer.clearData();
            console.log('Calibration data cleared');
        }
    }

    /**
     * Get recent gaze data
     */
    getRecentGazeData(count = 100) {
        return this.gazeData.slice(-count);
    }

    /**
     * Cleanup and destroy
     */
    async destroy() {
        if (this.isTracking) {
            await this.stop();
        }

        if (webgazer) {
            webgazer.end();
        }

        this.isInitialized = false;
        console.log('Eye tracker destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EyeTracker;
}
