<?php
/**
 * API Endpoint: Save Student Progress
 * Updates student learning progress for a specific problem
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance();

    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    $studentId = intval($input['student_id'] ?? 0);
    $problemId = intval($input['problem_id'] ?? 0);
    $status = $input['status'] ?? 'in_progress';
    $score = floatval($input['score'] ?? 0);
    $timeSpent = intval($input['time_spent'] ?? 0);

    if (!$studentId || !$problemId) {
        throw new Exception('student_id and problem_id are required');
    }

    // Check if progress record exists
    $existing = $db->fetchOne(
        "SELECT id, attempts FROM student_progress WHERE student_id = ? AND problem_id = ?",
        [$studentId, $problemId]
    );

    $now = date('Y-m-d H:i:s');

    if ($existing) {
        // Update existing record
        $updateData = [
            'status' => $status,
            'score' => $score,
            'attempts' => $existing['attempts'] + 1,
            'time_spent' => $timeSpent,
            'last_attempt_at' => $now
        ];

        if ($status === 'completed' || $status === 'mastered') {
            $updateData['completed_at'] = $now;
        }

        $db->update(
            'student_progress',
            $updateData,
            'student_id = ? AND problem_id = ?',
            [$studentId, $problemId]
        );

        $progressId = $existing['id'];
    } else {
        // Insert new record
        $progressId = $db->insert('student_progress', [
            'student_id' => $studentId,
            'problem_id' => $problemId,
            'status' => $status,
            'score' => $score,
            'attempts' => 1,
            'time_spent' => $timeSpent,
            'first_attempt_at' => $now,
            'last_attempt_at' => $now,
            'completed_at' => ($status === 'completed' || $status === 'mastered') ? $now : null
        ]);
    }

    // Get updated progress
    $progress = $db->fetchOne(
        "SELECT * FROM student_progress WHERE id = ?",
        [$progressId]
    );

    echo json_encode([
        'success' => true,
        'data' => [
            'id' => intval($progress['id']),
            'studentId' => intval($progress['student_id']),
            'problemId' => intval($progress['problem_id']),
            'status' => $progress['status'],
            'score' => floatval($progress['score']),
            'attempts' => intval($progress['attempts']),
            'timeSpent' => intval($progress['time_spent'])
        ],
        'message' => 'Progress saved successfully'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
