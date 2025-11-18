<?php
/**
 * 요약 저장 API
 * POST /api/save_summary.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight request 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/SummaryService.php';
require_once __DIR__ . '/../src/AIFeedback.php';

try {
    // POST 데이터 파싱
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception("잘못된 요청 형식입니다.");
    }

    // 필수 필드 확인
    $required = ['moodle_user_id', 'moodle_course_id', 'moodle_activity_id',
                 'activity_type', 'activity_name', 'summary_text'];

    foreach ($required as $field) {
        if (!isset($input[$field])) {
            throw new Exception("필수 항목이 누락되었습니다: " . $field);
        }
    }

    // 요약 저장
    $summaryService = new SummaryService();
    $summaryId = $summaryService->createSummary($input);

    $response = [
        'success' => true,
        'message' => '요약이 성공적으로 저장되었습니다.',
        'data' => [
            'summary_id' => $summaryId
        ]
    ];

    // AI 피드백 생성 (선택적)
    if (isset($input['generate_feedback']) && $input['generate_feedback'] === true) {
        try {
            $aiFeedback = new AIFeedback();
            $feedback = $aiFeedback->generateFeedback($summaryId);
            $response['data']['feedback'] = $feedback;
        } catch (Exception $e) {
            // AI 피드백 실패는 치명적이지 않음
            $response['data']['feedback_error'] = $e->getMessage();
        }
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
