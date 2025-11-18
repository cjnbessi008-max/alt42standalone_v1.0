<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Get learning analytics API endpoint
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

// Get parameters
$userid = required_param('userid', PARAM_INT);
$courseid = required_param('courseid', PARAM_INT);
$start_date = optional_param('start_date', null, PARAM_TEXT);
$end_date = optional_param('end_date', null, PARAM_TEXT);
$days = optional_param('days', 7, PARAM_INT);

// Security check
if ($userid != $USER->id && !has_capability('local/lms_notification:viewanalytics', context_system::instance())) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(array(
        'success' => false,
        'error' => 'Permission denied'
    ));
    exit;
}

// Verify course enrollment
$context = context_course::instance($courseid);
if (!is_enrolled($context, $userid) && !has_capability('local/lms_notification:viewanalytics', $context)) {
    header('HTTP/1.1 403 Forbidden');
    echo json_encode(array(
        'success' => false,
        'error' => 'Not authorized to view analytics for this course'
    ));
    exit;
}

// Get statistics
$stats = tracker::get_statistics($userid, $courseid, $days);

// Get daily breakdown
global $DB;

$start_timestamp = $start_date ? strtotime($start_date) : (time() - ($days * 86400));
$end_timestamp = $end_date ? strtotime($end_date) : time();

$sql = "SELECT *
        FROM {lms_learning_analytics}
        WHERE userid = :userid
          AND courseid = :courseid
          AND timecreated >= :start_time
          AND timecreated <= :end_time
        ORDER BY date ASC";

$daily_analytics = $DB->get_records_sql($sql, array(
    'userid' => $userid,
    'courseid' => $courseid,
    'start_time' => $start_timestamp,
    'end_time' => $end_timestamp
));

$daily_breakdown = array();
foreach ($daily_analytics as $day) {
    $daily_breakdown[] = array(
        'date' => $day->date,
        'total_time_spent' => (int)$day->total_time_spent,
        'total_attempts' => (int)$day->total_attempts,
        'success_rate' => (float)$day->success_rate,
        'inefficiency_score' => (float)$day->inefficiency_score,
        'activities_completed' => (int)$day->activities_completed,
        'alerts_triggered' => (int)$day->alerts_triggered
    );
}

// Get alert summary
$sql = "SELECT alert_type, severity, COUNT(*) as count
        FROM {lms_inefficiency_alerts}
        WHERE userid = :userid
          AND courseid = :courseid
          AND timecreated >= :start_time
          AND timecreated <= :end_time
        GROUP BY alert_type, severity
        ORDER BY count DESC";

$alert_summary = $DB->get_records_sql($sql, array(
    'userid' => $userid,
    'courseid' => $courseid,
    'start_time' => $start_timestamp,
    'end_time' => $end_timestamp
));

$alerts_by_type = array();
foreach ($alert_summary as $alert) {
    $alerts_by_type[] = array(
        'alert_type' => $alert->alert_type,
        'severity' => $alert->severity,
        'count' => (int)$alert->count
    );
}

// Format response
$response = array(
    'success' => true,
    'analytics' => array(
        'total_time_spent' => $stats['total_time'],
        'total_time_formatted' => format_time($stats['total_time']),
        'total_attempts' => $stats['total_attempts'],
        'total_correct' => $stats['total_correct'],
        'total_incorrect' => $stats['total_incorrect'],
        'success_rate' => $stats['avg_success_rate'],
        'avg_time_spent' => $stats['avg_time_spent'],
        'avg_time_formatted' => format_time($stats['avg_time_spent']),
        'activities_completed' => $stats['total_activities']
    ),
    'daily_breakdown' => $daily_breakdown,
    'alerts_by_type' => $alerts_by_type,
    'period' => array(
        'start_date' => date('Y-m-d', $start_timestamp),
        'end_date' => date('Y-m-d', $end_timestamp),
        'days' => $days
    )
);

// Send JSON response
header('Content-Type: application/json');
echo json_encode($response);
