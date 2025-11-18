<?php
/**
 * API Controller
 * Handles all API endpoints for the Answer Reason Tracking System
 */

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../models/MoodleIntegration.php';

class ApiController {
    private $db;
    private $moodle;
    private $config;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->moodle = new MoodleIntegration();
        $this->config = require __DIR__ . '/../../config/config.php';

        // Enable CORS for development
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    /**
     * Route API requests
     */
    public function handleRequest($route) {
        $method = $_SERVER['REQUEST_METHOD'];
        $parts = explode('/', trim($route, '/'));

        try {
            // API routes
            if (empty($parts[0])) {
                return $this->jsonResponse(['message' => 'Answer Reason Tracking API v1.0']);
            }

            switch ($parts[0]) {
                case 'attempts':
                    return $this->handleAttempts($method, $parts);

                case 'reasons':
                    return $this->handleReasons($method, $parts);

                case 'students':
                    return $this->handleStudents($method, $parts);

                case 'analytics':
                    return $this->handleAnalytics($method, $parts);

                case 'moodle':
                    return $this->handleMoodle($method, $parts);

                default:
                    return $this->jsonResponse(['error' => 'Invalid endpoint'], 404);
            }
        } catch (Exception $e) {
            return $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle quiz attempts endpoints
     */
    private function handleAttempts($method, $parts) {
        switch ($method) {
            case 'GET':
                if (isset($parts[1])) {
                    // GET /api/attempts/{id}
                    return $this->getAttempt($parts[1]);
                } else {
                    // GET /api/attempts?student_id=X&incorrect_only=1
                    return $this->getAttempts();
                }

            case 'POST':
                // POST /api/attempts - Create manual attempt
                return $this->createAttempt();

            default:
                return $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }

    /**
     * Handle answer reasons endpoints
     */
    private function handleReasons($method, $parts) {
        switch ($method) {
            case 'GET':
                if (isset($parts[1])) {
                    // GET /api/reasons/{id}
                    return $this->getReason($parts[1]);
                } else {
                    // GET /api/reasons?attempt_id=X&student_id=Y
                    return $this->getReasons();
                }

            case 'POST':
                // POST /api/reasons - Submit answer reason
                return $this->submitReason();

            case 'PUT':
                if (isset($parts[1])) {
                    // PUT /api/reasons/{id} - Update reason
                    return $this->updateReason($parts[1]);
                }
                return $this->jsonResponse(['error' => 'Reason ID required'], 400);

            default:
                return $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }

    /**
     * Handle students endpoints
     */
    private function handleStudents($method, $parts) {
        if ($method === 'GET') {
            if (isset($parts[1])) {
                // GET /api/students/{id}
                return $this->getStudent($parts[1]);
            } else {
                // GET /api/students
                return $this->getStudents();
            }
        }

        return $this->jsonResponse(['error' => 'Method not allowed'], 405);
    }

    /**
     * Handle analytics endpoints
     */
    private function handleAnalytics($method, $parts) {
        if ($method === 'GET') {
            if (isset($parts[1])) {
                switch ($parts[1]) {
                    case 'summary':
                        return $this->getAnalyticsSummary();
                    case 'categories':
                        return $this->getCategoryAnalytics();
                    case 'student':
                        return $this->getStudentAnalytics($_GET['student_id'] ?? null);
                }
            }
        }

        return $this->jsonResponse(['error' => 'Invalid analytics endpoint'], 400);
    }

    /**
     * Handle Moodle integration endpoints
     */
    private function handleMoodle($method, $parts) {
        if ($method === 'POST') {
            if (isset($parts[1])) {
                switch ($parts[1]) {
                    case 'sync-attempt':
                        // POST /api/moodle/sync-attempt
                        $data = $this->getJsonInput();
                        return $this->syncMoodleAttempt($data['attempt_id'] ?? null);

                    case 'test-connection':
                        // POST /api/moodle/test-connection
                        return $this->testMoodleConnection();
                }
            }
        }

        return $this->jsonResponse(['error' => 'Invalid Moodle endpoint'], 400);
    }

    // ========== Implementation Methods ==========

    /**
     * Get quiz attempts
     */
    private function getAttempts() {
        $studentId = $_GET['student_id'] ?? null;
        $incorrectOnly = isset($_GET['incorrect_only']) && $_GET['incorrect_only'] == '1';
        $limit = $_GET['limit'] ?? 50;
        $offset = $_GET['offset'] ?? 0;

        $where = '1=1';
        $params = [];

        if ($studentId) {
            $where .= ' AND student_id = ?';
            $params[] = $studentId;
        }

        if ($incorrectOnly) {
            $where .= ' AND is_correct = 0';
        }

        $sql = "SELECT qa.*, s.username, s.full_name,
                       ar.id as reason_id,
                       ar.reason_text,
                       ar.reason_submitted_at
                FROM quiz_attempts qa
                JOIN students s ON qa.student_id = s.id
                LEFT JOIN answer_reasons ar ON qa.id = ar.attempt_id
                WHERE $where
                ORDER BY qa.attempted_at DESC
                LIMIT ? OFFSET ?";

        $params[] = (int)$limit;
        $params[] = (int)$offset;

        $attempts = $this->db->query($sql, $params)->fetchAll();

        return $this->jsonResponse([
            'success' => true,
            'count' => count($attempts),
            'attempts' => $attempts
        ]);
    }

    /**
     * Get single attempt
     */
    private function getAttempt($id) {
        $sql = "SELECT qa.*, s.username, s.full_name,
                       ar.id as reason_id,
                       ar.reason_text,
                       ar.reason_category,
                       ar.reason_submitted_at
                FROM quiz_attempts qa
                JOIN students s ON qa.student_id = s.id
                LEFT JOIN answer_reasons ar ON qa.id = ar.attempt_id
                WHERE qa.id = ?";

        $attempt = $this->db->query($sql, [$id])->fetch();

        if (!$attempt) {
            return $this->jsonResponse(['error' => 'Attempt not found'], 404);
        }

        return $this->jsonResponse([
            'success' => true,
            'attempt' => $attempt
        ]);
    }

    /**
     * Create manual attempt
     */
    private function createAttempt() {
        $data = $this->getJsonInput();

        $required = ['student_id', 'quiz_name', 'question_text', 'student_answer', 'correct_answer', 'is_correct'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return $this->jsonResponse(['error' => "Missing required field: $field"], 400);
            }
        }

        $attemptId = $this->db->insert('quiz_attempts', [
            'student_id' => $data['student_id'],
            'quiz_name' => $data['quiz_name'],
            'question_id' => $data['question_id'] ?? 0,
            'question_text' => $data['question_text'],
            'student_answer' => $data['student_answer'],
            'correct_answer' => $data['correct_answer'],
            'is_correct' => $data['is_correct'] ? 1 : 0,
            'score' => $data['score'] ?? 0,
            'max_score' => $data['max_score'] ?? 0,
            'explanation_text' => $data['explanation_text'] ?? null
        ]);

        return $this->jsonResponse([
            'success' => true,
            'attempt_id' => $attemptId,
            'message' => 'Attempt created successfully'
        ], 201);
    }

    /**
     * Submit answer reason
     */
    private function submitReason() {
        $data = $this->getJsonInput();

        if (!isset($data['attempt_id']) || !isset($data['reason_text'])) {
            return $this->jsonResponse(['error' => 'Missing required fields'], 400);
        }

        // Validate reason length
        $reasonLength = mb_strlen($data['reason_text'], 'UTF-8');
        $minLength = $this->config['reason']['min_length'];
        $maxLength = $this->config['reason']['max_length'];

        if ($reasonLength < $minLength) {
            return $this->jsonResponse([
                'error' => "Reason too short. Minimum $minLength characters required."
            ], 400);
        }

        if ($reasonLength > $maxLength) {
            return $this->jsonResponse([
                'error' => "Reason too long. Maximum $maxLength characters allowed."
            ], 400);
        }

        // Get attempt details
        $attempt = $this->db->selectOne('quiz_attempts', 'id = ?', [$data['attempt_id']]);

        if (!$attempt) {
            return $this->jsonResponse(['error' => 'Attempt not found'], 404);
        }

        // Check if reason already exists
        $existing = $this->db->selectOne('answer_reasons', 'attempt_id = ?', [$data['attempt_id']]);

        if ($existing) {
            return $this->jsonResponse([
                'error' => 'Reason already submitted for this attempt',
                'reason_id' => $existing['id']
            ], 409);
        }

        // Calculate word count
        $wordCount = str_word_count($data['reason_text']);

        // Insert reason
        $reasonId = $this->db->insert('answer_reasons', [
            'attempt_id' => $data['attempt_id'],
            'student_id' => $attempt['student_id'],
            'reason_text' => $data['reason_text'],
            'reason_category' => $data['reason_category'] ?? null,
            'word_count' => $wordCount,
            'explanation_viewed_at' => date('Y-m-d H:i:s')
        ]);

        return $this->jsonResponse([
            'success' => true,
            'reason_id' => $reasonId,
            'message' => 'Reason submitted successfully'
        ], 201);
    }

    /**
     * Get answer reasons
     */
    private function getReasons() {
        $attemptId = $_GET['attempt_id'] ?? null;
        $studentId = $_GET['student_id'] ?? null;
        $category = $_GET['category'] ?? null;

        $where = '1=1';
        $params = [];

        if ($attemptId) {
            $where .= ' AND ar.attempt_id = ?';
            $params[] = $attemptId;
        }

        if ($studentId) {
            $where .= ' AND ar.student_id = ?';
            $params[] = $studentId;
        }

        if ($category) {
            $where .= ' AND ar.reason_category = ?';
            $params[] = $category;
        }

        $sql = "SELECT ar.*, qa.question_text, qa.quiz_name,
                       s.username, s.full_name
                FROM answer_reasons ar
                JOIN quiz_attempts qa ON ar.attempt_id = qa.id
                JOIN students s ON ar.student_id = s.id
                WHERE $where
                ORDER BY ar.reason_submitted_at DESC";

        $reasons = $this->db->query($sql, $params)->fetchAll();

        return $this->jsonResponse([
            'success' => true,
            'count' => count($reasons),
            'reasons' => $reasons
        ]);
    }

    /**
     * Get single reason
     */
    private function getReason($id) {
        $sql = "SELECT ar.*, qa.question_text, qa.quiz_name, qa.correct_answer,
                       s.username, s.full_name
                FROM answer_reasons ar
                JOIN quiz_attempts qa ON ar.attempt_id = qa.id
                JOIN students s ON ar.student_id = s.id
                WHERE ar.id = ?";

        $reason = $this->db->query($sql, [$id])->fetch();

        if (!$reason) {
            return $this->jsonResponse(['error' => 'Reason not found'], 404);
        }

        return $this->jsonResponse([
            'success' => true,
            'reason' => $reason
        ]);
    }

    /**
     * Get analytics summary
     */
    private function getAnalyticsSummary() {
        $sql = "SELECT * FROM student_reason_analytics";
        $analytics = $this->db->query($sql)->fetchAll();

        return $this->jsonResponse([
            'success' => true,
            'analytics' => $analytics
        ]);
    }

    /**
     * Sync Moodle attempt
     */
    private function syncMoodleAttempt($attemptId) {
        if (!$attemptId) {
            return $this->jsonResponse(['error' => 'Attempt ID required'], 400);
        }

        $result = $this->moodle->syncQuizAttempt($attemptId);

        if ($result) {
            return $this->jsonResponse([
                'success' => true,
                'synced_attempts' => $result,
                'message' => 'Attempt synced successfully'
            ]);
        } else {
            return $this->jsonResponse(['error' => 'Failed to sync attempt'], 500);
        }
    }

    /**
     * Test Moodle connection
     */
    private function testMoodleConnection() {
        $result = $this->moodle->testConnection();

        return $this->jsonResponse($result);
    }

    // ========== Helper Methods ==========

    /**
     * Get JSON input
     */
    private function getJsonInput() {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    /**
     * Send JSON response
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}
