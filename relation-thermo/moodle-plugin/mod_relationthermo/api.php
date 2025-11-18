<?php
/**
 * Relation Thermo Activity Module - REST API Endpoint
 *
 * @package    mod_relationthermo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    MIT
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Get request parameters
$action = required_param('action', PARAM_ALPHA);
$activity_id = required_param('activity_id', PARAM_INT);

require_login();

// CORS headers for AJAX
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    switch ($action) {
        case 'get_problems':
            $problems = get_problems($activity_id);
            echo json_encode(array('success' => true, 'data' => $problems));
            break;

        case 'submit_response':
            $problem_id = required_param('problem_id', PARAM_INT);
            $selected_relation = required_param('selected_relation', PARAM_ALPHA);
            $confidence_level = required_param('confidence_level', PARAM_INT);
            $time_spent = optional_param('time_spent', 0, PARAM_INT);

            $result = submit_response($activity_id, $problem_id, $selected_relation, $confidence_level, $time_spent);
            echo json_encode(array('success' => true, 'data' => $result));
            break;

        case 'get_progress':
            $progress = get_user_progress($activity_id);
            echo json_encode(array('success' => true, 'data' => $progress));
            break;

        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => $e->getMessage()));
}

/**
 * Get problems for the activity
 */
function get_problems($activity_id) {
    global $DB;

    $activity = $DB->get_record('relationthermo', array('id' => $activity_id), '*', MUST_EXIST);

    // Get problems from custom table
    $sql = "SELECT * FROM {rt_problems}
            WHERE moodle_activity_id = :activity_id
            AND difficulty <= :difficulty
            ORDER BY RAND()
            LIMIT :limit";

    $params = array(
        'activity_id' => $activity_id,
        'difficulty' => $activity->difficulty,
        'limit' => $activity->problem_count
    );

    $problems = $DB->get_records_sql($sql, $params);

    // Format problems for JSON
    $formatted = array();
    foreach ($problems as $problem) {
        $formatted[] = array(
            'id' => $problem->id,
            'title' => $problem->title,
            'description' => $problem->description,
            'set_a' => json_decode($problem->set_a),
            'set_b' => json_decode($problem->set_b),
            'difficulty' => $problem->difficulty
        );
    }

    return $formatted;
}

/**
 * Submit student response
 */
function submit_response($activity_id, $problem_id, $selected_relation, $confidence_level, $time_spent) {
    global $DB, $USER;

    // Get correct answer
    $problem = $DB->get_record('rt_problems', array('id' => $problem_id), '*', MUST_EXIST);
    $is_correct = ($selected_relation === $problem->relation_type);

    // Save response
    $response = new stdClass();
    $response->problem_id = $problem_id;
    $response->user_id = $USER->id;
    $response->selected_relation = $selected_relation;
    $response->confidence_level = $confidence_level;
    $response->is_correct = $is_correct;
    $response->time_spent = $time_spent;
    $response->submitted_at = time();

    $response_id = $DB->insert_record('rt_responses', $response);

    // Update progress
    update_progress($USER->id, $activity_id);

    // Update gradebook
    $activity = $DB->get_record('relationthermo', array('id' => $activity_id));
    relationthermo_update_grades($activity, $USER->id);

    return array(
        'response_id' => $response_id,
        'is_correct' => $is_correct,
        'correct_answer' => $problem->relation_type
    );
}

/**
 * Get user progress
 */
function get_user_progress($activity_id) {
    global $DB, $USER;

    $sql = "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
                AVG(confidence_level) as avg_confidence,
                AVG(time_spent) as avg_time
            FROM {rt_responses} r
            INNER JOIN {rt_problems} p ON r.problem_id = p.id
            WHERE p.moodle_activity_id = :activity_id
            AND r.user_id = :user_id";

    $params = array('activity_id' => $activity_id, 'user_id' => $USER->id);
    $progress = $DB->get_record_sql($sql, $params);

    return array(
        'total_problems' => (int)$progress->total,
        'correct_answers' => (int)$progress->correct,
        'accuracy' => $progress->total > 0 ? round(($progress->correct / $progress->total) * 100, 2) : 0,
        'avg_confidence' => round($progress->avg_confidence, 2),
        'avg_time' => round($progress->avg_time, 2)
    );
}

/**
 * Update user progress summary
 */
function update_progress($user_id, $activity_id) {
    global $DB;

    $activity = $DB->get_record('relationthermo', array('id' => $activity_id));

    $sql = "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
                AVG(confidence_level) as avg_confidence
            FROM {rt_responses} r
            INNER JOIN {rt_problems} p ON r.problem_id = p.id
            WHERE p.moodle_course_id = :course_id
            AND r.user_id = :user_id";

    $params = array('course_id' => $activity->course, 'user_id' => $user_id);
    $stats = $DB->get_record_sql($sql, $params);

    $progress = $DB->get_record('rt_progress',
                                array('user_id' => $user_id, 'moodle_course_id' => $activity->course));

    if ($progress) {
        $progress->total_problems = $stats->total;
        $progress->correct_answers = $stats->correct;
        $progress->average_confidence = $stats->avg_confidence;
        $progress->last_activity = time();
        $DB->update_record('rt_progress', $progress);
    } else {
        $progress = new stdClass();
        $progress->user_id = $user_id;
        $progress->moodle_course_id = $activity->course;
        $progress->total_problems = $stats->total;
        $progress->correct_answers = $stats->correct;
        $progress->average_confidence = $stats->avg_confidence;
        $DB->insert_record('rt_progress', $progress);
    }
}
