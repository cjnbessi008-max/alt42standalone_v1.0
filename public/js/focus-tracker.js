/**
 * Focus Tracking Library
 * 고난도 콘텐츠에서도 안정적인 집중 상태 추적
 *
 * Features:
 * - Page focus/blur tracking
 * - Mouse activity monitoring
 * - Keyboard activity monitoring
 * - Scroll tracking
 * - Idle detection
 * - Automatic batch event submission
 */

class FocusTracker {
    constructor(options = {}) {
        this.config = {
            sessionId: options.sessionId || null,
            attemptId: options.attemptId || null,
            apiEndpoint: options.apiEndpoint || '/api/focus-events.php',
            samplingRate: options.samplingRate || 5000, // 5 seconds
            idleThreshold: options.idleThreshold || 30000, // 30 seconds
            batchSize: options.batchSize || 20,
            autoSubmit: options.autoSubmit !== false,
            onMetricsUpdate: options.onMetricsUpdate || null,
            authToken: options.authToken || null
        };

        this.events = [];
        this.metrics = {
            focusTime: 0,
            idleTime: 0,
            interactionCount: 0,
            lastActivityTime: Date.now(),
            sessionStartTime: Date.now(),
            isPageFocused: true,
            isIdle: false
        };

        this.timers = {
            sampling: null,
            idleCheck: null,
            autoSubmit: null
        };

        this.init();
    }

    /**
     * Initialize tracking
     */
    init() {
        if (!this.config.sessionId) {
            console.warn('FocusTracker: sessionId not provided. Tracking disabled.');
            return;
        }

        this.attachEventListeners();
        this.startSampling();
        this.startIdleDetection();

        if (this.config.autoSubmit) {
            this.startAutoSubmit();
        }

        console.log('FocusTracker initialized', this.config);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Page focus/blur
        window.addEventListener('focus', () => this.handlePageFocus());
        window.addEventListener('blur', () => this.handlePageBlur());

        // Mouse activity
        document.addEventListener('mousemove', () => this.handleMouseMove());
        document.addEventListener('click', (e) => this.handleMouseClick(e));

        // Keyboard activity
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Scroll
        window.addEventListener('scroll', () => this.handleScroll());

        // Window resize (orientation change on mobile)
        window.addEventListener('resize', () => this.handleWindowResize());

        // Before unload - submit remaining events
        window.addEventListener('beforeunload', () => this.submitEvents(true));
    }

    /**
     * Handle page focus
     */
    handlePageFocus() {
        this.recordEvent('page_focus', {});
        this.metrics.isPageFocused = true;
        this.updateActivity();
    }

    /**
     * Handle page blur
     */
    handlePageBlur() {
        this.recordEvent('page_blur', {});
        this.metrics.isPageFocused = false;
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove() {
        // Throttle mouse move events
        if (!this.lastMouseMove || Date.now() - this.lastMouseMove > 1000) {
            this.recordEvent('mouse_move', {});
            this.lastMouseMove = Date.now();
            this.updateActivity();
        }
    }

    /**
     * Handle mouse click
     */
    handleMouseClick(event) {
        this.recordEvent('mouse_click', {
            target: event.target.tagName,
            x: event.clientX,
            y: event.clientY
        });
        this.metrics.interactionCount++;
        this.updateActivity();
    }

    /**
     * Handle keyboard input
     */
    handleKeyboard(event) {
        // Don't log actual key values for privacy
        this.recordEvent('keyboard_input', {
            key_category: this.categorizeKey(event.key)
        });
        this.metrics.interactionCount++;
        this.updateActivity();
    }

    /**
     * Handle scroll
     */
    handleScroll() {
        // Throttle scroll events
        if (!this.lastScroll || Date.now() - this.lastScroll > 500) {
            this.recordEvent('scroll', {
                scrollY: window.scrollY,
                scrollPercentage: this.getScrollPercentage()
            });
            this.lastScroll = Date.now();
            this.updateActivity();
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        this.recordEvent('window_resize', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }

    /**
     * Record an event
     */
    recordEvent(type, data) {
        this.events.push({
            type: type,
            timestamp: Date.now(),
            attempt_id: this.config.attemptId,
            data: data
        });

        // Auto-submit if batch size reached
        if (this.events.length >= this.config.batchSize) {
            this.submitEvents();
        }
    }

    /**
     * Update last activity time
     */
    updateActivity() {
        this.metrics.lastActivityTime = Date.now();

        if (this.metrics.isIdle) {
            this.recordEvent('idle_end', {});
            this.metrics.isIdle = false;
        }
    }

    /**
     * Start sampling timer
     */
    startSampling() {
        this.timers.sampling = setInterval(() => {
            this.sampleMetrics();
        }, this.config.samplingRate);
    }

    /**
     * Start idle detection
     */
    startIdleDetection() {
        this.timers.idleCheck = setInterval(() => {
            const timeSinceActivity = Date.now() - this.metrics.lastActivityTime;

            if (timeSinceActivity > this.config.idleThreshold && !this.metrics.isIdle) {
                this.recordEvent('idle_start', {
                    time_since_activity: timeSinceActivity
                });
                this.metrics.isIdle = true;
            }
        }, 5000); // Check every 5 seconds
    }

    /**
     * Start auto-submit timer
     */
    startAutoSubmit() {
        this.timers.autoSubmit = setInterval(() => {
            if (this.events.length > 0) {
                this.submitEvents();
            }
        }, 10000); // Submit every 10 seconds
    }

    /**
     * Sample current metrics
     */
    sampleMetrics() {
        const now = Date.now();
        const sessionDuration = now - this.metrics.sessionStartTime;

        const currentMetrics = {
            focus_time: this.metrics.focusTime,
            idle_time: this.metrics.idleTime,
            interaction_count: this.metrics.interactionCount,
            session_duration: sessionDuration,
            is_focused: this.metrics.isPageFocused,
            is_idle: this.metrics.isIdle
        };

        // Calculate real-time scores
        const attentionScore = this.calculateAttentionScore();
        const activityRatio = this.calculateActivityRatio();

        // Update UI if callback provided
        if (this.config.onMetricsUpdate) {
            this.config.onMetricsUpdate({
                ...currentMetrics,
                attention_score: attentionScore,
                activity_ratio: activityRatio
            });
        }
    }

    /**
     * Calculate attention score (0-100)
     */
    calculateAttentionScore() {
        const now = Date.now();
        const totalTime = now - this.metrics.sessionStartTime;
        const idleTime = this.metrics.isIdle ? (now - this.metrics.lastActivityTime) : 0;
        const activeTime = totalTime - idleTime;

        const score = totalTime > 0 ? (activeTime / totalTime) * 100 : 100;
        return Math.round(score * 10) / 10; // Round to 1 decimal
    }

    /**
     * Calculate activity ratio
     */
    calculateActivityRatio() {
        const now = Date.now();
        const totalTime = now - this.metrics.sessionStartTime;
        const activeTime = totalTime - this.metrics.idleTime;

        return totalTime > 0 ? (activeTime / totalTime) : 1;
    }

    /**
     * Submit events to server
     */
    async submitEvents(synchronous = false) {
        if (this.events.length === 0) {
            return;
        }

        const eventsToSubmit = [...this.events];
        this.events = [];

        const payload = {
            session_id: this.config.sessionId,
            attempt_id: this.config.attemptId,
            events: eventsToSubmit
        };

        try {
            if (synchronous) {
                // Use sendBeacon for synchronous submission (e.g., on page unload)
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(this.config.apiEndpoint, blob);
            } else {
                const response = await fetch(this.config.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.authToken}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    console.error('Failed to submit focus events:', response.statusText);
                    // Re-add events for retry
                    this.events.unshift(...eventsToSubmit);
                }
            }
        } catch (error) {
            console.error('Error submitting focus events:', error);
            // Re-add events for retry
            this.events.unshift(...eventsToSubmit);
        }
    }

    /**
     * Set attempt ID (when starting a new problem)
     */
    setAttemptId(attemptId) {
        this.config.attemptId = attemptId;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            attention_score: this.calculateAttentionScore(),
            activity_ratio: this.calculateActivityRatio()
        };
    }

    /**
     * Categorize key for privacy
     */
    categorizeKey(key) {
        if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
            return 'alphanumeric';
        } else if (['Enter', 'Tab', 'Space'].includes(key)) {
            return 'control';
        } else if (key.startsWith('Arrow')) {
            return 'navigation';
        } else if (key === 'Backspace' || key === 'Delete') {
            return 'delete';
        } else {
            return 'other';
        }
    }

    /**
     * Get scroll percentage
     */
    getScrollPercentage() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    }

    /**
     * Stop tracking and submit remaining events
     */
    async stop() {
        // Clear all timers
        if (this.timers.sampling) clearInterval(this.timers.sampling);
        if (this.timers.idleCheck) clearInterval(this.timers.idleCheck);
        if (this.timers.autoSubmit) clearInterval(this.timers.autoSubmit);

        // Submit remaining events
        await this.submitEvents();

        console.log('FocusTracker stopped');
    }

    /**
     * Destroy tracker completely
     */
    destroy() {
        this.stop();
        // Remove event listeners (would need to store bound functions to remove properly)
        console.log('FocusTracker destroyed');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusTracker;
}
