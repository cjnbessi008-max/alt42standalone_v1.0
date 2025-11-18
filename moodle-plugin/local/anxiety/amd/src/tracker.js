// This file is part of Moodle - http://moodle.org/
//
// Anxiety Detection Tracker - Client-side JavaScript
//
// @package    local_anxiety
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

define(['jquery', 'core/ajax'], function($, Ajax) {

    var AnxietyTracker = {
        // Configuration
        config: {
            userid: 0,
            courseid: 0,
            cmid: null,
            sesskey: '',
            throttleDelay: 1000, // 1 second between transmissions
            batchSize: 5, // Send after 5 events
        },

        // State
        state: {
            eventQueue: [],
            lastTransmit: 0,
            clickCount: 0,
            errorCount: 0,
            navigationBackCount: 0,
            startTime: Date.now(),
            lastActivityTime: Date.now(),
            isTracking: false,
        },

        /**
         * Initialize the tracker
         */
        init: function(userid, courseid, cmid, sesskey) {
            this.config.userid = userid;
            this.config.courseid = courseid;
            this.config.cmid = cmid;
            this.config.sesskey = sesskey;

            if (this.state.isTracking) {
                return; // Already initialized
            }

            this.state.isTracking = true;
            this.state.startTime = Date.now();
            this.state.lastActivityTime = Date.now();

            // Attach event listeners
            this.attachListeners();

            // Periodic time update
            setInterval(this.sendTimeUpdate.bind(this), 30000); // Every 30 seconds

            // End session on page unload
            $(window).on('beforeunload', this.endSession.bind(this));

            console.log('Anxiety tracker initialized for user ' + userid + ' in course ' + courseid);
        },

        /**
         * Attach DOM event listeners
         */
        attachListeners: function() {
            var self = this;

            // Click tracking
            $(document).on('click', function(e) {
                self.trackClick(e);
            });

            // Form submission (potential response)
            $('form').on('submit', function(e) {
                self.trackFormSubmit(e);
            });

            // Quiz-specific tracking
            if ($('.que').length > 0) {
                // Quiz question detected
                self.trackQuizActivity();
            }

            // Navigation tracking
            window.addEventListener('popstate', function() {
                self.trackNavigationBack();
            });

            // Focus/blur tracking (tab switching)
            $(window).on('blur', function() {
                self.trackEvent('focus_lost', {});
            });

            $(window).on('focus', function() {
                self.trackEvent('focus_gained', {});
            });
        },

        /**
         * Track a click event
         */
        trackClick: function(event) {
            this.state.clickCount++;
            this.state.lastActivityTime = Date.now();

            // Throttled transmission
            if (this.state.clickCount % 5 === 0) {
                this.trackEvent('click', {
                    target: event.target.tagName,
                    clickCount: this.state.clickCount
                });
            }
        },

        /**
         * Track form submission
         */
        trackFormSubmit: function(event) {
            var form = $(event.target);
            var responseTime = Math.floor((Date.now() - this.state.startTime) / 1000);

            // Check if this is a quiz/assignment submission
            var isCorrect = this.checkAnswerCorrectness(form);

            this.trackEvent('response', {
                response_time: responseTime,
                is_correct: isCorrect,
                form_id: form.attr('id') || 'unknown'
            });
        },

        /**
         * Track quiz activity
         */
        trackQuizActivity: function() {
            var self = this;

            // Track answer changes
            $('.que input, .que select, .que textarea').on('change', function() {
                self.state.lastActivityTime = Date.now();
            });

            // Track incorrect feedback
            $('.incorrect, .partiallycorrect').each(function() {
                self.state.errorCount++;
            });

            if (self.state.errorCount > 0) {
                self.trackEvent('error', {
                    error_count: self.state.errorCount
                });
            }
        },

        /**
         * Track navigation back
         */
        trackNavigationBack: function() {
            this.state.navigationBackCount++;
            this.trackEvent('navigation_back', {
                count: this.state.navigationBackCount
            });
        },

        /**
         * Send time update
         */
        sendTimeUpdate: function() {
            var timeOnTask = Math.floor((Date.now() - this.state.startTime) / 1000);
            var idleTime = Math.floor((Date.now() - this.state.lastActivityTime) / 1000);

            // Only send if user is active (not idle for more than 5 minutes)
            if (idleTime < 300) {
                this.trackEvent('time_update', {
                    time_on_task: timeOnTask,
                    idle_time: idleTime
                });
            }
        },

        /**
         * Check if answer is correct (heuristic)
         */
        checkAnswerCorrectness: function(form) {
            // Try to detect feedback elements
            if (form.find('.correct').length > 0) {
                return true;
            }
            if (form.find('.incorrect').length > 0) {
                return false;
            }
            // Unknown - don't count as error
            return null;
        },

        /**
         * Track an event
         */
        trackEvent: function(eventType, eventData) {
            this.state.eventQueue.push({
                event_type: eventType,
                event_data: eventData,
                timestamp: Date.now()
            });

            // Check if should transmit
            if (this.shouldTransmit()) {
                this.transmitEvents();
            }
        },

        /**
         * Check if should transmit events
         */
        shouldTransmit: function() {
            var now = Date.now();
            var timeSinceLastTransmit = now - this.state.lastTransmit;

            // Transmit if batch size reached or throttle delay passed
            return (this.state.eventQueue.length >= this.config.batchSize) ||
                   (timeSinceLastTransmit >= this.config.throttleDelay && this.state.eventQueue.length > 0);
        },

        /**
         * Transmit events to server
         */
        transmitEvents: function() {
            if (this.state.eventQueue.length === 0) {
                return;
            }

            var self = this;
            var events = this.state.eventQueue.splice(0, this.config.batchSize);
            this.state.lastTransmit = Date.now();

            // Aggregate events for transmission
            var aggregatedData = {
                click_count: this.state.clickCount,
                error_count: this.state.errorCount,
                navigation_back_count: this.state.navigationBackCount,
                time_on_task: Math.floor((Date.now() - this.state.startTime) / 1000)
            };

            // Send via AJAX
            $.ajax({
                url: M.cfg.wwwroot + '/local/anxiety/ajax/track.php',
                method: 'POST',
                data: {
                    sesskey: this.config.sesskey,
                    userid: this.config.userid,
                    courseid: this.config.courseid,
                    cmid: this.config.cmid,
                    event_type: events[events.length - 1].event_type,
                    event_data: JSON.stringify(aggregatedData)
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        // console.log('Anxiety score:', response.anxiety_score, 'Level:', response.anxiety_level);

                        // Show warning if anxiety is high
                        if (response.anxiety_level === 'severe') {
                            self.showAnxietyWarning(response);
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Failed to track anxiety event:', error);
                }
            });
        },

        /**
         * Show anxiety warning to student
         */
        showAnxietyWarning: function(response) {
            // Only show once per session
            if (sessionStorage.getItem('anxiety_warning_shown')) {
                return;
            }

            var message = M.util.get_string('high_anxiety_warning', 'local_anxiety') ||
                          'Your stress level seems high. Consider taking a break.';

            // Show notification (Moodle 3.7 compatible)
            if (typeof M.core !== 'undefined' && M.core.dialogue) {
                var dialogue = new M.core.dialogue({
                    headerContent: 'Anxiety Alert',
                    bodyContent: '<p>' + message + '</p>',
                    width: '400px',
                    modal: true,
                    draggable: false
                });
                dialogue.show();
            } else {
                alert(message);
            }

            sessionStorage.setItem('anxiety_warning_shown', '1');
        },

        /**
         * End session
         */
        endSession: function() {
            // Send final update
            this.sendTimeUpdate();
            this.transmitEvents();

            // Note: We can't reliably send AJAX on beforeunload in all browsers
            // Consider using navigator.sendBeacon for modern browsers
            if (navigator.sendBeacon) {
                var data = new FormData();
                data.append('sesskey', this.config.sesskey);
                data.append('userid', this.config.userid);
                data.append('courseid', this.config.courseid);
                data.append('event_type', 'session_end');
                data.append('event_data', JSON.stringify({}));

                navigator.sendBeacon(
                    M.cfg.wwwroot + '/local/anxiety/ajax/track.php',
                    data
                );
            }
        }
    };

    return {
        init: function(userid, courseid, cmid, sesskey) {
            AnxietyTracker.init(userid, courseid, cmid, sesskey);
        }
    };
});
