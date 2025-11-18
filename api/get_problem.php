<?php
/**
 * 집합 문제 가져오기 API
 * GET /api/get_problem.php?problem_id=123
 * GET /api/get_problem.php?random=1&category_id=5
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/SetProblem.php';

try {
    $setProblem = new SetProblem();

    // 특정 문제 ID로 가져오기
    if (isset($_GET['problem_id'])) {
        $problemId = filter_input(INPUT_GET, 'problem_id', FILTER_SANITIZE_NUMBER_INT);
        $problem = $setProblem->getProblem($problemId);

        if (!$problem) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => '문제를 찾을 수 없습니다.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    // 무작위 문제 가져오기
    elseif (isset($_GET['random'])) {
        $categoryId = filter_input(INPUT_GET, 'category_id', FILTER_SANITIZE_NUMBER_INT);
        $problem = $setProblem->getRandomProblem($categoryId);
    }
    // 샘플 문제
    else {
        $problem = $setProblem->getSampleProblem();
    }

    echo json_encode([
        'success' => true,
        'problem' => $problem
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '서버 오류가 발생했습니다.',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
