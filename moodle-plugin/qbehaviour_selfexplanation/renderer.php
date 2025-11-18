<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Renderer for self-explanation question behaviour.
 *
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Renderer class for self-explanation behaviour.
 *
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qbehaviour_selfexplanation_renderer extends qbehaviour_renderer {

    /**
     * Render the explanation input form.
     *
     * @param question_attempt $qa The question attempt
     * @param question_display_options $options Display options
     * @return string HTML output
     */
    public function controls(question_attempt $qa, question_display_options $options) {
        $output = '';

        // Check if explanation is required
        $explanation_required = $qa->get_last_behaviour_var('_explanation_required');
        $explanation_error = $qa->get_last_behaviour_var('_explanation_error');
        $explanation_accepted = $qa->get_last_behaviour_var('_explanation_accepted');

        if ($explanation_required && !$explanation_accepted) {
            // Show explanation form
            $output .= $this->render_explanation_form($qa, $options, $explanation_error);
        } else if ($explanation_accepted) {
            // Show success message
            $output .= $this->render_explanation_accepted($qa);
        }

        return $output;
    }

    /**
     * Render the explanation input form.
     *
     * @param question_attempt $qa The question attempt
     * @param question_display_options $options Display options
     * @param string|null $error Error code if validation failed
     * @return string HTML output
     */
    protected function render_explanation_form($qa, $options, $error = null) {
        global $PAGE;

        $output = '';

        // Load JavaScript module
        $config = $this->get_config($qa);
        $PAGE->requires->js_call_amd('qbehaviour_selfexplanation/explanation', 'init', array(
            'min_chars' => $config->min_chars,
            'min_words' => $config->min_words,
        ));

        // Determine if this was a correct or incorrect answer
        $fraction = $qa->get_fraction();
        $is_correct = ($fraction >= 0.99);

        // Container
        $output .= html_writer::start_div('qbehaviour-selfexplanation-container');

        // Answer correctness indicator
        if ($is_correct) {
            $output .= html_writer::div(
                '✓ ' . get_string('correct', 'question'),
                'alert alert-success correct-answer-indicator'
            );
        } else {
            $output .= html_writer::div(
                '✗ ' . get_string('incorrect', 'question'),
                'alert alert-danger incorrect-answer-indicator'
            );
        }

        // Show error message if validation failed
        if ($error) {
            $error_messages = explode(',', $error);
            foreach ($error_messages as $err) {
                $error_string = 'explanation' . $err;
                $output .= html_writer::div(
                    get_string($error_string, 'qbehaviour_selfexplanation', $config),
                    'alert alert-warning explanation-error'
                );
            }
        }

        // Explanation prompt
        $output .= html_writer::start_div('explanation-prompt');
        $output .= html_writer::tag('h4',
            get_string('explainprompt', 'qbehaviour_selfexplanation'));

        $help_text = get_string('explainprompt_help', 'qbehaviour_selfexplanation');
        $output .= html_writer::div($help_text, 'hint');
        $output .= html_writer::end_div();

        // Textarea for explanation
        $input_name = $qa->get_qt_field_name('explanation');
        $current_value = $qa->get_last_qt_var('explanation', '');

        $attributes = array(
            'name' => $input_name,
            'id' => $input_name,
            'class' => 'explanation-input form-control',
            'rows' => 6,
            'placeholder' => get_string('explanationplaceholder', 'qbehaviour_selfexplanation'),
            'required' => 'required',
        );

        $output .= html_writer::tag('textarea', s($current_value), $attributes);

        // Character and word count feedback
        $output .= html_writer::start_div('explanation-feedback');
        $output .= html_writer::span('', 'char-count', array('id' => 'char-count-' . $qa->get_slot()));
        $output .= ' | ';
        $output .= html_writer::span('', 'word-count', array('id' => 'word-count-' . $qa->get_slot()));
        $output .= html_writer::end_div();

        // Submit button
        $submit_name = $qa->get_behaviour_field_name('submitexplanation');
        $submit_attributes = array(
            'type' => 'submit',
            'name' => $submit_name,
            'value' => get_string('submitexplanation', 'qbehaviour_selfexplanation'),
            'class' => 'btn btn-primary submit-explanation-btn',
            'id' => 'submit-explanation-' . $qa->get_slot(),
            'disabled' => 'disabled', // Initially disabled until min requirements met
        );

        $output .= html_writer::empty_tag('input', $submit_attributes);

        $output .= html_writer::end_div(); // End container

        return $output;
    }

    /**
     * Render the explanation accepted message.
     *
     * @param question_attempt $qa The question attempt
     * @return string HTML output
     */
    protected function render_explanation_accepted($qa) {
        $output = '';

        $output .= html_writer::div(
            '✓ ' . get_string('explanationaccepted', 'qbehaviour_selfexplanation'),
            'alert alert-success explanation-accepted'
        );

        return $output;
    }

    /**
     * Get configuration for the question attempt.
     *
     * @param question_attempt $qa The question attempt
     * @return stdClass Configuration
     */
    protected function get_config($qa) {
        global $DB;

        // Try to get quiz-specific config
        $quizid = $qa->get_usage_id();

        $config = $DB->get_record('qbehaviour_selfexpl_config',
            array('quizid' => $quizid, 'questionid' => null));

        if (!$config) {
            // Use default configuration
            $config = new stdClass();
            $config->min_words = get_config('qbehaviour_selfexplanation', 'default_min_words') ?? 20;
            $config->min_chars = get_config('qbehaviour_selfexplanation', 'default_min_chars') ?? 50;
        }

        return $config;
    }

    /**
     * Display the grading information (for review).
     *
     * @param question_attempt $qa The question attempt
     * @param question_display_options $options Display options
     * @return string HTML output
     */
    public function feedback(question_attempt $qa, question_display_options $options) {
        global $DB;

        $output = '';

        // Get the explanation from database
        $explanation = $DB->get_record('qbehaviour_selfexplanation',
            array('questionattemptid' => $qa->get_database_id()));

        if ($explanation) {
            $output .= html_writer::start_div('selfexplanation-review');

            $output .= html_writer::tag('h5',
                get_string('yourexplanation', 'qbehaviour_selfexplanation'));

            $output .= html_writer::div(
                format_text($explanation->explanation, FORMAT_PLAIN),
                'explanation-text'
            );

            // Show quality metrics
            $output .= html_writer::start_div('explanation-metrics');

            $output .= html_writer::div(
                get_string('wordcount', 'qbehaviour_selfexplanation') . ': ' . $explanation->word_count,
                'metric'
            );

            if ($explanation->quality_score !== null) {
                $score_percent = round($explanation->quality_score * 100);
                $output .= html_writer::div(
                    get_string('qualityscore', 'qbehaviour_selfexplanation') . ': ' . $score_percent . '%',
                    'metric quality-score-' . $this->get_quality_class($explanation->quality_score)
                );
            }

            $output .= html_writer::end_div(); // End metrics

            // Show AI feedback if available
            if (!empty($explanation->ai_feedback)) {
                $output .= html_writer::start_div('ai-feedback alert alert-info');
                $output .= html_writer::tag('strong',
                    get_string('aifeedback', 'qbehaviour_selfexplanation') . ': ');
                $output .= format_text($explanation->ai_feedback, FORMAT_PLAIN);
                $output .= html_writer::end_div();
            }

            // Show teacher comment if available
            if (!empty($explanation->teacher_comment)) {
                $output .= html_writer::start_div('teacher-comment alert alert-primary');
                $output .= html_writer::tag('strong',
                    get_string('teachercomment', 'qbehaviour_selfexplanation') . ': ');
                $output .= format_text($explanation->teacher_comment, FORMAT_PLAIN);
                $output .= html_writer::end_div();
            }

            $output .= html_writer::end_div(); // End review
        }

        return $output;
    }

    /**
     * Get CSS class for quality score.
     *
     * @param float $score Quality score (0-1)
     * @return string CSS class
     */
    protected function get_quality_class($score) {
        if ($score >= 0.8) {
            return 'excellent';
        } else if ($score >= 0.6) {
            return 'good';
        } else if ($score >= 0.4) {
            return 'fair';
        } else {
            return 'poor';
        }
    }
}
