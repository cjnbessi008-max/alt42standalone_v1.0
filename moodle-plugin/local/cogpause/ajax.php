<?php
// This file is part of Moodle - http://moodle.org/

/**
 * AJAX endpoint for Cognitive Pause Tracking
 *
 * @package    local_cogpause
 * @copyright  2024 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->dirroot . '/local/cogpause/lib.php');

// Require login
require_login();

// Verify session key
require_sesskey();

// Get action
$action = required_param('action', PARAM_ALPHA);

// Response array
$response = array(
    'success' => false,
    'error' => null,
    'data' => null
);

try {
    switch ($action) {
        case 'save_pause_events':
            $events_json = required_param('events', PARAM_RAW);
            $events = json_decode($events_json);

            if (!$events || !is_array($events)) {
                throw new moodle_exception('Invalid events data');
            }

            $saved_count = 0;
            $failed_count = 0;

            foreach ($events as $event) {
                // Validate required fields
                if (!isset($event->userId) || !isset($event->pauseStartTime) || !isset($event->pauseEndTime)) {
                    $failed_count++;
                    continue;
                }

                // Verify user permission (can only save own data)
                if ($event->userId != $USER->id) {
                    $failed_count++;
                    continue;
                }

                // Save event
                $result = local_cogpause_save_event($event);
                if ($result) {
                    $saved_count++;

                    // Update analytics if question attempt is complete
                    if ($event->attemptId && $event->questionId) {
                        local_cogpause_update_analytics(
                            $event->userId,
                            $event->questionId,
                            $event->attemptId
                        );
                    }
                } else {
                    $failed_count++;
                }
            }

            $response['success'] = true;
            $response['data'] = array(
                'saved' => $saved_count,
                'failed' => $failed_count,
                'total' => count($events)
            );
            break;

        case 'get_student_analytics':
            $userid = required_param('userid', PARAM_INT);
            $courseid = optional_param('courseid', null, PARAM_INT);

            // Check permission
            if ($userid != $USER->id) {
                require_capability('local/cogpause:view', context_system::instance());
            }

            $analytics = local_cogpause_get_student_analytics($userid, $courseid);

            $response['success'] = true;
            $response['data'] = array_values($analytics);
            break;

        case 'get_question_patterns':
            $questionid = required_param('questionid', PARAM_INT);

            // Check permission
            require_capability('local/cogpause:view', context_system::instance());

            $patterns = local_cogpause_get_question_patterns($questionid);

            $response['success'] = true;
            $response['data'] = $patterns;
            break;

        case 'get_student_profile':
            $userid = required_param('userid', PARAM_INT);
            $courseid = required_param('courseid', PARAM_INT);

            // Check permission
            if ($userid != $USER->id) {
                require_capability('local/cogpause:view', context_system::instance());
            }

            $profile = local_cogpause_get_student_profile($userid, $courseid);

            $response['success'] = true;
            $response['data'] = $profile;
            break;

        case 'update_question_patterns':
            $questionid = required_param('questionid', PARAM_INT);

            // Check permission
            require_capability('local/cogpause:manage', context_system::instance());

            $patterns = local_cogpause_calculate_question_patterns($questionid);

            $response['success'] = true;
            $response['data'] = $patterns;
            break;

        case 'get_at_risk_students':
            $courseid = required_param('courseid', PARAM_INT);

            // Check permission
            require_capability('local/cogpause:view', context_system::instance());

            $sql = "SELECT scp.*
                    FROM {student_cognitive_profiles} scp
                    WHERE scp.course_id = ? AND scp.at_risk_flag = 1
                    ORDER BY scp.avg_cognitive_load DESC";

            $at_risk = $DB->get_records_sql($sql, array($courseid));

            $response['success'] = true;
            $response['data'] = array_values($at_risk);
            break;

        default:
            throw new moodle_exception('Unknown action: ' . $action);
    }

} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
}

// Send JSON response
header('Content-Type: application/json');
echo json_encode($response);
