/**
 * Attention Analyzer
 *
 * Analyzes eye tracking data to detect attention patterns and lapses
 */

class AttentionAnalyzer {
    constructor(options = {}) {
        this.options = {
            windowSize: options.windowSize || 30000, // 30 seconds
            alertThresholds: {
                blinkRateMin: options.blinkRateMin || 10,
                blinkRateMax: options.blinkRateMax || 35,
                gazeAwayDuration: options.gazeAwayDuration || 5000,
                faceAwayDuration: options.faceAwayDuration || 5000,
                noFaceDuration: options.noFaceDuration || 10000,
                gazeOnScreenMin: options.gazeOnScreenMin || 0.7,
                ...options.alertThresholds
            },
            ...options
        };

        this.eventBuffer = [];
        this.alerts = [];
        this.attentionScore = 100;
        this.attentionLevel = 'high';

        // Current state tracking
        this.currentState = {
            gazeAway: false,
            gazeAwayStart: null,
            faceAway: false,
            faceAwayStart: null,
            noFace: false,
            noFaceStart: null
        };

        this.callbacks = {
            onAlert: options.onAlert || (() => {}),
            onScoreUpdate: options.onScoreUpdate || (() => {})
        };

        this.lastAnalysisTime = Date.now();
    }

    /**
     * Add tracking event to buffer
     */
    addEvent(event) {
        this.eventBuffer.push(event);

        // Keep only recent events within window
        const cutoffTime = Date.now() - this.options.windowSize;
        this.eventBuffer = this.eventBuffer.filter(
            e => e.timestamp > cutoffTime
        );

        // Check for immediate alerts
        this.checkImmediateAlerts(event);
    }

    /**
     * Check for immediate alerts based on current event
     */
    checkImmediateAlerts(event) {
        const now = Date.now();

        // Check gaze away
        if (!event.gaze_on_screen) {
            if (!this.currentState.gazeAway) {
                this.currentState.gazeAway = true;
                this.currentState.gazeAwayStart = now;
            } else {
                const duration = now - this.currentState.gazeAwayStart;
                if (duration >= this.options.alertThresholds.gazeAwayDuration) {
                    this.createAlert('gaze_away', 'warning', {
                        duration: duration,
                        message: '시선이 화면을 벗어났습니다'
                    });
                }
            }
        } else {
            this.currentState.gazeAway = false;
            this.currentState.gazeAwayStart = null;
        }

        // Check face away
        if (event.face_direction !== 'center') {
            if (!this.currentState.faceAway) {
                this.currentState.faceAway = true;
                this.currentState.faceAwayStart = now;
            } else {
                const duration = now - this.currentState.faceAwayStart;
                if (duration >= this.options.alertThresholds.faceAwayDuration) {
                    this.createAlert('face_away', 'warning', {
                        duration: duration,
                        direction: event.face_direction,
                        message: '고개를 돌렸습니다'
                    });
                }
            }
        } else {
            this.currentState.faceAway = false;
            this.currentState.faceAwayStart = null;
        }

        // Check no face detected
        if (!event.face_detected) {
            if (!this.currentState.noFace) {
                this.currentState.noFace = true;
                this.currentState.noFaceStart = now;
            } else {
                const duration = now - this.currentState.noFaceStart;
                if (duration >= this.options.alertThresholds.noFaceDuration) {
                    this.createAlert('no_face_detected', 'critical', {
                        duration: duration,
                        message: '얼굴이 감지되지 않습니다 (자리 이탈 가능)'
                    });
                }
            }
        } else {
            this.currentState.noFace = false;
            this.currentState.noFaceStart = null;
        }
    }

    /**
     * Analyze events in the current window
     */
    analyze() {
        if (this.eventBuffer.length === 0) {
            return null;
        }

        const analysis = {
            timestamp: Date.now(),
            window: {
                start: this.eventBuffer[0].timestamp,
                end: this.eventBuffer[this.eventBuffer.length - 1].timestamp,
                eventCount: this.eventBuffer.length
            },
            blinks: this.analyzeBlinkPattern(),
            gaze: this.analyzeGazePattern(),
            face: this.analyzeFacePattern(),
            attention: null
        };

        // Calculate attention score
        analysis.attention = this.calculateAttentionScore(analysis);

        this.attentionScore = analysis.attention.score;
        this.attentionLevel = analysis.attention.level;

        this.lastAnalysisTime = Date.now();

        this.callbacks.onScoreUpdate(analysis.attention);

        return analysis;
    }

    /**
     * Analyze blink pattern
     */
    analyzeBlinkPattern() {
        const blinks = this.eventBuffer.filter(e => e.blink_detected);
        const blinkCount = blinks.length;

        // Calculate blink rate (per minute)
        const windowDuration = this.options.windowSize / 1000 / 60; // minutes
        const blinkRate = blinkCount / windowDuration;

        // Calculate average blink duration
        const blinkDurations = blinks
            .filter(b => b.blink_duration)
            .map(b => b.blink_duration);

        const avgBlinkDuration = blinkDurations.length > 0
            ? blinkDurations.reduce((sum, d) => sum + d, 0) / blinkDurations.length
            : null;

        // Check for alerts
        if (blinkRate > this.options.alertThresholds.blinkRateMax) {
            this.createAlert('excessive_blinking', 'warning', {
                blinkRate: blinkRate,
                threshold: this.options.alertThresholds.blinkRateMax,
                message: `과도한 눈 깜빡임 (${blinkRate.toFixed(1)} bpm)`
            });
        } else if (blinkRate < this.options.alertThresholds.blinkRateMin) {
            this.createAlert('insufficient_blinking', 'warning', {
                blinkRate: blinkRate,
                threshold: this.options.alertThresholds.blinkRateMin,
                message: `눈 깜빡임 부족 (${blinkRate.toFixed(1)} bpm)`
            });
        }

        return {
            count: blinkCount,
            rate: Math.round(blinkRate * 10) / 10,
            avgDuration: avgBlinkDuration ? Math.round(avgBlinkDuration) : null,
            status: this.getBlinkStatus(blinkRate)
        };
    }

    /**
     * Get blink status based on rate
     */
    getBlinkStatus(blinkRate) {
        if (blinkRate >= 15 && blinkRate <= 20) {
            return 'optimal';
        } else if (blinkRate >= 10 && blinkRate <= 25) {
            return 'normal';
        } else if (blinkRate < 10) {
            return 'insufficient';
        } else {
            return 'excessive';
        }
    }

    /**
     * Analyze gaze pattern
     */
    analyzeGazePattern() {
        const gazeOnScreenEvents = this.eventBuffer.filter(e => e.gaze_on_screen);
        const gazeOnScreenRatio = gazeOnScreenEvents.length / this.eventBuffer.length;

        // Calculate gaze movement (how much the gaze moves)
        const gazeMovement = this.calculateGazeMovement();

        // Check for alert
        if (gazeOnScreenRatio < this.options.alertThresholds.gazeOnScreenMin) {
            this.createAlert('frequent_gaze_away', 'warning', {
                ratio: gazeOnScreenRatio,
                threshold: this.options.alertThresholds.gazeOnScreenMin,
                message: `화면 밖을 자주 봅니다 (${(gazeOnScreenRatio * 100).toFixed(0)}%)`
            });
        }

        return {
            onScreenRatio: Math.round(gazeOnScreenRatio * 1000) / 1000,
            onScreenPercentage: Math.round(gazeOnScreenRatio * 100),
            movement: gazeMovement,
            status: gazeOnScreenRatio >= this.options.alertThresholds.gazeOnScreenMin ? 'focused' : 'distracted'
        };
    }

    /**
     * Calculate gaze movement score
     */
    calculateGazeMovement() {
        if (this.eventBuffer.length < 2) {
            return 0;
        }

        let totalDistance = 0;
        for (let i = 1; i < this.eventBuffer.length; i++) {
            const prev = this.eventBuffer[i - 1];
            const curr = this.eventBuffer[i];

            if (prev.gaze_x !== null && curr.gaze_x !== null) {
                const dx = parseFloat(curr.gaze_x) - parseFloat(prev.gaze_x);
                const dy = parseFloat(curr.gaze_y) - parseFloat(prev.gaze_y);
                const distance = Math.sqrt(dx * dx + dy * dy);
                totalDistance += distance;
            }
        }

        return Math.round(totalDistance * 100);
    }

    /**
     * Analyze face pattern
     */
    analyzeFacePattern() {
        const faceCenterEvents = this.eventBuffer.filter(e => e.face_direction === 'center');
        const faceCenterRatio = faceCenterEvents.length / this.eventBuffer.length;

        const faceDetectedEvents = this.eventBuffer.filter(e => e.face_detected);
        const faceDetectedRatio = faceDetectedEvents.length / this.eventBuffer.length;

        return {
            centerRatio: Math.round(faceCenterRatio * 1000) / 1000,
            centerPercentage: Math.round(faceCenterRatio * 100),
            detectedRatio: Math.round(faceDetectedRatio * 1000) / 1000,
            detectedPercentage: Math.round(faceDetectedRatio * 100),
            status: faceCenterRatio >= 0.7 ? 'engaged' : 'distracted'
        };
    }

    /**
     * Calculate overall attention score (0-100)
     */
    calculateAttentionScore(analysis) {
        // Blink score (0-100)
        const blinkRate = analysis.blinks.rate;
        let blinkScore;
        if (blinkRate >= 15 && blinkRate <= 20) {
            blinkScore = 100;
        } else if (blinkRate >= 10 && blinkRate <= 25) {
            blinkScore = 80;
        } else if (blinkRate >= 5 && blinkRate <= 30) {
            blinkScore = 60;
        } else {
            blinkScore = 40;
        }

        // Gaze score (0-100)
        const gazeScore = analysis.gaze.onScreenRatio * 100;

        // Face score (0-100)
        const faceScore = (analysis.face.centerRatio * 0.6 + analysis.face.detectedRatio * 0.4) * 100;

        // Overall score (weighted average)
        const score = blinkScore * 0.3 + gazeScore * 0.4 + faceScore * 0.3;

        // Determine level
        let level;
        if (score >= 80) {
            level = 'high';
        } else if (score >= 60) {
            level = 'medium';
        } else if (score >= 40) {
            level = 'low';
        } else {
            level = 'critical';
        }

        // Check for critical alert
        if (level === 'critical') {
            this.createAlert('low_attention', 'critical', {
                score: Math.round(score),
                message: '집중도가 매우 낮습니다'
            });
        }

        return {
            score: Math.round(score),
            level: level,
            components: {
                blink: Math.round(blinkScore),
                gaze: Math.round(gazeScore),
                face: Math.round(faceScore)
            }
        };
    }

    /**
     * Create alert
     */
    createAlert(type, severity, data = {}) {
        const alert = {
            type: type,
            severity: severity,
            timestamp: Date.now(),
            data: data,
            acknowledged: false
        };

        this.alerts.push(alert);

        // Keep only recent alerts
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }

        this.callbacks.onAlert(alert);

        return alert;
    }

    /**
     * Get recent alerts
     */
    getRecentAlerts(count = 10) {
        return this.alerts.slice(-count);
    }

    /**
     * Get unacknowledged alerts
     */
    getUnacknowledgedAlerts() {
        return this.alerts.filter(a => !a.acknowledged);
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(timestamp) {
        const alert = this.alerts.find(a => a.timestamp === timestamp);
        if (alert) {
            alert.acknowledged = true;
        }
    }

    /**
     * Get current attention status
     */
    getStatus() {
        return {
            score: this.attentionScore,
            level: this.attentionLevel,
            alerts: this.getUnacknowledgedAlerts().length,
            lastAnalysis: this.lastAnalysisTime
        };
    }

    /**
     * Reset analyzer
     */
    reset() {
        this.eventBuffer = [];
        this.alerts = [];
        this.attentionScore = 100;
        this.attentionLevel = 'high';
        this.currentState = {
            gazeAway: false,
            gazeAwayStart: null,
            faceAway: false,
            faceAwayStart: null,
            noFace: false,
            noFaceStart: null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttentionAnalyzer;
}
