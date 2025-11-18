<?php
/**
 * Progress API
 * Get user learning progress and statistics
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Progress.php';
require_once __DIR__ . '/../models/Attempt.php';
require_once __DIR__ . '/../utils/Session.php';
require_once __DIR__ . '/../utils/Logger.php';

$logger = new Logger();
$session = new Session();

try {
    // Check if user is logged in
    if (!$session->isLoggedIn()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Unauthorized - Please login'
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        exit;
    }

    $userId = $session->getUserId();
    $progressModel = new Progress();
    $attemptModel = new Attempt();

    // Get user progress
    $progress = $progressModel->getOrCreate($userId);
    $stats = $attemptModel->getUserStats($userId);
    $rank = $progressModel->getUserRank($userId);
    $recentAttempts = $attemptModel->getByUserId($userId, 10);

    $response = [
        'success' => true,
        'progress' => [
            'mastery_level' => $progress->masteryLevel,
            'total_attempts' => $progress->totalAttempts,
            'correct_attempts' => $progress->correctAttempts,
            'success_rate' => $progress->getSuccessRate(),
            'average_time' => round($progress->averageTime, 2),
            'progress_percentage' => $progress->getProgressPercentage(),
            'last_activity' => $progress->lastActivity,
            'rank' => $rank
        ],
        'statistics' => [
            'unique_problems' => $stats['unique_problems'] ?? 0,
            'average_hints' => round($stats['avg_hints'] ?? 0, 2),
            'total_time' => round(($stats['avg_time'] ?? 0) * ($stats['total_attempts'] ?? 0), 2)
        ],
        'recent_attempts' => array_map(function($attempt) {
            return [
                'problem_id' => $attempt['problem_id'],
                'is_correct' => (bool)$attempt['is_correct'],
                'attempt_time' => round($attempt['attempt_time'], 2),
                'created_at' => $attempt['created_at']
            ];
        }, $recentAttempts)
    ];

    // Get leaderboard if requested
    if (isset($_GET['include_leaderboard']) && $_GET['include_leaderboard'] === 'true') {
        $limit = isset($_GET['leaderboard_limit']) ? intval($_GET['leaderboard_limit']) : 10;
        $leaderboard = $progressModel->getLeaderboard($limit);
        $response['leaderboard'] = $leaderboard;
    }

    // Get global stats if requested
    if (isset($_GET['include_global']) && $_GET['include_global'] === 'true') {
        $globalStats = $progressModel->getGlobalStats();
        $response['global_stats'] = $globalStats;
    }

    echo json_encode($response);

} catch (Exception $e) {
    $logger->error("Progress API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
