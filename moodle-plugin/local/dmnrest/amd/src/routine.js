// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AMD module for DMN rest routine display and interaction
 */
define(['jquery', 'core/ajax', 'core/notification', 'core/str'], function($, Ajax, Notification, Str) {

    var module = {
        routineData: null,
        eventId: null,
        startTime: null,
        allowSkip: true,

        /**
         * Initialize the rest routine display
         */
        init: function(params) {
            this.routineData = params.routine;
            this.eventId = params.event_id;
            this.allowSkip = params.allow_skip;

            this.displayRoutine();
        },

        /**
         * Display the rest routine modal
         */
        displayRoutine: function() {
            var self = this;
            var routine = this.routineData;

            // Build modal HTML
            var modalHtml = this.buildModalHtml(routine);

            // Create modal container
            var $modal = $('<div>')
                .addClass('dmn-routine-modal')
                .html(modalHtml)
                .appendTo('body');

            // Add event listeners
            $('#dmn-start-btn').on('click', function() {
                self.startRoutine();
            });

            $('#dmn-skip-btn').on('click', function() {
                self.skipRoutine();
            });

            $('#dmn-complete-btn').on('click', function() {
                self.completeRoutine();
            });

            $('.dmn-feedback-star').on('click', function() {
                var rating = $(this).data('rating');
                self.selectFeedback(rating);
            });

            // Show modal
            $modal.fadeIn(300);
        },

        /**
         * Build modal HTML
         */
        buildModalHtml: function(routine) {
            var skipButton = this.allowSkip
                ? '<button id="dmn-skip-btn" class="btn btn-secondary">' + M.util.get_string('button_skip', 'local_dmnrest') + '</button>'
                : '';

            var html = `
                <div class="dmn-overlay"></div>
                <div class="dmn-modal-content">
                    <div class="dmn-header">
                        <h2>` + M.util.get_string('rest_routine_title', 'local_dmnrest') + `</h2>
                        <p class="dmn-subtitle">` + M.util.get_string('rest_routine_subtitle', 'local_dmnrest') + `</p>
                    </div>

                    <div class="dmn-routine-info">
                        <h3 class="dmn-routine-name">` + routine.name + `</h3>
                        <p class="dmn-routine-desc">` + routine.description + `</p>
                        <div class="dmn-timer">
                            <span class="dmn-timer-icon">⏱</span>
                            <span>` + M.util.get_string('timer_label', 'local_dmnrest') + ` ` + this.formatDuration(routine.duration_seconds) + `</span>
                        </div>
                    </div>

                    <div id="dmn-routine-steps" class="dmn-steps" style="display: none;">
                        ` + this.buildStepsHtml(routine.instructions.steps) + `
                    </div>

                    <div id="dmn-feedback-section" class="dmn-feedback" style="display: none;">
                        <p>` + M.util.get_string('feedback_prompt', 'local_dmnrest') + `</p>
                        <div class="dmn-feedback-stars">
                            <span class="dmn-feedback-star" data-rating="1">★</span>
                            <span class="dmn-feedback-star" data-rating="2">★</span>
                            <span class="dmn-feedback-star" data-rating="3">★</span>
                            <span class="dmn-feedback-star" data-rating="4">★</span>
                            <span class="dmn-feedback-star" data-rating="5">★</span>
                        </div>
                    </div>

                    <div class="dmn-actions">
                        <button id="dmn-start-btn" class="btn btn-primary">` + M.util.get_string('button_start', 'local_dmnrest') + `</button>
                        <button id="dmn-complete-btn" class="btn btn-success" style="display: none;">` + M.util.get_string('button_complete', 'local_dmnrest') + `</button>
                        ` + skipButton + `
                    </div>
                </div>
            `;

            return html;
        },

        /**
         * Build HTML for routine steps
         */
        buildStepsHtml: function(steps) {
            var html = '<ol class="dmn-step-list">';
            steps.forEach(function(step) {
                html += '<li class="dmn-step">' + step + '</li>';
            });
            html += '</ol>';
            return html;
        },

        /**
         * Format duration in readable format
         */
        formatDuration: function(seconds) {
            if (seconds < 60) {
                return seconds + ' seconds';
            } else if (seconds === 60) {
                return '1 minute';
            } else {
                var minutes = Math.floor(seconds / 60);
                var remainingSeconds = seconds % 60;
                return minutes + ' minute' + (minutes > 1 ? 's' : '') +
                       (remainingSeconds > 0 ? ' ' + remainingSeconds + ' seconds' : '');
            }
        },

        /**
         * Start the routine
         */
        startRoutine: function() {
            this.startTime = Date.now();

            // Hide start button, show complete button
            $('#dmn-start-btn').hide();
            $('#dmn-complete-btn').show();
            $('#dmn-skip-btn').hide();

            // Show steps
            $('#dmn-routine-steps').slideDown(300);

            // Auto-advance after routine duration (optional)
            var self = this;
            setTimeout(function() {
                $('#dmn-complete-btn').addClass('btn-pulse');
            }, this.routineData.duration_seconds * 1000);
        },

        /**
         * Skip the routine
         */
        skipRoutine: function() {
            this.recordCompletion(false, 0, null);
            this.closeModal();
        },

        /**
         * Complete the routine
         */
        completeRoutine: function() {
            var duration = Math.floor((Date.now() - this.startTime) / 1000);

            // Hide complete button
            $('#dmn-complete-btn').hide();
            $('#dmn-routine-steps').hide();

            // Show feedback section
            $('#dmn-feedback-section').slideDown(300);

            // Auto-submit with no feedback after 5 seconds
            var self = this;
            this.feedbackTimeout = setTimeout(function() {
                self.recordCompletion(true, duration, null);
                self.closeModal();
            }, 5000);
        },

        /**
         * Select feedback rating
         */
        selectFeedback: function(rating) {
            if (this.feedbackTimeout) {
                clearTimeout(this.feedbackTimeout);
            }

            var duration = Math.floor((Date.now() - this.startTime) / 1000);

            // Highlight selected stars
            $('.dmn-feedback-star').each(function(index) {
                if (index < rating) {
                    $(this).addClass('selected');
                } else {
                    $(this).removeClass('selected');
                }
            });

            // Record and close
            var self = this;
            setTimeout(function() {
                self.recordCompletion(true, duration, rating);
                self.closeModal();
            }, 500);
        },

        /**
         * Record completion via AJAX
         */
        recordCompletion: function(completed, duration, feedback) {
            var self = this;

            // Make AJAX call to local script that will call the API
            $.ajax({
                url: M.cfg.wwwroot + '/local/dmnrest/ajax/complete.php',
                method: 'POST',
                data: {
                    event_id: this.eventId,
                    completed: completed,
                    duration: duration,
                    feedback: feedback,
                    sesskey: M.cfg.sesskey
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        console.log('DMN: Routine completion recorded');
                    } else {
                        console.error('DMN: Failed to record completion', response.error);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('DMN: AJAX error', error);
                }
            });
        },

        /**
         * Close the modal
         */
        closeModal: function() {
            $('.dmn-routine-modal').fadeOut(300, function() {
                $(this).remove();
            });
        }
    };

    return module;
});
