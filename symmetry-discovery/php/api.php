<?php
/**
 * Symmetry Discovery API
 * PHP 7.1.9 compatible
 * Moodle 3.7 Integration
 */

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 in production

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load configuration
require_once 'config.php';
require_once 'database.php';
require_once 'moodle-connector.php';

/**
 * Main API Handler
 */
class SymmetryAPI {
    private $db;
    private $moodle;

    public function __construct() {
        $this->db = new Database();
        $this->moodle = new MoodleConnector();
    }

    /**
     * Route request to appropriate handler
     */
    public function handleRequest() {
        try {
            // Get request data
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return $this->errorResponse('Invalid JSON', 400);
            }

            $action = $data['action'] ?? '';

            // Route to appropriate handler
            switch ($action) {
                case 'verify_session':
                    return $this->verifySession($data);

                case 'save_progress':
                    return $this->saveProgress($data);

                case 'load_progress':
                    return $this->loadProgress($data);

                case 'submit_score':
                    return $this->submitScore($data);

                case 'get_leaderboard':
                    return $this->getLeaderboard($data);

                case 'log_event':
                    return $this->logEvent($data);

                case 'get_user_stats':
                    return $this->getUserStats($data);

                case 'get_achievements':
                    return $this->getAchievements($data);

                default:
                    return $this->errorResponse('Unknown action', 400);
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Verify session
     */
    private function verifySession($data) {
        $sessionId = $data['session_id'] ?? '';
        $userId = $data['user_id'] ?? '';

        if (empty($sessionId) || empty($userId)) {
            return $this->errorResponse('Missing session_id or user_id', 400);
        }

        // Check session in database
        $session = $this->db->query(
            "SELECT * FROM sym_sessions
             WHERE session_id = ? AND user_id = ? AND is_active = 1 AND expires_at > NOW()",
            [$sessionId, $userId]
        );

        if (!empty($session)) {
            // Update last activity
            $this->db->execute(
                "UPDATE sym_sessions SET last_activity = NOW() WHERE session_id = ?",
                [$sessionId]
            );

            return $this->successResponse([
                'valid' => true,
                'user_id' => $userId,
                'session_id' => $sessionId
            ]);
        }

        // Try to validate with Moodle
        if ($this->moodle->isAvailable()) {
            $moodleUser = $this->moodle->validateSession($sessionId);
            if ($moodleUser) {
                // Create new session
                $newSessionId = $this->createSession($moodleUser);
                return $this->successResponse([
                    'valid' => true,
                    'user_id' => $moodleUser['id'],
                    'session_id' => $newSessionId
                ]);
            }
        }

        return $this->errorResponse('Invalid session', 401);
    }

    /**
     * Create new session
     */
    private function createSession($user) {
        $sessionId = bin2hex(random_bytes(32));
        $userId = $this->getOrCreateUser($user);

        $this->db->execute(
            "INSERT INTO sym_sessions (session_id, user_id, ip_address, user_agent, expires_at)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
            [
                $sessionId,
                $userId,
                $_SERVER['REMOTE_ADDR'] ?? '',
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]
        );

        return $sessionId;
    }

    /**
     * Get or create user
     */
    private function getOrCreateUser($userData) {
        $moodleUserId = $userData['id'] ?? 0;
        $username = $userData['username'] ?? 'guest';
        $email = $userData['email'] ?? '';

        // Check if user exists
        $existingUser = $this->db->query(
            "SELECT id FROM sym_users WHERE moodle_user_id = ?",
            [$moodleUserId]
        );

        if (!empty($existingUser)) {
            return $existingUser[0]['id'];
        }

        // Create new user
        $this->db->execute(
            "INSERT INTO sym_users (moodle_user_id, username, email) VALUES (?, ?, ?)",
            [$moodleUserId, $username, $email]
        );

        return $this->db->lastInsertId();
    }

    /**
     * Save progress
     */
    private function saveProgress($data) {
        $userId = $data['user_id'] ?? 0;
        $courseId = $data['course_id'] ?? null;
        $activityId = $data['activity_id'] ?? null;
        $progressData = $data['data'] ?? [];

        if (!$userId) {
            return $this->errorResponse('Missing user_id', 400);
        }

        // Update or insert score record
        $this->db->execute(
            "INSERT INTO sym_scores (user_id, course_id, activity_id, total_score, high_score, current_level)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                total_score = VALUES(total_score),
                high_score = GREATEST(high_score, VALUES(high_score)),
                current_level = VALUES(current_level),
                last_played = NOW()",
            [
                $userId,
                $courseId,
                $activityId,
                $progressData['score'] ?? 0,
                $progressData['highScore'] ?? 0,
                $progressData['level'] ?? 1
            ]
        );

        // Log to Moodle if available
        if ($this->moodle->isAvailable() && $courseId && $activityId) {
            $this->moodle->logActivity([
                'userid' => $userId,
                'courseid' => $courseId,
                'activityid' => $activityId,
                'action' => 'progress_saved',
                'score' => $progressData['score'] ?? 0
            ]);
        }

        return $this->successResponse(['saved' => true]);
    }

    /**
     * Load progress
     */
    private function loadProgress($data) {
        $userId = $data['user_id'] ?? 0;
        $courseId = $data['course_id'] ?? null;
        $activityId = $data['activity_id'] ?? null;

        if (!$userId) {
            return $this->errorResponse('Missing user_id', 400);
        }

        $progress = $this->db->query(
            "SELECT * FROM sym_scores
             WHERE user_id = ? AND course_id <=> ? AND activity_id <=> ?",
            [$userId, $courseId, $activityId]
        );

        if (!empty($progress)) {
            return $this->successResponse([
                'score' => intval($progress[0]['total_score']),
                'highScore' => intval($progress[0]['high_score']),
                'level' => intval($progress[0]['current_level']),
                'shapesCompleted' => intval($progress[0]['shapes_completed'])
            ]);
        }

        return $this->successResponse(null);
    }

    /**
     * Submit score
     */
    private function submitScore($data) {
        $userId = $data['user_id'] ?? 0;
        $courseId = $data['course_id'] ?? null;
        $activityId = $data['activity_id'] ?? null;
        $score = $data['score'] ?? 0;
        $completed = $data['completed'] ?? false;

        if (!$userId) {
            return $this->errorResponse('Missing user_id', 400);
        }

        // Update score
        $this->db->execute(
            "INSERT INTO sym_scores (user_id, course_id, activity_id, total_score, high_score)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                total_score = VALUES(total_score),
                high_score = GREATEST(high_score, VALUES(high_score)),
                shapes_completed = shapes_completed + IF(? = 1, 1, 0)",
            [$userId, $courseId, $activityId, $score, $score, $completed ? 1 : 0]
        );

        // Submit to Moodle gradebook if available
        if ($this->moodle->isAvailable() && $courseId && $activityId) {
            $this->moodle->submitGrade([
                'userid' => $userId,
                'courseid' => $courseId,
                'activityid' => $activityId,
                'grade' => $score,
                'completed' => $completed
            ]);
        }

        // Update leaderboard rankings
        $this->db->execute(
            "CALL update_leaderboard_rankings(?, ?)",
            [$courseId, $activityId]
        );

        return $this->successResponse(['submitted' => true, 'score' => $score]);
    }

    /**
     * Get leaderboard
     */
    private function getLeaderboard($data) {
        $courseId = $data['course_id'] ?? null;
        $activityId = $data['activity_id'] ?? null;
        $limit = min(intval($data['limit'] ?? 10), 100);

        $leaderboard = $this->db->query(
            "SELECT l.rank_position, u.username, l.high_score, l.shapes_completed, l.last_updated
             FROM sym_leaderboard l
             JOIN sym_users u ON l.user_id = u.id
             WHERE l.course_id <=> ? AND l.activity_id <=> ?
             ORDER BY l.rank_position ASC
             LIMIT ?",
            [$courseId, $activityId, $limit]
        );

        return $this->successResponse($leaderboard);
    }

    /**
     * Log event
     */
    private function logEvent($data) {
        $userId = $data['user_id'] ?? 0;
        $sessionId = $data['session_id'] ?? '';
        $courseId = $data['course_id'] ?? null;
        $activityId = $data['activity_id'] ?? null;
        $eventType = $data['event_type'] ?? '';
        $eventData = json_encode($data['event_data'] ?? []);

        if (!$userId || !$eventType) {
            return $this->errorResponse('Missing required fields', 400);
        }

        $this->db->execute(
            "INSERT INTO sym_events (user_id, session_id, course_id, activity_id, event_type, event_data, ip_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                $userId,
                $sessionId,
                $courseId,
                $activityId,
                $eventType,
                $eventData,
                $_SERVER['REMOTE_ADDR'] ?? ''
            ]
        );

        return $this->successResponse(['logged' => true]);
    }

    /**
     * Get user statistics
     */
    private function getUserStats($data) {
        $userId = $data['user_id'] ?? 0;
        $courseId = $data['course_id'] ?? null;
        $activityId = $data['activity_id'] ?? null;

        if (!$userId) {
            return $this->errorResponse('Missing user_id', 400);
        }

        $stats = $this->db->query(
            "CALL get_user_stats(?, ?, ?)",
            [$userId, $courseId, $activityId]
        );

        return $this->successResponse($stats[0] ?? []);
    }

    /**
     * Get achievements
     */
    private function getAchievements($data) {
        $userId = $data['user_id'] ?? 0;

        if (!$userId) {
            return $this->errorResponse('Missing user_id', 400);
        }

        $achievements = $this->db->query(
            "SELECT * FROM sym_achievements WHERE user_id = ? ORDER BY earned_at DESC",
            [$userId]
        );

        return $this->successResponse($achievements);
    }

    /**
     * Success response
     */
    private function successResponse($data = null) {
        http_response_code(200);
        return json_encode([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Error response
     */
    private function errorResponse($message, $code = 500) {
        http_response_code($code);
        return json_encode([
            'success' => false,
            'error' => $message
        ]);
    }
}

// Execute API request
$api = new SymmetryAPI();
echo $api->handleRequest();
