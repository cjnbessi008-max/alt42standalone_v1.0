<?php
/**
 * Progress API Endpoint
 * Handles student progress tracking
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/LogarithmCalculator.php';
require_once __DIR__ . '/../models/StudentAttempt.php';
require_once __DIR__ . '/../utils/cors.php';
require_once __DIR__ . '/../utils/response.php';

// Load configuration
$config = require __DIR__ . '/../config/config.php';

// Enable CORS
handleCors($config['cors']);

// Get database instance
try {
    $db = Database::getInstance($config);
} catch (Exception $e) {
    sendError('Database connection failed', 500);
    exit;
}

// Initialize models
$calculator = new LogarithmCalculator();
$attemptModel = new StudentAttempt($db, $calculator);

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Parse request
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api/progress';

// Remove query string and base path
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace($basePath, '', $path);
$path = trim($path, '/');

try {
    switch ($method) {
        case 'GET':
            if (empty($path)) {
                sendError('Student ID required', 400);
                break;
            }

            $studentId = (int)$path;
            $action = $_GET['action'] ?? 'summary';

            switch ($action) {
                case 'summary':
                    // Get overall performance summary
                    $performance = $attemptModel->getStudentPerformance($studentId);
                    sendSuccess($performance);
                    break;

                case 'recent':
                    // Get recent attempts
                    $limit = $_GET['limit'] ?? 10;
                    $attempts = $attemptModel->getRecentByStudent($studentId, $limit);
                    sendSuccess(['attempts' => $attempts, 'count' => count($attempts)]);
                    break;

                case 'leaderboard':
                    // Get leaderboard
                    $limit = $_GET['limit'] ?? 10;
                    $timeframe = $_GET['timeframe'] ?? 'all';
                    $leaderboard = $attemptModel->getLeaderboard($limit, $timeframe);
                    sendSuccess(['leaderboard' => $leaderboard]);
                    break;

                default:
                    sendError('Invalid action', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Progress API error: ' . $e->getMessage());
    sendError('Internal server error', 500);
}
