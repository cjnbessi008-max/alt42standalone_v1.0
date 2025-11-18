<?php
/**
 * API Endpoint: Submit Answer
 * Handles student answer submission and grading
 */

require_once __DIR__ . '/../vendor/autoload.php';

use ColorPattern\Models\Pattern;
use ColorPattern\Models\StudentProgress;
use ColorPattern\Services\PatternClassifier;
use ColorPattern\Services\MoodleService;
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
    Validator::required($input['attempt_id'] ?? null, 'Attempt ID');
    Validator::required($input['student_answer'] ?? null, 'Student Answer');
    Validator::required($input['problem_id'] ?? null, 'Problem ID');
    Validator::isArray($input['student_answer'], 'Student Answer');

    $attemptId = $input['attempt_id'];
    $studentAnswer = $input['student_answer'];
    $problemId = $input['problem_id'];
    $timeSpent = $input['time_spent'] ?? null;

    // Get problem
    $patternModel = new Pattern();
    $problem = $patternModel->getById($problemId);

    if (!$problem) {
        throw new InvalidArgumentException('Problem not found');
    }

    // Grade the answer
    $classifier = new PatternClassifier();
    $result = $classifier->checkAnswer($studentAnswer, $problem['correct_answer']);

    // Update attempt
    $progressModel = new StudentProgress();
    $progressModel->submitAttempt(
        $attemptId,
        $studentAnswer,
        $result['is_correct'],
        $result['score'],
        $timeSpent
    );

    // Get attempt details for Moodle sync
    $attempt = $progressModel->getAttemptById($attemptId);

    // Sync grade to Moodle if enabled
    $moodleSyncResult = null;
    if ($attempt && isset($input['sync_to_moodle']) && $input['sync_to_moodle']) {
        $moodleService = new MoodleService();
        $moodleSyncResult = $moodleService->submitGrade(
            $attempt['moodle_user_id'],
            $input['course_id'] ?? 0,
            'Color Pattern: ' . $problem['pattern_type'],
            $result['score']
        );
    }

    // Prepare response
    $response = [
        'success' => true,
        'result' => [
            'is_correct' => $result['is_correct'],
            'score' => $result['score'],
            'correct_count' => $result['correct_count'],
            'total_count' => $result['total_count'],
            'feedback' => $result['feedback']
        ],
        'attempt' => [
            'id' => $attemptId,
            'attempt_number' => $attempt['attempt_number'] ?? 0,
            'time_spent' => $timeSpent
        ]
    ];

    if ($moodleSyncResult) {
        $response['moodle_sync'] = $moodleSyncResult;
    }

    // Add encouragement message
    if ($result['is_correct']) {
        $response['message'] = '정답입니다! 훌륭해요! 🎉';
    } elseif ($result['score'] >= 70) {
        $response['message'] = '거의 다 맞았어요! 조금만 더 힘내세요!';
    } elseif ($result['score'] >= 50) {
        $response['message'] = '좋은 시도입니다! 다시 한번 생각해보세요.';
    } else {
        $response['message'] = '다시 도전해보세요! 패턴을 잘 관찰해보세요.';
    }

    echo json_encode($response);

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
        'error' => 'Internal server error'
    ]);
    error_log("Submit Answer Error: " . $e->getMessage());
}
