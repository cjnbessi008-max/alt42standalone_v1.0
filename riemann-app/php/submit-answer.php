<?php
/**
 * Submit a student's answer for a Riemann Sum problem
 * POST /php/submit-answer.php
 * Body: {"problem_id": 1, "user_id": 123, "answer": 2.667, "actual_answer": 2.667}
 */

require_once __DIR__ . '/../config/database.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    exit;
}

try {
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendErrorResponse('Method not allowed', 405);
    }

    // Get POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendErrorResponse('Invalid JSON data', 400);
    }

    // Validate required fields
    if (!isset($data['problem_id']) || !isset($data['user_id']) ||
        !isset($data['answer']) || !isset($data['actual_answer'])) {
        sendErrorResponse('Missing required fields', 400);
    }

    $problemId = validateIntParam($data['problem_id'], 'problem_id');
    $userId = validateIntParam($data['user_id'], 'user_id');
    $answer = floatval($data['answer']);
    $actualAnswer = floatval($data['actual_answer']);

    // Calculate accuracy
    $error = abs($answer - $actualAnswer);
    $percentError = ($actualAnswer != 0) ? ($error / abs($actualAnswer)) * 100 : 0;
    $isCorrect = ($percentError < 5); // Consider correct if within 5% error

    // Get database connection
    $conn = getDatabaseConnection();

    // Insert submission record
    $sql = "INSERT INTO mdl_riemann_submissions
            (problem_id, user_id, submitted_answer, correct_answer, error_value,
             percent_error, is_correct, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        sendErrorResponse('Database prepare failed', 500);
    }

    $stmt->bind_param('iiddddi',
        $problemId,
        $userId,
        $answer,
        $actualAnswer,
        $error,
        $percentError,
        $isCorrect
    );

    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        sendErrorResponse('Failed to save submission', 500);
    }

    $submissionId = $stmt->insert_id;
    $stmt->close();

    // Update Moodle gradebook (if integrated)
    // This would typically call Moodle's grade API
    // For now, we'll just return the result

    // Format response
    $response = [
        'success' => true,
        'submission' => [
            'id' => $submissionId,
            'problem_id' => $problemId,
            'user_id' => $userId,
            'answer' => $answer,
            'correct_answer' => $actualAnswer,
            'error' => $error,
            'percent_error' => round($percentError, 2),
            'is_correct' => (bool)$isCorrect,
            'feedback' => $isCorrect
                ? '정답입니다! 잘하셨습니다.'
                : '조금 더 정확한 답을 찾아보세요. (오차: ' . round($percentError, 1) . '%)'
        ]
    ];

    sendJsonResponse($response);

} catch (Exception $e) {
    error_log("Error in submit-answer.php: " . $e->getMessage());
    sendErrorResponse('Internal server error', 500);
}
