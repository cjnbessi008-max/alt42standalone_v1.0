<?php
/**
 * AI 피드백 생성 API
 * POST /api/generate_feedback.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight request 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/AIFeedback.php';

try {
    $aiFeedback = new AIFeedback();

    // GET 요청: 기존 피드백 조회
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $summaryId = $_GET['summary_id'] ?? null;

        if (!$summaryId) {
            throw new Exception("summary_id가 필요합니다.");
        }

        $feedback = $aiFeedback->getFeedback($summaryId);

        echo json_encode([
            'success' => true,
            'data' => $feedback
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST 요청: 새로운 피드백 생성
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['summary_id'])) {
        throw new Exception("summary_id가 필요합니다.");
    }

    $summaryId = $input['summary_id'];

    // 피드백 생성
    $feedback = $aiFeedback->generateFeedback($summaryId);

    echo json_encode([
        'success' => true,
        'message' => 'AI 피드백이 생성되었습니다.',
        'data' => $feedback
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
