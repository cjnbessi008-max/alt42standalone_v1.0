<?php
// This file is part of Moodle - http://moodle.org/

namespace local_meditation_routine\external;

use external_api;
use external_function_parameters;
use external_value;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

/**
 * External function to log meditation session
 *
 * @package    local_meditation_routine
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class log_session extends external_api {

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User ID'),
            'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
            'attemptid' => new external_value(PARAM_INT, 'Quiz attempt ID'),
            'duration' => new external_value(PARAM_INT, 'Duration in seconds'),
            'completed' => new external_value(PARAM_INT, 'Whether completed (0 or 1)'),
        ]);
    }

    /**
     * Log meditation session
     *
     * @param int $userid User ID
     * @param int $quizid Quiz ID
     * @param int $attemptid Quiz attempt ID
     * @param int $duration Duration in seconds
     * @param int $completed Whether completed
     * @return array
     */
    public static function execute($userid, $quizid, $attemptid, $duration, $completed) {
        global $USER;

        // Validate parameters
        $params = self::validate_parameters(
            self::execute_parameters(),
            [
                'userid' => $userid,
                'quizid' => $quizid,
                'attemptid' => $attemptid,
                'duration' => $duration,
                'completed' => $completed
            ]
        );

        // Security check
        if ($params['userid'] != $USER->id) {
            require_capability('local/meditation_routine:manage', \context_system::instance());
        }

        $recordid = \local_meditation_routine\meditation_manager::log_meditation_session(
            $params['userid'],
            $params['quizid'],
            $params['attemptid'],
            $params['duration'],
            $params['completed'] == 1
        );

        return [
            'success' => $recordid > 0,
            'recordid' => $recordid
        ];
    }

    /**
     * Returns description of method result value
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new \external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Whether logging was successful'),
            'recordid' => new external_value(PARAM_INT, 'Record ID')
        ]);
    }
}
