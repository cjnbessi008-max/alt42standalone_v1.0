<?php
/**
 * Inequality Arrow App - Main API
 * Handles problems, responses, and sessions
 */

require_once 'config.php';
require_once 'moodle_integration.php';

class InequalityArrowAPI {
    private $pdo;
    private $moodle;

    public function __construct() {
        $this->pdo = getDatabaseConnection();
        $this->moodle = new MoodleIntegration();
    }

    /**
     * Create a new learning session
     * @param int $userId
     * @param int $moodleCourseId
     * @return array
     */
    public function createSession($userId, $moodleCourseId = null) {
        $sessionId = uniqid('session_', true);

        $stmt = $this->pdo->prepare("
            INSERT INTO learning_sessions (session_id, user_id, moodle_course_id)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$sessionId, $userId, $moodleCourseId]);

        return [
            'session_id' => $sessionId,
            'user_id' => $userId,
            'start_time' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get random inequality problem
     * @param string $difficulty
     * @param string $category
     * @return array|false
     */
    public function getRandomProblem($difficulty = null, $category = null) {
        $sql = "SELECT * FROM inequality_problems WHERE 1=1";
        $params = [];

        if ($difficulty) {
            $sql .= " AND difficulty_level = ?";
            $params[] = $difficulty;
        }

        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetch();
    }

    /**
     * Get problem by ID
     * @param int $problemId
     * @return array|false
     */
    public function getProblem($problemId) {
        $stmt = $this->pdo->prepare("SELECT * FROM inequality_problems WHERE id = ?");
        $stmt->execute([$problemId]);
        return $stmt->fetch();
    }

    /**
     * Submit student response
     * @param int $userId
     * @param int $problemId
     * @param string $selectedOperator
     * @param int $responseTime
     * @param string $sessionId
     * @return array
     */
    public function submitResponse($userId, $problemId, $selectedOperator, $responseTime, $sessionId) {
        // Get the problem
        $problem = $this->getProblem($problemId);

        if (!$problem) {
            return ['error' => 'Problem not found'];
        }

        // Check if correct
        $isCorrect = ($selectedOperator === $problem['correct_operator']);

        // Get attempt number
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
            FROM student_responses
            WHERE user_id = ? AND problem_id = ? AND session_id = ?
        ");
        $stmt->execute([$userId, $problemId, $sessionId]);
        $attemptData = $stmt->fetch();
        $attemptNumber = $attemptData['next_attempt'];

        // Insert response
        $stmt = $this->pdo->prepare("
            INSERT INTO student_responses
            (user_id, problem_id, selected_operator, is_correct, response_time_seconds, attempt_number, session_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $problemId,
            $selectedOperator,
            $isCorrect,
            $responseTime,
            $attemptNumber,
            $sessionId
        ]);

        // Update session statistics
        $this->updateSessionStats($sessionId, $isCorrect, $responseTime);

        return [
            'is_correct' => $isCorrect,
            'correct_operator' => $problem['correct_operator'],
            'attempt_number' => $attemptNumber,
            'response_id' => $this->pdo->lastInsertId()
        ];
    }

    /**
     * Update session statistics
     * @param string $sessionId
     * @param bool $isCorrect
     * @param int $responseTime
     */
    private function updateSessionStats($sessionId, $isCorrect, $responseTime) {
        $stmt = $this->pdo->prepare("
            UPDATE learning_sessions
            SET total_problems = total_problems + 1,
                correct_answers = correct_answers + ?,
                total_time_seconds = total_time_seconds + ?
            WHERE session_id = ?
        ");
        $stmt->execute([$isCorrect ? 1 : 0, $responseTime, $sessionId]);
    }

    /**
     * End learning session
     * @param string $sessionId
     * @return array
     */
    public function endSession($sessionId) {
        $stmt = $this->pdo->prepare("
            UPDATE learning_sessions
            SET end_time = NOW()
            WHERE session_id = ? AND end_time IS NULL
        ");
        $stmt->execute([$sessionId]);

        // Get final statistics
        $stmt = $this->pdo->prepare("
            SELECT * FROM session_statistics WHERE session_id = ?
        ");
        $stmt->execute([$sessionId]);
        $stats = $stmt->fetch();

        // Sync to Moodle if course ID exists
        if ($stats && $stats['moodle_course_id']) {
            $this->moodle->reportProgress(
                $stats['user_id'],
                $stats['moodle_course_id'],
                $sessionId,
                ['accuracy' => $stats['accuracy_percentage']]
            );
        }

        return $stats ?: [];
    }

    /**
     * Get user progress
     * @param int $userId
     * @return array
     */
    public function getUserProgress($userId) {
        $stmt = $this->pdo->prepare("CALL GetUserProgress(?)");
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: [];
    }

    /**
     * Get user settings
     * @param int $userId
     * @return array
     */
    public function getUserSettings($userId) {
        $stmt = $this->pdo->prepare("SELECT * FROM arrow_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        $settings = $stmt->fetch();

        if (!$settings) {
            // Create default settings
            $stmt = $this->pdo->prepare("
                INSERT INTO arrow_settings (user_id)
                VALUES (?)
            ");
            $stmt->execute([$userId]);

            $stmt = $this->pdo->prepare("SELECT * FROM arrow_settings WHERE user_id = ?");
            $stmt->execute([$userId]);
            $settings = $stmt->fetch();
        }

        return $settings;
    }

    /**
     * Update user settings
     * @param int $userId
     * @param array $settings
     * @return bool
     */
    public function updateUserSettings($userId, $settings) {
        $allowedFields = ['animation_speed', 'arrow_color', 'enable_sound', 'enable_haptics', 'theme'];
        $updates = [];
        $params = [];

        foreach ($settings as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updates[] = "$key = ?";
                $params[] = $value;
            }
        }

        if (empty($updates)) {
            return false;
        }

        $params[] = $userId;

        $sql = "UPDATE arrow_settings SET " . implode(', ', $updates) . " WHERE user_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Get session history
     * @param int $userId
     * @param int $limit
     * @return array
     */
    public function getSessionHistory($userId, $limit = 10) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM session_statistics
            WHERE user_id = ?
            ORDER BY start_time DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }
}

// API endpoint handling
if (basename($_SERVER['PHP_SELF']) === 'api.php') {
    $method = $_SERVER['REQUEST_METHOD'];
    $requestData = getRequestData();
    $api = new InequalityArrowAPI();

    // Extract session token from header or request
    $sessionToken = $_SERVER['HTTP_AUTHORIZATION'] ?? $requestData['session_id'] ?? null;
    $sessionToken = str_replace('Bearer ', '', $sessionToken);

    switch ($method) {
        case 'GET':
            $action = $requestData['action'] ?? '';

            switch ($action) {
                case 'get_problem':
                    $difficulty = $requestData['difficulty'] ?? null;
                    $category = $requestData['category'] ?? null;
                    $problemId = $requestData['problem_id'] ?? null;

                    if ($problemId) {
                        $problem = $api->getProblem($problemId);
                    } else {
                        $problem = $api->getRandomProblem($difficulty, $category);
                    }

                    if ($problem) {
                        sendJsonResponse(['success' => true, 'problem' => $problem]);
                    } else {
                        sendJsonResponse(['error' => 'No problem found'], 404);
                    }
                    break;

                case 'get_progress':
                    $userId = $requestData['user_id'] ?? null;
                    if (!$userId) {
                        sendJsonResponse(['error' => 'Missing user_id'], 400);
                    }

                    $progress = $api->getUserProgress($userId);
                    sendJsonResponse(['success' => true, 'progress' => $progress]);
                    break;

                case 'get_settings':
                    $userId = $requestData['user_id'] ?? null;
                    if (!$userId) {
                        sendJsonResponse(['error' => 'Missing user_id'], 400);
                    }

                    $settings = $api->getUserSettings($userId);
                    sendJsonResponse(['success' => true, 'settings' => $settings]);
                    break;

                case 'get_history':
                    $userId = $requestData['user_id'] ?? null;
                    $limit = $requestData['limit'] ?? 10;

                    if (!$userId) {
                        sendJsonResponse(['error' => 'Missing user_id'], 400);
                    }

                    $history = $api->getSessionHistory($userId, $limit);
                    sendJsonResponse(['success' => true, 'history' => $history]);
                    break;

                default:
                    sendJsonResponse(['error' => 'Unknown action'], 400);
            }
            break;

        case 'POST':
            $action = $requestData['action'] ?? '';

            switch ($action) {
                case 'create_session':
                    $userId = $requestData['user_id'] ?? null;
                    $moodleCourseId = $requestData['moodle_course_id'] ?? null;

                    if (!$userId) {
                        sendJsonResponse(['error' => 'Missing user_id'], 400);
                    }

                    $session = $api->createSession($userId, $moodleCourseId);
                    sendJsonResponse(['success' => true, 'session' => $session]);
                    break;

                case 'submit_response':
                    $userId = $requestData['user_id'] ?? null;
                    $problemId = $requestData['problem_id'] ?? null;
                    $selectedOperator = $requestData['selected_operator'] ?? null;
                    $responseTime = $requestData['response_time'] ?? 0;
                    $sessionId = $requestData['session_id'] ?? null;

                    if (!$userId || !$problemId || !$selectedOperator || !$sessionId) {
                        sendJsonResponse(['error' => 'Missing required parameters'], 400);
                    }

                    $result = $api->submitResponse($userId, $problemId, $selectedOperator, $responseTime, $sessionId);
                    sendJsonResponse(['success' => true, 'result' => $result]);
                    break;

                case 'end_session':
                    $sessionId = $requestData['session_id'] ?? null;

                    if (!$sessionId) {
                        sendJsonResponse(['error' => 'Missing session_id'], 400);
                    }

                    $stats = $api->endSession($sessionId);
                    sendJsonResponse(['success' => true, 'stats' => $stats]);
                    break;

                case 'update_settings':
                    $userId = $requestData['user_id'] ?? null;
                    $settings = $requestData['settings'] ?? [];

                    if (!$userId || empty($settings)) {
                        sendJsonResponse(['error' => 'Missing required parameters'], 400);
                    }

                    $result = $api->updateUserSettings($userId, $settings);
                    sendJsonResponse(['success' => $result]);
                    break;

                default:
                    sendJsonResponse(['error' => 'Unknown action'], 400);
            }
            break;

        default:
            sendJsonResponse(['error' => 'Method not allowed'], 405);
    }
}
