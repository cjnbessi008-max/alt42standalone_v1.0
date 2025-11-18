<?php
/**
 * REST API for Thinking Pattern Analysis
 * Provides endpoints for accessing analysis data and triggering analysis
 */

require_once __DIR__ . '/../database/DatabaseConnection.php';
require_once __DIR__ . '/../moodle-integration/MoodleClient.php';
require_once __DIR__ . '/../moodle-integration/DataCollector.php';
require_once __DIR__ . '/../analytics/ThinkingPatternAnalyzer.php';

class ThinkingPatternAPI {
    private $db;
    private $moodleClient;
    private $dataCollector;
    private $analyzer;

    public function __construct() {
        // Initialize database
        $this->db = DatabaseConnection::getInstance();

        // Load Moodle config
        $moodleConfig = $this->getMoodleConfig();
        $this->moodleClient = new MoodleClient(
            $moodleConfig['moodle_url'],
            $moodleConfig['moodle_token']
        );

        $this->dataCollector = new DataCollector($this->moodleClient, $this->db);
        $this->analyzer = new ThinkingPatternAnalyzer($this->db);
    }

    /**
     * Get Moodle configuration from database
     */
    private function getMoodleConfig() {
        $stmt = $this->db->query("
            SELECT config_key, config_value
            FROM moodle_integration_config
            WHERE config_key IN ('moodle_url', 'moodle_token')
        ");

        $config = [];
        while ($row = $stmt->fetch()) {
            $config[$row['config_key']] = $row['config_value'];
        }

        return $config;
    }

    /**
     * Handle API requests
     */
    public function handleRequest() {
        header('Content-Type: application/json');

        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));

        try {
            // Route requests
            if ($method === 'GET' && isset($pathParts[1]) && $pathParts[1] === 'analysis') {
                // GET /api/analysis/{user_id}
                $userId = (int) ($pathParts[2] ?? 0);
                $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
                $endDate = $_GET['end_date'] ?? date('Y-m-d');

                $this->getUserAnalysis($userId, $startDate, $endDate);

            } elseif ($method === 'POST' && isset($pathParts[1]) && $pathParts[1] === 'analyze') {
                // POST /api/analyze
                $this->triggerAnalysis();

            } elseif ($method === 'GET' && isset($pathParts[1]) && $pathParts[1] === 'summary') {
                // GET /api/summary/{user_id}
                $userId = (int) ($pathParts[2] ?? 0);
                $this->getUserSummary($userId);

            } elseif ($method === 'POST' && isset($pathParts[1]) && $pathParts[1] === 'sync') {
                // POST /api/sync
                $this->syncMoodleData();

            } elseif ($method === 'GET' && isset($pathParts[1]) && $pathParts[1] === 'compare') {
                // GET /api/compare/{user_id}
                $userId = (int) ($pathParts[2] ?? 0);
                $this->getComparison($userId);

            } else {
                $this->sendResponse(['error' => 'Invalid endpoint'], 404);
            }

        } catch (Exception $e) {
            $this->sendResponse([
                'error' => 'Server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user analysis data
     */
    private function getUserAnalysis($userId, $startDate, $endDate) {
        if ($userId <= 0) {
            $this->sendResponse(['error' => 'Invalid user ID'], 400);
            return;
        }

        $analysis = $this->analyzer->analyzeUserPatterns($userId, $startDate, $endDate);
        $this->sendResponse($analysis);
    }

    /**
     * Trigger analysis for users
     */
    private function triggerAnalysis() {
        $input = json_decode(file_get_contents('php://input'), true);

        $userId = (int) ($input['user_id'] ?? 0);
        $startDate = $input['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $input['end_date'] ?? date('Y-m-d');

        if ($userId <= 0) {
            $this->sendResponse(['error' => 'Invalid user ID'], 400);
            return;
        }

        $result = $this->analyzer->analyzeUserPatterns($userId, $startDate, $endDate);

        $this->sendResponse([
            'success' => true,
            'message' => 'Analysis completed',
            'data' => $result
        ]);
    }

    /**
     * Get user learning summary
     */
    private function getUserSummary($userId) {
        if ($userId <= 0) {
            $this->sendResponse(['error' => 'Invalid user ID'], 400);
            return;
        }

        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $summary = $this->dataCollector->getUserLearningSummary($userId, $startDate, $endDate);

        $this->sendResponse([
            'user_id' => $userId,
            'period' => ['start' => $startDate, 'end' => $endDate],
            'summary' => $summary
        ]);
    }

    /**
     * Sync data from Moodle
     */
    private function syncMoodleData() {
        $input = json_decode(file_get_contents('php://input'), true);

        $quizId = (int) ($input['quiz_id'] ?? 0);
        $userId = isset($input['user_id']) ? (int) $input['user_id'] : null;

        if ($quizId <= 0) {
            $this->sendResponse(['error' => 'Invalid quiz ID'], 400);
            return;
        }

        $syncedCount = $this->dataCollector->syncQuizAttempts($quizId, $userId);

        $this->sendResponse([
            'success' => true,
            'message' => 'Data synchronized',
            'synced_attempts' => $syncedCount
        ]);
    }

    /**
     * Get morning vs evening comparison
     */
    private function getComparison($userId) {
        if ($userId <= 0) {
            $this->sendResponse(['error' => 'Invalid user ID'], 400);
            return;
        }

        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $stmt = $this->db->prepare("
            SELECT
                time_of_day,
                avg_accuracy_rate,
                avg_concentration_score,
                avg_thinking_depth_score,
                avg_problem_solving_speed,
                total_activities,
                completion_rate
            FROM thinking_pattern_analysis
            WHERE moodle_user_id = ?
            AND analysis_period_start >= ?
            AND analysis_period_end <= ?
            ORDER BY analyzed_at DESC
            LIMIT 1
        ");

        $stmt->execute([$userId, $startDate, $endDate]);
        $data = $stmt->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC);

        $this->sendResponse([
            'user_id' => $userId,
            'comparison' => $data,
            'visualization_ready' => true
        ]);
    }

    /**
     * Send JSON response
     */
    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}

// Handle request if this file is accessed directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $api = new ThinkingPatternAPI();
    $api->handleRequest();
}
