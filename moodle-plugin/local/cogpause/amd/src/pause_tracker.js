/**
 * Cognitive Pause Tracker - Client-side JavaScript
 * Tracks student pauses during quiz attempts and sends data to server
 *
 * @module     local_cogpause/pause_tracker
 * @package    local_cogpause
 * @copyright  2024 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    /**
     * Pause Tracker class
     */
    var PauseTracker = function(config) {
        this.config = config;
        this.isTracking = false;
        this.currentPause = null;
        this.lastActivity = Date.now();
        this.sessionId = this.generateSessionId();
        this.pauseEvents = [];
        this.mouseMovements = [];
        this.scrollEvents = [];
        this.tabSwitches = 0;
        this.activeElement = null;
        this.questionData = this.extractQuestionData();

        // Bind methods
        this.onActivity = this.onActivity.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onScroll = this.onScroll.bind(this);
        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.checkPause = this.checkPause.bind(this);
        this.sendPauseData = this.sendPauseData.bind(this);

        this.init();
    };

    /**
     * Initialize the tracker
     */
    PauseTracker.prototype.init = function() {
        var self = this;

        // Attach event listeners for activity detection
        $(document).on('keydown keyup click input change', this.onActivity);
        $(document).on('mousemove', this.onMouseMove);
        $(document).on('scroll', this.onScroll);
        $(document).on('visibilitychange', this.onVisibilityChange);
        $(window).on('focus blur', this.onFocus);

        // Track input field focus
        $('input, textarea, select').on('focus', function() {
            self.activeElement = {
                id: $(this).attr('id') || $(this).attr('name'),
                type: $(this).prop('tagName').toLowerCase(),
                value: $(this).val()
            };
        });

        // Start pause detection interval
        this.checkInterval = setInterval(this.checkPause, 500); // Check every 500ms

        // Send data periodically
        this.sendInterval = setInterval(this.sendPauseData, 10000); // Send every 10 seconds

        // Send data before page unload
        $(window).on('beforeunload', function() {
            self.sendPauseData(true); // Synchronous send
        });

        this.isTracking = true;
        console.log('Cognitive Pause Tracker initialized', this.config);
    };

    /**
     * Generate unique session ID
     */
    PauseTracker.prototype.generateSessionId = function() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    /**
     * Extract question data from the page
     */
    PauseTracker.prototype.extractQuestionData = function() {
        var data = {
            quizId: null,
            questionId: null,
            attemptId: null
        };

        // Try to extract from URL parameters
        var urlParams = new URLSearchParams(window.location.search);
        data.attemptId = urlParams.get('attempt') || urlParams.get('attemptid');

        // Try to extract quiz ID from page elements
        var quizElement = $('[data-quiz-id]').first();
        if (quizElement.length) {
            data.quizId = quizElement.data('quiz-id');
        }

        // Try to extract question ID from page elements
        var questionElement = $('.que').first();
        if (questionElement.length) {
            var questionId = questionElement.attr('id');
            if (questionId) {
                // Extract numeric ID from format like "question-123"
                var match = questionId.match(/question-(\d+)/);
                if (match) {
                    data.questionId = match[1];
                }
            }
        }

        // Alternative: check for question ID in hidden inputs
        var hiddenQuestionId = $('input[name="questionid"]').val();
        if (hiddenQuestionId) {
            data.questionId = hiddenQuestionId;
        }

        return data;
    };

    /**
     * Update question data (called when page changes)
     */
    PauseTracker.prototype.updateQuestionData = function() {
        this.questionData = this.extractQuestionData();
    };

    /**
     * Handle any user activity
     */
    PauseTracker.prototype.onActivity = function(event) {
        var now = Date.now();
        var timeSinceLast = now - this.lastActivity;

        // If there was a pause in progress, end it
        if (this.currentPause && timeSinceLast >= this.config.pauseThreshold) {
            this.endPause(now);
        }

        this.lastActivity = now;
    };

    /**
     * Handle mouse movement
     */
    PauseTracker.prototype.onMouseMove = function(event) {
        this.mouseMovements.push({
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now()
        });

        // Keep only last 100 movements
        if (this.mouseMovements.length > 100) {
            this.mouseMovements.shift();
        }

        this.onActivity(event);
    };

    /**
     * Handle scroll events
     */
    PauseTracker.prototype.onScroll = function(event) {
        this.scrollEvents.push({
            scrollTop: $(window).scrollTop(),
            timestamp: Date.now()
        });

        // Keep only last 50 scroll events
        if (this.scrollEvents.length > 50) {
            this.scrollEvents.shift();
        }

        this.onActivity(event);
    };

    /**
     * Handle visibility change (tab switching)
     */
    PauseTracker.prototype.onVisibilityChange = function() {
        if (document.hidden) {
            this.tabSwitches++;
            // Mark current time as potential distraction pause start
            this.distractionStartTime = Date.now();
        } else {
            // Tab returned to focus
            if (this.distractionStartTime) {
                var distractionDuration = Date.now() - this.distractionStartTime;
                if (distractionDuration >= this.config.pauseThreshold) {
                    // Record as distraction pause
                    this.recordPause({
                        startTime: this.distractionStartTime,
                        endTime: Date.now(),
                        duration: distractionDuration,
                        type: 'distraction',
                        confidence: 0.9
                    });
                }
                this.distractionStartTime = null;
            }
            this.onActivity({ type: 'visibilitychange' });
        }
    };

    /**
     * Handle focus/blur events
     */
    PauseTracker.prototype.onFocus = function(event) {
        if (event.type === 'blur') {
            this.tabSwitches++;
        }
        this.onActivity(event);
    };

    /**
     * Check for pause condition
     */
    PauseTracker.prototype.checkPause = function() {
        var now = Date.now();
        var timeSinceLast = now - this.lastActivity;

        // If enough time has passed without activity, start/continue pause
        if (timeSinceLast >= this.config.pauseThreshold) {
            if (!this.currentPause) {
                this.startPause(this.lastActivity);
            }
        } else {
            // Activity detected, end pause if one was in progress
            if (this.currentPause) {
                this.endPause(now);
            }
        }
    };

    /**
     * Start a new pause
     */
    PauseTracker.prototype.startPause = function(startTime) {
        this.currentPause = {
            startTime: startTime,
            mouseMovementsBefore: this.mouseMovements.slice(-20), // Last 20 movements
            scrollEventsBefore: this.scrollEvents.slice(-10), // Last 10 scrolls
            activeElement: this.activeElement,
            tabSwitchesBefore: this.tabSwitches
        };

        console.log('Pause started at', new Date(startTime));
    };

    /**
     * End current pause
     */
    PauseTracker.prototype.endPause = function(endTime) {
        if (!this.currentPause) {
            return;
        }

        var duration = endTime - this.currentPause.startTime;

        // Classify pause type based on duration and context
        var classification = this.classifyPause(duration, this.currentPause);

        var pauseData = {
            startTime: this.currentPause.startTime,
            endTime: endTime,
            duration: duration,
            type: classification.type,
            confidence: classification.confidence,
            mouseMovements: this.currentPause.mouseMovementsBefore,
            scrollEvents: this.currentPause.scrollEventsBefore,
            activeElement: this.currentPause.activeElement,
            tabSwitches: this.tabSwitches - this.currentPause.tabSwitchesBefore
        };

        this.recordPause(pauseData);
        this.currentPause = null;

        console.log('Pause ended, duration:', duration + 'ms', 'type:', classification.type);
    };

    /**
     * Classify pause type based on duration and context
     */
    PauseTracker.prototype.classifyPause = function(duration, pauseContext) {
        var type = 'unknown';
        var confidence = 0.5;

        if (duration < this.config.thinkingThreshold) {
            // Short pause - likely thinking
            type = 'thinking';
            confidence = 0.8;
        } else if (duration < this.config.confusionThreshold) {
            // Medium pause - confusion or re-reading
            // Check if there was scrolling - might be re-reading
            if (pauseContext.scrollEventsBefore.length > 0) {
                type = 're_reading';
                confidence = 0.75;
            } else {
                type = 'confusion';
                confidence = 0.7;
            }
        } else if (duration < this.config.distractionThreshold) {
            // Long pause - likely confusion
            type = 'confusion';
            confidence = 0.8;
        } else {
            // Very long pause - distraction
            type = 'distraction';
            confidence = 0.85;
        }

        // Adjust confidence based on tab switches
        if (pauseContext.tabSwitchesBefore !== this.tabSwitches) {
            type = 'distraction';
            confidence = 0.9;
        }

        return { type: type, confidence: confidence };
    };

    /**
     * Record a pause event
     */
    PauseTracker.prototype.recordPause = function(pauseData) {
        // Update question data in case it changed
        this.updateQuestionData();

        // Add context information
        var fullPauseData = {
            userId: this.config.userId,
            courseId: this.config.courseId,
            quizId: this.questionData.quizId,
            questionId: this.questionData.questionId,
            attemptId: this.questionData.attemptId,
            pauseStartTime: pauseData.startTime,
            pauseEndTime: pauseData.endTime,
            pauseDuration: pauseData.duration,
            pauseType: pauseData.type,
            confidenceScore: pauseData.confidence,
            inputFieldId: pauseData.activeElement ? pauseData.activeElement.id : null,
            previousInputLength: pauseData.activeElement ? pauseData.activeElement.value.length : 0,
            mouseMovements: pauseData.mouseMovements,
            scrollEvents: pauseData.scrollEvents,
            tabSwitches: pauseData.tabSwitches,
            sessionId: this.sessionId,
            deviceType: this.getDeviceType(),
            browser: this.getBrowser(),
            questionProgress: this.calculateQuestionProgress()
        };

        this.pauseEvents.push(fullPauseData);

        // Trigger visual feedback for debugging (optional)
        this.showPauseIndicator(pauseData.type);
    };

    /**
     * Calculate question progress percentage
     */
    PauseTracker.prototype.calculateQuestionProgress = function() {
        // Count filled input fields
        var totalInputs = $('.que:visible input[type="text"], .que:visible textarea').length;
        if (totalInputs === 0) {
            return 0;
        }

        var filledInputs = $('.que:visible input[type="text"], .que:visible textarea').filter(function() {
            return $(this).val().trim() !== '';
        }).length;

        return Math.round((filledInputs / totalInputs) * 100);
    };

    /**
     * Get device type
     */
    PauseTracker.prototype.getDeviceType = function() {
        var width = $(window).width();
        if (width < 768) {
            return 'mobile';
        } else if (width < 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    };

    /**
     * Get browser name
     */
    PauseTracker.prototype.getBrowser = function() {
        var userAgent = navigator.userAgent;
        if (userAgent.indexOf('Firefox') > -1) {
            return 'Firefox';
        } else if (userAgent.indexOf('Chrome') > -1) {
            return 'Chrome';
        } else if (userAgent.indexOf('Safari') > -1) {
            return 'Safari';
        } else if (userAgent.indexOf('Edge') > -1) {
            return 'Edge';
        } else {
            return 'Unknown';
        }
    };

    /**
     * Show visual pause indicator (for debugging/feedback)
     */
    PauseTracker.prototype.showPauseIndicator = function(pauseType) {
        // Create or update indicator element
        var indicator = $('#cogpause-indicator');
        if (indicator.length === 0) {
            indicator = $('<div id="cogpause-indicator"></div>').css({
                position: 'fixed',
                top: '10px',
                right: '10px',
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: '12px',
                zIndex: 9999,
                display: 'none'
            });
            $('body').append(indicator);
        }

        // Set color based on pause type
        var colors = {
            thinking: '#4CAF50',
            confusion: '#FF9800',
            distraction: '#F44336',
            re_reading: '#2196F3'
        };

        indicator.css('backgroundColor', colors[pauseType] || '#999')
            .text('Pause: ' + pauseType)
            .fadeIn()
            .delay(2000)
            .fadeOut();
    };

    /**
     * Send pause data to server
     */
    PauseTracker.prototype.sendPauseData = function(synchronous) {
        if (this.pauseEvents.length === 0) {
            return;
        }

        var dataToSend = this.pauseEvents.slice(); // Copy array
        this.pauseEvents = []; // Clear local buffer

        console.log('Sending', dataToSend.length, 'pause events to server');

        if (synchronous) {
            // Synchronous send for page unload
            $.ajax({
                url: this.config.ajaxUrl,
                method: 'POST',
                data: {
                    sesskey: M.cfg.sesskey,
                    action: 'save_pause_events',
                    events: JSON.stringify(dataToSend)
                },
                async: false
            });
        } else {
            // Asynchronous send
            $.ajax({
                url: this.config.ajaxUrl,
                method: 'POST',
                data: {
                    sesskey: M.cfg.sesskey,
                    action: 'save_pause_events',
                    events: JSON.stringify(dataToSend)
                },
                success: function(response) {
                    if (response.success) {
                        console.log('Pause data saved successfully');
                    } else {
                        console.error('Error saving pause data:', response.error);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error saving pause data:', error);
                    // Put data back in queue for retry
                    this.pauseEvents = dataToSend.concat(this.pauseEvents);
                }.bind(this)
            });
        }
    };

    /**
     * Destroy the tracker
     */
    PauseTracker.prototype.destroy = function() {
        this.isTracking = false;

        // Send any remaining data
        this.sendPauseData(true);

        // Remove event listeners
        $(document).off('keydown keyup click input change', this.onActivity);
        $(document).off('mousemove', this.onMouseMove);
        $(document).off('scroll', this.onScroll);
        $(document).off('visibilitychange', this.onVisibilityChange);
        $(window).off('focus blur', this.onFocus);

        // Clear intervals
        clearInterval(this.checkInterval);
        clearInterval(this.sendInterval);

        console.log('Cognitive Pause Tracker destroyed');
    };

    return {
        /**
         * Initialize the pause tracker
         * @param {Object} config Configuration object
         */
        init: function(config) {
            // Create tracker instance
            window.cogPauseTracker = new PauseTracker(config);
        }
    };
});
