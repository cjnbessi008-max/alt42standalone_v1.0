<?php
/**
 * API Endpoint: 문제 정보 가져오기
 * GET /api/get-problem.php?quiz_id={id}
 * GET /api/get-problem.php?custom_id={id}
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . (defined('API_CORS_ORIGIN') ? API_CORS_ORIGIN : '*'));
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight request 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../moodle/moodle-connector.php';

// GET 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $connector = new MoodleConnector();
    $problemData = null;

    // Moodle 퀴즈 ID로 가져오기
    if (isset($_GET['quiz_id'])) {
        $quizId = intval($_GET['quiz_id']);
        if ($quizId <= 0) {
            throw new Exception('Invalid quiz_id');
        }
        $problemData = $connector->getQuizProblem($quizId);
    }
    // 커스텀 문제 ID로 가져오기
    elseif (isset($_GET['custom_id'])) {
        $customId = intval($_GET['custom_id']);
        if ($customId <= 0) {
            throw new Exception('Invalid custom_id');
        }
        $problemData = $connector->getCustomProblem($customId);
    }
    // 파라미터 없으면 샘플 데이터 반환
    else {
        // 데모용 샘플 데이터
        $problemData = [
            'id' => 0,
            'question_name' => 'Sample: Reciprocal Function',
            'function' => '1/x',
            'asymptotes' => [
                'vertical' => [0],
                'horizontal' => [0],
                'oblique' => []
            ],
            'domain' => [-10, 10],
            'range' => [-10, 10],
            'animation_duration' => 2000
        ];
    }

    if ($problemData === null) {
        http_response_code(404);
        echo json_encode(['error' => 'Problem not found']);
        exit;
    }

    // 성공 응답
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $problemData,
        'timestamp' => time()
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
