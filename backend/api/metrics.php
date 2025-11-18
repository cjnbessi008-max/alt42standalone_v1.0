<?php
/**
 * DMN Drift Metrics API
 * Calculate and retrieve DMN drift metrics
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../services/DmnDriftCalculator.php';

class MetricsAPI {
    private $conn;
    private $calculator;

    public function __construct() {
        $database = new Database();
        $database->loadConfig();
        $this->conn = $database->getConnection();
        $this->calculator = new DmnDriftCalculator($this->conn);
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $_SERVER['PATH_INFO'] ?? '/';

        try {
            switch($method) {
                case 'POST':
                    if (preg_match('/^\/calculate\/(\d+)$/', $path, $matches)) {
                        $this->calculateMetrics($matches[1]);
                    } else {
                        $this->sendError(404, 'Endpoint not found');
                    }
                    break;

                case 'GET':
                    if (preg_match('/^\/session\/(\d+)$/', $path, $matches)) {
                        $this->getSessionMetrics($matches[1]);
                    } elseif (preg_match('/^\/session\/(\d+)\/latest$/', $path, $matches)) {
                        $this->getLatestMetrics($matches[1]);
                    } elseif (preg_match('/^\/student\/(\d+)$/', $path, $matches)) {
                        $this->getStudentMetrics($matches[1]);
                    } else {
                        $this->sendError(404, 'Endpoint not found');
                    }
                    break;

                default:
                    $this->sendError(405, 'Method not allowed');
            }
        } catch (Exception $e) {
            $this->sendError(500, $e->getMessage());
        }
    }

    /**
     * Calculate DMN drift metrics for a session
     * POST /api/metrics/calculate/{session_id}
     */
    private function calculateMetrics($sessionId) {
        $data = json_decode(file_get_contents('php://input'), true);

        $windowStart = $data['window_start'] ?? null;
        $windowEnd = $data['window_end'] ?? null;

        // Calculate metrics
        $metrics = $this->calculator->calculateDriftMetrics($sessionId, $windowStart, $windowEnd);

        // Save to database
        $saved = $this->calculator->saveMetrics($metrics);

        if ($saved) {
            // Update session with latest drift score
            $updateQuery = "
                UPDATE learning_sessions
                SET dmn_drift_score = :drift_score
                WHERE id = :session_id
            ";
            $stmt = $this->conn->prepare($updateQuery);
            $stmt->execute([
                'drift_score' => $metrics['dmn_drift_score'],
                'session_id' => $sessionId
            ]);

            $this->sendSuccess([
                'metrics' => $metrics,
                'message' => 'Metrics calculated and saved successfully'
            ], 201);
        } else {
            $this->sendError(500, 'Failed to save metrics');
        }
    }

    /**
     * Get all metrics for a session
     * GET /api/metrics/session/{session_id}
     */
    private function getSessionMetrics($sessionId) {
        $query = "
            SELECT *
            FROM dmn_drift_metrics
            WHERE session_id = :session_id
            ORDER BY time_window_start DESC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['session_id' => $sessionId]);
        $metrics = $stmt->fetchAll();

        $this->sendSuccess([
            'session_id' => $sessionId,
            'metrics' => $metrics,
            'count' => count($metrics)
        ]);
    }

    /**
     * Get latest metrics for a session
     * GET /api/metrics/session/{session_id}/latest
     */
    private function getLatestMetrics($sessionId) {
        $query = "
            SELECT *
            FROM dmn_drift_metrics
            WHERE session_id = :session_id
            ORDER BY calculated_at DESC
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['session_id' => $sessionId]);
        $metrics = $stmt->fetch();

        if ($metrics) {
            $this->sendSuccess($metrics);
        } else {
            $this->sendError(404, 'No metrics found for this session');
        }
    }

    /**
     * Get metrics for all sessions of a student
     * GET /api/metrics/student/{student_id}
     */
    private function getStudentMetrics($studentId) {
        $query = "
            SELECT
                dm.*,
                ls.module_name,
                ls.session_start
            FROM dmn_drift_metrics dm
            JOIN learning_sessions ls ON dm.session_id = ls.id
            WHERE dm.student_id = :student_id
            ORDER BY dm.calculated_at DESC
            LIMIT 50
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['student_id' => $studentId]);
        $metrics = $stmt->fetchAll();

        // Calculate aggregate statistics
        $stats = $this->calculateAggregateStats($metrics);

        $this->sendSuccess([
            'student_id' => $studentId,
            'metrics' => $metrics,
            'aggregate_stats' => $stats
        ]);
    }

    /**
     * Calculate aggregate statistics
     */
    private function calculateAggregateStats($metrics) {
        if (empty($metrics)) {
            return null;
        }

        $driftScores = array_column($metrics, 'dmn_drift_score');
        $accuracyRates = array_column($metrics, 'accuracy_rate');

        return [
            'avg_drift_score' => round(array_sum($driftScores) / count($driftScores), 2),
            'max_drift_score' => max($driftScores),
            'min_drift_score' => min($driftScores),
            'avg_accuracy' => round(array_sum($accuracyRates) / count($accuracyRates), 2),
            'total_measurements' => count($metrics),
            'drift_level_distribution' => array_count_values(array_column($metrics, 'drift_level'))
        ];
    }

    private function sendSuccess($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }

    private function sendError($code, $message) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
    }
}

$api = new MetricsAPI();
$api->handleRequest();
