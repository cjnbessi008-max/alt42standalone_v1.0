// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * JavaScript for tracking feedback interactions
 *
 * @module     local_missedquestionfeedback/feedback_tracker
 * @copyright  2025 Your Organization
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax'], function($, Ajax) {
    return {
        /**
         * Initialize the feedback tracker
         */
        init: function() {
            var startTime = Date.now();
            var interactionId = $('.missed-feedback-block').data('interaction-id');

            if (!interactionId) {
                return;
            }

            // Track time spent when user leaves the page
            $(window).on('beforeunload', function() {
                var timeSpent = Math.floor((Date.now() - startTime) / 1000);

                // Use sendBeacon for reliable sending on page unload
                if (navigator.sendBeacon) {
                    var formData = new FormData();
                    formData.append('interactionid', interactionId);
                    formData.append('timespent', timeSpent);
                    navigator.sendBeacon(M.cfg.wwwroot + '/local/missedquestionfeedback/track.php', formData);
                }
            });

            // Track resource clicks
            $('.missed-feedback-resource').on('click', function() {
                var resourceUrl = $(this).attr('href');

                Ajax.call([{
                    methodname: 'local_missedquestionfeedback_track_resource_click',
                    args: {
                        interactionid: interactionId
                    },
                    fail: function() {
                        // Silent fail - don't interrupt user experience
                    }
                }]);
            });

            // Track scroll depth (optional - measures engagement)
            var maxScrollDepth = 0;
            $('.missed-feedback-block').on('scroll', function() {
                var scrollTop = $(this).scrollTop();
                var scrollHeight = $(this)[0].scrollHeight;
                var clientHeight = $(this).height();
                var scrollDepth = (scrollTop + clientHeight) / scrollHeight * 100;

                if (scrollDepth > maxScrollDepth) {
                    maxScrollDepth = scrollDepth;
                }
            });
        }
    };
});
