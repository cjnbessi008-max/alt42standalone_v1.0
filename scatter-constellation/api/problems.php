<?php
/**
 * API Endpoint: Get Problems
 * Returns problems/questions for a specific course
 */

header('Content-Type: application/json');
require_once('../config.php');
require_once('../lib/db.php');
require_once('../lib/moodle_api.php');

try {
    // Get course ID from query parameter
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

    if ($courseId === 0) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'course_id parameter is required'
        ]);
        exit;
    }

    $moodle = new MoodleAPI();
    $db = Database::getInstance();

    // Get problems from Moodle
    $problems = $moodle->getProblems($courseId);

    if ($problems === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Failed to fetch problems from Moodle'
        ]);
        exit;
    }

    // Store/update problems in database
    foreach ($problems as &$problem) {
        // Check if problem exists
        $existing = $db->fetchOne(
            "SELECT id FROM problems WHERE moodle_problem_id = ? AND course_id = ?",
            [$problem['id'], $courseId]
        );

        if ($existing) {
            // Update existing problem
            $db->update('problems', [
                'problem_name' => $problem['name'],
                'problem_type' => $problem['type'],
                'difficulty' => $problem['difficulty'],
                'max_grade' => $problem['grade'] ?? 0,
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = ?', [$existing['id']]);

            $problem['db_id'] = $existing['id'];
        } else {
            // Insert new problem
            $problemId = $db->insert('problems', [
                'moodle_problem_id' => $problem['id'],
                'course_id' => $courseId,
                'problem_name' => $problem['name'],
                'problem_type' => $problem['type'],
                'difficulty' => $problem['difficulty'],
                'max_grade' => $problem['grade'] ?? 0
            ]);

            $problem['db_id'] = $problemId;

            // Create constellation point
            $db->insert('constellation_points', [
                'problem_id' => $problemId,
                'x_coordinate' => $problem['x'],
                'y_coordinate' => $problem['y'],
                'color' => $problem['color'],
                'size' => 6
            ]);
        }
    }

    // Return problems with constellation data
    echo json_encode([
        'success' => true,
        'course_id' => $courseId,
        'count' => count($problems),
        'problems' => $problems
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Internal server error',
        'details' => APP_DEBUG ? $e->getMessage() : null
    ]);
}
