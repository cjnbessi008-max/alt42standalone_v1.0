/**
 * Word counter for self-explanation responses
 *
 * @module     mod_selfexplanation/wordcount
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery'], function($) {
    return {
        init: function() {
            var textarea = $('#responsetext');
            var wordcountSpan = $('#wordcount');

            if (textarea.length && wordcountSpan.length) {
                // Function to count words (handles both English and Korean)
                var countWords = function(text) {
                    if (!text || text.trim() === '') {
                        return 0;
                    }

                    // Remove extra whitespace
                    text = text.trim();

                    // Count Korean characters
                    var koreanChars = (text.match(/[\u3131-\uD79D]/g) || []).length;

                    // Count English words
                    var englishWords = text.split(/\s+/).filter(function(word) {
                        return word.length > 0 && /[a-zA-Z]/.test(word);
                    }).length;

                    // Return the maximum (handles mixed text)
                    return Math.max(koreanChars, englishWords);
                };

                // Update word count on input
                var updateWordCount = function() {
                    var text = textarea.val();
                    var count = countWords(text);
                    wordcountSpan.text(count);

                    // Visual feedback for minimum words
                    var minWords = parseInt(wordcountSpan.parent().text().match(/\d+/));
                    if (count >= minWords) {
                        wordcountSpan.css('color', 'green').css('font-weight', 'bold');
                    } else {
                        wordcountSpan.css('color', 'red').css('font-weight', 'normal');
                    }
                };

                // Bind events
                textarea.on('input keyup paste', function() {
                    updateWordCount();
                });

                // Initial count
                updateWordCount();

                // Track time spent
                var startTime = Date.now();
                $(window).on('beforeunload', function() {
                    var timeSpent = Math.floor((Date.now() - startTime) / 1000);
                    // Store in hidden field if exists
                    var timeField = $('input[name="timespent"]');
                    if (timeField.length) {
                        timeField.val(timeSpent);
                    }
                });
            }
        }
    };
});
