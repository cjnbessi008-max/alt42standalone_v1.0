/**
 * Confidence Reasoning UI Module
 *
 * Adds confidence level and reasoning input fields to quiz questions
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    var ConfidenceUI = {

        /**
         * Initialize the confidence UI
         */
        init: function() {
            this.addConfidenceFields();
            this.attachEventHandlers();
        },

        /**
         * Add confidence fields to each question
         */
        addConfidenceFields: function() {
            var self = this;

            // Find all questions in the quiz
            $('.que').each(function() {
                var $question = $(this);
                var questionId = self.getQuestionId($question);

                if (!questionId) {
                    return;
                }

                // Check if confidence fields already exist
                if ($question.find('.confidence-reasoning-container').length > 0) {
                    return;
                }

                // Create confidence UI HTML
                var html = self.createConfidenceHTML(questionId);

                // Insert after the question answer area
                var $answerContainer = $question.find('.ablock');
                if ($answerContainer.length > 0) {
                    $answerContainer.after(html);
                } else {
                    $question.append(html);
                }
            });
        },

        /**
         * Create HTML for confidence fields
         *
         * @param {Number} questionId
         * @return {String} HTML string
         */
        createConfidenceHTML: function(questionId) {
            // Get language strings (these would be loaded via Moodle string API in production)
            var lang = document.documentElement.lang || 'en';
            var isKorean = lang.startsWith('ko');

            var labels = {
                confidenceLabel: isKorean ? '답에 대한 확신도는?' : 'How confident are you?',
                reasoningLabel: isKorean ? '왜 확신하거나 확신하지 않나요?' : 'Why are you confident/not confident?',
                categoryLabel: isKorean ? '어떻게 이 답을 찾았나요?' : 'How did you arrive at this answer?',
                categories: isKorean ? {
                    '': '선택하세요',
                    'studied': '공부했던 내용',
                    'calculated': '계산해서 풀었음',
                    'remembered': '수업 시간에 배운 것을 기억함',
                    'guessed': '추측했음',
                    'eliminated': '오답을 제거했음',
                    'other': '기타'
                } : {
                    '': 'Select...',
                    'studied': 'I studied this',
                    'calculated': 'I calculated it',
                    'remembered': 'I remembered from class',
                    'guessed': 'I guessed',
                    'eliminated': 'I eliminated wrong answers',
                    'other': 'Other'
                },
                levels: isKorean ? [
                    '1 - 매우 불확실함',
                    '2 - 불확실함',
                    '3 - 보통',
                    '4 - 확신함',
                    '5 - 매우 확신함'
                ] : [
                    '1 - Very unsure',
                    '2 - Unsure',
                    '3 - Neutral',
                    '4 - Confident',
                    '5 - Very confident'
                ]
            };

            var categoryOptions = '';
            for (var key in labels.categories) {
                categoryOptions += '<option value="' + key + '">' + labels.categories[key] + '</option>';
            }

            var html = '<div class="confidence-reasoning-container" data-question-id="' + questionId + '" ' +
                       'style="margin-top: 15px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;">';

            // Confidence level slider
            html += '<div class="confidence-level-group" style="margin-bottom: 15px;">';
            html += '<label style="font-weight: bold; display: block; margin-bottom: 5px;">' + labels.confidenceLabel + '</label>';
            html += '<input type="range" class="confidence-slider" min="1" max="5" value="3" ' +
                    'data-question-id="' + questionId + '" style="width: 100%;" />';
            html += '<div class="confidence-value" style="text-align: center; margin-top: 5px; font-weight: bold;">' +
                    labels.levels[2] + '</div>';
            html += '</div>';

            // Reasoning category dropdown
            html += '<div class="reasoning-category-group" style="margin-bottom: 15px;">';
            html += '<label style="font-weight: bold; display: block; margin-bottom: 5px;">' + labels.categoryLabel + '</label>';
            html += '<select class="reasoning-category" data-question-id="' + questionId + '" ' +
                    'style="width: 100%; padding: 5px;">' + categoryOptions + '</select>';
            html += '</div>';

            // Reasoning text area
            html += '<div class="reasoning-text-group">';
            html += '<label style="font-weight: bold; display: block; margin-bottom: 5px;">' + labels.reasoningLabel + '</label>';
            html += '<textarea class="reasoning-text" rows="3" data-question-id="' + questionId + '" ' +
                    'style="width: 100%; padding: 5px;" placeholder="' +
                    (isKorean ? '이유를 간단히 설명해주세요...' : 'Briefly explain your reasoning...') +
                    '"></textarea>';
            html += '</div>';

            html += '</div>';

            return html;
        },

        /**
         * Attach event handlers
         */
        attachEventHandlers: function() {
            var self = this;

            // Confidence slider change
            $(document).on('input', '.confidence-slider', function() {
                var value = $(this).val();
                var $container = $(this).closest('.confidence-reasoning-container');
                var lang = document.documentElement.lang || 'en';
                var isKorean = lang.startsWith('ko');

                var levels = isKorean ? [
                    '1 - 매우 불확실함',
                    '2 - 불확실함',
                    '3 - 보통',
                    '4 - 확신함',
                    '5 - 매우 확신함'
                ] : [
                    '1 - Very unsure',
                    '2 - Unsure',
                    '3 - Neutral',
                    '4 - Confident',
                    '5 - Very confident'
                ];

                $container.find('.confidence-value').text(levels[value - 1]);
            });

            // Save on blur or change
            $(document).on('change blur', '.confidence-slider, .reasoning-category, .reasoning-text', function() {
                var $container = $(this).closest('.confidence-reasoning-container');
                self.saveConfidenceData($container);
            });

            // Save before quiz submission
            $('form[name="responseform"]').on('submit', function() {
                self.saveAllConfidenceData();
            });
        },

        /**
         * Get question ID from question element
         *
         * @param {jQuery} $question
         * @return {Number|null}
         */
        getQuestionId: function($question) {
            var id = $question.attr('id');
            if (id && id.startsWith('question-')) {
                return parseInt(id.replace('question-', ''));
            }
            return null;
        },

        /**
         * Save confidence data for a single question
         *
         * @param {jQuery} $container
         */
        saveConfidenceData: function($container) {
            var questionId = $container.data('question-id');
            var confidenceLevel = parseInt($container.find('.confidence-slider').val());
            var reasoningCategory = $container.find('.reasoning-category').val();
            var reasoningText = $container.find('.reasoning-text').val();

            // Get quiz and user IDs from page
            var quizId = this.getQuizId();
            var userId = this.getUserId();
            var questionAttemptId = this.getQuestionAttemptId(questionId);

            if (!questionAttemptId) {
                return; // Can't save without question attempt ID
            }

            // Call AJAX service
            var promises = Ajax.call([{
                methodname: 'local_confidencereasoning_save_confidence_data',
                args: {
                    questionattemptid: questionAttemptId,
                    userid: userId,
                    quizid: quizId,
                    questionid: questionId,
                    confidencelevel: confidenceLevel,
                    reasoning: reasoningText,
                    reasoningcategory: reasoningCategory
                }
            }]);

            promises[0].done(function(response) {
                if (response.success) {
                    // Show brief success indicator
                    $container.css('border-color', '#28a745');
                    setTimeout(function() {
                        $container.css('border-color', '#ddd');
                    }, 1000);
                }
            }).fail(function(error) {
                Notification.exception(error);
            });
        },

        /**
         * Save all confidence data before quiz submission
         */
        saveAllConfidenceData: function() {
            var self = this;
            $('.confidence-reasoning-container').each(function() {
                self.saveConfidenceData($(this));
            });
        },

        /**
         * Get quiz ID from page
         *
         * @return {Number}
         */
        getQuizId: function() {
            // Try to get from URL parameter
            var urlParams = new URLSearchParams(window.location.search);
            var id = urlParams.get('id') || urlParams.get('cmid');
            return parseInt(id) || 0;
        },

        /**
         * Get user ID from page
         *
         * @return {Number}
         */
        getUserId: function() {
            // This should be injected from PHP via data attribute or M.cfg
            return window.M && window.M.cfg && window.M.cfg.userid ? window.M.cfg.userid : 0;
        },

        /**
         * Get question attempt ID for a question
         *
         * @param {Number} questionId
         * @return {Number|null}
         */
        getQuestionAttemptId: function(questionId) {
            // Try to extract from hidden form fields
            var $input = $('input[name*="q' + questionId + ':"]').first();
            if ($input.length > 0) {
                var name = $input.attr('name');
                var match = name.match(/q(\d+):/);
                if (match) {
                    return parseInt(match[1]);
                }
            }
            return questionId; // Fallback to question ID
        }
    };

    return ConfidenceUI;
});
