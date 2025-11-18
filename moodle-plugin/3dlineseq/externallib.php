<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/mod/3dlineseq/lib.php');

/**
 * External API for 3D Line Seq
 */
class mod_3dlineseq_external extends external_api {

    /**
     * Returns description of get_sequence() parameters
     */
    public static function get_sequence_parameters() {
        return new external_function_parameters(
            array(
                '3dlineseqid' => new external_value(PARAM_INT, '3D Line Seq activity instance id')
            )
        );
    }

    /**
     * Get sequence data
     */
    public static function get_sequence($lineseqid) {
        global $DB;

        $params = self::validate_parameters(
            self::get_sequence_parameters(),
            array('3dlineseqid' => $lineseqid)
        );

        $lineseqid = $params['3dlineseqid'];

        // Validate context
        $cm = get_coursemodule_from_instance('3dlineseq', $lineseqid, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/3dlineseq:view', $context);

        // Get data
        $data = lineseq_get_sequence_data($lineseqid);

        return $data;
    }

    /**
     * Returns description of get_sequence() result value
     */
    public static function get_sequence_returns() {
        return new external_single_structure(
            array(
                'name' => new external_value(PARAM_TEXT, 'Sequence name'),
                'type' => new external_value(PARAM_TEXT, 'Sequence type'),
                'style' => new external_value(PARAM_TEXT, 'Visual style'),
                'values' => new external_multiple_structure(
                    new external_value(PARAM_FLOAT, 'Sequence value')
                )
            )
        );
    }

    /**
     * Returns description of submit_attempt() parameters
     */
    public static function submit_attempt_parameters() {
        return new external_function_parameters(
            array(
                '3dlineseqid' => new external_value(PARAM_INT, '3D Line Seq activity instance id'),
                'answer' => new external_value(PARAM_RAW, 'Answer data (JSON)'),
                'score' => new external_value(PARAM_FLOAT, 'Score', VALUE_DEFAULT, null)
            )
        );
    }

    /**
     * Submit an attempt
     */
    public static function submit_attempt($lineseqid, $answer, $score = null) {
        global $USER;

        $params = self::validate_parameters(
            self::submit_attempt_parameters(),
            array(
                '3dlineseqid' => $lineseqid,
                'answer' => $answer,
                'score' => $score
            )
        );

        $lineseqid = $params['3dlineseqid'];
        $answer = json_decode($params['answer'], true);
        $score = $params['score'];

        // Validate context
        $cm = get_coursemodule_from_instance('3dlineseq', $lineseqid, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/3dlineseq:submit', $context);

        // Save attempt
        $attemptid = lineseq_save_attempt($lineseqid, $USER->id, $answer, $score);

        return array(
            'success' => true,
            'attemptid' => $attemptid
        );
    }

    /**
     * Returns description of submit_attempt() result value
     */
    public static function submit_attempt_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'attemptid' => new external_value(PARAM_INT, 'Attempt ID')
            )
        );
    }

    /**
     * Returns description of get_attempts() parameters
     */
    public static function get_attempts_parameters() {
        return new external_function_parameters(
            array(
                '3dlineseqid' => new external_value(PARAM_INT, '3D Line Seq activity instance id')
            )
        );
    }

    /**
     * Get user attempts
     */
    public static function get_attempts($lineseqid) {
        global $USER;

        $params = self::validate_parameters(
            self::get_attempts_parameters(),
            array('3dlineseqid' => $lineseqid)
        );

        $lineseqid = $params['3dlineseqid'];

        // Validate context
        $cm = get_coursemodule_from_instance('3dlineseq', $lineseqid, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/3dlineseq:view', $context);

        // Get attempts
        $attempts = lineseq_get_user_attempts($lineseqid, $USER->id);

        $result = array();
        foreach ($attempts as $attempt) {
            $result[] = array(
                'id' => $attempt->id,
                'attempt' => $attempt->attempt,
                'answer' => $attempt->answer,
                'score' => $attempt->score,
                'completed' => $attempt->completed,
                'timecreated' => $attempt->timecreated
            );
        }

        return $result;
    }

    /**
     * Returns description of get_attempts() result value
     */
    public static function get_attempts_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(
                    'id' => new external_value(PARAM_INT, 'Attempt ID'),
                    'attempt' => new external_value(PARAM_INT, 'Attempt number'),
                    'answer' => new external_value(PARAM_RAW, 'Answer data (JSON)'),
                    'score' => new external_value(PARAM_FLOAT, 'Score', VALUE_OPTIONAL),
                    'completed' => new external_value(PARAM_INT, 'Completion status'),
                    'timecreated' => new external_value(PARAM_INT, 'Creation timestamp')
                )
            )
        );
    }
}
