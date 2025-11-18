<?php
/**
 * Student Progress API Endpoint
 * Handles saving and retrieving student progress
 * Compatible with PHP 7.1.9, MySQL 5.7
 */

require_once __DIR__ . '/../config/config.php';

set_cors_headers();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = get_db_connection();

    if ($method === 'GET') {
        // Get progress
        $problem_id = isset($_GET['problem_id']) ? $_GET['problem_id'] : null;
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

        if (!$problem_id || !$user_id) {
            send_error('Missing problem_id or user_id parameter', 400);
        }

        $sql = "SELECT p.*, pr.moodle_problem_id
                FROM student_progress p
                JOIN problems pr ON p.problem_id = pr.id
                WHERE (pr.moodle_problem_id = ? OR p.problem_id = ?)
                AND p.moodle_user_id = ?
                ORDER BY p.created_at DESC
                LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$problem_id, $problem_id, $user_id]);
        $progress = $stmt->fetch();

        if ($progress) {
            // Decode JSON fields
            $progress['numbers_selected'] = json_decode($progress['numbers_selected'], true);
            $progress['numbers_correct'] = json_decode($progress['numbers_correct'], true);
            $progress['numbers_incorrect'] = json_decode($progress['numbers_incorrect'], true);
        }

        send_json([
            'success' => true,
            'progress' => $progress
        ]);

    } elseif ($method === 'POST') {
        // Validate API key for POST requests
        if (!validate_api_key()) {
            send_error('Invalid API key', 401);
        }

        // Save progress
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!$data) {
            send_error('Invalid JSON data', 400);
        }

        $required = ['problem_id', 'user_id', 'session_id'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                send_error("Missing required field: $field", 400);
            }
        }

        // Get internal problem ID
        $sql = "SELECT id FROM problems WHERE moodle_problem_id = ? OR id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$data['problem_id'], $data['problem_id']]);
        $problem = $stmt->fetch();

        if (!$problem) {
            send_error('Problem not found', 404);
        }

        // Prepare JSON fields
        $numbers_selected = isset($data['numbers_selected']) ? json_encode($data['numbers_selected']) : '[]';
        $numbers_correct = isset($data['numbers_correct']) ? json_encode($data['numbers_correct']) : '[]';
        $numbers_incorrect = isset($data['numbers_incorrect']) ? json_encode($data['numbers_incorrect']) : '[]';

        // Insert or update progress
        $sql = "INSERT INTO student_progress (
            problem_id,
            moodle_user_id,
            session_id,
            numbers_selected,
            numbers_correct,
            numbers_incorrect,
            score,
            completed,
            end_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            numbers_selected = VALUES(numbers_selected),
            numbers_correct = VALUES(numbers_correct),
            numbers_incorrect = VALUES(numbers_incorrect),
            score = VALUES(score),
            completed = VALUES(completed),
            end_time = VALUES(end_time)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $problem['id'],
            $data['user_id'],
            $data['session_id'],
            $numbers_selected,
            $numbers_correct,
            $numbers_incorrect,
            isset($data['score']) ? $data['score'] : 0,
            isset($data['completed']) ? $data['completed'] : 0,
            isset($data['completed']) && $data['completed'] ? date('Y-m-d H:i:s') : null
        ]);

        send_json([
            'success' => true,
            'message' => 'Progress saved successfully'
        ]);

    } else {
        send_error('Method not allowed', 405);
    }

} catch (PDOException $e) {
    send_error('Database error: ' . $e->getMessage(), 500);
}
