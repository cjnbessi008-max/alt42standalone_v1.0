/**
 * Interactive Reasoning Step Builder
 *
 * Provides drag-and-drop, dynamic step management for reasoning path questions.
 *
 * @module     qtype_reasoningpath/step_builder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, ajax, notification) {

    /**
     * Step Builder class
     */
    var StepBuilder = function(questionAttemptId, minSteps) {
        this.questionAttemptId = questionAttemptId;
        this.minSteps = minSteps || 3;
        this.steps = [];
        this.currentStepNumber = 1;
        this.container = null;
        this.init();
    };

    /**
     * Initialize the step builder
     */
    StepBuilder.prototype.init = function() {
        this.container = $('#reasoningpath-steps-container-' + this.questionAttemptId);

        if (this.container.length === 0) {
            console.error('Step container not found for question attempt:', this.questionAttemptId);
            return;
        }

        this.setupEventHandlers();
        this.loadSavedSteps();

        // Add initial empty step
        if (this.steps.length === 0) {
            this.addStep();
        }

        // Update hidden input on form submit
        var form = this.container.closest('form');
        form.on('submit', this.onFormSubmit.bind(this));
    };

    /**
     * Setup event handlers
     */
    StepBuilder.prototype.setupEventHandlers = function() {
        var self = this;

        // Add step button
        this.container.on('click', '.add-step-btn', function(e) {
            e.preventDefault();
            self.addStep();
        });

        // Remove step button
        this.container.on('click', '.remove-step-btn', function(e) {
            e.preventDefault();
            var stepNumber = $(this).data('step');
            self.removeStep(stepNumber);
        });

        // Step content change - auto-save
        this.container.on('change blur', '.step-content, .step-description, .step-type', function() {
            var stepNumber = $(this).closest('.reasoning-step').data('step');
            self.saveStepData(stepNumber);
        });

        // LaTeX input support
        this.container.on('click', '.insert-math-btn', function(e) {
            e.preventDefault();
            var stepNumber = $(this).data('step');
            self.openMathEditor(stepNumber);
        });
    };

    /**
     * Add a new reasoning step
     */
    StepBuilder.prototype.addStep = function(stepData) {
        var stepNumber = this.currentStepNumber++;

        var stepData = stepData || {
            type: 'calculation',
            content: '',
            description: '',
            latex: ''
        };

        this.steps.push({
            number: stepNumber,
            data: stepData
        });

        var stepHtml = this.renderStep(stepNumber, stepData);
        this.container.find('.steps-list').append(stepHtml);

        this.updateStepNumbers();
        this.updateSubmitButton();

        // Focus on new step
        $('#step-content-' + stepNumber).focus();
    };

    /**
     * Render a single step
     */
    StepBuilder.prototype.renderStep = function(stepNumber, data) {
        var html = '<div class="reasoning-step card mb-3" data-step="' + stepNumber + '">';
        html += '  <div class="card-header">';
        html += '    <strong>단계 ' + stepNumber + '</strong>';
        html += '    <button type="button" class="btn btn-sm btn-danger float-right remove-step-btn" data-step="' + stepNumber + '">';
        html += '      <i class="fa fa-trash"></i> 삭제';
        html += '    </button>';
        html += '  </div>';
        html += '  <div class="card-body">';

        // Step type selector
        html += '    <div class="form-group">';
        html += '      <label>단계 유형:</label>';
        html += '      <select class="form-control step-type" id="step-type-' + stepNumber + '">';
        html += '        <option value="calculation"' + (data.type === 'calculation' ? ' selected' : '') + '>계산</option>';
        html += '        <option value="explanation"' + (data.type === 'explanation' ? ' selected' : '') + '>설명</option>';
        html += '        <option value="assumption"' + (data.type === 'assumption' ? ' selected' : '') + '>가정</option>';
        html += '        <option value="conclusion"' + (data.type === 'conclusion' ? ' selected' : '') + '>결론</option>';
        html += '      </select>';
        html += '    </div>';

        // Step description
        html += '    <div class="form-group">';
        html += '      <label>설명 (왜 이 단계를 수행했나요?):</label>';
        html += '      <input type="text" class="form-control step-description" id="step-desc-' + stepNumber + '" ';
        html += '             placeholder="예: 양변에서 5를 뺍니다" value="' + (data.description || '') + '">';
        html += '    </div>';

        // Step content
        html += '    <div class="form-group">';
        html += '      <label>작업 내용:</label>';
        html += '      <div class="input-group">';
        html += '        <textarea class="form-control step-content" id="step-content-' + stepNumber + '" rows="3" ';
        html += '                  placeholder="예: 2x + 5 - 5 = 13 - 5&#10;    2x = 8">' + (data.content || '') + '</textarea>';
        html += '        <div class="input-group-append">';
        html += '          <button type="button" class="btn btn-outline-secondary insert-math-btn" data-step="' + stepNumber + '">';
        html += '            <i class="fa fa-calculator"></i> 수식 입력';
        html += '          </button>';
        html += '        </div>';
        html += '      </div>';
        html += '    </div>';

        // LaTeX preview (if available)
        if (data.latex) {
            html += '    <div class="math-preview">';
            html += '      <small class="text-muted">수식:</small> ';
            html += '      <span class="math-latex">\\(' + data.latex + '\\)</span>';
            html += '    </div>';
        }

        html += '  </div>';
        html += '</div>';

        return html;
    };

    /**
     * Remove a step
     */
    StepBuilder.prototype.removeStep = function(stepNumber) {
        // Don't allow removing if only one step left
        if (this.steps.length <= 1) {
            notification.alert('경고', '최소 1개의 단계가 필요합니다.', 'OK');
            return;
        }

        this.steps = this.steps.filter(function(step) {
            return step.number !== stepNumber;
        });

        this.container.find('.reasoning-step[data-step="' + stepNumber + '"]').remove();
        this.updateStepNumbers();
        this.updateSubmitButton();
    };

    /**
     * Save data for a specific step
     */
    StepBuilder.prototype.saveStepData = function(stepNumber) {
        var stepContainer = this.container.find('.reasoning-step[data-step="' + stepNumber + '"]');

        var data = {
            type: stepContainer.find('.step-type').val(),
            description: stepContainer.find('.step-description').val(),
            content: stepContainer.find('.step-content').val(),
            latex: stepContainer.find('.math-latex').text() || ''
        };

        // Update in steps array
        var step = this.steps.find(function(s) { return s.number === stepNumber; });
        if (step) {
            step.data = data;
        }

        // Update hidden input
        this.updateHiddenInput();
    };

    /**
     * Update hidden input with all steps data
     */
    StepBuilder.prototype.updateHiddenInput = function() {
        var stepsData = this.steps.map(function(step) {
            return step.data;
        });

        var input = $('#reasoningpath-steps-data-' + this.questionAttemptId);
        if (input.length === 0) {
            // Create hidden input if doesn't exist
            input = $('<input type="hidden" name="steps" id="reasoningpath-steps-data-' + this.questionAttemptId + '">');
            this.container.append(input);
        }

        input.val(JSON.stringify(stepsData));

        // Also update step count
        var countInput = $('input[name="step_count"]');
        if (countInput.length > 0) {
            countInput.val(this.steps.length);
        }
    };

    /**
     * Update step numbers in UI
     */
    StepBuilder.prototype.updateStepNumbers = function() {
        var self = this;
        this.container.find('.reasoning-step').each(function(index) {
            $(this).find('.card-header strong').text('단계 ' + (index + 1));
        });
    };

    /**
     * Update submit button state
     */
    StepBuilder.prototype.updateSubmitButton = function() {
        var submitBtn = this.container.closest('form').find('input[type="submit"], button[type="submit"]');
        var isValid = this.validateSteps();

        if (isValid) {
            submitBtn.prop('disabled', false);
            submitBtn.removeClass('btn-secondary').addClass('btn-primary');
        } else {
            submitBtn.prop('disabled', true);
            submitBtn.removeClass('btn-primary').addClass('btn-secondary');
        }

        // Show validation message
        this.showValidationMessage(isValid);
    };

    /**
     * Validate all steps
     */
    StepBuilder.prototype.validateSteps = function() {
        if (this.steps.length < this.minSteps) {
            return false;
        }

        // Check that all steps have content
        for (var i = 0; i < this.steps.length; i++) {
            var step = this.steps[i];
            if (!step.data.content && !step.data.description) {
                return false;
            }
        }

        return true;
    };

    /**
     * Show validation message
     */
    StepBuilder.prototype.showValidationMessage = function(isValid) {
        var msgContainer = this.container.find('.validation-message');
        if (msgContainer.length === 0) {
            msgContainer = $('<div class="validation-message alert"></div>');
            this.container.prepend(msgContainer);
        }

        if (isValid) {
            msgContainer.hide();
        } else {
            var message = '최소 ' + this.minSteps + '개의 단계가 필요합니다.';
            if (this.steps.length < this.minSteps) {
                message += ' (현재: ' + this.steps.length + '개)';
            } else {
                message = '모든 단계에 내용을 입력해주세요.';
            }
            msgContainer.removeClass('alert-success').addClass('alert-warning');
            msgContainer.text(message);
            msgContainer.show();
        }
    };

    /**
     * Open math editor modal
     */
    StepBuilder.prototype.openMathEditor = function(stepNumber) {
        // This would integrate with a LaTeX editor like MathJax or KaTeX
        // For now, use a simple prompt
        var latex = prompt('LaTeX 수식을 입력하세요:\n(예: x^2 + 2x + 1 = 0)');
        if (latex) {
            var stepContainer = this.container.find('.reasoning-step[data-step="' + stepNumber + '"]');
            var preview = stepContainer.find('.math-preview');

            if (preview.length === 0) {
                preview = $('<div class="math-preview"><small class="text-muted">수식:</small> <span class="math-latex"></span></div>');
                stepContainer.find('.card-body').append(preview);
            }

            preview.find('.math-latex').text('\\(' + latex + '\\)');

            // Trigger MathJax rendering if available
            if (typeof MathJax !== 'undefined') {
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, preview[0]]);
            }

            this.saveStepData(stepNumber);
        }
    };

    /**
     * Load saved steps from session/database
     */
    StepBuilder.prototype.loadSavedSteps = function() {
        // Try to load from hidden input (page refresh)
        var input = $('#reasoningpath-steps-data-' + this.questionAttemptId);
        if (input.length > 0 && input.val()) {
            try {
                var savedSteps = JSON.parse(input.val());
                for (var i = 0; i < savedSteps.length; i++) {
                    this.addStep(savedSteps[i]);
                }
            } catch (e) {
                console.error('Failed to parse saved steps:', e);
            }
        }
    };

    /**
     * Handle form submission
     */
    StepBuilder.prototype.onFormSubmit = function(e) {
        // Collect all current step data
        var self = this;
        this.steps.forEach(function(step) {
            self.saveStepData(step.number);
        });

        this.updateHiddenInput();

        // Final validation
        if (!this.validateSteps()) {
            e.preventDefault();
            notification.alert('제출 불가', '모든 단계를 완성해주세요.', 'OK');
            return false;
        }

        return true;
    };

    /**
     * Initialize all step builders on the page
     */
    var init = function() {
        $('.reasoningpath-question').each(function() {
            var questionAttemptId = $(this).data('attempt-id');
            var minSteps = $(this).data('min-steps') || 3;

            new StepBuilder(questionAttemptId, minSteps);
        });
    };

    return {
        init: init,
        StepBuilder: StepBuilder
    };
});
