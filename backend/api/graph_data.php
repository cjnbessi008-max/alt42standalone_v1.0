<?php
/**
 * API Endpoint: Get Graph Data
 * Returns data for Live Graph visualization
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../moodle/moodle_client.php';

try {
    $moodle = new MoodleClient();

    // Get parameters
    $quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    if (!$quizId) {
        throw new Exception("quiz_id parameter is required");
    }

    // Get quiz statistics
    $stats = $moodle->getQuizStatistics($quizId);

    // Get user-specific progress if userId provided
    $userProgress = null;
    if ($userId) {
        $userProgress = $moodle->getStudentProgress($userId, $quizId);
    }

    // Format data for Live Graph
    $graphData = [
        'success' => true,
        'timestamp' => time(),
        'quiz_id' => $quizId,
        'statistics' => [
            'total_attempts' => $stats['total_attempts'],
            'average_score' => round($stats['average_score'], 2),
            'completion_rate' => round($stats['completion_rate'], 2)
        ],
        'time_series' => $stats['time_data'],
        'user_progress' => $userProgress,
        'animation_config' => [
            'breath_duration' => 3000, // 3 seconds for one breath cycle
            'pulse_intensity' => 0.15,  // 15% scale change
            'update_interval' => GRAPH_UPDATE_INTERVAL
        ]
    ];

    echo json_encode($graphData, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => time()
    ], JSON_PRETTY_PRINT);
}
