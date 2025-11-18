<?php
/**
 * Submit Answer API Endpoint
 * Processes student answer and detects traps
 * Trap Detection LMS
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../src/services/TrapDetectionService.php';

try {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST requests are allowed");
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $requiredFields = ['student_id', 'question_id', 'selected_option_id'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    $studentId = intval($input['student_id']);
    $questionId = intval($input['question_id']);
    $selectedOptionId = intval($input['selected_option_id']);
    $timeSpent = isset($input['time_spent']) ? intval($input['time_spent']) : 0;

    // Process attempt
    $trapService = new TrapDetectionService();
    $result = $trapService->processAttempt($studentId, $questionId, $selectedOptionId, $timeSpent);

    // Return response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result,
        'message' => $result['is_correct'] ? '정답입니다!' : '오답입니다. 다시 시도해보세요.',
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
