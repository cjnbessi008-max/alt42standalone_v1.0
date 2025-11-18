<?php
/**
 * Area Recombination App - API Controller
 * RESTful API endpoints for shape manipulation
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/ShapeManager.php';
require_once __DIR__ . '/SessionManager.php';

class API {
    private $db;
    private $shapeManager;
    private $sessionManager;
    private $method;
    private $endpoint;
    private $requestData;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->shapeManager = new ShapeManager($this->db);
        $this->sessionManager = new SessionManager($this->db);

        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->parseRequest();
    }

    /**
     * Parse incoming request
     */
    private function parseRequest() {
        // Get endpoint from URL
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = explode('/', trim($uri, '/'));

        // Remove 'api' from path if present
        if ($uri[0] === 'api' || $uri[0] === 'php') {
            array_shift($uri);
            if ($uri[0] === 'api.php') {
                array_shift($uri);
            }
        }

        $this->endpoint = isset($uri[0]) ? $uri[0] : '';

        // Parse request body
        $this->requestData = json_decode(file_get_contents('php://input'), true);

        // Merge GET and POST data
        if (empty($this->requestData)) {
            $this->requestData = array_merge($_GET, $_POST);
        }
    }

    /**
     * Route request to appropriate handler
     */
    public function handleRequest() {
        try {
            switch ($this->endpoint) {
                case 'shapes':
                    return $this->handleShapes();

                case 'session':
                    return $this->handleSession();

                case 'manipulation':
                    return $this->handleManipulation();

                case 'progress':
                    return $this->handleProgress();

                case 'validate':
                    return $this->handleValidation();

                case 'statistics':
                    return $this->handleStatistics();

                default:
                    return $this->response(['error' => 'Invalid endpoint'], 404);
            }
        } catch (Exception $e) {
            return $this->response([
                'error' => $e->getMessage(),
                'debug' => APP_DEBUG ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Handle shape-related requests
     */
    private function handleShapes() {
        switch ($this->method) {
            case 'GET':
                if (isset($this->requestData['id'])) {
                    $shape = $this->shapeManager->getShapeById($this->requestData['id']);
                    return $this->response(['shape' => $shape]);
                } elseif (isset($this->requestData['difficulty'])) {
                    $shapes = $this->shapeManager->getShapesByDifficulty($this->requestData['difficulty']);
                    return $this->response(['shapes' => $shapes]);
                } else {
                    $shapes = $this->shapeManager->getAllShapes();
                    return $this->response(['shapes' => $shapes]);
                }

            default:
                return $this->response(['error' => 'Method not allowed'], 405);
        }
    }

    /**
     * Handle session management
     */
    private function handleSession() {
        switch ($this->method) {
            case 'POST':
                // Start new session
                $required = ['user_id', 'course_id', 'shape_id'];
                if (!$this->validateRequired($required)) {
                    return $this->response(['error' => 'Missing required fields'], 400);
                }

                // Verify Moodle user
                $user = $this->db->verifyMoodleUser(
                    $this->requestData['user_id'],
                    $this->requestData['course_id']
                );

                if (!$user) {
                    return $this->response(['error' => 'Invalid user or not enrolled in course'], 403);
                }

                $sessionId = $this->sessionManager->startSession(
                    $this->requestData['user_id'],
                    $this->requestData['course_id'],
                    $this->requestData['shape_id']
                );

                return $this->response([
                    'session_id' => $sessionId,
                    'user' => $user,
                    'message' => 'Session started successfully'
                ]);

            case 'PUT':
                // Update session
                if (!isset($this->requestData['session_id'])) {
                    return $this->response(['error' => 'Session ID required'], 400);
                }

                $this->sessionManager->updateSession(
                    $this->requestData['session_id'],
                    $this->requestData
                );

                return $this->response(['message' => 'Session updated successfully']);

            case 'GET':
                // Get session info
                if (!isset($this->requestData['session_id'])) {
                    return $this->response(['error' => 'Session ID required'], 400);
                }

                $session = $this->sessionManager->getSession($this->requestData['session_id']);
                return $this->response(['session' => $session]);

            default:
                return $this->response(['error' => 'Method not allowed'], 405);
        }
    }

    /**
     * Handle shape manipulation logging
     */
    private function handleManipulation() {
        if ($this->method !== 'POST') {
            return $this->response(['error' => 'Method not allowed'], 405);
        }

        $required = ['session_id', 'action_type', 'action_data'];
        if (!$this->validateRequired($required)) {
            return $this->response(['error' => 'Missing required fields'], 400);
        }

        $manipulationId = $this->sessionManager->logManipulation(
            $this->requestData['session_id'],
            $this->requestData['action_type'],
            $this->requestData['action_data'],
            isset($this->requestData['calculated_area']) ? $this->requestData['calculated_area'] : null
        );

        return $this->response([
            'manipulation_id' => $manipulationId,
            'message' => 'Manipulation logged successfully'
        ]);
    }

    /**
     * Handle progress tracking
     */
    private function handleProgress() {
        if ($this->method !== 'GET') {
            return $this->response(['error' => 'Method not allowed'], 405);
        }

        $required = ['user_id', 'course_id'];
        if (!$this->validateRequired($required)) {
            return $this->response(['error' => 'Missing required fields'], 400);
        }

        $progress = $this->sessionManager->getStudentProgress(
            $this->requestData['user_id'],
            $this->requestData['course_id']
        );

        return $this->response(['progress' => $progress]);
    }

    /**
     * Handle area validation
     */
    private function handleValidation() {
        if ($this->method !== 'POST') {
            return $this->response(['error' => 'Method not allowed'], 405);
        }

        $required = ['session_id', 'pieces'];
        if (!$this->validateRequired($required)) {
            return $this->response(['error' => 'Missing required fields'], 400);
        }

        $result = $this->shapeManager->validateAreaConservation(
            $this->requestData['session_id'],
            $this->requestData['pieces']
        );

        // Complete session if validation succeeds
        if ($result['is_valid']) {
            $this->sessionManager->completeSession(
                $this->requestData['session_id'],
                $result['score'],
                json_encode($this->requestData['pieces'])
            );
        }

        return $this->response($result);
    }

    /**
     * Handle statistics requests
     */
    private function handleStatistics() {
        if ($this->method !== 'GET') {
            return $this->response(['error' => 'Method not allowed'], 405);
        }

        if (isset($this->requestData['shape_id'])) {
            $stats = $this->shapeManager->getShapeStatistics($this->requestData['shape_id']);
            return $this->response(['statistics' => $stats]);
        } elseif (isset($this->requestData['user_id']) && isset($this->requestData['course_id'])) {
            $stats = $this->sessionManager->getUserStatistics(
                $this->requestData['user_id'],
                $this->requestData['course_id']
            );
            return $this->response(['statistics' => $stats]);
        } else {
            return $this->response(['error' => 'Missing required parameters'], 400);
        }
    }

    /**
     * Validate required fields
     */
    private function validateRequired($fields) {
        foreach ($fields as $field) {
            if (!isset($this->requestData[$field])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Send JSON response
     */
    private function response($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}

// Handle API request
$api = new API();
$api->handleRequest();
