/**
 * Focus Highlights Tracker
 * Client-side activity tracking for Moodle integration
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiBaseUrl: '/focus-highlights/api',
        trackingInterval: 5000, // 5 seconds
        idleThreshold: 60000, // 1 minute
        minSessionDuration: 30000 // 30 seconds
    };

    class FocusTracker {
        constructor(userId, courseId, activityId) {
            this.userId = userId;
            this.courseId = courseId;
            this.activityId = activityId || null;
            this.sessionId = null;
            this.isTracking = false;
            this.lastActivityTime = Date.now();
            this.sessionStartTime = null;
            this.activityCount = 0;
            this.answerStartTime = null;

            this.init();
        }

        init() {
            // Start session
            this.startSession();

            // Set up event listeners
            this.setupEventListeners();

            // Start periodic tracking
            this.startPeriodicTracking();

            // Handle page unload
            window.addEventListener('beforeunload', () => {
                this.endSession();
            });
        }

        setupEventListeners() {
            // Track clicks
            document.addEventListener('click', (e) => {
                this.recordActivity('click', {
                    element: e.target.tagName,
                    className: e.target.className,
                    id: e.target.id
                });
            });

            // Track keyboard input
            document.addEventListener('keypress', () => {
                this.recordActivity('keypress', {});
            });

            // Track mouse movement (throttled)
            let mouseMoveTimeout;
            document.addEventListener('mousemove', () => {
                clearTimeout(mouseMoveTimeout);
                mouseMoveTimeout = setTimeout(() => {
                    this.updateLastActivity();
                }, 1000);
            });

            // Track form submissions (quiz answers, etc.)
            document.addEventListener('submit', (e) => {
                const form = e.target;
                const formData = new FormData(form);
                const data = {};

                formData.forEach((value, key) => {
                    data[key] = value;
                });

                this.recordActivity('form_submit', {
                    formId: form.id,
                    formClass: form.className,
                    fieldCount: formData.length
                });
            });

            // Track focus and blur
            window.addEventListener('focus', () => {
                this.recordActivity('page_focus', {});
            });

            window.addEventListener('blur', () => {
                this.recordActivity('page_blur', {});
            });

            // Track scroll (throttled)
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.recordActivity('scroll', {
                        scrollY: window.scrollY,
                        scrollPercentage: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                    });
                }, 2000);
            });
        }

        startSession() {
            fetch(CONFIG.apiBaseUrl + '/track_activity.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'start_session',
                    user_id: this.userId,
                    course_id: this.courseId,
                    activity_id: this.activityId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.sessionId = data.session_id;
                    this.isTracking = true;
                    this.sessionStartTime = Date.now();
                    console.log('Focus tracking started. Session ID:', this.sessionId);
                }
            })
            .catch(error => {
                console.error('Error starting session:', error);
            });
        }

        recordActivity(activityType, activityData) {
            if (!this.sessionId || !this.isTracking) {
                return;
            }

            this.activityCount++;
            this.updateLastActivity();

            // Add timestamp and session info to activity data
            activityData.timestamp = new Date().toISOString();
            activityData.sessionTime = Date.now() - this.sessionStartTime;

            // Calculate response time for answer submissions
            if (activityType === 'submit_answer' && this.answerStartTime) {
                activityData.response_time = (Date.now() - this.answerStartTime) / 1000;
                this.answerStartTime = null;
            }

            fetch(CONFIG.apiBaseUrl + '/track_activity.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'log_activity',
                    session_id: this.sessionId,
                    user_id: this.userId,
                    course_id: this.courseId,
                    activity_type: activityType,
                    activity_data: activityData
                })
            })
            .catch(error => {
                console.error('Error logging activity:', error);
            });
        }

        updateLastActivity() {
            this.lastActivityTime = Date.now();
        }

        startPeriodicTracking() {
            setInterval(() => {
                if (!this.isTracking) return;

                const timeSinceLastActivity = Date.now() - this.lastActivityTime;

                if (timeSinceLastActivity > CONFIG.idleThreshold) {
                    // User is idle
                    this.recordActivity('idle', {
                        idleDuration: timeSinceLastActivity
                    });
                } else {
                    // User is active
                    this.recordActivity('heartbeat', {
                        activityCount: this.activityCount,
                        sessionDuration: Date.now() - this.sessionStartTime
                    });
                }
            }, CONFIG.trackingInterval);
        }

        endSession() {
            if (!this.sessionId || !this.isTracking) {
                return;
            }

            const sessionDuration = Date.now() - this.sessionStartTime;

            // Only end session if it meets minimum duration
            if (sessionDuration < CONFIG.minSessionDuration) {
                console.log('Session too short, not ending');
                return;
            }

            // Use sendBeacon for reliable transmission on page unload
            const data = JSON.stringify({
                action: 'end_session',
                session_id: this.sessionId,
                user_id: this.userId,
                course_id: this.courseId
            });

            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon(CONFIG.apiBaseUrl + '/track_activity.php', blob);

            this.isTracking = false;
            console.log('Focus tracking ended. Session ID:', this.sessionId);
        }

        // Public method to record quiz/assignment answers
        recordAnswer(isCorrect, responseTime) {
            this.recordActivity('submit_answer', {
                is_correct: isCorrect,
                response_time: responseTime
            });
        }

        // Public method to start timing an answer
        startAnswer() {
            this.answerStartTime = Date.now();
        }
    }

    // Expose to global scope
    window.FocusTracker = FocusTracker;

    // Auto-initialize if data attributes are present
    document.addEventListener('DOMContentLoaded', function() {
        const trackerElement = document.querySelector('[data-focus-tracker]');

        if (trackerElement) {
            const userId = trackerElement.getAttribute('data-user-id');
            const courseId = trackerElement.getAttribute('data-course-id');
            const activityId = trackerElement.getAttribute('data-activity-id');

            if (userId && courseId) {
                window.focusTrackerInstance = new FocusTracker(userId, courseId, activityId);
            }
        }
    });

})();
