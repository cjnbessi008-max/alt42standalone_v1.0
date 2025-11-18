<?php
/**
 * EquaMap Backend API
 * PHP 7.1.9 호환
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/moodle.php';
require_once __DIR__ . '/api/moodle_connector.php';

// 라우팅
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

try {
    // API 라우트 파싱
    $path = parse_url($requestUri, PHP_URL_PATH);
    $path = str_replace('/api', '', $path);

    // 라우트 매칭
    if ($requestMethod === 'GET' && preg_match('/^\/moodle\/health$/', $path)) {
        // Moodle 연결 상태 확인
        $result = checkMoodleHealth();
        echo json_encode($result);

    } elseif ($requestMethod === 'GET' && preg_match('/^\/moodle\/question\/(\d+)$/', $path, $matches)) {
        // 특정 문제 가져오기
        $questionId = intval($matches[1]);
        $question = getQuestionById($questionId);
        echo json_encode($question);

    } elseif ($requestMethod === 'GET' && preg_match('/^\/moodle\/quiz\/(\d+)\/questions$/', $path, $matches)) {
        // 퀴즈 문제 목록 가져오기
        $quizId = intval($matches[1]);
        $questions = getQuizQuestions($quizId);
        echo json_encode($questions);

    } elseif ($requestMethod === 'POST' && preg_match('/^\/moodle\/submit$/', $path)) {
        // 답안 제출
        $input = json_decode(file_get_contents('php://input'), true);
        $result = submitStudentAnswer($input['questionId'], $input['answer']);
        echo json_encode($result);

    } else {
        // 404 Not Found
        http_response_code(404);
        echo json_encode([
            'error' => 'Not Found',
            'path' => $path
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
}
