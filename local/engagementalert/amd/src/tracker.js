/**
 * Engagement tracking JavaScript module for detecting DMN drift
 *
 * @module     local_engagementalert/tracker
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, ajax, notification) {

    /**
     * Engagement Tracker Class
     */
    var EngagementTracker = function(config) {
        this.config = config;
        this.sessionId = this.generateSessionId();
        this.lastActivityTime = Date.now();
        this.lastFocusTime = Date.now();
        this.isFocused = true;
        this.events = [];
        this.alertCooldownUntil = 0;

        this.init();
    };

    /**
     * Initialize the tracker
     */
    EngagementTracker.prototype.init = function() {
        var self = this;

        // Track mouse movement
        $(document).on('mousemove.engagementtracker', function() {
            self.recordEvent('mouse');
        });

        // Track keyboard activity
        $(document).on('keypress.engagementtracker', function() {
            self.recordEvent('keyboard');
        });

        // Track scrolling
        $(document).on('scroll.engagementtracker', function() {
            self.recordEvent('scroll');
        });

        // Track window focus/blur
        $(window).on('focus.engagementtracker', function() {
            self.isFocused = true;
            self.lastFocusTime = Date.now();
            self.recordEvent('focus');
        });

        $(window).on('blur.engagementtracker', function() {
            self.isFocused = false;
            self.recordEvent('blur');
        });

        // Track page visibility changes (for tab switching)
        if (typeof document.hidden !== 'undefined') {
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    self.isFocused = false;
                    self.recordEvent('blur');
                } else {
                    self.isFocused = true;
                    self.lastFocusTime = Date.now();
                    self.recordEvent('focus');
                }
            });
        }

        // Periodic check for inactivity and data submission
        setInterval(function() {
            self.checkEngagement();
            self.submitEvents();
        }, this.config.trackingInterval * 1000);

        // Submit events before page unload
        $(window).on('beforeunload.engagementtracker', function() {
            self.submitEvents();
        });
    };

    /**
     * Record an engagement event
     */
    EngagementTracker.prototype.recordEvent = function(eventType) {
        var now = Date.now();
        this.lastActivityTime = now;

        this.events.push({
            type: eventType,
            timestamp: Math.floor(now / 1000),
            sessionId: this.sessionId
        });

        // Limit events array size to prevent memory issues
        if (this.events.length > 1000) {
            this.events = this.events.slice(-500);
        }
    };

    /**
     * Check engagement levels and trigger alerts if needed
     */
    EngagementTracker.prototype.checkEngagement = function() {
        var now = Date.now();
        var timeSinceActivity = (now - this.lastActivityTime) / 1000; // in seconds
        var timeSinceFocus = (now - this.lastFocusTime) / 1000;

        // Skip if we're in alert cooldown
        if (now < this.alertCooldownUntil) {
            return;
        }

        // Check for inactivity
        if (timeSinceActivity > this.config.inactiveThreshold) {
            this.triggerAlert('inactive', timeSinceActivity);
            return;
        }

        // Check for unfocused state
        if (!this.isFocused && timeSinceFocus > this.config.unfocusThreshold) {
            this.triggerAlert('unfocused', timeSinceFocus);
            return;
        }
    };

    /**
     * Trigger an engagement alert
     */
    EngagementTracker.prototype.triggerAlert = function(alertType, duration) {
        var self = this;
        var now = Date.now();

        // Set cooldown
        this.alertCooldownUntil = now + (this.config.alertCooldown * 1000);

        // Send alert to server
        ajax.call([{
            methodname: 'local_engagementalert_trigger_alert',
            args: {
                courseid: this.config.courseId,
                cmid: this.config.cmId || 0,
                sessionid: this.sessionId,
                alerttype: alertType,
                duration: Math.floor(duration)
            },
            done: function(response) {
                if (response.success) {
                    // Show alert to student if enabled
                    if (self.config.enableStudentAlerts && response.show_student_alert) {
                        self.showStudentAlert();
                    }
                }
            },
            fail: function(error) {
                // Silently fail - don't interrupt user experience
                console.log('Engagement alert failed:', error);
            }
        }]);
    };

    /**
     * Show alert to student
     */
    EngagementTracker.prototype.showStudentAlert = function() {
        // Create a gentle, non-intrusive notification
        var alertHtml = '<div class="engagement-alert" style="' +
            'position: fixed; top: 20px; right: 20px; ' +
            'background: #fff3cd; border: 2px solid #ffc107; ' +
            'border-radius: 8px; padding: 15px 20px; ' +
            'box-shadow: 0 4px 6px rgba(0,0,0,0.1); ' +
            'max-width: 300px; z-index: 9999; ' +
            'animation: slideIn 0.3s ease-out;">' +
            '<div style="font-weight: bold; margin-bottom: 5px;">' +
            this.config.alertTitle +
            '</div>' +
            '<div style="font-size: 14px;">' +
            this.config.alertMessage +
            '</div>' +
            '<button class="btn btn-sm btn-primary" style="margin-top: 10px;"' +
            'onclick="this.parentElement.remove();">확인 / OK</button>' +
            '</div>';

        $('body').append(alertHtml);

        // Auto-remove after 10 seconds
        setTimeout(function() {
            $('.engagement-alert').fadeOut(function() {
                $(this).remove();
            });
        }, 10000);
    };

    /**
     * Submit collected events to server
     */
    EngagementTracker.prototype.submitEvents = function() {
        if (this.events.length === 0) {
            return;
        }

        var eventsToSubmit = this.events.slice();
        this.events = [];

        ajax.call([{
            methodname: 'local_engagementalert_log_events',
            args: {
                courseid: this.config.courseId,
                cmid: this.config.cmId || 0,
                events: JSON.stringify(eventsToSubmit)
            },
            done: function() {
                // Successfully submitted
            },
            fail: function(error) {
                console.log('Failed to submit engagement events:', error);
            }
        }]);
    };

    /**
     * Generate a unique session ID
     */
    EngagementTracker.prototype.generateSessionId = function() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    /**
     * Cleanup and stop tracking
     */
    EngagementTracker.prototype.destroy = function() {
        $(document).off('.engagementtracker');
        $(window).off('.engagementtracker');
    };

    /**
     * Initialize tracking with configuration
     */
    return {
        init: function(config) {
            return new EngagementTracker(config);
        }
    };
});
