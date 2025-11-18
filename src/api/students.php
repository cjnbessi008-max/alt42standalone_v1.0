<?php
/**
 * Students API Endpoint
 * Handles student-related queries
 */

$sync = new MoodleSync();
$detector = new AvoidanceDetector();

switch ($method) {
    case 'GET':
        if ($id) {
            // Get specific student
            if ($action === 'patterns') {
                // Get avoidance patterns for student
                $include_resolved = isset($_GET['include_resolved']) && $_GET['include_resolved'] === 'true';
                $patterns = $detector->getStudentPatterns($id, $include_resolved);
                send_success_response($patterns);
            }
            elseif ($action === 'analysis') {
                // Get student analysis summary
                $db = Database::getInstance();
                $sql = "SELECT * FROM v_student_concept_summary
                        WHERE moodle_user_id = :user_id
                        ORDER BY risk_level DESC, accuracy_rate ASC";

                $analysis = $db->fetchAll($sql, [':user_id' => $id]);
                send_success_response($analysis);
            }
            elseif ($action === 'attempts') {
                // Get student quiz attempts from Moodle
                $attempts = $sync->getStudentAttempts($id);
                send_success_response($attempts);
            }
            else {
                send_error_response('Unknown action', 400);
            }
        } else {
            // Get all students
            $students = $sync->getStudents();
            send_success_response($students);
        }
        break;

    default:
        send_error_response('Method not allowed', 405);
}
