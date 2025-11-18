/**
 * Student behavior tracking module for reasoning clip detection
 *
 * @module     local_reasoningclip/tracker
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    /**
     * Tracker class for monitoring student interactions
     */
    var Tracker = function(config) {
        this.config = {
            questionId: config.questionId || 0,
            userId: config.userId || 0,
            courseId: config.courseId || 0,
            cmId: config.cmId || 0,
            sessionId: this.generateSessionId(),
            autoAnalyze: config.autoAnalyze !== undefined ? config.autoAnalyze : true,
            batchSize: config.batchSize || 10,
            sendInterval: config.sendInterval || 30000  // Send every 30 seconds
        };

        this.events = [];
        this.lastEventTime = Date.now();
        this.timers = {};

        this.init();
    };

    /**
     * Initialize tracker
     */
    Tracker.prototype.init = function() {
        this.attachEventListeners();
        this.startPeriodicSend();

        // Send remaining events when page unloads
        var self = this;
        $(window).on('beforeunload', function() {
            if (self.events.length > 0) {
                self.sendEvents(true);
            }
        });
    };

    /**
     * Generate unique session ID
     */
    Tracker.prototype.generateSessionId = function() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    /**
     * Attach event listeners to track student behavior
     */
    Tracker.prototype.attachEventListeners = function() {
        var self = this;

        // Track input changes
        $(document).on('input', 'input[type="text"], input[type="number"], textarea', function(e) {
            self.recordEvent('input', {
                element: e.target.tagName,
                name: e.target.name || '',
                value: e.target.value,
                length: e.target.value.length
            });
        });

        // Track clicks on interactive elements
        $(document).on('click', 'button, input[type="submit"], input[type="button"], a.btn', function(e) {
            self.recordEvent('click', {
                element: e.target.tagName,
                text: $(e.target).text() || '',
                classes: e.target.className,
                id: e.target.id || ''
            });
        });

        // Track radio/checkbox changes
        $(document).on('change', 'input[type="radio"], input[type="checkbox"], select', function(e) {
            self.recordEvent('change', {
                element: e.target.tagName,
                type: e.target.type,
                name: e.target.name || '',
                value: e.target.value,
                checked: e.target.checked
            });
        });

        // Track focus (when student starts working on input)
        $(document).on('focus', 'input, textarea, select', function(e) {
            self.recordEvent('focus', {
                element: e.target.tagName,
                name: e.target.name || ''
            });
        });

        // Track blur (when student leaves input)
        $(document).on('blur', 'input, textarea, select', function(e) {
            self.recordEvent('blur', {
                element: e.target.tagName,
                name: e.target.name || '',
                value: e.target.value
            });
        });

        // Track answer submissions
        $(document).on('submit', 'form.questionform, form[data-question-form]', function(e) {
            var formData = {};
            $(this).find('input, select, textarea').each(function() {
                if (this.name) {
                    formData[this.name] = $(this).val();
                }
            });

            self.recordEvent('answer_submit', {
                form_data: formData,
                form_id: this.id || ''
            });

            // Force send events on submission
            setTimeout(function() {
                self.sendEvents(false);
            }, 100);
        });

        // Track mouse movement patterns (throttled)
        var mouseMoveThrottle = null;
        $(document).on('mousemove', function(e) {
            if (mouseMoveThrottle) {
                clearTimeout(mouseMoveThrottle);
            }

            mouseMoveThrottle = setTimeout(function() {
                self.recordEvent('mousemove', {
                    x: e.pageX,
                    y: e.pageY
                }, false); // Don't track every mouse move
            }, 1000);
        });

        // Track scroll behavior
        var scrollThrottle = null;
        $(window).on('scroll', function() {
            if (scrollThrottle) {
                clearTimeout(scrollThrottle);
            }

            scrollThrottle = setTimeout(function() {
                self.recordEvent('scroll', {
                    scrollTop: $(window).scrollTop(),
                    scrollHeight: $(document).height()
                }, false);
            }, 500);
        });
    };

    /**
     * Record an event
     *
     * @param {string} eventType Type of event
     * @param {object} eventData Event data
     * @param {boolean} trackTime Whether to track time gaps (default true)
     */
    Tracker.prototype.recordEvent = function(eventType, eventData, trackTime) {
        trackTime = trackTime !== undefined ? trackTime : true;

        var now = Date.now();
        var timeGap = trackTime ? (now - this.lastEventTime) / 1000 : 0;

        var event = {
            userid: this.config.userId,
            sessionid: this.config.sessionId,
            questionid: this.config.questionId,
            eventtype: eventType,
            eventdata: JSON.stringify({
                data: eventData,
                time_gap: timeGap,
                timestamp: now
            }),
            timecreated: Math.floor(now / 1000)
        };

        this.events.push(event);
        this.lastEventTime = now;

        // Auto-send if batch size reached
        if (this.events.length >= this.config.batchSize) {
            this.sendEvents(false);
        }
    };

    /**
     * Send events to server
     *
     * @param {boolean} synchronous Whether to send synchronously (for page unload)
     */
    Tracker.prototype.sendEvents = function(synchronous) {
        if (this.events.length === 0) {
            return;
        }

        var eventsToSend = this.events.slice();
        this.events = [];

        var self = this;

        if (synchronous) {
            // Use synchronous XHR for page unload (not ideal but necessary)
            $.ajax({
                url: M.cfg.wwwroot + '/local/reasoningclip/ajax/save_events.php',
                type: 'POST',
                async: false,
                data: {
                    sesskey: M.cfg.sesskey,
                    events: JSON.stringify(eventsToSend)
                },
                dataType: 'json'
            });
        } else {
            // Use Moodle's Ajax API for async
            Ajax.call([{
                methodname: 'local_reasoningclip_save_events',
                args: {
                    events: eventsToSend
                },
                done: function(response) {
                    if (response.success && self.config.autoAnalyze) {
                        // Trigger analysis if auto-analyze is enabled
                        self.analyzeEvents();
                    }
                },
                fail: function(error) {
                    Notification.exception(error);
                }
            }]);
        }
    };

    /**
     * Start periodic sending of events
     */
    Tracker.prototype.startPeriodicSend = function() {
        var self = this;
        this.timers.periodicSend = setInterval(function() {
            if (self.events.length > 0) {
                self.sendEvents(false);
            }
        }, this.config.sendInterval);
    };

    /**
     * Trigger reasoning moment analysis on server
     */
    Tracker.prototype.analyzeEvents = function() {
        Ajax.call([{
            methodname: 'local_reasoningclip_analyze_session',
            args: {
                sessionid: this.config.sessionId,
                questionid: this.config.questionId,
                userid: this.config.userId,
                courseid: this.config.courseId,
                cmid: this.config.cmId
            },
            done: function(response) {
                if (response.clips && response.clips.length > 0) {
                    // Optional: Notify about detected clips
                    window.console && console.log('Reasoning clips detected:', response.clips);
                }
            },
            fail: function(error) {
                // Silent fail for analysis
                window.console && console.error('Analysis failed:', error);
            }
        }]);
    };

    /**
     * Manually trigger clip for a specific moment
     *
     * @param {string} clipType Type of clip to create
     * @param {object} additionalData Additional data for the clip
     */
    Tracker.prototype.manualClip = function(clipType, additionalData) {
        this.recordEvent('manual_clip', {
            clip_type: clipType,
            additional_data: additionalData
        });
        this.sendEvents(false);
    };

    /**
     * Stop tracking and cleanup
     */
    Tracker.prototype.destroy = function() {
        // Send remaining events
        this.sendEvents(true);

        // Clear timers
        for (var timer in this.timers) {
            if (this.timers.hasOwnProperty(timer)) {
                clearInterval(this.timers[timer]);
            }
        }

        // Remove event listeners
        $(document).off('.reasoningclip');
        $(window).off('.reasoningclip');
    };

    /**
     * Public initialization function
     *
     * @param {object} config Configuration object
     * @return {Tracker} Tracker instance
     */
    var init = function(config) {
        return new Tracker(config);
    };

    return {
        init: init,
        Tracker: Tracker
    };
});
