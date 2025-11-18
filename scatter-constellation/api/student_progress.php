<?php
/**
 * API Endpoint: Student Progress
 * Get or update student progress on problems
 */

header('Content-Type: application/json');
require_once('../config.php');
require_once('../lib/db.php');
require_once('../lib/moodle_api.php');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::getInstance();

    if ($method === 'GET') {
        // Get student progress
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
        $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

        if ($userId === 0) {
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'user_id is required']);
            exit;
        }

        $sql = "
            SELECT
                sp.*,
                p.problem_name,
                p.problem_type,
                p.difficulty
            FROM student_progress sp
            INNER JOIN problems p ON sp.problem_id = p.id
        ";

        $params = [];
        $conditions = ['sp.moodle_user_id = ?'];
        $params[] = $userId;

        if ($courseId > 0) {
            $conditions[] = 'p.course_id = ?';
            $params[] = $courseId;
        }

        $sql .= " WHERE " . implode(' AND ', $conditions);
        $sql .= " ORDER BY sp.updated_at DESC";

        $progress = $db->fetchAll($sql, $params);

        echo json_encode([
            'success' => true,
            'progress' => $progress
        ]);

    } elseif ($method === 'POST') {
        // Update student progress
        $input = json_decode(file_get_contents('php://input'), true);

        $userId = $input['user_id'] ?? 0;
        $problemId = $input['problem_id'] ?? 0;
        $score = $input['score'] ?? 0;
        $timeSpent = $input['time_spent'] ?? 0;
        $completed = $input['completed'] ?? false;

        if ($userId === 0 || $problemId === 0) {
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'user_id and problem_id are required']);
            exit;
        }

        // Check if progress exists
        $existing = $db->fetchOne(
            "SELECT id, attempts FROM student_progress WHERE moodle_user_id = ? AND problem_id = ?",
            [$userId, $problemId]
        );

        if ($existing) {
            // Update existing progress
            $db->update('student_progress', [
                'score' => $score,
                'attempts' => $existing['attempts'] + 1,
                'time_spent' => $timeSpent,
                'completed' => $completed ? 1 : 0,
                'last_attempt_at' => date('Y-m-d H:i:s')
            ], 'id = ?', [$existing['id']]);

            $progressId = $existing['id'];
        } else {
            // Insert new progress
            $progressId = $db->insert('student_progress', [
                'moodle_user_id' => $userId,
                'problem_id' => $problemId,
                'score' => $score,
                'attempts' => 1,
                'time_spent' => $timeSpent,
                'completed' => $completed ? 1 : 0,
                'last_attempt_at' => date('Y-m-d H:i:s')
            ]);
        }

        echo json_encode([
            'success' => true,
            'progress_id' => $progressId,
            'message' => 'Progress updated successfully'
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Internal server error',
        'details' => APP_DEBUG ? $e->getMessage() : null
    ]);
}
