<?php
/**
 * Prime Fireworks API - 진도 조회
 * GET /api/progress.php?user_id={id}
 *
 * @author Prime Fireworks Team
 * @version 1.0.0
 */

require_once __DIR__ . '/config.php';

// 메서드 검증
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendErrorResponse('Method not allowed', 405);
}

// 데이터베이스 연결
$db = getDbConnection();
if (!$db) {
    sendErrorResponse('Database connection failed', 500);
}

// 파라미터 가져오기
$userId = getParam('user_id');

// 유효성 검증
if (!$userId) {
    sendErrorResponse('user_id parameter is required', 400);
}

try {
    // 사용자 통계 조회
    $stmt = $db->prepare("
        SELECT * FROM user_statistics WHERE moodle_user_id = ?
    ");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // 통계가 없으면 초기 데이터 생성
        $responseData = [
            'total_problems' => 0,
            'completed_problems' => 0,
            'correct_answers' => 0,
            'correct_rate' => 0,
            'total_time_seconds' => 0,
            'fireworks_count' => 0,
            'last_activity' => null
        ];
    } else {
        $stats = $result->fetch_assoc();
        $correctRate = $stats['completed_problems'] > 0
            ? ($stats['correct_answers'] / $stats['completed_problems']) * 100
            : 0;

        $responseData = [
            'total_problems' => intval($stats['total_problems']),
            'completed_problems' => intval($stats['completed_problems']),
            'correct_answers' => intval($stats['correct_answers']),
            'correct_rate' => round($correctRate, 2),
            'total_time_seconds' => intval($stats['total_time_seconds']),
            'fireworks_count' => intval($stats['fireworks_count']),
            'last_activity' => $stats['last_activity_at']
        ];
    }

    $stmt->close();

    sendSuccessResponse($responseData);

} catch (Exception $e) {
    logMessage('Error in progress.php: ' . $e->getMessage(), 'ERROR');
    sendErrorResponse('An error occurred while fetching progress', 500);
}

$db->close();
