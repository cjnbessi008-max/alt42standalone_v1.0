<?php
/**
 * Log API
 * REST API endpoints for log management
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/moodle_connector.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

class LogAPI {
    private $db;
    private $moodle;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->moodle = new MoodleConnector();
    }

    /**
     * Get logs with optional filters
     */
    public function getLogs($filters = []) {
        $query = "SELECT * FROM activity_logs WHERE 1=1";
        $params = [];

        if (!empty($filters['user_id'])) {
            $query .= " AND moodle_user_id = :user_id";
            $params[':user_id'] = $filters['user_id'];
        }

        if (!empty($filters['activity_type'])) {
            $query .= " AND activity_type = :activity_type";
            $params[':activity_type'] = $filters['activity_type'];
        }

        if (!empty($filters['from_date'])) {
            $query .= " AND created_at >= :from_date";
            $params[':from_date'] = $filters['from_date'];
        }

        if (!empty($filters['to_date'])) {
            $query .= " AND created_at <= :to_date";
            $params[':to_date'] = $filters['to_date'];
        }

        $query .= " ORDER BY created_at DESC LIMIT 100";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /**
     * Add log entry
     */
    public function addLog($logData) {
        $query = "INSERT INTO activity_logs
                  (moodle_user_id, user_name, activity_type, problem_id,
                   problem_name, action, result, score, log_message, raw_data)
                  VALUES
                  (:moodle_user_id, :user_name, :activity_type, :problem_id,
                   :problem_name, :action, :result, :score, :log_message, :raw_data)";

        $stmt = $this->db->prepare($query);

        return $stmt->execute([
            ':moodle_user_id' => $logData['user_id'],
            ':user_name' => $logData['user_name'],
            ':activity_type' => $logData['activity_type'],
            ':problem_id' => $logData['problem_id'] ?? null,
            ':problem_name' => $logData['problem_name'] ?? null,
            ':action' => $logData['action'],
            ':result' => $logData['result'] ?? null,
            ':score' => $logData['score'] ?? null,
            ':log_message' => $logData['log_message'],
            ':raw_data' => $logData['raw_data'] ?? null
        ]);
    }

    /**
     * Get highlight keywords
     */
    public function getHighlightKeywords() {
        $query = "SELECT * FROM highlight_keywords
                  WHERE is_active = 1
                  ORDER BY priority DESC, keyword ASC";

        $stmt = $this->db->query($query);
        $keywords = $stmt->fetchAll();

        // Group by category
        $grouped = [];
        foreach ($keywords as $kw) {
            $grouped[$kw['category']][] = $kw;
        }

        return $grouped;
    }

    /**
     * Sync logs from Moodle
     */
    public function syncFromMoodle($quizId, $userId = 0) {
        try {
            // Get quiz attempts from Moodle
            $attempts = $this->moodle->getQuizAttempts($quizId, $userId);

            // Parse and save logs
            $logs = $this->moodle->parseLogData(['attempts' => $attempts], 'quiz');

            $syncedCount = 0;
            foreach ($logs as $log) {
                if ($this->addLog($log)) {
                    $syncedCount++;
                }
            }

            // Update sync status
            $this->updateSyncStatus('quiz_sync', $syncedCount, 'success');

            return [
                'success' => true,
                'synced' => $syncedCount,
                'message' => "Synced {$syncedCount} logs from Moodle"
            ];

        } catch (Exception $e) {
            $this->updateSyncStatus('quiz_sync', 0, 'error', $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Update sync status
     */
    private function updateSyncStatus($syncType, $recordsSynced, $status, $errorMessage = null) {
        $query = "INSERT INTO sync_status
                  (sync_type, records_synced, status, error_message)
                  VALUES (:sync_type, :records_synced, :status, :error_message)";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':sync_type' => $syncType,
            ':records_synced' => $recordsSynced,
            ':status' => $status,
            ':error_message' => $errorMessage
        ]);
    }

    /**
     * Handle API requests
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        try {
            switch ($action) {
                case 'get_logs':
                    $filters = [
                        'user_id' => $_GET['user_id'] ?? null,
                        'activity_type' => $_GET['activity_type'] ?? null,
                        'from_date' => $_GET['from_date'] ?? null,
                        'to_date' => $_GET['to_date'] ?? null
                    ];
                    $logs = $this->getLogs($filters);
                    echo json_encode(['success' => true, 'data' => $logs]);
                    break;

                case 'get_keywords':
                    $keywords = $this->getHighlightKeywords();
                    echo json_encode(['success' => true, 'data' => $keywords]);
                    break;

                case 'sync_moodle':
                    $quizId = $_GET['quiz_id'] ?? 0;
                    $userId = $_GET['user_id'] ?? 0;
                    $result = $this->syncFromMoodle($quizId, $userId);
                    echo json_encode($result);
                    break;

                case 'add_log':
                    if ($method === 'POST') {
                        $data = json_decode(file_get_contents('php://input'), true);
                        $success = $this->addLog($data);
                        echo json_encode(['success' => $success]);
                    }
                    break;

                default:
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Invalid action']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}

// Handle request if called directly
if (basename($_SERVER['PHP_SELF']) === 'log_api.php') {
    $api = new LogAPI();
    $api->handleRequest();
}
