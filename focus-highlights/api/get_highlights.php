<?php
/**
 * Get Highlights API
 * Retrieves focus highlights for users
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/focus_tracker.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Only GET method allowed");
    }

    $userId = $_GET['user_id'] ?? null;
    $courseId = $_GET['course_id'] ?? null;
    $limit = (int)($_GET['limit'] ?? 20);
    $offset = (int)($_GET['offset'] ?? 0);

    if (!$userId && !$courseId) {
        throw new Exception("Either user_id or course_id is required");
    }

    $tracker = new FocusTracker();

    if ($userId) {
        // Get highlights for specific user
        $highlights = $tracker->getUserHighlights($userId, $limit, $offset);
        $stats = $tracker->getUserStats($userId);

        echo json_encode([
            'success' => true,
            'highlights' => $highlights,
            'stats' => $stats,
            'count' => count($highlights)
        ]);
    } elseif ($courseId) {
        // Get highlights for course (teacher view)
        $highlights = $tracker->getCourseHighlights($courseId, $limit, $offset);

        echo json_encode([
            'success' => true,
            'highlights' => $highlights,
            'count' => count($highlights)
        ]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
