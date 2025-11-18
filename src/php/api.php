<?php
/**
 * Explosion Count REST API
 * Handles all AJAX requests from frontend
 */

header('Content-Type: application/json; charset=utf-8');

if (ALLOW_CORS) {
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/moodle_integration.php';

class ExplosionCountAPI {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        try {
            switch ($action) {
                case 'get_problems':
                    $this->getProblems();
                    break;

                case 'get_problem':
                    $this->getProblem();
                    break;

                case 'get_steps':
                    $this->getSteps();
                    break;

                case 'create_session':
                    $this->createSession();
                    break;

                case 'update_session':
                    $this->updateSession();
                    break;

                case 'get_session':
                    $this->getSession();
                    break;

                case 'get_animation_config':
                    $this->getAnimationConfig();
                    break;

                default:
                    $this->sendError('Invalid action', 400);
            }
        } catch (Exception $e) {
            $this->sendError($e->getMessage(), 500);
        }
    }

    private function getProblems() {
        $sql = "SELECT p.*, a.animation_type, a.color_scheme, a.speed, a.intensity
                FROM explosion_problems p
                LEFT JOIN explosion_animations a ON p.id = a.problem_id
                ORDER BY p.id ASC";

        $problems = $this->db->fetchAll($sql);
        $this->sendSuccess(['problems' => $problems]);
    }

    private function getProblem() {
        $id = $_GET['id'] ?? 0;

        if (!$id) {
            $this->sendError('Problem ID required', 400);
            return;
        }

        $sql = "SELECT p.*, a.animation_type, a.color_scheme, a.speed, a.intensity
                FROM explosion_problems p
                LEFT JOIN explosion_animations a ON p.id = a.problem_id
                WHERE p.id = :id";

        $problem = $this->db->fetchOne($sql, ['id' => $id]);

        if (!$problem) {
            $this->sendError('Problem not found', 404);
            return;
        }

        $this->sendSuccess(['problem' => $problem]);
    }

    private function getSteps() {
        $problemId = $_GET['problem_id'] ?? 0;

        if (!$problemId) {
            $this->sendError('Problem ID required', 400);
            return;
        }

        $sql = "SELECT * FROM explosion_steps
                WHERE problem_id = :problem_id
                ORDER BY step_number ASC";

        $steps = $this->db->fetchAll($sql, ['problem_id' => $problemId]);
        $this->sendSuccess(['steps' => $steps]);
    }

    private function createSession() {
        $input = json_decode(file_get_contents('php://input'), true);

        $userId = $input['user_id'] ?? null;
        $problemId = $input['problem_id'] ?? 0;

        if (!$problemId) {
            $this->sendError('Problem ID required', 400);
            return;
        }

        $data = [
            'moodle_user_id' => $userId,
            'problem_id' => $problemId,
            'current_step' => 0,
            'current_count' => 1,
            'max_count_reached' => 1
        ];

        $sessionId = $this->db->insert('explosion_sessions', $data);

        $this->sendSuccess([
            'session_id' => $sessionId,
            'message' => 'Session created successfully'
        ]);
    }

    private function updateSession() {
        $input = json_decode(file_get_contents('php://input'), true);

        $sessionId = $input['session_id'] ?? 0;
        $currentStep = $input['current_step'] ?? null;
        $currentCount = $input['current_count'] ?? null;
        $maxCountReached = $input['max_count_reached'] ?? null;
        $completed = $input['completed'] ?? false;

        if (!$sessionId) {
            $this->sendError('Session ID required', 400);
            return;
        }

        $data = [];
        if ($currentStep !== null) $data['current_step'] = $currentStep;
        if ($currentCount !== null) $data['current_count'] = $currentCount;
        if ($maxCountReached !== null) $data['max_count_reached'] = $maxCountReached;
        if ($completed) $data['completed_at'] = date('Y-m-d H:i:s');

        if (empty($data)) {
            $this->sendError('No data to update', 400);
            return;
        }

        $this->db->update('explosion_sessions', $data, 'id = :id', ['id' => $sessionId]);

        $this->sendSuccess(['message' => 'Session updated successfully']);
    }

    private function getSession() {
        $sessionId = $_GET['session_id'] ?? 0;

        if (!$sessionId) {
            $this->sendError('Session ID required', 400);
            return;
        }

        $sql = "SELECT * FROM explosion_sessions WHERE id = :id";
        $session = $this->db->fetchOne($sql, ['id' => $sessionId]);

        if (!$session) {
            $this->sendError('Session not found', 404);
            return;
        }

        $this->sendSuccess(['session' => $session]);
    }

    private function getAnimationConfig() {
        $problemId = $_GET['problem_id'] ?? 0;

        if (!$problemId) {
            $this->sendError('Problem ID required', 400);
            return;
        }

        $sql = "SELECT * FROM explosion_animations WHERE problem_id = :problem_id";
        $config = $this->db->fetchOne($sql, ['problem_id' => $problemId]);

        if (!$config) {
            // Return default config
            $config = [
                'animation_type' => 'fire',
                'color_scheme' => 'red-orange',
                'speed' => 1.0,
                'intensity' => 1.0
            ];
        }

        $this->sendSuccess(['animation' => $config]);
    }

    private function sendSuccess($data, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit();
    }

    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit();
    }
}

// Execute API
$api = new ExplosionCountAPI();
$api->handleRequest();

?>
