/**
 * DMN Dropout Detection - Frontend Behavior Tracker
 * Monitors student behavior and sends data to detection API
 *
 * Compatible with: Moodle 3.7, Modern Browsers
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    /**
     * Main DMNTracker object
     */
    const DMNTracker = {
        // Configuration
        config: {
            apiEndpoint: null,
            studentId: null,
            courseId: null,
            activityId: null,
            sessionId: null,

            // Tracking intervals (milliseconds)
            sendInterval: 30000,  // Send data every 30 seconds
            inactivityThreshold: 300000,  // 5 minutes

            // Detection thresholds
            randomClickThreshold: 20,  // clicks in 30 seconds
            repetitiveClickThreshold: 10,  // same location in 60 seconds

            // Debug mode
            debug: false
        },

        // Tracking state
        state: {
            sessionStartTime: null,
            lastActivityTime: null,
            lastMousePosition: { x: 0, y: 0 },
            isPageVisible: true,
            pageHiddenStartTime: null,

            // Counters
            mouseMovements: 0,
            mouseClicks: 0,
            keyPresses: 0,
            scrolls: 0,

            // Click tracking
            recentClicks: [],  // { x, y, timestamp }

            // Inactivity tracking
            mouseInactiveStart: null,
            keyInactiveStart: null,

            // Problem tracking
            currentProblem: null,
            problemStartTime: null,
            problems: []  // { id, startTime, endTime, isCorrect }
        },

        // Event queue
        eventQueue: [],

        /**
         * Initialize tracker
         * @param {Object} options - Configuration options
         */
        init: function(options) {
            // Validate required options
            if (!options.apiEndpoint || !options.studentId || !options.courseId) {
                console.error('DMNTracker: Missing required configuration');
                return false;
            }

            // Merge config
            Object.assign(this.config, options);

            // Initialize state
            this.state.sessionStartTime = Date.now();
            this.state.lastActivityTime = Date.now();

            // Start session
            this.startSession();

            // Attach event listeners
            this.attachEventListeners();

            // Start periodic sending
            this.startPeriodicSend();

            // Cleanup on page unload
            window.addEventListener('beforeunload', this.endSession.bind(this));

            this.log('DMNTracker initialized');
            return true;
        },

        /**
         * Start tracking session
         */
        startSession: function() {
            this.sendEvent('session_start', {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                screenResolution: window.screen.width + 'x' + window.screen.height,
                viewportSize: window.innerWidth + 'x' + window.innerHeight
            });
        },

        /**
         * End tracking session
         */
        endSession: function() {
            const sessionDuration = Date.now() - this.state.sessionStartTime;

            this.sendEvent('session_end', {
                timestamp: new Date().toISOString(),
                totalDuration: sessionDuration,
                mouseMovements: this.state.mouseMovements,
                mouseClicks: this.state.mouseClicks,
                keyPresses: this.state.keyPresses,
                scrolls: this.state.scrolls
            }, true);  // Synchronous send
        },

        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            // Mouse events
            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            document.addEventListener('click', this.handleMouseClick.bind(this));

            // Keyboard events
            document.addEventListener('keydown', this.handleKeyPress.bind(this));

            // Scroll events
            document.addEventListener('scroll', this.handleScroll.bind(this), true);

            // Page visibility
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

            // Window focus
            window.addEventListener('focus', this.handleWindowFocus.bind(this));
            window.addEventListener('blur', this.handleWindowBlur.bind(this));

            this.log('Event listeners attached');
        },

        /**
         * Handle mouse movement
         */
        handleMouseMove: function(e) {
            this.state.mouseMovements++;
            this.state.lastMousePosition = { x: e.clientX, y: e.clientY };
            this.updateActivity();

            // Reset mouse inactivity timer
            if (this.state.mouseInactiveStart) {
                const inactiveDuration = Date.now() - this.state.mouseInactiveStart;
                if (inactiveDuration > this.config.inactivityThreshold) {
                    this.queueEvent('mouse_inactive', {
                        duration: inactiveDuration
                    });
                }
                this.state.mouseInactiveStart = null;
            }
        },

        /**
         * Handle mouse click
         */
        handleMouseClick: function(e) {
            this.state.mouseClicks++;
            this.updateActivity();

            const clickData = {
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now(),
                target: e.target.tagName,
                targetId: e.target.id,
                targetClass: e.target.className
            };

            this.state.recentClicks.push(clickData);

            // Check for random/repetitive clicking
            this.detectAbnormalClicking();

            this.queueEvent('mouse_click', clickData);
        },

        /**
         * Handle key press
         */
        handleKeyPress: function(e) {
            this.state.keyPresses++;
            this.updateActivity();

            // Reset keyboard inactivity timer
            if (this.state.keyInactiveStart) {
                const inactiveDuration = Date.now() - this.state.keyInactiveStart;
                if (inactiveDuration > this.config.inactivityThreshold) {
                    this.queueEvent('key_inactive', {
                        duration: inactiveDuration
                    });
                }
                this.state.keyInactiveStart = null;
            }

            this.queueEvent('key_press', {
                key: e.key,
                code: e.code,
                timestamp: Date.now()
            });
        },

        /**
         * Handle scroll
         */
        handleScroll: function(e) {
            this.state.scrolls++;
            this.updateActivity();

            this.queueEvent('scroll', {
                scrollY: window.scrollY,
                scrollX: window.scrollX,
                timestamp: Date.now()
            });
        },

        /**
         * Handle visibility change
         */
        handleVisibilityChange: function() {
            if (document.hidden) {
                // Page hidden
                this.state.isPageVisible = false;
                this.state.pageHiddenStartTime = Date.now();

                this.queueEvent('page_hidden', {
                    timestamp: new Date().toISOString()
                });
            } else {
                // Page visible
                this.state.isPageVisible = true;

                if (this.state.pageHiddenStartTime) {
                    const hiddenDuration = Date.now() - this.state.pageHiddenStartTime;

                    this.queueEvent('page_visible', {
                        timestamp: new Date().toISOString(),
                        hiddenDuration: hiddenDuration
                    });

                    this.state.pageHiddenStartTime = null;
                }
            }
        },

        /**
         * Handle window focus
         */
        handleWindowFocus: function() {
            this.updateActivity();
        },

        /**
         * Handle window blur
         */
        handleWindowBlur: function() {
            // Window lost focus
        },

        /**
         * Update activity timestamp
         */
        updateActivity: function() {
            this.state.lastActivityTime = Date.now();
        },

        /**
         * Detect abnormal clicking patterns
         */
        detectAbnormalClicking: function() {
            const now = Date.now();

            // Remove old clicks (older than 60 seconds)
            this.state.recentClicks = this.state.recentClicks.filter(
                click => now - click.timestamp < 60000
            );

            // Check for random clicking (20+ clicks in 30 seconds)
            const recentClicksIn30s = this.state.recentClicks.filter(
                click => now - click.timestamp < 30000
            );

            if (recentClicksIn30s.length >= this.config.randomClickThreshold) {
                this.queueEvent('random_clicks', {
                    clickCount: recentClicksIn30s.length,
                    timeWindow: 30000,
                    clicks: recentClicksIn30s
                });

                // Clear to avoid duplicate detection
                this.state.recentClicks = [];
            }

            // Check for repetitive clicking (10+ clicks in same location)
            const clicksByLocation = {};
            this.state.recentClicks.forEach(click => {
                const key = Math.floor(click.x / 50) + '_' + Math.floor(click.y / 50);  // 50px grid
                clicksByLocation[key] = (clicksByLocation[key] || 0) + 1;
            });

            for (const [location, count] of Object.entries(clicksByLocation)) {
                if (count >= this.config.repetitiveClickThreshold) {
                    this.queueEvent('repetitive_clicking', {
                        location: location,
                        clickCount: count,
                        timeWindow: 60000
                    });

                    // Clear to avoid duplicate detection
                    this.state.recentClicks = [];
                    break;
                }
            }
        },

        /**
         * Check for inactivity
         */
        checkInactivity: function() {
            const now = Date.now();
            const timeSinceActivity = now - this.state.lastActivityTime;

            // Mouse inactivity
            if (!this.state.mouseInactiveStart && timeSinceActivity > this.config.inactivityThreshold) {
                this.state.mouseInactiveStart = this.state.lastActivityTime;
            }

            // Keyboard inactivity
            if (!this.state.keyInactiveStart && timeSinceActivity > this.config.inactivityThreshold) {
                this.state.keyInactiveStart = this.state.lastActivityTime;
            }
        },

        /**
         * Queue event for sending
         */
        queueEvent: function(eventType, eventData) {
            this.eventQueue.push({
                type: eventType,
                data: eventData,
                timestamp: new Date().toISOString()
            });

            this.log('Event queued:', eventType, eventData);
        },

        /**
         * Send event immediately
         */
        sendEvent: function(eventType, eventData, synchronous = false) {
            const payload = {
                studentId: this.config.studentId,
                courseId: this.config.courseId,
                activityId: this.config.activityId,
                sessionId: this.config.sessionId,
                eventType: eventType,
                eventData: eventData,
                timestamp: new Date().toISOString()
            };

            if (synchronous) {
                // Use sendBeacon for synchronous sending (e.g., on page unload)
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(this.config.apiEndpoint + '/track', blob);
            } else {
                // Use fetch for asynchronous sending
                fetch(this.config.apiEndpoint + '/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }).catch(err => {
                    console.error('DMNTracker: Failed to send event', err);
                });
            }

            this.log('Event sent:', eventType);
        },

        /**
         * Send queued events
         */
        sendQueuedEvents: function() {
            if (this.eventQueue.length === 0) {
                return;
            }

            // Check inactivity before sending
            this.checkInactivity();

            const payload = {
                studentId: this.config.studentId,
                courseId: this.config.courseId,
                activityId: this.config.activityId,
                sessionId: this.config.sessionId,
                events: this.eventQueue,
                stats: {
                    mouseMovements: this.state.mouseMovements,
                    mouseClicks: this.state.mouseClicks,
                    keyPresses: this.state.keyPresses,
                    scrolls: this.state.scrolls,
                    sessionDuration: Date.now() - this.state.sessionStartTime
                }
            };

            fetch(this.config.apiEndpoint + '/track/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                this.log('Batch sent successfully', data);

                // Update session ID if provided
                if (data.sessionId) {
                    this.config.sessionId = data.sessionId;
                }

                // Clear queue
                this.eventQueue = [];
            })
            .catch(err => {
                console.error('DMNTracker: Failed to send batch', err);
            });

            this.log('Sending queued events:', this.eventQueue.length);
        },

        /**
         * Start periodic sending
         */
        startPeriodicSend: function() {
            setInterval(() => {
                this.sendQueuedEvents();
            }, this.config.sendInterval);

            this.log('Periodic sending started');
        },

        /**
         * Track problem start
         */
        startProblem: function(problemId, problemData) {
            this.state.currentProblem = problemId;
            this.state.problemStartTime = Date.now();

            this.queueEvent('problem_started', {
                problemId: problemId,
                problemData: problemData,
                timestamp: new Date().toISOString()
            });
        },

        /**
         * Track problem submission
         */
        submitProblem: function(problemId, answer, isCorrect) {
            const problemDuration = Date.now() - this.state.problemStartTime;

            this.state.problems.push({
                id: problemId,
                startTime: this.state.problemStartTime,
                endTime: Date.now(),
                duration: problemDuration,
                isCorrect: isCorrect
            });

            this.queueEvent('problem_submitted', {
                problemId: problemId,
                answer: answer,
                isCorrect: isCorrect,
                duration: problemDuration,
                timestamp: new Date().toISOString()
            });

            if (isCorrect) {
                this.queueEvent('answer_correct', {
                    problemId: problemId
                });
            } else {
                this.queueEvent('answer_incorrect', {
                    problemId: problemId
                });
            }

            this.state.currentProblem = null;
            this.state.problemStartTime = null;
        },

        /**
         * Get current statistics
         */
        getStats: function() {
            return {
                sessionDuration: Date.now() - this.state.sessionStartTime,
                mouseMovements: this.state.mouseMovements,
                mouseClicks: this.state.mouseClicks,
                keyPresses: this.state.keyPresses,
                scrolls: this.state.scrolls,
                problemsCompleted: this.state.problems.length,
                correctAnswers: this.state.problems.filter(p => p.isCorrect).length,
                queuedEvents: this.eventQueue.length
            };
        },

        /**
         * Debug logging
         */
        log: function(...args) {
            if (this.config.debug) {
                console.log('[DMNTracker]', ...args);
            }
        }
    };

    // Expose to global scope
    window.DMNTracker = DMNTracker;

})(window);
