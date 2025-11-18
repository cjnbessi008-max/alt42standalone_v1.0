<?php
/**
 * 답안 제출 API
 * POST /api/submit_answer.php
 * Body: { "problem_id": 123, "student_id": 456, "answer": "{3,4,5}" }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'POST 메서드만 허용됩니다.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/SetProblem.php';

try {
    // JSON 데이터 파싱
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => '잘못된 요청 형식입니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $problemId = $input['problem_id'] ?? null;
    $studentId = $input['student_id'] ?? null;
    $answer = $input['answer'] ?? null;

    if (!$problemId || !$studentId || !$answer) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => '필수 파라미터가 누락되었습니다. (problem_id, student_id, answer)'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $setProblem = new SetProblem();
    $result = $setProblem->submitAnswer($problemId, $studentId, $answer);

    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '서버 오류가 발생했습니다.',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
