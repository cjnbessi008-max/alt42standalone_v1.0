<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Reasoning path analyzer - integrates with AI grading engine.
 *
 * @package    qtype_reasoningpath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Analyzer class for reasoning paths.
 */
class qtype_reasoningpath_analyzer {

    /** @var string API endpoint for analysis engine */
    private $api_endpoint;

    /** @var string API key for authentication */
    private $api_key;

    /** @var int Timeout for API calls in seconds */
    private $timeout;

    /**
     * Constructor.
     */
    public function __construct() {
        global $CFG;

        // Load configuration
        $this->api_endpoint = get_config('qtype_reasoningpath', 'analysis_api_endpoint') ?:
            'http://localhost:8000/api/analyze-reasoning';
        $this->api_key = get_config('qtype_reasoningpath', 'analysis_api_key') ?: '';
        $this->timeout = get_config('qtype_reasoningpath', 'api_timeout') ?: 30;
    }

    /**
     * Analyze a reasoning path using AI.
     *
     * @param int $attemptid Question attempt ID
     * @param array $steps Array of reasoning steps
     * @param array $expected Expected steps (may be null)
     * @param array $rubric Grading rubric
     * @param object $question Question object
     * @return array Analysis result with scores and feedback
     */
    public function analyze_reasoning_path($attemptid, $steps, $expected, $rubric, $question) {
        global $DB;

        // Store steps in database
        $this->store_reasoning_steps($attemptid, $steps);

        // Get question context
        $context = $this->get_question_context($attemptid);

        // Prepare data for AI analysis
        $data = array(
            'attempt_id' => $attemptid,
            'question_text' => $context['question_text'],
            'steps' => $steps,
            'expected_steps' => $expected,
            'grading_rubric' => $rubric,
            'min_steps_required' => $question->min_steps_required,
            'weights' => array(
                'completeness' => $question->completeness_weight,
                'coherence' => $question->coherence_weight,
                'method' => $question->method_weight,
                'clarity' => $question->clarity_weight,
            ),
        );

        // Call analysis API
        try {
            $result = $this->call_analysis_api($data);

            // Validate result
            if (!$this->validate_analysis_result($result)) {
                throw new moodle_exception('invalidanalysisresult', 'qtype_reasoningpath');
            }

            // Store analysis in database
            $this->store_analysis_result($attemptid, $result);

            return $result;

        } catch (Exception $e) {
            // Fallback to basic rule-based grading
            debugging('AI analysis failed: ' . $e->getMessage() .
                      '. Using fallback grading.', DEBUG_NORMAL);
            return $this->fallback_grading($steps, $expected, $question);
        }
    }

    /**
     * Store reasoning steps in database.
     */
    private function store_reasoning_steps($attemptid, $steps) {
        global $DB;

        $time = time();

        foreach ($steps as $index => $step) {
            $record = new stdClass();
            $record->questionattemptid = $attemptid;
            $record->step_number = $index + 1;
            $record->step_type = isset($step['type']) ? $step['type'] : 'calculation';
            $record->step_description = isset($step['description']) ? $step['description'] : '';
            $record->step_content = isset($step['content']) ? $step['content'] : '';
            $record->mathematical_expression = isset($step['latex']) ? $step['latex'] : '';
            $record->timecreated = $time;
            $record->timemodified = $time;

            $DB->insert_record('qtype_reasoningpath_steps', $record);
        }
    }

    /**
     * Get question context for analysis.
     */
    private function get_question_context($attemptid) {
        global $DB;

        $attempt = $DB->get_record_sql(
            "SELECT qa.*, q.questiontext, q.name
             FROM {question_attempts} qa
             JOIN {question} q ON qa.questionid = q.id
             WHERE qa.id = ?",
            array($attemptid),
            MUST_EXIST
        );

        return array(
            'question_text' => format_text($attempt->questiontext),
            'question_name' => $attempt->name,
        );
    }

    /**
     * Call the AI analysis API.
     */
    private function call_analysis_api($data) {
        // Prepare HTTP request
        $ch = curl_init($this->api_endpoint);

        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->api_key,
            ),
        ));

        // Execute request
        $response = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Check for errors
        if ($error) {
            throw new moodle_exception('apicallfailed', 'qtype_reasoningpath',
                '', null, $error);
        }

        if ($httpcode !== 200) {
            throw new moodle_exception('apireturnedcode', 'qtype_reasoningpath',
                '', $httpcode);
        }

        // Parse response
        $result = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new moodle_exception('invalidjsonresponse', 'qtype_reasoningpath');
        }

        return $result;
    }

    /**
     * Validate AI analysis result structure.
     */
    private function validate_analysis_result($result) {
        $required_fields = array(
            'completeness_score',
            'logical_coherence_score',
            'method_appropriateness_score',
            'clarity_score',
            'final_grade',
            'feedback',
        );

        foreach ($required_fields as $field) {
            if (!isset($result[$field])) {
                return false;
            }
        }

        // Validate score ranges
        $scores = array(
            $result['completeness_score'],
            $result['logical_coherence_score'],
            $result['method_appropriateness_score'],
            $result['clarity_score'],
            $result['final_grade'],
        );

        foreach ($scores as $score) {
            if (!is_numeric($score) || $score < 0 || $score > 100) {
                return false;
            }
        }

        return true;
    }

    /**
     * Store analysis result in database.
     */
    private function store_analysis_result($attemptid, $result) {
        global $DB;

        $record = new stdClass();
        $record->questionattemptid = $attemptid;
        $record->completeness_score = $result['completeness_score'];
        $record->logical_coherence_score = $result['logical_coherence_score'];
        $record->method_appropriateness_score = $result['method_appropriateness_score'];
        $record->clarity_score = $result['clarity_score'];
        $record->final_grade = $result['final_grade'];
        $record->ai_feedback = $result['feedback'];
        $record->ai_model_used = isset($result['model']) ? $result['model'] : 'unknown';
        $record->analysis_metadata = isset($result['metadata']) ?
            json_encode($result['metadata']) : '{}';
        $record->graded_by = 'ai';
        $record->timecreated = time();

        // Check if analysis already exists (shouldn't happen, but be safe)
        $existing = $DB->get_record('qtype_reasoningpath_analysis',
            array('questionattemptid' => $attemptid));

        if ($existing) {
            $record->id = $existing->id;
            $DB->update_record('qtype_reasoningpath_analysis', $record);
        } else {
            $DB->insert_record('qtype_reasoningpath_analysis', $record);
        }

        // Update individual step scores if provided
        if (isset($result['step_scores']) && is_array($result['step_scores'])) {
            $this->update_step_scores($attemptid, $result['step_scores']);
        }
    }

    /**
     * Update individual step scores.
     */
    private function update_step_scores($attemptid, $step_scores) {
        global $DB;

        foreach ($step_scores as $step_num => $scores) {
            $step = $DB->get_record('qtype_reasoningpath_steps', array(
                'questionattemptid' => $attemptid,
                'step_number' => $step_num,
            ));

            if ($step) {
                $step->is_correct = isset($scores['is_correct']) ? $scores['is_correct'] : null;
                $step->partial_credit = isset($scores['partial_credit']) ?
                    $scores['partial_credit'] : null;
                $step->reasoning_quality_score = isset($scores['quality']) ?
                    $scores['quality'] : null;
                $step->timemodified = time();

                $DB->update_record('qtype_reasoningpath_steps', $step);
            }
        }
    }

    /**
     * Fallback grading when AI is unavailable.
     *
     * Uses simple rule-based scoring.
     */
    private function fallback_grading($steps, $expected, $question) {
        $step_count = count($steps);
        $min_steps = $question->min_steps_required;

        // Simple completeness score
        $completeness = min(100, ($step_count / max($min_steps, 1)) * 100);

        // Basic scoring (pessimistic when AI unavailable)
        $coherence = 50; // Assume average
        $method = 50;
        $clarity = 50;

        // Calculate weighted final grade
        $final_grade = (
            ($completeness * $question->completeness_weight / 100) +
            ($coherence * $question->coherence_weight / 100) +
            ($method * $question->method_weight / 100) +
            ($clarity * $question->clarity_weight / 100)
        );

        return array(
            'completeness_score' => $completeness,
            'logical_coherence_score' => $coherence,
            'method_appropriateness_score' => $method,
            'clarity_score' => $clarity,
            'final_grade' => $final_grade,
            'feedback' => get_string('fallbackgrading', 'qtype_reasoningpath'),
            'model' => 'fallback-rule-based',
        );
    }
}
