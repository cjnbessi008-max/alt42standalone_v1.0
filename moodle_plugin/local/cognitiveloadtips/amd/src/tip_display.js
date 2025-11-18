// This file is part of Moodle - http://moodle.org/

/**
 * JavaScript for cognitive load tip display and interaction tracking
 *
 * @module     local_cognitiveloadtips/tip_display
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    var TipDisplay = {

        startTime: null,
        tipIds: [],
        questionId: null,
        quizId: null,

        /**
         * Initialize tip display
         */
        init: function() {
            var self = this;

            $(document).ready(function() {
                self.startTime = new Date();

                // Get tip IDs from the page
                $('.clt-tip').each(function() {
                    self.tipIds.push($(this).data('tipid'));
                });

                var overlay = $('.cognitive-load-tips-overlay');
                if (overlay.length) {
                    self.questionId = overlay.data('questionid');
                    self.quizId = overlay.data('quizid');
                }

                // Handle mandatory tips with timer
                self.initTimers();

                // Handle skip button
                $('.clt-skip-btn').on('click', function() {
                    self.skipTips();
                });

                // Handle continue button
                $('.clt-continue-btn').on('click', function() {
                    if (!$(this).prop('disabled')) {
                        self.continueTo Question();
                    }
                });

                // Handle feedback buttons
                $('.clt-feedback-btn').on('click', function() {
                    var helpful = $(this).data('helpful');
                    self.submitFeedback(helpful);
                    $(this).addClass('active').siblings().removeClass('active');
                });
            });
        },

        /**
         * Initialize timers for mandatory tips
         */
        initTimers: function() {
            var self = this;
            var allTimersComplete = true;

            $('.clt-tip').each(function() {
                var $tip = $(this);
                var isMandatory = $tip.data('mandatory');
                var duration = $tip.data('duration');

                if (isMandatory && duration > 0) {
                    allTimersComplete = false;
                    self.startTimer($tip, duration);
                }
            });

            // If no mandatory tips, enable continue button immediately
            if (allTimersComplete) {
                $('#clt-continue-btn').prop('disabled', false);
            }
        },

        /**
         * Start countdown timer for a tip
         * @param {jQuery} $tip Tip element
         * @param {int} duration Duration in seconds
         */
        startTimer: function($tip, duration) {
            var self = this;
            var remaining = duration;
            var $progressFill = $tip.find('.clt-progress-fill');
            var $countdown = $tip.find('.clt-countdown');

            var interval = setInterval(function() {
                remaining--;
                var progress = ((duration - remaining) / duration) * 100;
                $progressFill.css('width', progress + '%');
                $countdown.text(remaining);

                if (remaining <= 0) {
                    clearInterval(interval);
                    $progressFill.css('width', '100%');
                    $tip.addClass('timer-complete');
                    self.checkAllTimersComplete();
                }
            }, 1000);
        },

        /**
         * Check if all mandatory timers are complete
         */
        checkAllTimersComplete: function() {
            var allComplete = true;
            $('.clt-tip[data-mandatory="1"]').each(function() {
                if (!$(this).hasClass('timer-complete')) {
                    allComplete = false;
                    return false;
                }
            });

            if (allComplete) {
                $('#clt-continue-btn').prop('disabled', false).addClass('pulse');
            }
        },

        /**
         * Skip tips
         */
        skipTips: function() {
            var self = this;
            var duration = this.calculateDuration();

            // Record skipped interaction
            this.tipIds.forEach(function(tipId) {
                self.recordInteraction(tipId, duration, true);
            });

            this.closeTips();
        },

        /**
         * Continue to question
         */
        continueToQuestion: function() {
            var self = this;
            var duration = this.calculateDuration();

            // Record viewed interaction
            this.tipIds.forEach(function(tipId) {
                self.recordInteraction(tipId, duration, false);
            });

            this.closeTips();
        },

        /**
         * Close tips overlay
         */
        closeTips: function() {
            $('.cognitive-load-tips-overlay').fadeOut(300, function() {
                $(this).remove();
            });
        },

        /**
         * Calculate duration in seconds
         * @return {int} Duration in seconds
         */
        calculateDuration: function() {
            if (!this.startTime) {
                return 0;
            }
            var endTime = new Date();
            return Math.round((endTime - this.startTime) / 1000);
        },

        /**
         * Record tip interaction via AJAX
         * @param {int} tipId Tip ID
         * @param {int} duration Duration in seconds
         * @param {boolean} skipped Was it skipped
         */
        recordInteraction: function(tipId, duration, skipped) {
            var self = this;

            Ajax.call([{
                methodname: 'local_cognitiveloadtips_record_interaction',
                args: {
                    tipid: tipId,
                    questionid: self.questionId,
                    quizid: self.quizId,
                    duration: duration,
                    skipped: skipped
                },
                fail: function(error) {
                    // Silent fail - don't interrupt user experience
                    console.error('Failed to record tip interaction:', error);
                }
            }]);
        },

        /**
         * Submit feedback
         * @param {int} helpful 1 for helpful, 0 for not helpful
         */
        submitFeedback: function(helpful) {
            var self = this;

            this.tipIds.forEach(function(tipId) {
                Ajax.call([{
                    methodname: 'local_cognitiveloadtips_submit_feedback',
                    args: {
                        tipid: tipId,
                        questionid: self.questionId,
                        helpful: helpful
                    },
                    done: function() {
                        if (helpful) {
                            Notification.addNotification({
                                message: M.util.get_string('feedback_thank_you', 'local_cognitiveloadtips'),
                                type: 'success'
                            });
                        }
                    },
                    fail: function(error) {
                        console.error('Failed to submit feedback:', error);
                    }
                }]);
            });
        }
    };

    return {
        init: function() {
            TipDisplay.init();
        }
    };
});
