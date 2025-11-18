<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Question type class for the Reasoning Path question type.
 *
 * @package    qtype_reasoningpath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/questionlib.php');

/**
 * The Reasoning Path question type.
 *
 * Grades based on completeness and quality of reasoning rather than just final answer.
 */
class qtype_reasoningpath extends question_type {

    /**
     * Returns the name of this question type.
     */
    public function name() {
        return 'reasoningpath';
    }

    /**
     * Whether this question type can perform a frequency analysis of student responses.
     */
    public function can_analyse_responses() {
        return true;
    }

    /**
     * Extra question fields for the database table.
     */
    public function extra_question_fields() {
        return array(
            'qtype_reasoningpath',
            'min_steps_required',
            'expected_steps',
            'grading_rubric',
            'allow_multiple_methods',
            'enable_ai_grading',
            'completeness_weight',
            'coherence_weight',
            'method_weight',
            'clarity_weight'
        );
    }

    /**
     * Move files when saving a question.
     */
    public function save_question_options($question) {
        global $DB;

        $context = $question->context;
        $options = $DB->get_record('qtype_reasoningpath', array('questionid' => $question->id));

        if (!$options) {
            $options = new stdClass();
            $options->questionid = $question->id;
            $options->id = $DB->insert_record('qtype_reasoningpath', $options);
        }

        // Save expected steps as JSON
        $options->min_steps_required = isset($question->min_steps_required)
            ? $question->min_steps_required : 3;
        $options->expected_steps = isset($question->expected_steps)
            ? json_encode($question->expected_steps) : '[]';
        $options->grading_rubric = isset($question->grading_rubric)
            ? json_encode($question->grading_rubric) : '{}';
        $options->allow_multiple_methods = isset($question->allow_multiple_methods)
            ? $question->allow_multiple_methods : 1;
        $options->enable_ai_grading = isset($question->enable_ai_grading)
            ? $question->enable_ai_grading : 1;

        // Grading weights (must sum to 100)
        $options->completeness_weight = isset($question->completeness_weight)
            ? $question->completeness_weight : 40;
        $options->coherence_weight = isset($question->coherence_weight)
            ? $question->coherence_weight : 30;
        $options->method_weight = isset($question->method_weight)
            ? $question->method_weight : 20;
        $options->clarity_weight = isset($question->clarity_weight)
            ? $question->clarity_weight : 10;

        $DB->update_record('qtype_reasoningpath', $options);

        $this->save_hints($question, true);
    }

    /**
     * Delete question from the database.
     */
    public function delete_question($questionid, $contextid) {
        global $DB;

        // Delete steps and analysis for all attempts of this question
        $attempts = $DB->get_records_sql(
            "SELECT qa.id
             FROM {question_attempts} qa
             JOIN {question_usages} qu ON qa.questionusageid = qu.id
             WHERE qa.questionid = ?",
            array($questionid)
        );

        foreach ($attempts as $attempt) {
            $DB->delete_records('qtype_reasoningpath_steps',
                array('questionattemptid' => $attempt->id));
            $DB->delete_records('qtype_reasoningpath_analysis',
                array('questionattemptid' => $attempt->id));
        }

        // Delete cache entries
        $DB->delete_records('qtype_reasoningpath_cache',
            array('questionid' => $questionid));

        // Delete question options
        $DB->delete_records('qtype_reasoningpath',
            array('questionid' => $questionid));

        parent::delete_question($questionid, $contextid);
    }

    /**
     * Get random guess score.
     */
    public function get_random_guess_score($questiondata) {
        // Random guessing is essentially impossible for reasoning paths
        return 0;
    }

    /**
     * Get possible responses for a question.
     */
    public function get_possible_responses($questiondata) {
        // Reasoning paths have infinite possible responses
        // We categorize by score ranges
        return array(
            $questiondata->id => array(
                0 => new question_possible_response(
                    get_string('excellent', 'qtype_reasoningpath') . ' (90-100%)', 0.95),
                1 => new question_possible_response(
                    get_string('good', 'qtype_reasoningpath') . ' (70-89%)', 0.80),
                2 => new question_possible_response(
                    get_string('satisfactory', 'qtype_reasoningpath') . ' (50-69%)', 0.60),
                3 => new question_possible_response(
                    get_string('incomplete', 'qtype_reasoningpath') . ' (0-49%)', 0.25),
                null => question_possible_response::no_response()
            ),
        );
    }

    /**
     * Initialise the common question_definition fields.
     */
    protected function initialise_question_instance(question_definition $question, $questiondata) {
        parent::initialise_question_instance($question, $questiondata);

        $question->min_steps_required = $questiondata->options->min_steps_required;
        $question->expected_steps = json_decode($questiondata->options->expected_steps, true);
        $question->grading_rubric = json_decode($questiondata->options->grading_rubric, true);
        $question->allow_multiple_methods = $questiondata->options->allow_multiple_methods;
        $question->enable_ai_grading = $questiondata->options->enable_ai_grading;
        $question->completeness_weight = $questiondata->options->completeness_weight;
        $question->coherence_weight = $questiondata->options->coherence_weight;
        $question->method_weight = $questiondata->options->method_weight;
        $question->clarity_weight = $questiondata->options->clarity_weight;
    }

    /**
     * Import question from Moodle XML format.
     */
    public function import_from_xml($data, $question, qformat_xml $format, $extra=null) {
        if (!isset($data['@']['type']) || $data['@']['type'] != 'reasoningpath') {
            return false;
        }

        $question = $format->import_headers($data);
        $question->qtype = 'reasoningpath';

        $question->min_steps_required = $format->getpath($data,
            array('#', 'min_steps_required', 0, '#'), 3);

        $expectedsteps = $format->getpath($data,
            array('#', 'expected_steps', 0, '#'), '');
        $question->expected_steps = !empty($expectedsteps) ?
            json_decode($expectedsteps, true) : array();

        $rubric = $format->getpath($data,
            array('#', 'grading_rubric', 0, '#'), '');
        $question->grading_rubric = !empty($rubric) ?
            json_decode($rubric, true) : array();

        $format->import_hints($question, $data, true, false,
            $format->get_format($question->questiontextformat));

        return $question;
    }

    /**
     * Export question to Moodle XML format.
     */
    public function export_to_xml($question, qformat_xml $format, $extra=null) {
        $output = parent::export_to_xml($question, $format, $extra);

        $output .= "    <min_steps_required>{$question->options->min_steps_required}</min_steps_required>\n";
        $output .= "    <expected_steps>" .
            htmlspecialchars($question->options->expected_steps) .
            "</expected_steps>\n";
        $output .= "    <grading_rubric>" .
            htmlspecialchars($question->options->grading_rubric) .
            "</grading_rubric>\n";

        return $output;
    }
}
