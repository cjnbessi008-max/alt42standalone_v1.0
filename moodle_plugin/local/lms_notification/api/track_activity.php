<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Track learning activity API endpoint
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->dirroot . '/local/lms_notification/classes/tracker.php');

use local_lms_notification\tracker;

// Require login
require_login();

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required parameters
$userid = isset($data['userid']) ? (int)$data['userid'] : $USER->id;
$courseid = required_param_json('courseid', PARAM_INT, $data);
$moduleid = required_param_json('moduleid', PARAM_INT, $data);
$activitytype = required_param_json('activitytype', PARAM_TEXT, $data);

// Security check: users can only track their own activities unless they have permission
if ($userid != $USER->id && !has_capability('local/lms_notification:viewallalerts', context_system::instance())) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(array(
        'success' => false,
        'error' => 'Permission denied'
    ));
    exit;
}

// Verify course enrollment
$context = context_course::instance($courseid);
if (!is_enrolled($context, $userid)) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(array(
        'success' => false,
        'error' => 'Not enrolled in course'
    ));
    exit;
}

// Prepare activity data
$activity_data = array(
    'starttime' => isset($data['starttime']) ? $data['starttime'] : time(),
    'endtime' => isset($data['endtime']) ? $data['endtime'] : null,
    'attempts' => isset($data['attempts']) ? (int)$data['attempts'] : 1,
    'correct' => isset($data['correct']) ? (int)$data['correct'] : 0,
    'incorrect' => isset($data['incorrect']) ? (int)$data['incorrect'] : 0,
    'hints_used' => isset($data['hints_used']) ? (int)$data['hints_used'] : 0,
    'time_spent' => isset($data['time_spent']) ? (int)$data['time_spent'] : 0,
    'metadata' => isset($data['metadata']) ? $data['metadata'] : array()
);

// Track the activity
$result = tracker::track_activity($userid, $courseid, $moduleid, $activitytype, $activity_data);

if ($result === false) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(array(
        'success' => false,
        'error' => 'Failed to track activity'
    ));
    exit;
}

// Prepare response
$response = array(
    'success' => true,
    'tracking_id' => $result['tracking_id'],
    'alerts_triggered' => !empty($result['alerts']),
    'alert_count' => count($result['alerts']),
    'alerts' => array()
);

// Format alerts for response
foreach ($result['alerts'] as $alert) {
    $response['alerts'][] = array(
        'id' => $alert->id,
        'type' => $alert->alert_type,
        'severity' => $alert->severity,
        'description' => $alert->description,
        'metrics' => json_decode($alert->metrics, true)
    );
}

// Send JSON response
header('Content-Type: application/json');
echo json_encode($response);

/**
 * Helper function to get required parameter from JSON data
 */
function required_param_json($name, $type, $data) {
    if (!isset($data[$name])) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(array(
            'success' => false,
            'error' => "Missing required parameter: $name"
        ));
        exit;
    }

    $value = $data[$name];

    // Validate based on type
    switch ($type) {
        case PARAM_INT:
            return (int)$value;
        case PARAM_TEXT:
            return clean_param($value, PARAM_TEXT);
        default:
            return $value;
    }
}
