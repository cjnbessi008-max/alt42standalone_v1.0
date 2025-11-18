<?php
/**
 * Submit API
 * Submit and grade student answers
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../services/GradingService.php';
require_once __DIR__ . '/../services/MoodleService.php';
require_once __DIR__ . '/../utils/Session.php';
require_once __DIR__ . '/../utils/Logger.php';

$logger = new Logger();
$session = new Session();

try {
    // Check if user is logged in
    if (!$session->isLoggedIn()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Unauthorized - Please login'
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        exit;
    }

    // Get POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON data'
        ]);
        exit;
    }

    // Validate CSRF token
    $csrfToken = $data['csrf_token'] ?? '';
    if (!$session->validateCsrfToken($csrfToken)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid CSRF token'
        ]);
        exit;
    }

    // Validate required fields
    $required = ['problem_id', 'selected_u', 'selected_dv'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => "Missing required field: $field"
            ]);
            exit;
        }
    }

    $userId = $session->getUserId();
    $problemId = intval($data['problem_id']);
    $selectedU = trim($data['selected_u']);
    $selectedDv = trim($data['selected_dv']);
    $attemptTime = isset($data['attempt_time']) ? floatval($data['attempt_time']) : null;
    $hintUsed = isset($data['hint_used']) ? intval($data['hint_used']) : 0;
    $moodleToken = $data['session_token'] ?? null;

    // Grade the answer
    $gradingService = new GradingService();
    $result = $gradingService->gradeAnswer(
        $userId,
        $problemId,
        $selectedU,
        $selectedDv,
        $attemptTime,
        $hintUsed
    );

    if (!$result['success']) {
        http_response_code(400);
        echo json_encode($result);
        exit;
    }

    // Sync with Moodle if token provided
    if ($moodleToken && $result['is_correct']) {
        try {
            $moodleService = new MoodleService($moodleToken);

            // Log activity
            $moodleService->logActivity($userId, 'problem_solved', [
                'problem_id' => $problemId,
                'attempt_time' => $attemptTime,
                'hints_used' => $hintUsed
            ]);

            // Calculate score (100 for correct, with penalties)
            $score = 100;
            if ($hintUsed > 0) {
                $score -= ($hintUsed * 5); // 5% penalty per hint
            }
            $score = max(60, $score); // Minimum 60%

            $result['moodle_synced'] = true;
            $result['score'] = $score;

        } catch (Exception $e) {
            $logger->warning("Moodle sync failed: " . $e->getMessage());
            $result['moodle_synced'] = false;
        }
    }

    $logger->info("Answer submitted by user $userId for problem $problemId: " .
                  ($result['is_correct'] ? 'CORRECT' : 'INCORRECT'));

    echo json_encode($result);

} catch (Exception $e) {
    $logger->error("Submit API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
