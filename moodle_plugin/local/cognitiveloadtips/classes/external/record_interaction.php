<?php
// This file is part of Moodle - http://moodle.org/

/**
 * External API for recording tip interactions
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_cognitiveloadtips\external;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;

/**
 * External API for recording user interaction with tips
 */
class record_interaction extends external_api {

    /**
     * Returns description of method parameters
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters(
            array(
                'tipid' => new external_value(PARAM_INT, 'Tip ID'),
                'questionid' => new external_value(PARAM_INT, 'Question ID', VALUE_OPTIONAL, null),
                'quizid' => new external_value(PARAM_INT, 'Quiz ID', VALUE_OPTIONAL, null),
                'duration' => new external_value(PARAM_INT, 'View duration in seconds', VALUE_OPTIONAL, null),
                'skipped' => new external_value(PARAM_BOOL, 'Was tip skipped', VALUE_DEFAULT, false),
            )
        );
    }

    /**
     * Record interaction
     *
     * @param int $tipid Tip ID
     * @param int $questionid Question ID
     * @param int $quizid Quiz ID
     * @param int $duration View duration
     * @param bool $skipped Was skipped
     * @return array Result
     */
    public static function execute($tipid, $questionid = null, $quizid = null, $duration = null, $skipped = false) {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), array(
            'tipid' => $tipid,
            'questionid' => $questionid,
            'quizid' => $quizid,
            'duration' => $duration,
            'skipped' => $skipped,
        ));

        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('local/cognitiveloadtips:viewtips', $context);

        $success = \local_cognitiveloadtips\tip_manager::record_interaction(
            $params['tipid'],
            $params['questionid'],
            $params['quizid'],
            $params['duration'],
            $params['skipped']
        );

        return array(
            'success' => $success,
            'message' => $success ? 'Interaction recorded' : 'Failed to record interaction',
        );
    }

    /**
     * Returns description of method result value
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'message' => new external_value(PARAM_TEXT, 'Result message'),
            )
        );
    }
}
