<?php
/**
 * Angle Live - Main API Endpoint
 * PHP 7.1.9 Compatible
 *
 * Endpoints:
 * - GET /api.php?action=get_angle&session_id={id}
 * - POST /api.php?action=update_angle
 * - GET /api.php?action=get_thresholds
 * - GET /api.php?action=get_progress&user_id={id}
 * - POST /api.php?action=sync_moodle
 */

require_once 'database.php';

class AngleLiveAPI {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Handle API requests
     */
    public function handleRequest() {
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        $method = $_SERVER['REQUEST_METHOD'];

        try {
            switch ($action) {
                case 'get_angle':
                    if ($method === 'GET') {
                        $this->getAngle();
                    }
                    break;

                case 'update_angle':
                    if ($method === 'POST') {
                        $this->updateAngle();
                    }
                    break;

                case 'get_thresholds':
                    if ($method === 'GET') {
                        $this->getThresholds();
                    }
                    break;

                case 'get_progress':
                    if ($method === 'GET') {
                        $this->getProgress();
                    }
                    break;

                case 'sync_moodle':
                    if ($method === 'POST') {
                        $this->syncMoodle();
                    }
                    break;

                case 'get_status':
                    if ($method === 'GET') {
                        $this->getStatus();
                    }
                    break;

                default:
                    $this->sendResponse(400, ['error' => 'Invalid action']);
            }
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get current angle for session
     */
    private function getAngle() {
        $session_id = isset($_GET['session_id']) ? $this->db->escape($_GET['session_id']) : '';

        if (empty($session_id)) {
            $this->sendResponse(400, ['error' => 'Session ID required']);
            return;
        }

        $query = "SELECT * FROM angle_sessions WHERE session_id = '$session_id' ORDER BY created_at DESC LIMIT 1";
        $result = $this->conn->query($query);

        if ($result && $result->num_rows > 0) {
            $data = $result->fetch_assoc();
            $this->sendResponse(200, ['success' => true, 'data' => $data]);
        } else {
            $this->sendResponse(404, ['error' => 'Session not found']);
        }
    }

    /**
     * Update angle value
     */
    private function updateAngle() {
        $input = json_decode(file_get_contents('php://input'), true);

        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;
        $session_id = isset($input['session_id']) ? $this->db->escape($input['session_id']) : '';
        $angle_value = isset($input['angle_value']) ? floatval($input['angle_value']) : 0;

        if ($user_id <= 0 || empty($session_id)) {
            $this->sendResponse(400, ['error' => 'Invalid input']);
            return;
        }

        // Get angle status
        $status = $this->getAngleStatus($angle_value);

        // Insert new record
        $query = "INSERT INTO angle_sessions (user_id, session_id, angle_value, angle_status, status_description)
                  VALUES ($user_id, '$session_id', $angle_value, '{$status['name']}', '{$status['description']}')";

        if ($this->conn->query($query)) {
            // Update user progress
            $this->updateUserProgress($user_id, $angle_value);

            $this->sendResponse(200, [
                'success' => true,
                'angle' => $angle_value,
                'status' => $status
            ]);
        } else {
            $this->sendResponse(500, ['error' => 'Failed to update angle']);
        }
    }

    /**
     * Get angle status based on thresholds
     */
    private function getAngleStatus($angle) {
        $angle = floatval($angle);

        $query = "SELECT * FROM angle_thresholds
                  WHERE $angle >= angle_min AND $angle <= angle_max
                  AND is_active = 1
                  LIMIT 1";

        $result = $this->conn->query($query);

        if ($result && $result->num_rows > 0) {
            $data = $result->fetch_assoc();
            return [
                'name' => $data['status_name'],
                'description' => $data['status_description'],
                'visual' => $data['visual_feedback'],
                'audio' => $data['audio_feedback']
            ];
        }

        return [
            'name' => 'Unknown',
            'description' => 'Angle value not in defined range',
            'visual' => 'color-default',
            'audio' => null
        ];
    }

    /**
     * Get all angle thresholds
     */
    private function getThresholds() {
        $query = "SELECT * FROM angle_thresholds WHERE is_active = 1 ORDER BY angle_min ASC";
        $result = $this->conn->query($query);

        $thresholds = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $thresholds[] = $row;
            }
        }

        $this->sendResponse(200, ['success' => true, 'data' => $thresholds]);
    }

    /**
     * Get user progress
     */
    private function getProgress() {
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

        if ($user_id <= 0) {
            $this->sendResponse(400, ['error' => 'Invalid user ID']);
            return;
        }

        $query = "SELECT * FROM user_progress WHERE user_id = $user_id";
        $result = $this->conn->query($query);

        if ($result && $result->num_rows > 0) {
            $data = $result->fetch_assoc();
            $this->sendResponse(200, ['success' => true, 'data' => $data]);
        } else {
            // Create new progress record
            $insert = "INSERT INTO user_progress (user_id) VALUES ($user_id)";
            $this->conn->query($insert);

            $this->sendResponse(200, [
                'success' => true,
                'data' => [
                    'user_id' => $user_id,
                    'total_sessions' => 0,
                    'angles_discovered' => 0,
                    'completion_percentage' => 0,
                    'last_angle' => 0
                ]
            ]);
        }
    }

    /**
     * Update user progress
     */
    private function updateUserProgress($user_id, $angle) {
        // Get or create progress record
        $query = "SELECT * FROM user_progress WHERE user_id = $user_id";
        $result = $this->conn->query($query);

        if ($result && $result->num_rows > 0) {
            // Update existing
            $update = "UPDATE user_progress
                      SET total_sessions = total_sessions + 1,
                          last_angle = $angle,
                          updated_at = NOW()
                      WHERE user_id = $user_id";
            $this->conn->query($update);
        } else {
            // Create new
            $insert = "INSERT INTO user_progress (user_id, total_sessions, last_angle)
                      VALUES ($user_id, 1, $angle)";
            $this->conn->query($insert);
        }
    }

    /**
     * Sync with Moodle
     */
    private function syncMoodle() {
        $input = json_decode(file_get_contents('php://input'), true);

        $moodle_user_id = isset($input['moodle_user_id']) ? intval($input['moodle_user_id']) : 0;
        $moodle_course_id = isset($input['moodle_course_id']) ? intval($input['moodle_course_id']) : 0;
        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;

        if ($moodle_user_id <= 0 || $user_id <= 0) {
            $this->sendResponse(400, ['error' => 'Invalid input']);
            return;
        }

        // Get user progress
        $progress_query = "SELECT * FROM user_progress WHERE user_id = $user_id";
        $progress_result = $this->conn->query($progress_query);

        if ($progress_result && $progress_result->num_rows > 0) {
            $progress = $progress_result->fetch_assoc();
            $grade = $progress['completion_percentage'];

            // Update or insert Moodle integration record
            $sync_query = "INSERT INTO moodle_integration
                          (moodle_course_id, moodle_user_id, angle_live_user_id, grade, last_synced_at)
                          VALUES ($moodle_course_id, $moodle_user_id, $user_id, $grade, NOW())
                          ON DUPLICATE KEY UPDATE
                          grade = $grade, last_synced_at = NOW()";

            if ($this->conn->query($sync_query)) {
                $this->sendResponse(200, ['success' => true, 'grade' => $grade]);
            } else {
                $this->sendResponse(500, ['error' => 'Failed to sync with Moodle']);
            }
        } else {
            $this->sendResponse(404, ['error' => 'User progress not found']);
        }
    }

    /**
     * Get API status
     */
    private function getStatus() {
        $this->sendResponse(200, [
            'success' => true,
            'app' => APP_NAME,
            'version' => APP_VERSION,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Send JSON response
     */
    private function sendResponse($code, $data) {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }

    /**
     * Destructor - close connections
     */
    public function __destruct() {
        if ($this->db) {
            $this->db->closeConnections();
        }
    }
}

// Initialize and handle request
$api = new AngleLiveAPI();
$api->handleRequest();
