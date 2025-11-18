<?php
/**
 * Submit API Endpoint
 * POST /api/v1/problems/{id}/submit - 답안 제출 및 채점
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../utils/Database.php';
require_once __DIR__ . '/../utils/IntegralCalculator.php';

header('Content-Type: application/json; charset=utf-8');

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed. Use POST', 405);
}

try {
    // URL에서 문제 ID 추출
    $path = $_SERVER['REQUEST_URI'];
    $pathParts = explode('/', trim($path, '/'));
    $problemIndex = array_search('problems', $pathParts);
    $problemId = isset($pathParts[$problemIndex + 1]) ? $pathParts[$problemIndex + 1] : null;

    if (!$problemId || !is_numeric($problemId)) {
        sendError('Problem ID required', 400);
    }

    // 입력 데이터 파싱
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendError('Invalid JSON input', 400);
    }

    // 필수 필드 검증
    $requiredFields = ['user_id', 'answer'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }

    $userId = (int)$input['user_id'];
    $userAnswer = (float)$input['answer'];
    $timeSpent = isset($input['time_spent']) ? (int)$input['time_spent'] : 0;
    $hintUsed = isset($input['hint_used']) ? (bool)$input['hint_used'] : false;
    $sessionData = isset($input['session_data']) ? $input['session_data'] : null;

    // 문제 정보 조회
    $problemModel = new Problem();
    $problem = $problemModel->getById($problemId);

    if (!$problem) {
        sendError('Problem not found', 404);
    }

    // 적분 계산 및 검증
    $calculator = new IntegralCalculator();
    $validation = $calculator->validate(
        $userAnswer,
        $problem['correct_answer'],
        $problem['tolerance']
    );

    // 점수 계산
    $score = $calculator->calculateScore($validation['error_percentage']);

    // 피드백 메시지 결정
    $feedback = $validation['is_correct']
        ? $problem['success_message']
        : $problem['failure_message'];

    // 애니메이션 데이터 생성
    $animationData = [
        'character_move_distance' => abs($userAnswer),
        'correct_distance' => abs($problem['correct_answer']),
        'area_fill_color' => $validation['is_correct'] ? '#2ecc71' : '#e74c3c',
        'area_opacity' => 0.3,
        'success_effect' => $validation['is_correct'],
        'error_visualization' => !$validation['is_correct']
    ];

    // 시도 기록 저장
    $attemptId = saveAttempt(
        $problemId,
        $userId,
        $userAnswer,
        $validation['is_correct'],
        $validation['error_percentage'],
        $score,
        $timeSpent,
        $hintUsed,
        $sessionData
    );

    // 진도 업데이트 (트리거에 의해 자동 처리되지만 확인)
    updateProgress($userId, $problemId, $validation['is_correct'], $score);

    // 응답 생성
    $response = [
        'attempt_id' => $attemptId,
        'is_correct' => $validation['is_correct'],
        'user_answer' => $userAnswer,
        'correct_answer' => $problem['correct_answer'],
        'error' => $validation['error'],
        'error_percentage' => $validation['error_percentage'],
        'score' => round($score, 2),
        'feedback' => $feedback,
        'animation_data' => $animationData,
        'hints' => $validation['is_correct'] ? [] : $problem['hints']
    ];

    sendSuccess($response, 'Answer submitted successfully');

} catch (Exception $e) {
    error_log('[Submit API] Error: ' . $e->getMessage());
    sendError('Submission failed: ' . $e->getMessage(), 500);
}

/**
 * 시도 기록 저장
 */
function saveAttempt($problemId, $userId, $userAnswer, $isCorrect, $errorPercentage, $score, $timeSpent, $hintUsed, $sessionData) {
    $db = Database::getInstance();

    // 현재 시도 횟수 조회
    $attemptNumber = getAttemptNumber($userId, $problemId);

    // 힌트 사용 내역 JSON 변환
    $hintsViewed = $hintUsed && isset($sessionData['hints_viewed'])
        ? json_encode($sessionData['hints_viewed'])
        : null;

    // 세션 데이터 JSON 변환
    $sessionDataJson = $sessionData ? json_encode($sessionData) : null;

    // 데이터 준비
    $data = [
        'problem_id' => $problemId,
        'user_id' => $userId,
        'user_answer' => $userAnswer,
        'is_correct' => $isCorrect ? 1 : 0,
        'error_percentage' => $errorPercentage,
        'score' => $score,
        'attempt_number' => $attemptNumber,
        'time_spent_seconds' => $timeSpent,
        'hint_used' => $hintUsed ? 1 : 0,
        'hints_viewed' => $hintsViewed,
        'session_data' => $sessionDataJson,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
    ];

    return $db->insert('area_walk_attempts', $data);
}

/**
 * 시도 횟수 조회
 */
function getAttemptNumber($userId, $problemId) {
    $db = Database::getInstance();

    $sql = "SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
            FROM area_walk_attempts
            WHERE user_id = ? AND problem_id = ?";

    $result = $db->fetchOne($sql, [$userId, $problemId]);

    return $result ? (int)$result['next_attempt'] : 1;
}

/**
 * 진도 업데이트 (트리거 보조)
 */
function updateProgress($userId, $problemId, $isCorrect, $score) {
    $db = Database::getInstance();

    // 진도 테이블 존재 여부 확인
    $sql = "SELECT id FROM area_walk_progress
            WHERE user_id = ? AND problem_id = ?";

    $progress = $db->fetchOne($sql, [$userId, $problemId]);

    if (!$progress) {
        // 진도 레코드 생성 (트리거가 처리하지 못한 경우)
        $db->insert('area_walk_progress', [
            'user_id' => $userId,
            'problem_id' => $problemId,
            'status' => $isCorrect ? 'completed' : 'in_progress',
            'completion_percentage' => $isCorrect ? 100.00 : 0.00,
            'best_score' => $score,
            'total_attempts' => 1,
            'successful_attempts' => $isCorrect ? 1 : 0,
            'first_accessed_at' => date('Y-m-d H:i:s'),
            'last_accessed_at' => date('Y-m-d H:i:s'),
            'completed_at' => $isCorrect ? date('Y-m-d H:i:s') : null
        ]);
    }
    // 트리거가 대부분의 업데이트를 처리함
}

/**
 * 성공 응답
 */
function sendSuccess($data, $message = 'Success', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
