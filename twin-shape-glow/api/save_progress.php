<?php
/**
 * API: Save User Progress
 * Records user's game completion and scores
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../includes/moodle_integration.php';

try {
    // Get POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        throw new Exception('Invalid request data');
    }

    $user_id = isset($data['user_id']) ? intval($data['user_id']) : null;
    $problem_id = isset($data['problem_id']) ? intval($data['problem_id']) : null;
    $score = isset($data['score']) ? floatval($data['score']) : 0;
    $time_spent = isset($data['time_spent']) ? intval($data['time_spent']) : 0;
    $completed = isset($data['completed']) ? boolval($data['completed']) : false;

    if (!$user_id || !$problem_id) {
        throw new Exception('User ID and Problem ID are required');
    }

    $moodle = new MoodleIntegration();
    $success = $moodle->recordProgress($user_id, $problem_id, $score, $time_spent, $completed);

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Progress saved successfully',
            'data' => [
                'user_id' => $user_id,
                'problem_id' => $problem_id,
                'score' => $score,
                'time_spent' => $time_spent,
                'completed' => $completed
            ]
        ]);
    } else {
        throw new Exception('Failed to save progress');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
