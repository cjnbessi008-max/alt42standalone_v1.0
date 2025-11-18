<?php
/**
 * Learning Sessions API
 * Endpoints for managing student learning sessions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class SessionsAPI {
    private $db;
    private $conn;

    public function __construct() {
        $database = new Database();
        $database->loadConfig();
        $this->conn = $database->getConnection();
    }

    /**
     * Handle API requests
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $_SERVER['PATH_INFO'] ?? '/';

        try {
            switch($method) {
                case 'POST':
                    if ($path === '/' || $path === '') {
                        $this->createSession();
                    } elseif (preg_match('/^\/(\d+)\/end$/', $path, $matches)) {
                        $this->endSession($matches[1]);
                    } else {
                        $this->sendError(404, 'Endpoint not found');
                    }
                    break;

                case 'GET':
                    if (preg_match('/^\/(\d+)$/', $path, $matches)) {
                        $this->getSession($matches[1]);
                    } elseif (preg_match('/^\/student\/(\d+)$/', $path, $matches)) {
                        $this->getStudentSessions($matches[1]);
                    } else {
                        $this->sendError(404, 'Endpoint not found');
                    }
                    break;

                case 'PUT':
                    if (preg_match('/^\/(\d+)$/', $path, $matches)) {
                        $this->updateSession($matches[1]);
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
     * Create new learning session
     * POST /api/sessions
     */
    private function createSession() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['student_id']) || !isset($data['module_name'])) {
            $this->sendError(400, 'Missing required fields: student_id, module_name');
            return;
        }

        $query = "
            INSERT INTO learning_sessions (
                student_id, module_name, session_start, status
            ) VALUES (
                :student_id, :module_name, NOW(), 'active'
            )
        ";

        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'student_id' => $data['student_id'],
            'module_name' => $data['module_name']
        ]);

        if ($result) {
            $sessionId = $this->conn->lastInsertId();
            $this->sendSuccess([
                'session_id' => $sessionId,
                'student_id' => $data['student_id'],
                'module_name' => $data['module_name'],
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s')
            ], 201);
        } else {
            $this->sendError(500, 'Failed to create session');
        }
    }

    /**
     * Get session details
     * GET /api/sessions/{id}
     */
    private function getSession($sessionId) {
        $query = "
            SELECT
                ls.*,
                s.username,
                s.full_name,
                COUNT(DISTINCT pa.id) as total_attempts,
                SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) as correct_attempts
            FROM learning_sessions ls
            JOIN students s ON ls.student_id = s.id
            LEFT JOIN problem_attempts pa ON ls.id = pa.session_id
            WHERE ls.id = :id
            GROUP BY ls.id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $sessionId]);
        $session = $stmt->fetch();

        if ($session) {
            // Calculate accuracy
            if ($session['total_attempts'] > 0) {
                $session['accuracy_rate'] = round(
                    ($session['correct_attempts'] / $session['total_attempts']) * 100,
                    2
                );
            } else {
                $session['accuracy_rate'] = 0;
            }

            $this->sendSuccess($session);
        } else {
            $this->sendError(404, 'Session not found');
        }
    }

    /**
     * Get all sessions for a student
     * GET /api/sessions/student/{student_id}
     */
    private function getStudentSessions($studentId) {
        $query = "
            SELECT
                ls.*,
                COUNT(DISTINCT pa.id) as total_attempts,
                SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) as correct_attempts
            FROM learning_sessions ls
            LEFT JOIN problem_attempts pa ON ls.id = pa.session_id
            WHERE ls.student_id = :student_id
            GROUP BY ls.id
            ORDER BY ls.session_start DESC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['student_id' => $studentId]);
        $sessions = $stmt->fetchAll();

        foreach ($sessions as &$session) {
            if ($session['total_attempts'] > 0) {
                $session['accuracy_rate'] = round(
                    ($session['correct_attempts'] / $session['total_attempts']) * 100,
                    2
                );
            } else {
                $session['accuracy_rate'] = 0;
            }
        }

        $this->sendSuccess(['sessions' => $sessions]);
    }

    /**
     * Update session
     * PUT /api/sessions/{id}
     */
    private function updateSession($sessionId) {
        $data = json_decode(file_get_contents('php://input'), true);

        $updates = [];
        $params = ['id' => $sessionId];

        if (isset($data['dmn_drift_score'])) {
            $updates[] = 'dmn_drift_score = :dmn_drift_score';
            $params['dmn_drift_score'] = $data['dmn_drift_score'];
        }

        if (isset($data['activity_count'])) {
            $updates[] = 'activity_count = activity_count + :activity_count';
            $params['activity_count'] = $data['activity_count'];
        }

        if (empty($updates)) {
            $this->sendError(400, 'No fields to update');
            return;
        }

        $query = "UPDATE learning_sessions SET " . implode(', ', $updates) . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        if ($stmt->execute($params)) {
            $this->sendSuccess(['message' => 'Session updated successfully']);
        } else {
            $this->sendError(500, 'Failed to update session');
        }
    }

    /**
     * End a session
     * POST /api/sessions/{id}/end
     */
    private function endSession($sessionId) {
        $query = "
            UPDATE learning_sessions
            SET
                session_end = NOW(),
                total_duration_seconds = TIMESTAMPDIFF(SECOND, session_start, NOW()),
                status = 'completed'
            WHERE id = :id AND status = 'active'
        ";

        $stmt = $this->conn->prepare($query);
        if ($stmt->execute(['id' => $sessionId])) {
            if ($stmt->rowCount() > 0) {
                $this->sendSuccess(['message' => 'Session ended successfully']);
            } else {
                $this->sendError(404, 'Active session not found');
            }
        } else {
            $this->sendError(500, 'Failed to end session');
        }
    }

    /**
     * Send success response
     */
    private function sendSuccess($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Send error response
     */
    private function sendError($code, $message) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
    }
}

// Handle request
$api = new SessionsAPI();
$api->handleRequest();
