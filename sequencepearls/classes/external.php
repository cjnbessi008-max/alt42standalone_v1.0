<?php
// This file is part of Moodle - http://moodle.org/
//
// External API for Sequence Pearls activity module

namespace mod_sequencepearls;

defined('MOODLE_INTERNAL') || die();

require_once("$CFG->libdir/externallib.php");

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;

/**
 * External API class for Sequence Pearls
 */
class external extends external_api {

    /**
     * Returns description of submit_answer parameters
     */
    public static function submit_answer_parameters() {
        return new external_function_parameters(
            array(
                'problemid' => new external_value(PARAM_INT, 'Problem ID'),
                'answer' => new external_value(PARAM_FLOAT, 'User answer'),
                'timespent' => new external_value(PARAM_INT, 'Time spent in seconds')
            )
        );
    }

    /**
     * Submit an answer to a problem
     *
     * @param int $problemid Problem ID
     * @param float $answer User's answer
     * @param int $timespent Time spent in seconds
     * @return array Result including correctness and updated progress
     */
    public static function submit_answer($problemid, $answer, $timespent) {
        global $USER, $DB;

        // Validate parameters
        $params = self::validate_parameters(self::submit_answer_parameters(), array(
            'problemid' => $problemid,
            'answer' => $answer,
            'timespent' => $timespent
        ));

        // Get problem
        $problem = $DB->get_record('sequencepearls_problems',
            array('id' => $params['problemid']), '*', MUST_EXIST);

        // Get activity
        $activity = $DB->get_record('sequencepearls',
            array('id' => $problem->sequencepearls_id), '*', MUST_EXIST);

        // Get course module
        $cm = get_coursemodule_from_instance('sequencepearls', $activity->id, $activity->course, false, MUST_EXIST);

        // Validate context and permissions
        $context = \context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/sequencepearls:submit', $context);

        // Check answer
        $isCorrect = sequencepearls_check_answer($params['problemid'], $USER->id,
            $params['answer'], $params['timespent']);

        // Get updated progress
        $progress = $DB->get_record('sequencepearls_progress',
            array('sequencepearls_id' => $activity->id, 'userid' => $USER->id));

        return array(
            'correct' => $isCorrect,
            'progress' => array(
                'attempted' => $progress->problems_attempted,
                'correct' => $progress->problems_correct,
                'current_streak' => $progress->current_streak,
                'best_streak' => $progress->best_streak,
                'completion' => $progress->completion_percentage
            )
        );
    }

    /**
     * Returns description of submit_answer return value
     */
    public static function submit_answer_returns() {
        return new external_single_structure(
            array(
                'correct' => new external_value(PARAM_BOOL, 'Whether answer is correct'),
                'progress' => new external_single_structure(
                    array(
                        'attempted' => new external_value(PARAM_INT, 'Problems attempted'),
                        'correct' => new external_value(PARAM_INT, 'Problems correct'),
                        'current_streak' => new external_value(PARAM_INT, 'Current streak'),
                        'best_streak' => new external_value(PARAM_INT, 'Best streak'),
                        'completion' => new external_value(PARAM_FLOAT, 'Completion percentage')
                    )
                )
            )
        );
    }

    /**
     * Returns description of get_problem parameters
     */
    public static function get_problem_parameters() {
        return new external_function_parameters(
            array(
                'activityid' => new external_value(PARAM_INT, 'Activity ID'),
            )
        );
    }

    /**
     * Get next problem for user
     *
     * @param int $activityid Activity ID
     * @return array Problem data
     */
    public static function get_problem($activityid) {
        global $USER, $DB;

        // Validate parameters
        $params = self::validate_parameters(self::get_problem_parameters(), array(
            'activityid' => $activityid
        ));

        // Get activity
        $activity = $DB->get_record('sequencepearls',
            array('id' => $params['activityid']), '*', MUST_EXIST);

        // Get course module
        $cm = get_coursemodule_from_instance('sequencepearls', $activity->id, $activity->course, false, MUST_EXIST);

        // Validate context and permissions
        $context = \context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/sequencepearls:view', $context);

        // Get next problem
        $problem = sequencepearls_get_next_problem($params['activityid'], $USER->id);

        return array(
            'problemid' => $problem->id,
            'sequence' => $problem->sequence_data,
            'missing_position' => $problem->missing_position
        );
    }

    /**
     * Returns description of get_problem return value
     */
    public static function get_problem_returns() {
        return new external_single_structure(
            array(
                'problemid' => new external_value(PARAM_INT, 'Problem ID'),
                'sequence' => new external_value(PARAM_RAW, 'Sequence data (JSON)'),
                'missing_position' => new external_value(PARAM_INT, 'Position of missing value')
            )
        );
    }
}
