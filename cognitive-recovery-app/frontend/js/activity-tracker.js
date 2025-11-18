/**
 * Activity Tracker
 * Monitors user activity and detects cognitive recovery periods
 */

class ActivityTracker {
    constructor(config = {}) {
        this.config = {
            apiUrl: config.apiUrl || '/backend/api/track.php',
            dashboardUrl: config.dashboardUrl || '/backend/api/dashboard.php',
            userId: config.userId || null,
            courseId: config.courseId || null,
            moduleId: config.moduleId || null,
            trackingInterval: config.trackingInterval || 1000, // 1 second
            batchSize: config.batchSize || 10, // Send events in batches
            debounceDelay: config.debounceDelay || 100, // Debounce mouse moves
            enableConsoleLog: config.enableConsoleLog || false
        };

        this.sessionToken = null;
        this.sessionId = null;
        this.eventQueue = [];
        this.lastActivityTime = Date.now();
        this.isTracking = false;
        this.listeners = [];
        this.heartbeatInterval = null;
        this.detectionInterval = null;

        // Debounced event handlers
        this.debouncedMouseMove = this.debounce(
            this.trackMouseMove.bind(this),
            this.config.debounceDelay
        );
    }

    /**
     * Initialize and start tracking
     */
    async start() {
        if (this.isTracking) {
            this.log('Tracking already started');
            return;
        }

        try {
            // Start session
            const response = await this.apiCall('track.php', {
                action: 'start_session',
                user_id: this.config.userId,
                course_id: this.config.courseId,
                module_id: this.config.moduleId
            });

            if (response.success) {
                this.sessionToken = response.session_token;
                this.sessionId = response.session_id;
                this.isTracking = true;

                this.log('Session started:', response);

                // Attach event listeners
                this.attachListeners();

                // Start heartbeat
                this.startHeartbeat();

                // Start recovery detection
                this.startRecoveryDetection();

                return response;
            } else {
                throw new Error('Failed to start session');
            }
        } catch (error) {
            console.error('Failed to start tracking:', error);
            throw error;
        }
    }

    /**
     * Stop tracking and end session
     */
    async stop() {
        if (!this.isTracking) {
            this.log('Tracking not active');
            return;
        }

        try {
            // Send remaining events
            await this.flushEventQueue();

            // End session
            const response = await this.apiCall('track.php', {
                action: 'end_session',
                session_token: this.sessionToken
            });

            // Remove event listeners
            this.removeListeners();

            // Stop heartbeat
            this.stopHeartbeat();

            // Stop recovery detection
            this.stopRecoveryDetection();

            this.isTracking = false;
            this.sessionToken = null;
            this.sessionId = null;

            this.log('Session ended:', response);

            return response;
        } catch (error) {
            console.error('Failed to stop tracking:', error);
            throw error;
        }
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        // Mouse events
        this.addListener('mousemove', this.debouncedMouseMove);
        this.addListener('click', this.trackClick.bind(this));

        // Keyboard events
        this.addListener('keypress', this.trackKeypress.bind(this));

        // Scroll events
        this.addListener('scroll', this.debounce(
            this.trackScroll.bind(this),
            this.config.debounceDelay
        ));

        // Focus/Blur events
        this.addListener('focus', this.trackFocus.bind(this));
        this.addListener('blur', this.trackBlur.bind(this));

        // Page visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * Remove event listeners
     */
    removeListeners() {
        this.listeners.forEach(({ event, handler }) => {
            document.removeEventListener(event, handler);
        });
        this.listeners = [];

        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * Add event listener and track it
     */
    addListener(event, handler) {
        document.addEventListener(event, handler);
        this.listeners.push({ event, handler });
    }

    /**
     * Track mouse movement
     */
    trackMouseMove(event) {
        this.addEvent('mouse_move', {
            x: event.clientX,
            y: event.clientY,
            target: this.getElementInfo(event.target)
        });
    }

    /**
     * Track click events
     */
    trackClick(event) {
        this.addEvent('click', {
            x: event.clientX,
            y: event.clientY,
            button: event.button,
            target: this.getElementInfo(event.target)
        });
    }

    /**
     * Track keypress events
     */
    trackKeypress(event) {
        this.addEvent('keypress', {
            key: event.key,
            code: event.code,
            target: this.getElementInfo(event.target)
        });
    }

    /**
     * Track scroll events
     */
    trackScroll(event) {
        this.addEvent('scroll', {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            target: this.getElementInfo(event.target)
        });
    }

    /**
     * Track focus events
     */
    trackFocus(event) {
        this.addEvent('focus', {
            target: this.getElementInfo(event.target)
        });
    }

    /**
     * Track blur events
     */
    trackBlur(event) {
        this.addEvent('blur', {
            target: this.getElementInfo(event.target)
        });
    }

    /**
     * Handle page visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.addEvent('page_hidden', {
                timestamp: new Date().toISOString()
            });
        } else {
            this.addEvent('page_visible', {
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Add event to queue
     */
    addEvent(type, metadata = {}) {
        this.lastActivityTime = Date.now();

        this.eventQueue.push({
            type: type,
            timestamp: this.getTimestamp(),
            metadata: metadata
        });

        // Send if batch size reached
        if (this.eventQueue.length >= this.config.batchSize) {
            this.flushEventQueue();
        }
    }

    /**
     * Flush event queue to server
     */
    async flushEventQueue() {
        if (this.eventQueue.length === 0) {
            return;
        }

        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            await this.apiCall('track.php', {
                action: 'track_events',
                session_token: this.sessionToken,
                events: events
            });

            this.log(`Flushed ${events.length} events`);
        } catch (error) {
            console.error('Failed to flush events:', error);
            // Put events back in queue
            this.eventQueue = events.concat(this.eventQueue);
        }
    }

    /**
     * Start heartbeat to keep session alive
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                await this.apiCall('track.php', {
                    action: 'heartbeat',
                    session_token: this.sessionToken
                });

                this.log('Heartbeat sent');
            } catch (error) {
                console.error('Heartbeat failed:', error);
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Start cognitive recovery detection
     */
    startRecoveryDetection() {
        this.detectionInterval = setInterval(async () => {
            try {
                // Flush any pending events first
                await this.flushEventQueue();

                // Detect recovery periods
                const response = await this.apiCall('track.php', {
                    action: 'detect_recovery',
                    session_token: this.sessionToken,
                    min_gap_seconds: 10
                });

                if (response.success && response.insights) {
                    this.log('Recovery detection:', response);

                    // Emit custom event for UI to consume
                    this.emitRecoveryUpdate(response.insights);
                }
            } catch (error) {
                console.error('Recovery detection failed:', error);
            }
        }, 60000); // Every minute
    }

    /**
     * Stop recovery detection
     */
    stopRecoveryDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    /**
     * Get real-time session status
     */
    async getRealtimeStatus() {
        try {
            const response = await this.apiCall('dashboard.php', {
                action: 'realtime_status',
                session_token: this.sessionToken
            }, 'GET');

            return response;
        } catch (error) {
            console.error('Failed to get realtime status:', error);
            return null;
        }
    }

    /**
     * Get session statistics
     */
    async getSessionStats() {
        try {
            const response = await this.apiCall('dashboard.php', {
                action: 'session_stats',
                session_id: this.sessionId
            }, 'GET');

            return response;
        } catch (error) {
            console.error('Failed to get session stats:', error);
            return null;
        }
    }

    /**
     * Emit recovery update event
     */
    emitRecoveryUpdate(insights) {
        const event = new CustomEvent('cognitiveRecoveryUpdate', {
            detail: insights
        });
        document.dispatchEvent(event);
    }

    /**
     * Make API call
     */
    async apiCall(endpoint, data, method = 'POST') {
        const url = method === 'GET'
            ? `${this.config.apiUrl.replace('track.php', endpoint)}?${new URLSearchParams(data).toString()}`
            : this.config.apiUrl.replace('track.php', endpoint);

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (method === 'POST') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Get element information
     */
    getElementInfo(element) {
        if (!element) return null;

        return {
            tag: element.tagName,
            id: element.id || null,
            class: element.className || null,
            name: element.name || null
        };
    }

    /**
     * Get timestamp in MySQL format
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
    }

    /**
     * Debounce function
     */
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Log messages
     */
    log(...args) {
        if (this.config.enableConsoleLog) {
            console.log('[ActivityTracker]', ...args);
        }
    }

    /**
     * Get time since last activity
     */
    getTimeSinceLastActivity() {
        return Date.now() - this.lastActivityTime;
    }

    /**
     * Check if user is currently in recovery period
     */
    isInRecoveryPeriod() {
        const timeSince = this.getTimeSinceLastActivity();
        return timeSince >= 10000 && timeSince <= 60000; // 10-60 seconds
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTracker;
}
