<?php
/**
 * API Endpoint: Start Attempt
 * Initiates a new problem attempt for a student
 */

require_once __DIR__ . '/../vendor/autoload.php';

use ColorPattern\Models\StudentProgress;
use ColorPattern\Utils\Validator;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new InvalidArgumentException('Invalid JSON input');
    }

    // Validate required fields
    Validator::required($input['user_id'] ?? null, 'User ID');
    Validator::required($input['problem_id'] ?? null, 'Problem ID');
    Validator::positiveInteger($input['user_id'], 'User ID');
    Validator::positiveInteger($input['problem_id'], 'Problem ID');

    $userId = $input['user_id'];
    $problemId = $input['problem_id'];

    $progressModel = new StudentProgress();

    // Check if max attempts reached
    if ($progressModel->isMaxAttemptsReached($userId, $problemId)) {
        $appConfig = require __DIR__ . '/../config/app.php';
        throw new Exception(
            'Maximum attempts (' . $appConfig['max_attempts_per_problem'] . ') reached for this problem'
        );
    }

    // Start new attempt
    $attemptId = $progressModel->startAttempt($userId, $problemId);

    if (!$attemptId) {
        throw new Exception('Failed to create attempt');
    }

    // Get attempt details
    $attempt = $progressModel->getAttemptById($attemptId);

    echo json_encode([
        'success' => true,
        'attempt' => $attempt,
        'message' => '문제를 시작했습니다. 행운을 빕니다!'
    ]);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    error_log("Start Attempt Error: " . $e->getMessage());
}
