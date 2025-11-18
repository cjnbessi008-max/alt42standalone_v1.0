<?php
/**
 * API Endpoint: Get Progress
 * Retrieves student progress and statistics
 */

require_once __DIR__ . '/../vendor/autoload.php';

use ColorPattern\Models\StudentProgress;
use ColorPattern\Utils\Validator;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $progressModel = new StudentProgress();

    // Get parameters
    $userId = $_GET['user_id'] ?? null;
    $problemId = $_GET['problem_id'] ?? null;
    $type = $_GET['type'] ?? 'summary'; // summary, attempts, statistics, leaderboard

    if (!$userId && $type !== 'leaderboard') {
        throw new InvalidArgumentException('User ID is required');
    }

    Validator::positiveInteger($userId, 'User ID');

    $response = ['success' => true];

    switch ($type) {
        case 'attempts':
            // Get all attempts for specific problem
            if (!$problemId) {
                throw new InvalidArgumentException('Problem ID is required for attempts');
            }
            Validator::positiveInteger($problemId, 'Problem ID');

            $attempts = $progressModel->getUserAttempts($userId, $problemId);
            $response['attempts'] = $attempts;
            $response['attempt_count'] = count($attempts);
            $response['best_score'] = $progressModel->getBestScore($userId, $problemId);
            break;

        case 'statistics':
            // Get overall user statistics
            $stats = $progressModel->getUserStatistics($userId);
            $byPattern = $progressModel->getUserProgressByPattern($userId);

            $response['statistics'] = $stats;
            $response['by_pattern'] = $byPattern;

            // Calculate success rate
            if ($stats['total_attempts'] > 0) {
                $response['success_rate'] = round(
                    ($stats['correct_attempts'] / $stats['total_attempts']) * 100,
                    2
                );
            } else {
                $response['success_rate'] = 0;
            }
            break;

        case 'leaderboard':
            // Get leaderboard
            $limit = $_GET['limit'] ?? 10;
            $leaderboard = $progressModel->getLeaderboard($limit);
            $response['leaderboard'] = $leaderboard;
            break;

        case 'summary':
        default:
            // Get summary of user progress
            $stats = $progressModel->getUserStatistics($userId);
            $byPattern = $progressModel->getUserProgressByPattern($userId);

            if ($problemId) {
                Validator::positiveInteger($problemId, 'Problem ID');
                $attempts = $progressModel->getUserAttempts($userId, $problemId);
                $bestScore = $progressModel->getBestScore($userId, $problemId);
                $latestAttempt = $progressModel->getLatestAttempt($userId, $problemId);

                $response['current_problem'] = [
                    'problem_id' => $problemId,
                    'attempt_count' => count($attempts),
                    'best_score' => $bestScore,
                    'latest_attempt' => $latestAttempt
                ];
            }

            $response['overall_statistics'] = $stats;
            $response['progress_by_pattern'] = $byPattern;

            // Calculate level based on problems solved
            $problemsSolved = $stats['problems_attempted'] ?? 0;
            $level = floor($problemsSolved / 5) + 1;
            $response['level'] = $level;
            $response['next_level_problems'] = (($level) * 5) - $problemsSolved;
            break;
    }

    echo json_encode($response);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
    error_log("Get Progress Error: " . $e->getMessage());
}
