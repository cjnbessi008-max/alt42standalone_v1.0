// This file is part of Moodle - http://moodle.org/

/**
 * JavaScript module for self-explanation behaviour.
 *
 * @module     qbehaviour_selfexplanation/explanation
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery'], function($) {

    /**
     * Initialize the explanation form.
     *
     * @param {Object} config Configuration with min_chars and min_words
     */
    var init = function(config) {
        var minChars = config.min_chars || 50;
        var minWords = config.min_words || 20;

        // Find all explanation inputs
        $('.explanation-input').each(function() {
            var $textarea = $(this);
            var $submitBtn = $textarea.closest('.qbehaviour-selfexplanation-container')
                .find('.submit-explanation-btn');
            var $charCount = $textarea.closest('.qbehaviour-selfexplanation-container')
                .find('.char-count');
            var $wordCount = $textarea.closest('.qbehaviour-selfexplanation-container')
                .find('.word-count');

            /**
             * Count words in text (handles English and Korean).
             *
             * @param {string} text Input text
             * @return {number} Word count
             */
            var countWords = function(text) {
                // For English: split by spaces
                var words = text.trim().split(/\s+/).filter(function(word) {
                    return word.length > 0;
                });
                var enCount = words.length;

                // For Korean: count hangul characters (rough approximation)
                var koChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
                var koWords = Math.ceil(koChars / 2); // ~2 chars per word

                // Use the larger count for mixed text
                return Math.max(enCount, koWords);
            };

            /**
             * Update character and word counts.
             */
            var updateCounts = function() {
                var text = $textarea.val();
                var charCount = text.length;
                var wordCount = countWords(text);

                // Update display
                $charCount.text(charCount + ' / ' + minChars + ' 글자');
                $wordCount.text(wordCount + ' / ' + minWords + ' 단어');

                // Enable/disable submit button
                if (charCount >= minChars && wordCount >= minWords) {
                    $submitBtn.prop('disabled', false);
                    $charCount.removeClass('text-danger').addClass('text-success');
                    $wordCount.removeClass('text-danger').addClass('text-success');
                } else {
                    $submitBtn.prop('disabled', true);
                    if (charCount < minChars) {
                        $charCount.removeClass('text-success').addClass('text-danger');
                    }
                    if (wordCount < minWords) {
                        $wordCount.removeClass('text-success').addClass('text-danger');
                    }
                }
            };

            // Bind events
            $textarea.on('input keyup', updateCounts);

            // Initial update
            updateCounts();

            // Prevent accidental form submission
            $textarea.on('keydown', function(e) {
                // Prevent Enter key from submitting (unless Shift+Enter for new line)
                if (e.keyCode === 13 && !e.shiftKey) {
                    e.preventDefault();
                }
            });
        });

        /**
         * Auto-save explanation to localStorage (for recovery).
         */
        var autoSave = function() {
            $('.explanation-input').each(function() {
                var $textarea = $(this);
                var key = 'selfexpl_' + $textarea.attr('name');
                var value = $textarea.val();

                if (value.length > 0) {
                    localStorage.setItem(key, value);
                }
            });
        };

        /**
         * Restore explanation from localStorage.
         */
        var restore = function() {
            $('.explanation-input').each(function() {
                var $textarea = $(this);
                var key = 'selfexpl_' + $textarea.attr('name');
                var saved = localStorage.getItem(key);

                if (saved && $textarea.val().length === 0) {
                    $textarea.val(saved);
                    $textarea.trigger('input'); // Update counts
                }
            });
        };

        // Auto-save every 5 seconds
        setInterval(autoSave, 5000);

        // Restore on load
        restore();

        // Clear localStorage on successful submission
        $('.submit-explanation-btn').on('click', function() {
            var $btn = $(this);
            var $textarea = $btn.closest('.qbehaviour-selfexplanation-container')
                .find('.explanation-input');
            var key = 'selfexpl_' + $textarea.attr('name');

            // Clear after a short delay (to ensure form is submitted)
            setTimeout(function() {
                localStorage.removeItem(key);
            }, 500);
        });
    };

    return {
        init: init
    };
});
