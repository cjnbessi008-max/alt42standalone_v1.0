<?php
/**
 * Moodle API Bridge
 * Connects the standalone web app with Moodle LMS 3.7
 * PHP 7.1.9 compatible
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers for development
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Start session
session_start();

// Load configuration
require_once __DIR__ . '/../config/config.php';

// Load Moodle configuration if available
if (file_exists(MOODLE_PATH . '/config.php')) {
    require_once MOODLE_PATH . '/config.php';
}

class MoodleBridge {
    private $db;
    private $moodleDB;
    private $config;

    public function __construct($config) {
        $this->config = $config;
        $this->initDatabase();
    }

    /**
     * Initialize database connections
     */
    private function initDatabase() {
        try {
            // Local database for app data
            $this->db = new PDO(
                "mysql:host={$this->config['db_host']};dbname={$this->config['db_name']};charset=utf8mb4",
                $this->config['db_user'],
                $this->config['db_pass'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            // Moodle database (if different)
            if (isset($this->config['moodle_db_name'])) {
                $this->moodleDB = new PDO(
                    "mysql:host={$this->config['moodle_db_host']};dbname={$this->config['moodle_db_name']};charset=utf8mb4",
                    $this->config['moodle_db_user'],
                    $this->config['moodle_db_pass'],
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );
            } else {
                $this->moodleDB = $this->db;
            }
        } catch (PDOException $e) {
            $this->sendError("Database connection failed: " . $e->getMessage());
        }
    }

    /**
     * Handle API requests
     */
    public function handleRequest() {
        $action = $_POST['action'] ?? $_GET['action'] ?? '';

        try {
            switch ($action) {
                case 'init':
                    return $this->initialize();
                case 'getUserInfo':
                    return $this->getUserInfo();
                case 'getNextProblem':
                    return $this->getNextProblem();
                case 'submitAnswer':
                    return $this->submitAnswer();
                case 'getScoreHistory':
                    return $this->getScoreHistory();
                case 'updateProgress':
                    return $this->updateProgress();
                default:
                    return $this->sendError("Unknown action: $action");
            }
        } catch (Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Initialize session and authenticate user
     */
    private function initialize() {
        // Check if Moodle session exists
        $userId = $this->getMoodleUserId();

        if (!$userId) {
            // For development: create mock user
            $userId = 'demo_user_' . time();
            $_SESSION['user_id'] = $userId;
            $_SESSION['demo_mode'] = true;
        }

        $token = bin2hex(random_bytes(32));
        $_SESSION['session_token'] = $token;
        $_SESSION['user_id'] = $userId;

        return $this->sendSuccess([
            'token' => $token,
            'userId' => $userId,
            'demoMode' => isset($_SESSION['demo_mode'])
        ]);
    }

    /**
     * Get Moodle user ID from session
     */
    private function getMoodleUserId() {
        // Check Moodle session
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']->id)) {
            return $_SESSION['USER']->id;
        }

        // Try to get from Moodle database
        try {
            if (isset($_COOKIE['MoodleSession'])) {
                $sessionId = $_COOKIE['MoodleSession'];
                $stmt = $this->moodleDB->prepare("
                    SELECT userid
                    FROM mdl_sessions
                    WHERE sid = ? AND timemodified > ?
                ");
                $stmt->execute([$sessionId, time() - 86400]); // 24 hours
                $result = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($result) {
                    return $result['userid'];
                }
            }
        } catch (PDOException $e) {
            // Moodle not available, continue with demo mode
        }

        return null;
    }

    /**
     * Get user information
     */
    private function getUserInfo() {
        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            return $this->sendError("User not authenticated");
        }

        // Try to get from Moodle
        try {
            $stmt = $this->moodleDB->prepare("
                SELECT id, username, firstname, lastname, email
                FROM mdl_user
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $moodleUser = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($moodleUser) {
                // Get app-specific data
                $appData = $this->getAppUserData($userId);

                return $this->sendSuccess([
                    'id' => $moodleUser['id'],
                    'name' => trim($moodleUser['firstname'] . ' ' . $moodleUser['lastname']),
                    'email' => $moodleUser['email'],
                    'totalScore' => $appData['total_score'],
                    'level' => $appData['level'],
                    'streak' => $appData['streak']
                ]);
            }
        } catch (PDOException $e) {
            // Moodle not available
        }

        // Demo mode
        $appData = $this->getAppUserData($userId);
        return $this->sendSuccess([
            'id' => $userId,
            'name' => 'Demo Student',
            'email' => 'demo@example.com',
            'totalScore' => $appData['total_score'],
            'level' => $appData['level'],
            'streak' => $appData['streak']
        ]);
    }

    /**
     * Get app-specific user data
     */
    private function getAppUserData($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT total_score, level, streak
                FROM user_progress
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return $data;
            }
        } catch (PDOException $e) {
            // Table might not exist yet
        }

        // Create new user record
        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_progress (user_id, total_score, level, streak)
                VALUES (?, 0, 1, 0)
            ");
            $stmt->execute([$userId]);
        } catch (PDOException $e) {
            // Ignore if already exists
        }

        return ['total_score' => 0, 'level' => 1, 'streak' => 0];
    }

    /**
     * Get next problem from Moodle quiz
     */
    private function getNextProblem() {
        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            return $this->sendError("User not authenticated");
        }

        // Try to get from Moodle question bank
        try {
            $stmt = $this->moodleDB->prepare("
                SELECT q.id, q.questiontext, q.defaultmark
                FROM mdl_question q
                WHERE q.qtype = 'shortanswer'
                AND q.category IN (
                    SELECT id FROM mdl_question_categories
                    WHERE name LIKE '%fraction%' OR name LIKE '%math%'
                )
                ORDER BY RAND()
                LIMIT 1
            ");
            $stmt->execute();
            $question = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($question) {
                // Get answer
                $stmt = $this->moodleDB->prepare("
                    SELECT answer
                    FROM mdl_question_answers
                    WHERE question = ? AND fraction = 1
                    LIMIT 1
                ");
                $stmt->execute([$question['id']]);
                $answer = $stmt->fetch(PDO::FETCH_ASSOC);

                return $this->sendSuccess([
                    'id' => $question['id'],
                    'type' => 'shortanswer',
                    'question' => strip_tags($question['questiontext']),
                    'answer' => $answer['answer'] ?? '',
                    'points' => (int)$question['defaultmark'] * 10,
                    'difficulty' => 1
                ]);
            }
        } catch (PDOException $e) {
            // Moodle questions not available, use built-in
        }

        // Use built-in problems
        return $this->sendSuccess($this->getBuiltInProblem());
    }

    /**
     * Get built-in problem (fallback)
     */
    private function getBuiltInProblem() {
        $problems = [
            [
                'id' => 'builtin_1',
                'type' => 'fraction',
                'question' => '1/2 + 1/4 = ?',
                'answer' => '3/4',
                'difficulty' => 1,
                'points' => 10
            ],
            [
                'id' => 'builtin_2',
                'type' => 'fraction',
                'question' => 'Simplify: 6/8',
                'answer' => '3/4',
                'difficulty' => 1,
                'points' => 10
            ],
            [
                'id' => 'builtin_3',
                'type' => 'fraction',
                'question' => '2/3 × 3/4 = ?',
                'answer' => '1/2',
                'difficulty' => 2,
                'points' => 20
            ],
            [
                'id' => 'builtin_4',
                'type' => 'fraction',
                'question' => 'Convert to improper fraction: 2 1/3',
                'answer' => '7/3',
                'difficulty' => 2,
                'points' => 15
            ],
            [
                'id' => 'builtin_5',
                'type' => 'fraction',
                'question' => '5/6 - 1/3 = ?',
                'answer' => '1/2',
                'difficulty' => 2,
                'points' => 20
            ]
        ];

        return $problems[array_rand($problems)];
    }

    /**
     * Submit and check answer
     */
    private function submitAnswer() {
        $userId = $_SESSION['user_id'] ?? null;
        $problemId = $_POST['problemId'] ?? '';
        $userAnswer = trim($_POST['answer'] ?? '');

        if (!$userId || !$problemId || !$userAnswer) {
            return $this->sendError("Missing required data");
        }

        // Get correct answer
        $correctAnswer = $this->getCorrectAnswer($problemId);

        // Normalize and compare answers
        $isCorrect = $this->compareAnswers($userAnswer, $correctAnswer);

        // Calculate points
        $points = 0;
        if ($isCorrect) {
            $points = $this->calculatePoints($problemId);
        }

        // Record attempt
        $this->recordAttempt($userId, $problemId, $userAnswer, $isCorrect, $points);

        return $this->sendSuccess([
            'correct' => $isCorrect,
            'points' => $points,
            'message' => $isCorrect ? 'Correct! Well done!' : 'Incorrect. Try again!',
            'correctAnswer' => $correctAnswer
        ]);
    }

    /**
     * Get correct answer for a problem
     */
    private function getCorrectAnswer($problemId) {
        // Try Moodle first
        try {
            $stmt = $this->moodleDB->prepare("
                SELECT answer
                FROM mdl_question_answers
                WHERE question = ? AND fraction = 1
                LIMIT 1
            ");
            $stmt->execute([$problemId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return trim($result['answer']);
            }
        } catch (PDOException $e) {
            // Not found in Moodle
        }

        // Built-in answers
        $builtInAnswers = [
            'builtin_1' => '3/4',
            'builtin_2' => '3/4',
            'builtin_3' => '1/2',
            'builtin_4' => '7/3',
            'builtin_5' => '1/2'
        ];

        return $builtInAnswers[$problemId] ?? '';
    }

    /**
     * Compare user answer with correct answer
     */
    private function compareAnswers($userAnswer, $correctAnswer) {
        // Normalize both answers
        $user = strtolower(str_replace([' ', '\t', '\n'], '', $userAnswer));
        $correct = strtolower(str_replace([' ', '\t', '\n'], '', $correctAnswer));

        return $user === $correct;
    }

    /**
     * Calculate points for a problem
     */
    private function calculatePoints($problemId) {
        // Default points
        return 10;
    }

    /**
     * Record attempt in database
     */
    private function recordAttempt($userId, $problemId, $answer, $isCorrect, $points) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_attempts
                (user_id, problem_id, answer, is_correct, points, attempt_time)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $problemId, $answer, $isCorrect ? 1 : 0, $points]);
        } catch (PDOException $e) {
            // Log error but don't fail
            error_log("Failed to record attempt: " . $e->getMessage());
        }
    }

    /**
     * Get user's score history
     */
    private function getScoreHistory() {
        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            return $this->sendError("User not authenticated");
        }

        try {
            $stmt = $this->db->prepare("
                SELECT problem_id, points, is_correct, attempt_time
                FROM user_attempts
                WHERE user_id = ?
                ORDER BY attempt_time DESC
                LIMIT 20
            ");
            $stmt->execute([$userId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendSuccess($history);
        } catch (PDOException $e) {
            return $this->sendSuccess([]);
        }
    }

    /**
     * Update user progress
     */
    private function updateProgress() {
        $userId = $_SESSION['user_id'] ?? null;
        $score = $_POST['score'] ?? 0;
        $level = $_POST['level'] ?? 1;
        $streak = $_POST['streak'] ?? 0;

        if (!$userId) {
            return $this->sendError("User not authenticated");
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE user_progress
                SET total_score = ?, level = ?, streak = ?, last_activity = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$score, $level, $streak, $userId]);

            return $this->sendSuccess(['updated' => true]);
        } catch (PDOException $e) {
            return $this->sendError("Failed to update progress");
        }
    }

    /**
     * Send success response
     */
    private function sendSuccess($data) {
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }

    /**
     * Send error response
     */
    private function sendError($message) {
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }
}

// Handle request
$bridge = new MoodleBridge($config);
$bridge->handleRequest();
