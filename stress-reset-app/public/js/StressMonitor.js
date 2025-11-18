/**
 * Stress Monitor Client
 * Tracks user activity and communicates with backend
 */

class StressMonitor {
    constructor(apiBaseUrl, moodleUserId, moodleCourseId = null) {
        this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
        this.moodleUserId = moodleUserId;
        this.moodleCourseId = moodleCourseId;
        this.sessionId = null;
        this.lightEffect = null;
        this.isActive = false;

        // Activity tracking
        this.activityBuffer = {
            click: 0,
            keypress: 0,
            scroll: 0
        };

        // Timers
        this.heartbeatInterval = null;
        this.stressCheckInterval = null;
        this.activityFlushInterval = null;

        // Configuration
        this.config = {
            heartbeat_interval: 30000, // 30 seconds
            stress_check_interval: 60000, // 1 minute
            activity_flush_interval: 10000, // 10 seconds
        };

        // Event listeners
        this.listeners = {};
    }

    /**
     * Initialize and start monitoring
     */
    async start() {
        if (this.isActive) {
            console.warn('Monitor already active');
            return;
        }

        try {
            // Start session
            await this.startSession();

            // Setup activity tracking
            this.setupActivityTracking();

            // Start intervals
            this.startIntervals();

            this.isActive = true;
            this.emit('started', { sessionId: this.sessionId });

            console.log('Stress monitor started:', this.sessionId);
        } catch (error) {
            console.error('Failed to start monitor:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Stop monitoring
     */
    async stop() {
        if (!this.isActive) {
            return;
        }

        try {
            // Flush remaining activity
            await this.flushActivityBuffer();

            // Clear intervals
            this.stopIntervals();

            // End session
            if (this.sessionId) {
                await this.endSession();
            }

            // Remove event listeners
            this.removeActivityTracking();

            this.isActive = false;
            this.emit('stopped');

            console.log('Stress monitor stopped');
        } catch (error) {
            console.error('Error stopping monitor:', error);
            this.emit('error', error);
        }
    }

    /**
     * Start new session
     */
    async startSession() {
        const response = await fetch(`${this.apiBaseUrl}/api/session.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                moodle_user_id: this.moodleUserId,
                moodle_course_id: this.moodleCourseId,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to start session');
        }

        this.sessionId = data.data.session_id;
        return data.data;
    }

    /**
     * End current session
     */
    async endSession() {
        if (!this.sessionId) return;

        await fetch(`${this.apiBaseUrl}/api/session.php?session_id=${this.sessionId}`, {
            method: 'DELETE',
        });

        this.sessionId = null;
    }

    /**
     * Setup activity event listeners
     */
    setupActivityTracking() {
        this.clickHandler = () => this.activityBuffer.click++;
        this.keypressHandler = () => this.activityBuffer.keypress++;
        this.scrollHandler = () => this.activityBuffer.scroll++;

        document.addEventListener('click', this.clickHandler);
        document.addEventListener('keypress', this.keypressHandler);
        window.addEventListener('scroll', this.scrollHandler);
    }

    /**
     * Remove activity event listeners
     */
    removeActivityTracking() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.keypressHandler) {
            document.removeEventListener('keypress', this.keypressHandler);
        }
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }
    }

    /**
     * Start monitoring intervals
     */
    startIntervals() {
        // Heartbeat
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, this.config.heartbeat_interval);

        // Stress check
        this.stressCheckInterval = setInterval(() => {
            this.checkStress();
        }, this.config.stress_check_interval);

        // Activity flush
        this.activityFlushInterval = setInterval(() => {
            this.flushActivityBuffer();
        }, this.config.activity_flush_interval);
    }

    /**
     * Stop all intervals
     */
    stopIntervals() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.stressCheckInterval) {
            clearInterval(this.stressCheckInterval);
            this.stressCheckInterval = null;
        }
        if (this.activityFlushInterval) {
            clearInterval(this.activityFlushInterval);
            this.activityFlushInterval = null;
        }
    }

    /**
     * Send heartbeat to update session
     */
    async sendHeartbeat() {
        if (!this.sessionId) return;

        try {
            await fetch(`${this.apiBaseUrl}/api/session.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                }),
            });
        } catch (error) {
            console.error('Heartbeat failed:', error);
        }
    }

    /**
     * Flush activity buffer to server
     */
    async flushActivityBuffer() {
        if (!this.sessionId) return;

        const activities = [];

        for (const [type, count] of Object.entries(this.activityBuffer)) {
            if (count > 0) {
                activities.push({ type, count });
                this.activityBuffer[type] = 0;
            }
        }

        if (activities.length === 0) return;

        try {
            for (const activity of activities) {
                await fetch(`${this.apiBaseUrl}/api/activity.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        session_id: this.sessionId,
                        activity_type: activity.type,
                        count: activity.count,
                    }),
                });
            }
        } catch (error) {
            console.error('Failed to flush activity:', error);
        }
    }

    /**
     * Check stress level and trigger reset if needed
     */
    async checkStress() {
        if (!this.sessionId) return;

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/api/stress.php?session_id=${this.sessionId}`
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            this.emit('stress_checked', data.data);

            if (data.should_reset) {
                await this.triggerReset(data.data);
            }
        } catch (error) {
            console.error('Stress check failed:', error);
            this.emit('error', error);
        }
    }

    /**
     * Trigger reset light effect
     */
    async triggerReset(resetData) {
        console.log('Triggering reset:', resetData);

        this.emit('reset_triggered', resetData);

        // Load effect configuration
        const effectConfig = resetData.effect_config;

        // Create and play light effect
        this.lightEffect = new LightEffect(effectConfig);

        this.lightEffect.play(() => {
            // Acknowledge reset
            this.acknowledgeReset(resetData.event_id);
            this.emit('reset_completed', resetData);
        });
    }

    /**
     * Acknowledge reset event
     */
    async acknowledgeReset(eventId) {
        try {
            await fetch(`${this.apiBaseUrl}/api/reset.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_id: eventId,
                }),
            });
        } catch (error) {
            console.error('Failed to acknowledge reset:', error);
        }
    }

    /**
     * Event emitter
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    /**
     * Get session statistics
     */
    async getStats() {
        if (!this.sessionId) {
            throw new Error('No active session');
        }

        const response = await fetch(
            `${this.apiBaseUrl}/api/session.php?session_id=${this.sessionId}`
        );

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        return data.data;
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StressMonitor;
}
