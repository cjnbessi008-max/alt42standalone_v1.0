// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Flow Moments Behavior Tracker (JavaScript)
 *
 * Tracks fine-grained student behavior for flow detection
 *
 * @module     local_flowmoments/tracker
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    /**
     * Flow Moments Tracker class
     */
    var Tracker = function() {
        this.userId = null;
        this.courseId = null;
        this.cmId = null;
        this.attemptId = null;
        this.questionId = null;
        this.sessionStart = Date.now();
        this.lastActivity = Date.now();
        this.eventQueue = [];
        this.maxQueueSize = 20;
        this.flushInterval = 30000; // 30 seconds
        this.init();
    };

    /**
     * Initialize tracker
     */
    Tracker.prototype.init = function() {
        var self = this;

        // Extract context from page
        this.extractContext();

        // Set up event listeners
        this.setupEventListeners();

        // Start periodic flush
        setInterval(function() {
            self.flush();
        }, this.flushInterval);

        // Flush on page unload
        window.addEventListener('beforeunload', function() {
            self.flush(true); // Synchronous flush
        });
    };

    /**
     * Extract context information from the page
     */
    Tracker.prototype.extractContext = function() {
        // Get user ID from Moodle page context
        var userIdMatch = document.body.className.match(/userid-(\d+)/);
        if (userIdMatch) {
            this.userId = parseInt(userIdMatch[1]);
        }

        // Get course ID
        var courseIdMatch = document.body.className.match(/course-(\d+)/);
        if (courseIdMatch) {
            this.courseId = parseInt(courseIdMatch[1]);
        }

        // Get course module ID
        var cmIdMatch = document.body.className.match(/cmid-(\d+)/);
        if (cmIdMatch) {
            this.cmId = parseInt(cmIdMatch[1]);
        }

        // Try to get attempt ID from quiz page
        var attemptInput = document.querySelector('input[name="attempt"]');
        if (attemptInput) {
            this.attemptId = parseInt(attemptInput.value);
        }

        // Try to get question ID from question container
        var questionContainer = document.querySelector('[data-qid]');
        if (questionContainer) {
            this.questionId = parseInt(questionContainer.getAttribute('data-qid'));
        }
    };

    /**
     * Set up event listeners for behavior tracking
     */
    Tracker.prototype.setupEventListeners = function() {
        var self = this;

        // Track clicks
        document.addEventListener('click', function(e) {
            self.trackEvent('click', {
                target: self.getElementPath(e.target),
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            });
        });

        // Track input changes
        var inputElements = document.querySelectorAll('input, textarea, select');
        inputElements.forEach(function(element) {
            element.addEventListener('input', function(e) {
                self.trackEvent('input', {
                    target: self.getElementPath(e.target),
                    value_length: e.target.value ? e.target.value.length : 0,
                    timestamp: Date.now()
                });
            });

            element.addEventListener('change', function(e) {
                self.trackEvent('change', {
                    target: self.getElementPath(e.target),
                    timestamp: Date.now()
                });
            });
        });

        // Track backspace (corrections)
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                self.trackEvent('correction', {
                    key: e.key,
                    target: self.getElementPath(e.target),
                    timestamp: Date.now()
                });
            }
        });

        // Track scroll
        var scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                self.trackEvent('scroll', {
                    scrollY: window.scrollY,
                    timestamp: Date.now()
                });
            }, 200); // Debounce scroll events
        });

        // Track focus/blur (attention)
        window.addEventListener('focus', function() {
            self.trackEvent('focus', {
                timestamp: Date.now()
            });
        });

        window.addEventListener('blur', function() {
            self.trackEvent('blur', {
                timestamp: Date.now()
            });
        });

        // Track quiz submission
        var submitButtons = document.querySelectorAll('input[type="submit"], button[type="submit"]');
        submitButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                self.trackEvent('submit', {
                    target: self.getElementPath(button),
                    time_spent: Math.round((Date.now() - self.sessionStart) / 1000),
                    timestamp: Date.now()
                });
                self.flush(true); // Immediate flush on submit
            });
        });
    };

    /**
     * Get element path (for identifying elements)
     */
    Tracker.prototype.getElementPath = function(element) {
        if (!element) {
            return '';
        }

        var path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            var selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
            } else if (element.className) {
                selector += '.' + element.className.trim().split(/\s+/).join('.');
            }
            path.unshift(selector);
            element = element.parentNode;
            if (path.length > 3) {
                break; // Limit path depth
            }
        }
        return path.join(' > ');
    };

    /**
     * Track an event
     */
    Tracker.prototype.trackEvent = function(eventType, eventData) {
        if (!this.userId || !this.courseId) {
            return; // No context, skip tracking
        }

        var timeSinceLastActivity = Date.now() - this.lastActivity;
        this.lastActivity = Date.now();

        var event = {
            eventtype: eventType,
            eventdata: JSON.stringify(eventData),
            timespent: Math.round(timeSinceLastActivity / 1000),
            timestamp: Math.floor(Date.now() / 1000)
        };

        this.eventQueue.push(event);

        // Auto-flush if queue is full
        if (this.eventQueue.length >= this.maxQueueSize) {
            this.flush();
        }
    };

    /**
     * Flush event queue to server
     */
    Tracker.prototype.flush = function(synchronous) {
        if (this.eventQueue.length === 0) {
            return;
        }

        var events = this.eventQueue.slice(); // Copy queue
        this.eventQueue = []; // Clear queue

        var data = {
            userid: this.userId,
            courseid: this.courseId,
            cmid: this.cmId,
            attemptid: this.attemptId,
            questionid: this.questionId,
            events: events
        };

        if (synchronous) {
            // Synchronous AJAX for page unload
            this.sendBeacon(data);
        } else {
            // Asynchronous AJAX
            this.sendAjax(data);
        }
    };

    /**
     * Send data via AJAX (asynchronous)
     */
    Tracker.prototype.sendAjax = function(data) {
        Ajax.call([{
            methodname: 'local_flowmoments_track_events',
            args: data,
            fail: function(error) {
                // Silently fail - don't disrupt user experience
                if (window.console) {
                    console.error('Flow tracker error:', error);
                }
            }
        }]);
    };

    /**
     * Send data via Beacon API (synchronous, for page unload)
     */
    Tracker.prototype.sendBeacon = function(data) {
        if (!navigator.sendBeacon) {
            return; // Beacon not supported
        }

        var url = M.cfg.wwwroot + '/local/flowmoments/ajax/track.php';
        var formData = new FormData();
        formData.append('data', JSON.stringify(data));
        formData.append('sesskey', M.cfg.sesskey);

        navigator.sendBeacon(url, formData);
    };

    /**
     * Initialize tracker on page load
     */
    return {
        init: function() {
            // Only initialize on quiz pages
            if (document.body.classList.contains('path-mod-quiz') ||
                document.body.classList.contains('path-question') ||
                document.querySelector('[data-flowtracking="enabled"]')) {
                new Tracker();
            }
        }
    };
});
