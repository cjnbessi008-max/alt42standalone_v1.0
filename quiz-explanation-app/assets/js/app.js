/**
 * Quiz Explanation App - JavaScript
 */

$(document).ready(function() {
    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        $('.alert').fadeOut('slow');
    }, 5000);

    // Confirm delete actions
    $('.btn-delete').on('click', function(e) {
        if (!confirm('Are you sure you want to delete this item?')) {
            e.preventDefault();
        }
    });

    // Character counter for textareas
    $('textarea[data-max-length]').each(function() {
        const $textarea = $(this);
        const maxLength = $textarea.data('max-length');
        const $counter = $('<div class="text-muted text-right mt-1"><span class="current">0</span> / ' + maxLength + ' characters</div>');

        $textarea.after($counter);

        $textarea.on('input', function() {
            const length = $(this).val().length;
            $counter.find('.current').text(length);

            if (length > maxLength) {
                $counter.addClass('text-danger');
            } else {
                $counter.removeClass('text-danger');
            }
        });
    });
});

/**
 * Dynamic option management for question creation
 */
let optionCount = 4;

function addOption() {
    optionCount++;
    const optionHtml = `
        <div class="option-item" id="option-${optionCount}">
            <div class="form-row">
                <div class="col-md-8">
                    <input type="text" name="options[]" class="form-control" placeholder="Option ${optionCount}" required>
                </div>
                <div class="col-md-3">
                    <div class="custom-control custom-checkbox">
                        <input type="checkbox" class="custom-control-input correct-option" name="correct_option" value="${optionCount}" id="correct-${optionCount}">
                        <label class="custom-control-label" for="correct-${optionCount}">Correct Answer</label>
                    </div>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger btn-sm" onclick="removeOption(${optionCount})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    $('#options-container').append(optionHtml);
}

function removeOption(id) {
    $(`#option-${id}`).remove();
}

/**
 * Dynamic keyword management
 */
let keywordCount = 0;

function addKeyword() {
    keywordCount++;
    const keywordHtml = `
        <div class="keyword-item" id="keyword-${keywordCount}">
            <div class="form-row">
                <div class="col-md-4">
                    <input type="text" name="keywords[]" class="form-control" placeholder="Keyword" required>
                </div>
                <div class="col-md-3">
                    <select name="keyword_types[]" class="form-control">
                        <option value="required">Required</option>
                        <option value="bonus">Bonus</option>
                        <option value="negative">Negative</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <input type="number" name="keyword_weights[]" class="form-control" placeholder="Weight" step="0.1" value="1.0" min="0">
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-danger btn-sm" onclick="removeKeyword(${keywordCount})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    $('#keywords-container').append(keywordHtml);
}

function removeKeyword(id) {
    $(`#keyword-${id}`).remove();
}

/**
 * Quiz timer functionality
 */
let timerInterval;
let timeRemaining;

function startTimer(duration) {
    timeRemaining = duration * 60; // Convert to seconds

    timerInterval = setInterval(function() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;

        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        $('#timer-display').text(display);

        if (timeRemaining <= 300) { // 5 minutes
            $('#timer-display').removeClass('timer-warning').addClass('timer-danger');
        } else if (timeRemaining <= 600) { // 10 minutes
            $('#timer-display').addClass('timer-warning');
        }

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Your quiz will be submitted automatically.');
            $('#quiz-form').submit();
        }

        timeRemaining--;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

/**
 * Quiz submission with validation
 */
function validateQuizSubmission() {
    const questions = $('.question-container');
    let allAnswered = true;
    let allExplained = true;

    questions.each(function() {
        const $question = $(this);
        const questionId = $question.data('question-id');

        // Check if answer is selected
        const answered = $question.find('input[type="radio"]:checked').length > 0;
        if (!answered) {
            allAnswered = false;
        }

        // Check if explanation is provided
        const explanation = $question.find('textarea[name="explanations[' + questionId + ']"]').val().trim();
        if (!explanation || explanation.length < 20) {
            allExplained = false;
        }
    });

    if (!allAnswered) {
        alert('Please answer all questions before submitting.');
        return false;
    }

    if (!allExplained) {
        const proceed = confirm('Some explanations are missing or too short. Do you want to submit anyway?');
        return proceed;
    }

    return true;
}

/**
 * AJAX form submission
 */
function submitFormAjax(formId, successCallback) {
    $(`#${formId}`).on('submit', function(e) {
        e.preventDefault();

        const formData = $(this).serialize();
        const action = $(this).attr('action');

        $.ajax({
            url: action,
            method: 'POST',
            data: formData,
            dataType: 'json',
            beforeSend: function() {
                $(`#${formId} button[type="submit"]`).prop('disabled', true).html('<span class="loading-spinner"></span> Processing...');
            },
            success: function(response) {
                if (response.success) {
                    if (successCallback) {
                        successCallback(response);
                    } else {
                        showAlert('success', response.message);
                    }
                } else {
                    showAlert('danger', response.error || 'An error occurred.');
                }
            },
            error: function(xhr) {
                showAlert('danger', 'Server error. Please try again.');
            },
            complete: function() {
                $(`#${formId} button[type="submit"]`).prop('disabled', false).html('Submit');
            }
        });
    });
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>
    `;

    $('#alert-container').html(alertHtml);

    setTimeout(function() {
        $('.alert').fadeOut('slow');
    }, 5000);
}

/**
 * Load quiz questions dynamically
 */
function loadQuizQuestions(quizId) {
    $.ajax({
        url: '/api/get_questions.php',
        method: 'GET',
        data: { quiz_id: quizId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                renderQuestions(response.data);
            } else {
                showAlert('danger', response.error);
            }
        },
        error: function() {
            showAlert('danger', 'Failed to load questions.');
        }
    });
}

/**
 * Render questions
 */
function renderQuestions(questions) {
    const container = $('#questions-container');
    container.empty();

    questions.forEach(function(question, index) {
        const questionHtml = createQuestionHtml(question, index + 1);
        container.append(questionHtml);
    });
}

/**
 * Create question HTML
 */
function createQuestionHtml(question, number) {
    let optionsHtml = '';

    question.options.forEach(function(option) {
        optionsHtml += `
            <div class="form-check quiz-option">
                <input class="form-check-input" type="radio" name="answers[${question.id}]" value="${option.id}" id="option-${option.id}">
                <label class="form-check-label" for="option-${option.id}">
                    ${option.option_text}
                </label>
            </div>
        `;
    });

    return `
        <div class="question-container" data-question-id="${question.id}">
            <h5>Question ${number}</h5>
            <p class="question-text">${question.question_text}</p>

            <div class="mb-3">
                ${optionsHtml}
            </div>

            <div class="form-group">
                <label for="explanation-${question.id}">
                    <strong>Explain why your answer is correct:</strong>
                </label>
                <textarea class="form-control explanation-textarea" name="explanations[${question.id}]" id="explanation-${question.id}" rows="4" placeholder="Write your explanation here..." required></textarea>
                <small class="form-text text-muted">Minimum 20 characters required.</small>
            </div>
        </div>
    `;
}

/**
 * Format score display
 */
function formatScore(score) {
    return Math.round(score * 10) / 10;
}

/**
 * Sync grades to Moodle
 */
function syncGradeToMoodle(attemptId) {
    $.ajax({
        url: '/api/sync_grades.php',
        method: 'POST',
        data: { attempt_id: attemptId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showAlert('success', 'Grade synced to Moodle successfully!');
            } else {
                showAlert('warning', 'Failed to sync grade to Moodle: ' + response.error);
            }
        },
        error: function() {
            showAlert('danger', 'Error syncing grade to Moodle.');
        }
    });
}
