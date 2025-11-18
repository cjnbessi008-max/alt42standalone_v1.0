<?php
/**
 * Heavy Term API Endpoints
 * RESTful API for Heavy Term application
 * Compatible with PHP 7.1.9
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../lib/db.php');

class HeavyTermAPI {

    private $db;
    private $method;
    private $endpoint;
    private $params;

    public function __construct() {
        $this->db = HeavyTermDB::get_instance();
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->parse_request();
    }

    /**
     * Parse incoming request
     */
    private function parse_request() {
        $request_uri = $_SERVER['REQUEST_URI'];
        $script_name = dirname($_SERVER['SCRIPT_NAME']);
        $uri = str_replace($script_name, '', $request_uri);
        $uri = trim($uri, '/');
        $uri = explode('?', $uri)[0];

        $parts = explode('/', $uri);
        $this->endpoint = $parts[0] ?? '';
        $this->params = array_slice($parts, 1);

        // Parse query string
        parse_str($_SERVER['QUERY_STRING'] ?? '', $query_params);
        $this->params = array_merge($this->params, $query_params);
    }

    /**
     * Get request body
     * @return array Parsed JSON body
     */
    private function get_request_body() {
        $body = file_get_contents('php://input');
        return json_decode($body, true) ?? array();
    }

    /**
     * Send JSON response
     * @param mixed $data Response data
     * @param int $status HTTP status code
     */
    private function response($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }

    /**
     * Send error response
     * @param string $message Error message
     * @param int $status HTTP status code
     */
    private function error($message, $status = 400) {
        $this->response(array('error' => $message), $status);
    }

    /**
     * Main router
     */
    public function route() {
        try {
            switch ($this->endpoint) {
                case 'problems':
                    return $this->handle_problems();

                case 'sessions':
                    return $this->handle_sessions();

                case 'interactions':
                    return $this->handle_interactions();

                case 'settings':
                    return $this->handle_settings();

                case 'sync':
                    return $this->handle_sync();

                default:
                    $this->error('Endpoint not found', 404);
            }
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage());
            $this->error('Internal server error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Handle /problems endpoint
     */
    private function handle_problems() {
        switch ($this->method) {
            case 'GET':
                if (!empty($this->params[0])) {
                    // GET /problems/{id}
                    return $this->get_problem($this->params[0]);
                } else {
                    // GET /problems
                    return $this->get_problems();
                }

            case 'POST':
                // POST /problems
                return $this->create_problem();

            default:
                $this->error('Method not allowed', 405);
        }
    }

    /**
     * Get single problem with terms
     * GET /problems/{id}
     */
    private function get_problem($problem_id) {
        $stmt = $this->db->prepare(
            "SELECT * FROM heavy_term_problems WHERE id = ?"
        );
        $stmt->execute(array($problem_id));
        $problem = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$problem) {
            $this->error('Problem not found', 404);
        }

        // Get terms
        $stmt = $this->db->prepare(
            "SELECT * FROM heavy_term_terms WHERE problem_id = ? ORDER BY term_size DESC"
        );
        $stmt->execute(array($problem_id));
        $problem['terms'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->response($problem);
    }

    /**
     * Get all problems
     * GET /problems
     */
    private function get_problems() {
        $course_id = $this->params['course_id'] ?? null;
        $quiz_id = $this->params['quiz_id'] ?? null;

        $sql = "SELECT * FROM heavy_term_problems WHERE 1=1";
        $params = array();

        if ($course_id) {
            $sql .= " AND moodle_course_id = ?";
            $params[] = $course_id;
        }

        if ($quiz_id) {
            $sql .= " AND moodle_quiz_id = ?";
            $params[] = $quiz_id;
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $problems = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->response(array('problems' => $problems));
    }

    /**
     * Create new problem
     * POST /problems
     */
    private function create_problem() {
        $body = $this->get_request_body();

        $required = array('moodle_question_id', 'moodle_course_id', 'question_text', 'question_type');
        foreach ($required as $field) {
            if (empty($body[$field])) {
                $this->error("Missing required field: {$field}");
            }
        }

        $stmt = $this->db->prepare(
            "INSERT INTO heavy_term_problems
             (moodle_question_id, moodle_course_id, moodle_quiz_id, question_text, question_type, difficulty_level)
             VALUES (?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute(array(
            $body['moodle_question_id'],
            $body['moodle_course_id'],
            $body['moodle_quiz_id'] ?? null,
            $body['question_text'],
            $body['question_type'],
            $body['difficulty_level'] ?? 'medium'
        ));

        $problem_id = $this->db->lastInsertId();

        $this->response(array(
            'success' => true,
            'problem_id' => $problem_id
        ), 201);
    }

    /**
     * Handle /sessions endpoint
     */
    private function handle_sessions() {
        switch ($this->method) {
            case 'GET':
                if (!empty($this->params[0])) {
                    return $this->get_session($this->params[0]);
                }
                $this->error('Session ID required', 400);

            case 'POST':
                return $this->create_session();

            case 'PUT':
                if (!empty($this->params[0])) {
                    return $this->update_session($this->params[0]);
                }
                $this->error('Session ID required', 400);

            default:
                $this->error('Method not allowed', 405);
        }
    }

    /**
     * Get session details
     * GET /sessions/{id}
     */
    private function get_session($session_id) {
        $stmt = $this->db->prepare(
            "SELECT s.*, p.question_text
             FROM heavy_term_user_sessions s
             JOIN heavy_term_problems p ON s.problem_id = p.id
             WHERE s.id = ?"
        );
        $stmt->execute(array($session_id));
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            $this->error('Session not found', 404);
        }

        // Get interactions count
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) as count FROM heavy_term_interactions WHERE session_id = ?"
        );
        $stmt->execute(array($session_id));
        $session['interaction_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        $this->response($session);
    }

    /**
     * Create new session
     * POST /sessions
     */
    private function create_session() {
        $body = $this->get_request_body();

        $required = array('moodle_user_id', 'problem_id');
        foreach ($required as $field) {
            if (!isset($body[$field])) {
                $this->error("Missing required field: {$field}");
            }
        }

        $stmt = $this->db->prepare(
            "INSERT INTO heavy_term_user_sessions
             (moodle_user_id, problem_id, device_type)
             VALUES (?, ?, ?)"
        );

        $stmt->execute(array(
            $body['moodle_user_id'],
            $body['problem_id'],
            $body['device_type'] ?? 'smartphone'
        ));

        $session_id = $this->db->lastInsertId();

        $this->response(array(
            'success' => true,
            'session_id' => $session_id
        ), 201);
    }

    /**
     * Update session (close session)
     * PUT /sessions/{id}
     */
    private function update_session($session_id) {
        $body = $this->get_request_body();

        $stmt = $this->db->prepare(
            "UPDATE heavy_term_user_sessions
             SET session_end = NOW(), is_active = 0
             WHERE id = ?"
        );

        $stmt->execute(array($session_id));

        $this->response(array('success' => true));
    }

    /**
     * Handle /interactions endpoint
     */
    private function handle_interactions() {
        if ($this->method === 'POST') {
            return $this->log_interaction();
        }

        $this->error('Method not allowed', 405);
    }

    /**
     * Log interaction
     * POST /interactions
     */
    private function log_interaction() {
        $body = $this->get_request_body();

        $required = array('session_id', 'term_id', 'interaction_type');
        foreach ($required as $field) {
            if (!isset($body[$field])) {
                $this->error("Missing required field: {$field}");
            }
        }

        $stmt = $this->db->prepare(
            "INSERT INTO heavy_term_interactions
             (session_id, term_id, interaction_type, position_x, position_y, interaction_data)
             VALUES (?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute(array(
            $body['session_id'],
            $body['term_id'],
            $body['interaction_type'],
            $body['position_x'] ?? null,
            $body['position_y'] ?? null,
            json_encode($body['data'] ?? array())
        ));

        $this->response(array(
            'success' => true,
            'interaction_id' => $this->db->lastInsertId()
        ), 201);
    }

    /**
     * Handle /settings endpoint
     */
    private function handle_settings() {
        if ($this->method === 'GET') {
            $stmt = $this->db->query(
                "SELECT setting_key, setting_value, setting_type FROM heavy_term_settings"
            );
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $result = array();
            foreach ($settings as $setting) {
                $value = $setting['setting_value'];

                // Type cast based on setting_type
                switch ($setting['setting_type']) {
                    case 'number':
                        $value = floatval($value);
                        break;
                    case 'boolean':
                        $value = $value === 'true';
                        break;
                    case 'json':
                        $value = json_decode($value, true);
                        break;
                }

                $result[$setting['setting_key']] = $value;
            }

            $this->response($result);
        }

        $this->error('Method not allowed', 405);
    }

    /**
     * Handle /sync endpoint (sync Moodle questions)
     */
    private function handle_sync() {
        if ($this->method !== 'POST') {
            $this->error('Method not allowed', 405);
        }

        $body = $this->get_request_body();

        if (empty($body['question_id'])) {
            $this->error('Missing required field: question_id');
        }

        // Note: This requires Moodle connector to be properly configured
        // For now, just acknowledge the sync request
        $this->response(array(
            'success' => true,
            'message' => 'Sync endpoint ready. Requires Moodle connector configuration.'
        ));
    }
}

// Run API
$api = new HeavyTermAPI();
$api->route();
