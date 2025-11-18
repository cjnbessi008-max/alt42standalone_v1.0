<?php
/**
 * 요약 수정/삭제 API
 * PUT /api/update_summary.php - 수정
 * DELETE /api/update_summary.php - 삭제
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight request 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/SummaryService.php';

try {
    $summaryService = new SummaryService();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['summary_id']) || !isset($input['user_id'])) {
        throw new Exception("summary_id와 user_id가 필요합니다.");
    }

    $summaryId = $input['summary_id'];
    $userId = $input['user_id'];

    // DELETE 요청: 삭제
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $summaryService->deleteSummary($summaryId, $userId);

        echo json_encode([
            'success' => true,
            'message' => '요약이 삭제되었습니다.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // PUT 요청: 수정
    if (!isset($input['summary_text'])) {
        throw new Exception("summary_text가 필요합니다.");
    }

    $summaryService->updateSummary($summaryId, $input['summary_text'], $userId);

    echo json_encode([
        'success' => true,
        'message' => '요약이 수정되었습니다.'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
