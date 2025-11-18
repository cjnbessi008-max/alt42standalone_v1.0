<?php
/**
 * API: Get User Progress
 * Returns user's progress for a specific problem
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../includes/moodle_integration.php';

try {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $problem_id = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;

    if (!$user_id || !$problem_id) {
        throw new Exception('User ID and Problem ID are required');
    }

    $moodle = new MoodleIntegration();
    $progress = $moodle->getUserProgress($user_id, $problem_id);

    if ($progress) {
        echo json_encode([
            'success' => true,
            'progress' => $progress
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'progress' => null,
            'message' => 'No progress found'
        ]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
