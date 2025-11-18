<?php
// This file is part of Moodle - http://moodle.org/

/**
 * AJAX endpoint for tracking behavioral events
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->dirroot . '/local/anxiety/classes/collector.php');

// Require login
require_login();

// Check session key
if (!confirm_sesskey(optional_param('sesskey', '', PARAM_RAW))) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(['success' => false, 'error' => 'Invalid session key']);
    die();
}

// Get parameters
$userid = required_param('userid', PARAM_INT);
$courseid = required_param('courseid', PARAM_INT);
$cmid = optional_param('cmid', null, PARAM_INT);
$event_type = required_param('event_type', PARAM_ALPHA);
$event_data_json = optional_param('event_data', '{}', PARAM_RAW);

// Validate user can only track their own events (unless they're a teacher)
$context = context_course::instance($courseid);
if ($userid != $USER->id && !has_capability('local/anxiety:viewothers', $context)) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(['success' => false, 'error' => 'Permission denied']);
    die();
}

// Parse event data
$event_data = json_decode($event_data_json, true);
if ($event_data === null) {
    $event_data = [];
}

try {
    // Track the event
    $result = \local_anxiety\collector::track_event(
        $userid,
        $courseid,
        $cmid,
        $event_type,
        $event_data
    );

    header('Content-Type: application/json');
    echo json_encode($result);

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        'success' => false,
        'error' => 'Failed to track event: ' . $e->getMessage()
    ]);
}
