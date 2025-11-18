<?php
// This file is part of Moodle - http://moodle.org/

namespace local_meditation_routine\external;

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

/**
 * External function to check if meditation routine should be shown
 *
 * @package    local_meditation_routine
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class check_should_show extends external_api {

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
            'attemptid' => new external_value(PARAM_INT, 'Quiz attempt ID'),
            'userid' => new external_value(PARAM_INT, 'User ID'),
        ]);
    }

    /**
     * Check if meditation should be shown
     *
     * @param int $quizid Quiz ID
     * @param int $attemptid Quiz attempt ID
     * @param int $userid User ID
     * @return array
     */
    public static function execute($quizid, $attemptid, $userid) {
        global $USER;

        // Validate parameters
        $params = self::validate_parameters(
            self::execute_parameters(),
            ['quizid' => $quizid, 'attemptid' => $attemptid, 'userid' => $userid]
        );

        // Security check
        if ($params['userid'] != $USER->id) {
            require_capability('local/meditation_routine:manage', \context_system::instance());
        }

        $settings = \local_meditation_routine\meditation_manager::should_show_meditation(
            $params['quizid'],
            $params['userid'],
            $params['attemptid']
        );

        if ($settings) {
            return [
                'should_show' => true,
                'duration' => $settings['duration'],
                'animation_style' => $settings['animation_style'],
                'complexity' => $settings['complexity']
            ];
        }

        return [
            'should_show' => false,
            'duration' => 0,
            'animation_style' => '',
            'complexity' => 0
        ];
    }

    /**
     * Returns description of method result value
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure([
            'should_show' => new external_value(PARAM_BOOL, 'Whether to show meditation'),
            'duration' => new external_value(PARAM_INT, 'Duration in seconds'),
            'animation_style' => new external_value(PARAM_TEXT, 'Animation style'),
            'complexity' => new external_value(PARAM_INT, 'Problem complexity level')
        ]);
    }
}
