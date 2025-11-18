<?php
/**
 * API - Review Flag
 * 플래그 검토 완료 처리 API
 */

require_once __DIR__ . '/../../src/autoload.php';

use OverconfidenceDetector\Controllers\DashboardController;

header('Content-Type: application/json');

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// CSRF 보호 (실제 환경에서는 토큰 검증 필요)
// if (!isset($_POST['csrf_token']) || !validateCsrfToken($_POST['csrf_token'])) {
//     http_response_code(403);
//     echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
//     exit;
// }

$flagId = $_POST['flag_id'] ?? null;
$notes = $_POST['notes'] ?? '';
$reviewerId = $_SESSION['teacher_id'] ?? 1; // 실제로는 세션에서 가져와야 함

if (!$flagId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Flag ID is required']);
    exit;
}

try {
    $controller = new DashboardController();
    $success = $controller->reviewFlag($flagId, $reviewerId, $notes);

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Flag reviewed successfully'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Flag not found'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
