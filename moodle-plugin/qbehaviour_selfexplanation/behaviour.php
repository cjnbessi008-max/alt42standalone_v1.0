<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Question behaviour for self-explanation.
 *
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/classes/explanation_analyzer.php');

/**
 * Self-explanation question behaviour.
 *
 * This behaviour requires students to explain their reasoning after submitting
 * an answer, particularly when they answer correctly.
 *
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class qbehaviour_selfexplanation extends question_behaviour_with_save {

    /** State when explanation is required */
    const STATE_EXPLANATION_REQUIRED = 'needsexplanation';

    /** State when explanation was rejected */
    const STATE_EXPLANATION_REJECTED = 'explanationrejected';

    /**
     * Get the configuration for this question/quiz.
     *
     * @return stdClass Configuration object
     */
    protected function get_config() {
        global $DB;

        static $config = null;

        if ($config !== null) {
            return $config;
        }

        // Try to get quiz-specific config
        $quizid = $this->qa->get_usage_id(); // This might need adjustment based on actual quiz access

        $config = $DB->get_record('qbehaviour_selfexpl_config',
            array('quizid' => $quizid, 'questionid' => null));

        if (!$config) {
            // Use default configuration
            $config = new stdClass();
            $config->require_on_correct = get_config('qbehaviour_selfexplanation', 'require_on_correct') ?? 1;
            $config->require_on_incorrect = get_config('qbehaviour_selfexplanation', 'require_on_incorrect') ?? 0;
            $config->min_words = get_config('qbehaviour_selfexplanation', 'default_min_words') ?? 20;
            $config->min_chars = get_config('qbehaviour_selfexplanation', 'default_min_chars') ?? 50;
            $config->enable_ai_analysis = get_config('qbehaviour_selfexplanation', 'enable_ai_analysis') ?? 0;
            $config->blocked_phrases = '["모르겠다", "그냥", "I don\'t know", "just guessed"]';
            $config->required_keywords = '[]';
        }

        return $config;
    }

    /**
     * Return what data can be in the request.
     *
     * @return array Expected data keys
     */
    public function get_expected_data() {
        $expected = parent::get_expected_data();
        $expected['explanation'] = PARAM_RAW_TRIMMED;
        $expected['-submitexplanation'] = PARAM_BOOL;
        return $expected;
    }

    /**
     * Determine what state we need to move to next.
     *
     * @param question_attempt_pending_step $pendingstep
     * @return bool Whether the step should be kept
     */
    public function process_action(question_attempt_pending_step $pendingstep) {

        // Check if this is an explanation submission
        if ($pendingstep->has_behaviour_var('submitexplanation')) {
            return $this->process_explanation($pendingstep);
        }

        // Otherwise, process as normal submit
        if ($pendingstep->has_behaviour_var('submit')) {
            return $this->process_submit($pendingstep);
        }

        return parent::process_action($pendingstep);
    }

    /**
     * Process the initial answer submission.
     *
     * @param question_attempt_pending_step $pendingstep
     * @return bool Whether the step should be kept
     */
    public function process_submit(question_attempt_pending_step $pendingstep) {
        // First, grade the answer
        $status = $this->process_save($pendingstep);

        // Get the fraction (0 = wrong, 1 = correct)
        $fraction = $this->question->grade_response(
            $this->qa->get_last_step_with_qt_var('answer')
        );

        $pendingstep->set_fraction($fraction);

        $config = $this->get_config();

        // Determine if explanation is required
        $needs_explanation = false;

        if ($fraction >= 0.99 && $config->require_on_correct) {
            // Correct answer and explanation required
            $needs_explanation = true;
            $pendingstep->set_state(question_state::$needsgrading);
            $pendingstep->set_behaviour_var('_explanation_required', 1);
        } else if ($fraction < 0.99 && $config->require_on_incorrect) {
            // Incorrect answer and explanation required
            $needs_explanation = true;
            $pendingstep->set_state(question_state::$needsgrading);
            $pendingstep->set_behaviour_var('_explanation_required', 1);
        } else {
            // No explanation required, mark as complete
            if ($fraction >= 0.99) {
                $pendingstep->set_state(question_state::$gradedright);
            } else if ($fraction > 0) {
                $pendingstep->set_state(question_state::$gradedpartial);
            } else {
                $pendingstep->set_state(question_state::$gradedwrong);
            }
        }

        return question_attempt::KEEP;
    }

    /**
     * Process the explanation submission.
     *
     * @param question_attempt_pending_step $pendingstep
     * @return bool Whether the step should be kept
     */
    public function process_explanation(question_attempt_pending_step $pendingstep) {
        global $DB, $USER;

        $explanation = $pendingstep->get_qt_var('explanation');

        if (empty($explanation)) {
            $pendingstep->set_behaviour_var('_explanation_error', 'empty');
            return question_attempt::KEEP;
        }

        $config = $this->get_config();

        // Validate the explanation
        $analyzer = new qbehaviour_selfexplanation_analyzer();
        $errors = $analyzer->validate_explanation($explanation, $config, $this->question);

        if (!empty($errors)) {
            // Explanation rejected
            $pendingstep->set_behaviour_var('_explanation_error', implode(',', $errors));
            $pendingstep->set_behaviour_var('_explanation_rejected', 1);
            return question_attempt::KEEP;
        }

        // Explanation accepted - save to database
        $record = new stdClass();
        $record->questionattemptid = $this->qa->get_database_id();
        $record->userid = $USER->id;
        $record->questionid = $this->question->id;
        $record->attemptid = $this->qa->get_usage_id(); // Quiz attempt ID
        $record->explanation = $explanation;
        $record->word_count = str_word_count($explanation);
        $record->char_count = mb_strlen($explanation);
        $record->quality_score = $analyzer->calculate_quality_score($explanation, $this->question);
        $record->timecreated = time();
        $record->timemodified = time();

        $DB->insert_record('qbehaviour_selfexplanation', $record);

        // Clear the explanation requirement
        $pendingstep->set_behaviour_var('_explanation_required', 0);
        $pendingstep->set_behaviour_var('_explanation_accepted', 1);

        // Set final state based on original answer correctness
        $fraction = $this->qa->get_fraction();

        if ($fraction >= 0.99) {
            $pendingstep->set_state(question_state::$gradedright);
        } else if ($fraction > 0) {
            $pendingstep->set_state(question_state::$gradedpartial);
        } else {
            $pendingstep->set_state(question_state::$gradedwrong);
        }

        // Schedule AI analysis if enabled
        if ($config->enable_ai_analysis) {
            $this->schedule_ai_analysis($record);
        }

        return question_attempt::KEEP;
    }

    /**
     * Schedule AI analysis as a background task.
     *
     * @param stdClass $record The explanation record
     */
    protected function schedule_ai_analysis($record) {
        // TODO: Implement adhoc task for AI analysis
        // This would use Moodle's task API to queue the analysis
    }

    /**
     * Get the most applicable hint for the current state.
     *
     * @return question_hint|null
     */
    protected function get_applicable_hint() {
        return null; // No hints in this behaviour
    }

    /**
     * What is the minimum fraction that can be scored for this question?
     *
     * @return number
     */
    public function get_min_fraction() {
        return 0;
    }

    /**
     * What is the maximum fraction that can be scored for this question?
     *
     * @return number
     */
    public function get_max_fraction() {
        return 1;
    }

    /**
     * Returns a summary of this attempt for display.
     *
     * @return string Summary text
     */
    public function summarise_action(question_attempt_step $step) {
        if ($step->has_behaviour_var('submitexplanation')) {
            return get_string('submitexplanation', 'qbehaviour_selfexplanation');
        }
        return parent::summarise_action($step);
    }
}
