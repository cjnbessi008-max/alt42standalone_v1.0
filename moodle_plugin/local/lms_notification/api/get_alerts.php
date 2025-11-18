<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Get alerts API endpoint
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->dirroot . '/local/lms_notification/classes/analyzer.php');

use local_lms_notification\analyzer;

// Require login
require_login();

// Get parameters
$userid = optional_param('userid', $USER->id, PARAM_INT);
$courseid = optional_param('courseid', null, PARAM_INT);
$acknowledged = optional_param('acknowledged', null, PARAM_INT);
$limit = optional_param('limit', 20, PARAM_INT);
$offset = optional_param('offset', 0, PARAM_INT);

// Security check
if ($userid != $USER->id && !has_capability('local/lms_notification:viewallalerts', context_system::instance())) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(array(
        'success' => false,
        'error' => 'Permission denied'
    ));
    exit;
}

// Get alerts
$acknowledged_filter = null;
if ($acknowledged !== null) {
    $acknowledged_filter = (bool)$acknowledged;
}

$alerts = analyzer::get_user_alerts($userid, $courseid, $acknowledged_filter, $limit, $offset);

// Get total count
global $DB;
$params = array('userid' => $userid);
$conditions = array('userid = :userid');

if ($courseid !== null) {
    $conditions[] = 'courseid = :courseid';
    $params['courseid'] = $courseid;
}

if ($acknowledged_filter !== null) {
    $conditions[] = 'is_acknowledged = :acknowledged';
    $params['acknowledged'] = $acknowledged_filter ? 1 : 0;
}

$total_count = $DB->count_records_select('lms_inefficiency_alerts',
    implode(' AND ', $conditions), $params);

// Format response
$response = array(
    'success' => true,
    'alerts' => array(),
    'total_count' => $total_count,
    'limit' => $limit,
    'offset' => $offset
);

foreach ($alerts as $alert) {
    $response['alerts'][] = array(
        'id' => $alert->id,
        'courseid' => $alert->courseid,
        'moduleid' => $alert->moduleid,
        'alert_type' => $alert->alert_type,
        'severity' => $alert->severity,
        'description' => $alert->description,
        'metrics' => json_decode($alert->metrics, true),
        'is_acknowledged' => (bool)$alert->is_acknowledged,
        'acknowledged_time' => $alert->acknowledged_time,
        'timecreated' => $alert->timecreated,
        'time_ago' => format_time(time() - $alert->timecreated)
    );
}

// Send JSON response
header('Content-Type: application/json');
echo json_encode($response);
