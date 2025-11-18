<?php
/**
 * Probability Grid - LTI Integration Handler
 * Handles LTI launch requests from Moodle 3.7
 * Compatible with PHP 7.1.9
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lti_validator.php';

class LTIHandler {
    private $db;
    private $config;

    public function __construct($config) {
        $this->config = $config;
        $this->initDatabase();
    }

    private function initDatabase() {
        try {
            $dsn = "mysql:host={$this->config['database']->host};" .
                   "port={$this->config['database']->port};" .
                   "dbname={$this->config['database']->dbname};" .
                   "charset=utf8mb4";

            $this->db = new PDO(
                $dsn,
                $this->config['database']->username,
                $this->config['database']->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            $this->handleError('Database connection failed: ' . $e->getMessage());
        }
    }

    public function handleLaunch() {
        // Set CORS headers
        $this->setCORSHeaders();

        // Handle preflight request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        // Validate LTI request
        $validator = new LTIValidator($this->config['lti']);
        if (!$validator->validate($_POST)) {
            $this->handleError('Invalid LTI signature', 401);
        }

        // Extract LTI parameters
        $params = $this->extractLTIParams($_POST);

        // Create or update session
        $sessionId = $this->createSession($params);

        // Get problem data
        $problemId = $this->getProblemId($params);
        $problemData = $this->getProblemData($problemId);

        // Return launch response
        $this->sendLaunchResponse($sessionId, $problemData);
    }

    private function extractLTIParams($post) {
        return [
            'user_id' => $post['user_id'] ?? null,
            'course_id' => $post['context_id'] ?? null,
            'resource_link_id' => $post['resource_link_id'] ?? null,
            'consumer_key' => $post['oauth_consumer_key'] ?? null,
            'custom_question_id' => $post['custom_question_id'] ?? null,
            'lis_person_name_full' => $post['lis_person_name_full'] ?? 'Student',
            'roles' => $post['roles'] ?? ''
        ];
    }

    private function createSession($params) {
        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + $this->config['app']->session_lifetime);

        $stmt = $this->db->prepare("
            INSERT INTO lti_sessions
            (session_id, moodle_user_id, moodle_course_id, consumer_key,
             resource_link_id, context_id, session_data, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $sessionId,
            $params['user_id'],
            $params['course_id'],
            $params['consumer_key'],
            $params['resource_link_id'],
            $params['course_id'],
            json_encode($params),
            $expiresAt
        ]);

        return $sessionId;
    }

    private function getProblemId($params) {
        // Get problem ID from custom parameter or resource link
        if (!empty($params['custom_question_id'])) {
            $stmt = $this->db->prepare("
                SELECT id FROM problems
                WHERE moodle_question_id = ?
                LIMIT 1
            ");
            $stmt->execute([$params['custom_question_id']]);
            $result = $stmt->fetch();

            if ($result) {
                return $result['id'];
            }
        }

        // Return default problem for testing
        return 1;
    }

    private function getProblemData($problemId) {
        $stmt = $this->db->prepare("
            SELECT p.*, g.cell_colors, g.event_regions, g.probability_labels
            FROM problems p
            LEFT JOIN grid_configurations g ON p.id = g.problem_id
            WHERE p.id = ?
        ");
        $stmt->execute([$problemId]);
        $data = $stmt->fetch();

        if (!$data) {
            $this->handleError('Problem not found', 404);
        }

        // Parse JSON fields
        $data['probability_data'] = json_decode($data['probability_data'], true);
        $data['color_scheme'] = json_decode($data['color_scheme'], true);

        if (!empty($data['cell_colors'])) {
            $data['cell_colors'] = json_decode($data['cell_colors'], true);
        }
        if (!empty($data['event_regions'])) {
            $data['event_regions'] = json_decode($data['event_regions'], true);
        }
        if (!empty($data['probability_labels'])) {
            $data['probability_labels'] = json_decode($data['probability_labels'], true);
        }

        return $data;
    }

    private function sendLaunchResponse($sessionId, $problemData) {
        // Redirect to app with session
        $appUrl = $this->config['app']->base_url . '/public/index.html';
        $redirectUrl = $appUrl . '?session=' . urlencode($sessionId) .
                       '&problem=' . urlencode($problemData['id']);

        header('Location: ' . $redirectUrl);
        exit;
    }

    private function setCORSHeaders() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $this->config['cors']->allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }

        header('Access-Control-Allow-Methods: ' .
               implode(', ', $this->config['cors']->allowed_methods));
        header('Access-Control-Allow-Headers: ' .
               implode(', ', $this->config['cors']->allowed_headers));
        header('Access-Control-Allow-Credentials: true');
    }

    private function handleError($message, $code = 500) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => true,
            'message' => $message
        ]);
        exit;
    }
}

// Handle LTI launch request
$config = require __DIR__ . '/config.php';
$handler = new LTIHandler($config);
$handler->handleLaunch();
