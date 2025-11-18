<?php
// This file is part of Moodle - http://moodle.org/

/**
 * AJAX endpoint for retrieving anxiety data
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->dirroot . '/local/anxiety/classes/analyzer.php');
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
$courseid = required_param('courseid', PARAM_INT);
$userid = optional_param('userid', null, PARAM_INT);
$timerange = optional_param('timerange', 'week', PARAM_ALPHA);

// Convert timerange to seconds
$timerange_map = [
    'today' => 86400,      // 1 day
    'week' => 604800,      // 7 days
    'month' => 2592000,    // 30 days
];
$timerange_seconds = isset($timerange_map[$timerange]) ? $timerange_map[$timerange] : 604800;

// Check permissions
$context = context_course::instance($courseid);

if ($userid === null) {
    // Requesting all students - must have viewothers capability
    if (!has_capability('local/anxiety:viewothers', $context)) {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(['success' => false, 'error' => 'Permission denied']);
        die();
    }
    $target_userid = $USER->id; // Default to self if no specific user
} else {
    // Requesting specific user
    if ($userid != $USER->id && !has_capability('local/anxiety:viewothers', $context)) {
        header('HTTP/1.1 403 Forbidden');
        echo json_encode(['success' => false, 'error' => 'Permission denied']);
        die();
    }
    $target_userid = $userid;
}

try {
    $data = [];

    if ($userid === null && has_capability('local/anxiety:viewothers', $context)) {
        // Get all students in course
        $enrolled_users = get_enrolled_users($context, 'local/anxiety:view', 0, 'u.id, u.firstname, u.lastname');

        $students = [];
        foreach ($enrolled_users as $user) {
            // Get latest anxiety score for this user
            $trend = \local_anxiety\analyzer::get_anxiety_trend($user->id, $courseid, $timerange_seconds);

            $latest_score = 0;
            $latest_level = 'normal';
            if (!empty($trend)) {
                $latest = end($trend);
                $latest_score = $latest->anxiety_score;
                $latest_level = $latest->anxiety_level;
            }

            $students[] = [
                'id' => $user->id,
                'name' => fullname($user),
                'anxiety_score' => round($latest_score, 1),
                'anxiety_level' => $latest_level,
                'trend' => array_map(function($item) {
                    return [
                        'timestamp' => $item->timecreated,
                        'score' => round($item->anxiety_score, 1),
                        'level' => $item->anxiety_level
                    ];
                }, $trend)
            ];
        }

        $data['students'] = $students;

        // Get alert statistics
        $data['alert_stats'] = \local_anxiety\alert_manager::get_alert_statistics($courseid, $timerange_seconds);

        // Get unread alerts
        $alerts = \local_anxiety\alert_manager::get_unread_alerts($courseid, 20);
        $data['alerts'] = array_map(function($alert) {
            return [
                'id' => $alert->id,
                'userid' => $alert->userid,
                'student_name' => fullname($alert),
                'alert_type' => $alert->alert_type,
                'anxiety_score' => round($alert->anxiety_score, 1),
                'message' => $alert->message,
                'timecreated' => $alert->timecreated,
                'is_read' => $alert->is_read
            ];
        }, $alerts);

    } else {
        // Get data for specific user
        $trend = \local_anxiety\analyzer::get_anxiety_trend($target_userid, $courseid, $timerange_seconds);

        $data['trend'] = array_map(function($item) {
            return [
                'timestamp' => $item->timecreated,
                'score' => round($item->anxiety_score, 1),
                'level' => $item->anxiety_level
            ];
        }, $trend);

        // Get user's alerts
        $alerts = \local_anxiety\alert_manager::get_user_alerts($target_userid, $courseid, 20);
        $data['alerts'] = array_map(function($alert) {
            return [
                'id' => $alert->id,
                'alert_type' => $alert->alert_type,
                'anxiety_score' => round($alert->anxiety_score, 1),
                'message' => $alert->message,
                'timecreated' => $alert->timecreated,
                'is_read' => $alert->is_read
            ];
        }, $alerts);
    }

    $data['success'] = true;

    header('Content-Type: application/json');
    echo json_encode($data);

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        'success' => false,
        'error' => 'Failed to retrieve data: ' . $e->getMessage()
    ]);
}
