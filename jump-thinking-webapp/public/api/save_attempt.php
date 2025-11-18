<?php
/**
 * API: Save Student Attempt
 */

require_once __DIR__ . '/../../src/autoload.php';

use JumpThinking\Database\Connection;

header('Content-Type: application/json');

session_start();

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Validate required fields
if (!isset($input['session_id']) || !isset($input['problem_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    $db = Connection::getInstance();

    // Verify session belongs to user
    $sql = "SELECT * FROM student_sessions WHERE id = ? AND student_id = ?";
    $session = $db->fetchOne($sql, [$input['session_id'], $_SESSION['user_id']]);

    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid session']);
        exit;
    }

    // Get current attempt number
    $sql = "SELECT MAX(attempt_number) as max_attempt FROM attempts
            WHERE session_id = ? AND problem_id = ?";
    $result = $db->fetchOne($sql, [$input['session_id'], $input['problem_id']]);
    $attemptNumber = ($result['max_attempt'] ?? 0) + 1;

    // Insert attempt
    $sql = "INSERT INTO attempts
            (session_id, problem_id, attempt_number, student_answer, is_correct,
             time_spent_seconds, hints_used, skipped)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $db->insert($sql, [
        $input['session_id'],
        $input['problem_id'],
        $attemptNumber,
        $input['answer'] ?? null,
        $input['is_correct'] ?? 0,
        $input['time_spent'] ?? 0,
        $input['hints_used'] ?? 0,
        $input['skipped'] ?? 0
    ]);

    // Update session total time
    $sql = "UPDATE student_sessions
            SET total_time_seconds = total_time_seconds + ?
            WHERE id = ?";
    $db->execute($sql, [$input['time_spent'] ?? 0, $input['session_id']]);

    echo json_encode([
        'success' => true,
        'attempt_number' => $attemptNumber
    ]);

} catch (\Exception $e) {
    error_log('Save attempt error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
