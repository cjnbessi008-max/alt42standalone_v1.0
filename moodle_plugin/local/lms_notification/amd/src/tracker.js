// This file is part of Moodle - http://moodle.org/
//
// LMS Notification System - Activity Tracker
//
// @package    local_lms_notification
// @copyright  2024
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    var Tracker = {
        sessionData: {
            startTime: null,
            attempts: 0,
            correct: 0,
            incorrect: 0,
            hintsUsed: 0,
            metadata: {}
        },

        /**
         * Initialize the tracker
         */
        init: function(courseid, moduleid, activitytype) {
            this.courseid = courseid;
            this.moduleid = moduleid;
            this.activitytype = activitytype;
            this.sessionData.startTime = Math.floor(Date.now() / 1000);
            this.trackingId = null;

            // Request browser notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }

            // Start periodic tracking
            this.startPeriodicTracking();
        },

        /**
         * Track an activity event
         */
        trackActivity: function(data) {
            var self = this;

            // Update session data
            if (data.attempts !== undefined) {
                this.sessionData.attempts += data.attempts;
            }
            if (data.correct !== undefined) {
                this.sessionData.correct += data.correct;
            }
            if (data.incorrect !== undefined) {
                this.sessionData.incorrect += data.incorrect;
            }
            if (data.hintsUsed !== undefined) {
                this.sessionData.hintsUsed += data.hintsUsed;
            }
            if (data.metadata) {
                Object.assign(this.sessionData.metadata, data.metadata);
            }

            // Calculate time spent
            var timeSpent = Math.floor(Date.now() / 1000) - this.sessionData.startTime;

            var payload = {
                courseid: this.courseid,
                moduleid: this.moduleid,
                activitytype: this.activitytype,
                starttime: this.sessionData.startTime,
                endtime: Math.floor(Date.now() / 1000),
                attempts: this.sessionData.attempts,
                correct: this.sessionData.correct,
                incorrect: this.sessionData.incorrect,
                hints_used: this.sessionData.hintsUsed,
                time_spent: timeSpent,
                metadata: this.sessionData.metadata
            };

            // Send to API
            $.ajax({
                url: M.cfg.wwwroot + '/local/lms_notification/api/track_activity.php',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: function(response) {
                    if (response.success) {
                        self.trackingId = response.tracking_id;

                        // Check for alerts
                        if (response.alerts_triggered && response.alerts.length > 0) {
                            self.handleAlerts(response.alerts);
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Failed to track activity:', error);
                }
            });
        },

        /**
         * Handle triggered alerts
         */
        handleAlerts: function(alerts) {
            var self = this;

            alerts.forEach(function(alert) {
                // Show browser notification
                self.showBrowserNotification(alert);

                // Show in-page notification
                self.showInPageNotification(alert);
            });
        },

        /**
         * Show browser notification
         */
        showBrowserNotification: function(alert) {
            if ('Notification' in window && Notification.permission === 'granted') {
                var notification = new Notification('학습 패턴 알림', {
                    body: alert.description,
                    icon: M.cfg.wwwroot + '/local/lms_notification/pix/alert_icon.png',
                    tag: 'lms-alert-' + alert.id,
                    requireInteraction: alert.severity === 'high' || alert.severity === 'critical'
                });

                notification.onclick = function() {
                    window.focus();
                    this.close();
                };
            }
        },

        /**
         * Show in-page notification
         */
        showInPageNotification: function(alert) {
            var severityClass = 'alert-' + alert.severity;
            var icon = this.getSeverityIcon(alert.severity);

            var message = '<div class="lms-notification-alert ' + severityClass + '">' +
                         '<span class="alert-icon">' + icon + '</span>' +
                         '<div class="alert-content">' +
                         '<strong>' + alert.description + '</strong>' +
                         '<p class="alert-recommendation">' + this.getRecommendation(alert.type) + '</p>' +
                         '</div>' +
                         '<button class="alert-dismiss" data-alert-id="' + alert.id + '">확인</button>' +
                         '</div>';

            // Append to notification area
            var $notificationArea = $('#lms-notification-area');
            if ($notificationArea.length === 0) {
                $notificationArea = $('<div id="lms-notification-area"></div>').appendTo('body');
            }

            var $alert = $(message);
            $notificationArea.append($alert);

            // Auto-dismiss after 10 seconds for low/medium severity
            if (alert.severity !== 'high' && alert.severity !== 'critical') {
                setTimeout(function() {
                    $alert.fadeOut(300, function() {
                        $(this).remove();
                    });
                }, 10000);
            }

            // Handle dismiss button
            $alert.find('.alert-dismiss').on('click', function() {
                var alertId = $(this).data('alert-id');
                Tracker.acknowledgeAlert(alertId);
                $alert.fadeOut(300, function() {
                    $(this).remove();
                });
            });
        },

        /**
         * Get severity icon
         */
        getSeverityIcon: function(severity) {
            var icons = {
                'low': '&#9432;',
                'medium': '&#9888;',
                'high': '&#10071;',
                'critical': '&#128680;'
            };
            return icons[severity] || '&#9432;';
        },

        /**
         * Get recommendation text
         */
        getRecommendation: function(alertType) {
            var recommendations = {
                'excessive_time': '잠시 휴식을 취하거나 다른 접근 방법을 시도해보세요.',
                'excessive_attempts': '힌트를 확인하거나 교수자에게 도움을 요청하세요.',
                'high_error_rate': '기본 개념을 다시 복습하고 연습 문제를 풀어보세요.',
                'learning_stagnation': '학습을 재개하고 규칙적인 학습 습관을 만들어보세요.'
            };
            return recommendations[alertType] || '효율적인 학습 방법을 찾아보세요.';
        },

        /**
         * Acknowledge an alert
         */
        acknowledgeAlert: function(alertId) {
            $.ajax({
                url: M.cfg.wwwroot + '/local/lms_notification/api/acknowledge_alert.php',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    alert_id: alertId
                }),
                success: function(response) {
                    if (response.success) {
                        console.log('Alert acknowledged:', alertId);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Failed to acknowledge alert:', error);
                }
            });
        },

        /**
         * Start periodic tracking (every 5 minutes)
         */
        startPeriodicTracking: function() {
            var self = this;

            setInterval(function() {
                if (document.visibilityState === 'visible') {
                    self.trackActivity({});
                }
            }, 300000); // 5 minutes
        },

        /**
         * Load user alerts
         */
        loadAlerts: function(callback) {
            $.ajax({
                url: M.cfg.wwwroot + '/local/lms_notification/api/get_alerts.php',
                type: 'GET',
                data: {
                    courseid: this.courseid,
                    acknowledged: 0,
                    limit: 10
                },
                success: function(response) {
                    if (response.success && callback) {
                        callback(response.alerts);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Failed to load alerts:', error);
                }
            });
        },

        /**
         * Load analytics data
         */
        loadAnalytics: function(days, callback) {
            $.ajax({
                url: M.cfg.wwwroot + '/local/lms_notification/api/get_analytics.php',
                type: 'GET',
                data: {
                    userid: M.cfg.userid,
                    courseid: this.courseid,
                    days: days || 7
                },
                success: function(response) {
                    if (response.success && callback) {
                        callback(response.analytics, response.daily_breakdown);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Failed to load analytics:', error);
                }
            });
        }
    };

    return {
        init: function(courseid, moduleid, activitytype) {
            Tracker.init(courseid, moduleid, activitytype);
            return Tracker;
        }
    };
});
