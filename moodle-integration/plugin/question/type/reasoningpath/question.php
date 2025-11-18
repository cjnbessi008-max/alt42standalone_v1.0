<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Reasoning path question definition class.
 *
 * @package    qtype_reasoningpath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/type/questionbase.php');

/**
 * Represents a reasoning path question.
 */
class qtype_reasoningpath_question extends question_with_responses {

    /** @var int Minimum number of steps required */
    public $min_steps_required;

    /** @var array Expected solution steps */
    public $expected_steps;

    /** @var array Grading rubric configuration */
    public $grading_rubric;

    /** @var bool Whether to allow multiple solution methods */
    public $allow_multiple_methods;

    /** @var bool Whether AI grading is enabled */
    public $enable_ai_grading;

    /** @var float Weight for completeness (0-100) */
    public $completeness_weight;

    /** @var float Weight for logical coherence (0-100) */
    public $coherence_weight;

    /** @var float Weight for method appropriateness (0-100) */
    public $method_weight;

    /** @var float Weight for clarity (0-100) */
    public $clarity_weight;

    /**
     * Get expected data - what the student should submit.
     */
    public function get_expected_data() {
        return array(
            'steps' => PARAM_RAW, // JSON array of reasoning steps
            'step_count' => PARAM_INT,
        );
    }

    /**
     * What data would need to be submitted to get this question correct.
     * We return null because there's no single correct answer for reasoning paths.
     */
    public function get_correct_response() {
        // Multiple valid reasoning paths may exist
        return null;
    }

    /**
     * Check if the given response is complete.
     */
    public function is_complete_response(array $response) {
        if (empty($response['steps'])) {
            return false;
        }

        $steps = json_decode($response['steps'], true);
        if (!is_array($steps)) {
            return false;
        }

        // Check minimum number of steps
        if (count($steps) < $this->min_steps_required) {
            return false;
        }

        // Check that all steps have content
        foreach ($steps as $step) {
            if (empty($step['content']) && empty($step['description'])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Used by interactive behaviour to check if student has provided enough info.
     */
    public function is_gradable_response(array $response) {
        return $this->is_complete_response($response);
    }

    /**
     * Grade a response to the question.
     *
     * @param array $response The student's response
     * @return array fraction (0-1) and state
     */
    public function grade_response(array $response) {
        if (!$this->is_gradable_response($response)) {
            return array(0, question_state::$gradedwrong);
        }

        // For reasoning paths, we don't grade synchronously
        // Instead, we trigger AI analysis in background
        // This method returns a temporary grade
        return array(null, question_state::$needsgrading);
    }

    /**
     * Perform AI-assisted grading of reasoning path.
     *
     * This is called asynchronously after initial submission.
     *
     * @param int $attemptid Question attempt ID
     * @param array $steps Array of reasoning steps
     * @return array Grading result with scores and feedback
     */
    public function grade_reasoning_path($attemptid, $steps) {
        global $DB, $CFG;

        require_once($CFG->dirroot . '/question/type/reasoningpath/classes/analyzer.php');

        // Check cache first
        $cache_key = $this->get_steps_hash($steps);
        $cached = $DB->get_record('qtype_reasoningpath_cache', array(
            'questionid' => $this->id,
            'steps_hash' => $cache_key
        ));

        if ($cached && $cached->timeexpires > time()) {
            // Use cached result
            $DB->execute('UPDATE {qtype_reasoningpath_cache}
                          SET hit_count = hit_count + 1
                          WHERE id = ?', array($cached->id));
            return json_decode($cached->analysis_result, true);
        }

        // Perform AI analysis
        $analyzer = new qtype_reasoningpath_analyzer();
        $result = $analyzer->analyze_reasoning_path(
            $attemptid,
            $steps,
            $this->expected_steps,
            $this->grading_rubric,
            $this
        );

        // Cache the result (24 hour expiry)
        $cache_record = new stdClass();
        $cache_record->questionid = $this->id;
        $cache_record->steps_hash = $cache_key;
        $cache_record->analysis_result = json_encode($result);
        $cache_record->hit_count = 1;
        $cache_record->timecreated = time();
        $cache_record->timeexpires = time() + (24 * 3600);

        try {
            $DB->insert_record('qtype_reasoningpath_cache', $cache_record);
        } catch (dml_exception $e) {
            // Cache insertion failed - not critical
            debugging('Failed to cache reasoning analysis: ' . $e->getMessage());
        }

        return $result;
    }

    /**
     * Generate a hash of the reasoning steps for caching.
     */
    private function get_steps_hash($steps) {
        // Normalize steps for hashing (ignore whitespace, capitalization)
        $normalized = array();
        foreach ($steps as $step) {
            $normalized[] = array(
                'type' => isset($step['type']) ? $step['type'] : 'calculation',
                'content' => preg_replace('/\s+/', ' ',
                    strtolower(trim($step['content']))),
            );
        }
        return hash('sha256', json_encode($normalized));
    }

    /**
     * Get validation error message.
     */
    public function get_validation_error(array $response) {
        if (empty($response['steps'])) {
            return get_string('pleaseprovidereasoning', 'qtype_reasoningpath');
        }

        $steps = json_decode($response['steps'], true);
        if (!is_array($steps)) {
            return get_string('invalidstepsformat', 'qtype_reasoningpath');
        }

        if (count($steps) < $this->min_steps_required) {
            return get_string('notenoughsteps', 'qtype_reasoningpath',
                $this->min_steps_required);
        }

        return '';
    }

    /**
     * Generate a brief textual description of a response.
     */
    public function summarise_response(array $response) {
        if (empty($response['steps'])) {
            return get_string('noresponse', 'qtype_reasoningpath');
        }

        $steps = json_decode($response['steps'], true);
        if (!is_array($steps)) {
            return get_string('invalidresponse', 'qtype_reasoningpath');
        }

        $count = count($steps);
        return get_string('stepssubmitted', 'qtype_reasoningpath', $count);
    }

    /**
     * Classify the student's response.
     */
    public function classify_response(array $response) {
        if (empty($response['steps'])) {
            return array($this->id => question_classified_response::no_response());
        }

        // For reasoning paths, classification is complex
        // We'll need the grading result to classify properly
        return array(
            $this->id => new question_classified_response(
                0,
                get_string('responserequiresgrading', 'qtype_reasoningpath'),
                null
            )
        );
    }

    /**
     * Checks whether two responses are the same.
     */
    public function is_same_response(array $prevresponse, array $newresponse) {
        $prevsteps = isset($prevresponse['steps']) ? $prevresponse['steps'] : '';
        $newsteps = isset($newresponse['steps']) ? $newresponse['steps'] : '';

        return $prevsteps === $newsteps;
    }

    /**
     * Produce a plain text summary of a response.
     */
    public function get_right_answer_summary() {
        if (empty($this->expected_steps)) {
            return get_string('multiplecorrectpaths', 'qtype_reasoningpath');
        }

        $summary = get_string('expectedsteps', 'qtype_reasoningpath') . ":\n";
        foreach ($this->expected_steps as $i => $step) {
            $stepnum = $i + 1;
            $stepdesc = isset($step['description']) ? $step['description'] :
                (isset($step['content']) ? $step['content'] : '');
            $summary .= "{$stepnum}. {$stepdesc}\n";
        }

        return $summary;
    }

    /**
     * Returns a summary of the correct response for display.
     */
    public function format_correct_response_summary() {
        return $this->get_right_answer_summary();
    }
}
