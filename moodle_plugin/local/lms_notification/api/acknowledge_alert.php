<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Acknowledge alert API endpoint
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');

// Require login
require_login();

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required parameters
if (!isset($data['alert_id'])) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(array(
        'success' => false,
        'error' => 'Missing required parameter: alert_id'
    ));
    exit;
}

$alert_id = (int)$data['alert_id'];

global $DB;

// Get alert
try {
    $alert = $DB->get_record('lms_inefficiency_alerts', array('id' => $alert_id), '*', MUST_EXIST);
} catch (Exception $e) {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(array(
        'success' => false,
        'error' => 'Alert not found'
    ));
    exit;
}

// Security check
$context = context_course::instance($alert->courseid);
if ($alert->userid != $USER->id && !has_capability('local/lms_notification:viewallalerts', $context)) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(array(
        'success' => false,
        'error' => 'Permission denied'
    ));
    exit;
}

// Update alert
$alert->is_acknowledged = 1;
$alert->acknowledged_by = $USER->id;
$alert->acknowledged_time = time();
$alert->timemodified = time();

try {
    $DB->update_record('lms_inefficiency_alerts', $alert);

    // Log the acknowledgment
    $event = \local_lms_notification\event\alert_acknowledged::create(array(
        'context' => $context,
        'objectid' => $alert->id,
        'relateduserid' => $alert->userid,
        'other' => array(
            'alert_type' => $alert->alert_type,
            'severity' => $alert->severity
        )
    ));
    $event->trigger();

    // Send response
    header('Content-Type: application/json');
    echo json_encode(array(
        'success' => true,
        'message' => 'Alert acknowledged successfully',
        'alert_id' => $alert->id,
        'acknowledged_time' => $alert->acknowledged_time
    ));

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(array(
        'success' => false,
        'error' => 'Failed to acknowledge alert: ' . $e->getMessage()
    ));
}
