<?php
/**
 * External API for tracking student activities
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_thinkroutine_consistency\external;

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use block_thinkroutine_consistency\activity_tracker;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

class track_activity extends external_api {

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User ID'),
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'cmid' => new external_value(PARAM_INT, 'Course module ID'),
            'activitytype' => new external_value(PARAM_TEXT, 'Activity type (quiz, assignment, etc.)'),
            'action' => new external_value(PARAM_TEXT, 'Action taken'),
            'actiondata' => new external_value(PARAM_RAW, 'JSON encoded action data', VALUE_DEFAULT, '{}'),
        ]);
    }

    /**
     * Track activity
     *
     * @param int $userid
     * @param int $courseid
     * @param int $cmid
     * @param string $activitytype
     * @param string $action
     * @param string $actiondata
     * @return array
     */
    public static function execute($userid, $courseid, $cmid, $activitytype, $action, $actiondata = '{}') {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'userid' => $userid,
            'courseid' => $courseid,
            'cmid' => $cmid,
            'activitytype' => $activitytype,
            'action' => $action,
            'actiondata' => $actiondata,
        ]);

        // Validate context
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);

        // Check permissions - user can only track their own activities
        if ($params['userid'] != $USER->id) {
            throw new \moodle_exception('cannottrackothers', 'block_thinkroutine_consistency');
        }

        // Decode action data
        $actiondata_array = json_decode($params['actiondata'], true);
        if ($actiondata_array === null) {
            $actiondata_array = [];
        }

        // Track the activity
        $activityid = activity_tracker::track_activity(
            $params['userid'],
            $params['courseid'],
            $params['cmid'],
            $params['activitytype'],
            $params['action'],
            $actiondata_array
        );

        return [
            'success' => true,
            'activityid' => $activityid,
            'message' => get_string('activitytracked', 'block_thinkroutine_consistency'),
        ];
    }

    /**
     * Returns description of method result value
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success status'),
            'activityid' => new external_value(PARAM_INT, 'Activity record ID'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
        ]);
    }
}
