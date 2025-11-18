<?php
// This file is part of Moodle - http://moodle.org/

/**
 * External API for local_engagementalert plugin
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_engagementalert;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;

/**
 * External API class
 */
class external extends external_api {

    /**
     * Returns description of log_events parameters
     */
    public static function log_events_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'cmid' => new external_value(PARAM_INT, 'Course module ID', VALUE_DEFAULT, 0),
            'events' => new external_value(PARAM_RAW, 'JSON encoded events array'),
        ]);
    }

    /**
     * Log engagement events
     */
    public static function log_events($courseid, $cmid, $events) {
        global $USER, $DB;

        $params = self::validate_parameters(self::log_events_parameters(), [
            'courseid' => $courseid,
            'cmid' => $cmid,
            'events' => $events,
        ]);

        // Verify course access
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/engagementalert:view', $context);

        $eventsArray = json_decode($params['events'], true);
        if (!is_array($eventsArray)) {
            return ['success' => false, 'message' => 'Invalid events data'];
        }

        $tracker = new engagement_tracker();
        $result = $tracker->log_events($USER->id, $params['courseid'], $params['cmid'], $eventsArray);

        return ['success' => $result, 'message' => 'Events logged'];
    }

    /**
     * Returns description of log_events return value
     */
    public static function log_events_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success status'),
            'message' => new external_value(PARAM_TEXT, 'Response message'),
        ]);
    }

    /**
     * Returns description of trigger_alert parameters
     */
    public static function trigger_alert_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'cmid' => new external_value(PARAM_INT, 'Course module ID', VALUE_DEFAULT, 0),
            'sessionid' => new external_value(PARAM_TEXT, 'Session ID'),
            'alerttype' => new external_value(PARAM_TEXT, 'Alert type'),
            'duration' => new external_value(PARAM_INT, 'Duration in seconds'),
        ]);
    }

    /**
     * Trigger an engagement alert
     */
    public static function trigger_alert($courseid, $cmid, $sessionid, $alerttype, $duration) {
        global $USER, $CFG;

        $params = self::validate_parameters(self::trigger_alert_parameters(), [
            'courseid' => $courseid,
            'cmid' => $cmid,
            'sessionid' => $sessionid,
            'alerttype' => $alerttype,
            'duration' => $duration,
        ]);

        // Verify course access
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/engagementalert:view', $context);

        $alertmanager = new alert_manager();
        $result = $alertmanager->create_alert(
            $USER->id,
            $params['courseid'],
            $params['cmid'],
            $params['sessionid'],
            $params['alerttype'],
            $params['duration']
        );

        $enableStudentAlerts = get_config('local_engagementalert', 'enable_student_alerts');

        return [
            'success' => $result,
            'message' => 'Alert triggered',
            'show_student_alert' => (bool)$enableStudentAlerts,
        ];
    }

    /**
     * Returns description of trigger_alert return value
     */
    public static function trigger_alert_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success status'),
            'message' => new external_value(PARAM_TEXT, 'Response message'),
            'show_student_alert' => new external_value(PARAM_BOOL, 'Whether to show alert to student'),
        ]);
    }
}
