<?php
/**
 * 요약 조회 API
 * GET /api/get_summaries.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    // 쿼리 파라미터 파싱
    $summaryId = $_GET['summary_id'] ?? null;
    $userId = $_GET['user_id'] ?? null;
    $courseId = $_GET['course_id'] ?? null;
    $activityId = $_GET['activity_id'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $response = [
        'success' => true,
        'data' => null
    ];

    // 특정 요약 조회
    if ($summaryId) {
        $summary = $summaryService->getSummaryById($summaryId);
        if (!$summary) {
            throw new Exception("요약을 찾을 수 없습니다.");
        }
        $response['data'] = $summary;
    }
    // 사용자별 요약 조회
    elseif ($userId) {
        $summaries = $summaryService->getSummariesByUser($userId, $limit, $offset);
        $stats = $summaryService->getStatistics($userId);
        $response['data'] = [
            'summaries' => $summaries,
            'statistics' => $stats
        ];
    }
    // 코스별 요약 조회
    elseif ($courseId) {
        $summaries = $summaryService->getSummariesByCourse($courseId, $limit);
        $stats = $summaryService->getStatistics(null, $courseId);
        $response['data'] = [
            'summaries' => $summaries,
            'statistics' => $stats
        ];
    }
    // 활동별 요약 조회
    elseif ($activityId) {
        $summaries = $summaryService->getSummariesByActivity($activityId, $limit);
        $response['data'] = [
            'summaries' => $summaries
        ];
    }
    else {
        throw new Exception("조회 조건을 지정해주세요. (summary_id, user_id, course_id, activity_id 중 하나)");
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
