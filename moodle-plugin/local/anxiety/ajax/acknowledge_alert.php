<?php
// This file is part of Moodle - http://moodle.org/

/**
 * AJAX endpoint for acknowledging alerts
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->dirroot . '/local/anxiety/classes/alert_manager.php');

// Require login
require_login();

// Check session key
if (!confirm_sesskey(optional_param('sesskey', '', PARAM_RAW))) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(['success' => false, 'error' => 'Invalid session key']);
    die();
}

// Get parameters
$alertid = required_param('alertid', PARAM_INT);

try {
    global $DB;

    // Get alert to check permissions
    $alert = $DB->get_record('local_anxiety_alerts', ['id' => $alertid], '*', MUST_EXIST);
    $context = context_course::instance($alert->courseid);

    // Check if user has permission to acknowledge alerts
    if (!has_capability('local/anxiety:receivealerts', $context)) {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(['success' => false, 'error' => 'Permission denied']);
        die();
    }

    // Acknowledge the alert
    $success = \local_anxiety\alert_manager::acknowledge_alert($alertid, $USER->id);

    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success
    ]);

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        'success' => false,
        'error' => 'Failed to acknowledge alert: ' . $e->getMessage()
    ]);
}
