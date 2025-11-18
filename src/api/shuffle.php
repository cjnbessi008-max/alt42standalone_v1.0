<?php
/**
 * Data Shuffle API Endpoints
 *
 * Provides REST API for quiz shuffling functionality
 *
 * @package DataShuffle
 * @version 1.0.0
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/ShuffleEngine.php';
require_once __DIR__ . '/../../moodle-integration/MoodleConnector.php';

use DataShuffle\Config\Database;
use DataShuffle\Lib\ShuffleEngine;
use MoodleIntegration\MoodleConnector;

// Set headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize dependencies
try {
    $db = Database::getConnection();
    $shuffleEngine = new ShuffleEngine($db);
    $moodleConnector = new MoodleConnector();
} catch (\Exception $e) {
    sendError(500, 'Initialization failed: ' . $e->getMessage());
}

// Route requests
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse route
if (preg_match('#/api/v1/quiz/(\d+)/shuffled#', $requestUri, $matches)) {
    if ($requestMethod === 'GET') {
        getShuffledQuiz((int)$matches[1]);
    } else {
        sendError(405, 'Method not allowed');
    }
}
elseif (preg_match('#/api/v1/quiz/(\d+)/submit#', $requestUri, $matches)) {
    if ($requestMethod === 'POST') {
        submitAnswer((int)$matches[1]);
    } else {
        sendError(405, 'Method not allowed');
    }
}
elseif (preg_match('#/api/v1/admin/quiz/(\d+)/shuffle-map#', $requestUri, $matches)) {
    if ($requestMethod === 'GET') {
        getShuffleMap((int)$matches[1]);
    } else {
        sendError(405, 'Method not allowed');
    }
}
elseif (preg_match('#/api/v1/quiz/(\d+)/config#', $requestUri, $matches)) {
    if ($requestMethod === 'GET') {
        getQuizConfig((int)$matches[1]);
    } elseif ($requestMethod === 'POST') {
        updateQuizConfig((int)$matches[1]);
    } else {
        sendError(405, 'Method not allowed');
    }
}
elseif (preg_match('#/api/v1/quiz/(\d+)/statistics#', $requestUri, $matches)) {
    if ($requestMethod === 'GET') {
        getQuizStatistics((int)$matches[1]);
    } else {
        sendError(405, 'Method not allowed');
    }
}
else {
    sendError(404, 'Endpoint not found');
}

/**
 * Get shuffled quiz for student
 */
function getShuffledQuiz($quizId)
{
    global $shuffleEngine, $moodleConnector;

    $startTime = microtime(true);

    try {
        // Get student ID from query parameter or session
        $studentId = $_GET['student_id'] ?? null;
        $sessionId = $_GET['session_id'] ?? session_id();

        if (!$studentId) {
            sendError(400, 'student_id parameter is required');
        }

        // Validate student authentication (implement your auth logic)
        // if (!authenticateStudent($studentId)) {
        //     sendError(401, 'Unauthorized');
        // }

        // Get quiz configuration
        $config = $shuffleEngine->getQuizConfig($quizId);

        if (!($config['enabled'] ?? true)) {
            sendError(403, 'Shuffle feature is disabled for this quiz');
        }

        // Get questions from Moodle
        $questions = $moodleConnector->getQuizQuestions($quizId);

        if (empty($questions)) {
            sendError(404, 'No questions found for quiz');
        }

        // Shuffle questions
        $shuffledQuestions = $shuffleEngine->shuffleQuestions(
            $questions,
            $studentId,
            $quizId,
            true // record history
        );

        // Shuffle answers for each question
        foreach ($shuffledQuestions as &$question) {
            if (isset($question['answers']) && is_array($question['answers'])) {
                $shuffleResult = $shuffleEngine->shuffleAnswers(
                    $question['answers'],
                    $question['id'],
                    $studentId,
                    $quizId
                );

                $question['answers'] = $shuffleResult['answers'];
                $question['answer_mapping'] = $shuffleResult['mapping'];
            }
        }

        // Get shuffle seeds
        $seeds = $shuffleEngine->getOrCreateSeeds($studentId, $quizId, $sessionId);

        // Calculate expiration time
        $cacheDuration = $config['cache_duration'] ?? 3600;
        $expiresAt = date('Y-m-d\TH:i:s\Z', time() + $cacheDuration);

        // Build response
        $response = [
            'success' => true,
            'quiz_id' => $quizId,
            'student_id' => $studentId,
            'total_questions' => count($shuffledQuestions),
            'questions' => $shuffledQuestions,
            'shuffle_seed' => substr($seeds['question_seed'], 0, 16) . '...', // Partial seed for reference
            'cached' => false,
            'expires_at' => $expiresAt,
            'execution_time_ms' => (int)((microtime(true) - $startTime) * 1000)
        ];

        sendSuccess($response);

    } catch (\Exception $e) {
        error_log("Get shuffled quiz error: " . $e->getMessage());
        sendError(500, 'Failed to get shuffled quiz: ' . $e->getMessage());
    }
}

/**
 * Submit answer for a question
 */
function submitAnswer($quizId)
{
    global $shuffleEngine, $moodleConnector;

    try {
        // Get POST data
        $input = json_decode(file_get_contents('php://input'), true);

        $studentId = $input['student_id'] ?? null;
        $questionId = $input['question_id'] ?? null;
        $selectedAnswerId = $input['selected_answer_id'] ?? null;

        if (!$studentId || !$questionId || !$selectedAnswerId) {
            sendError(400, 'Missing required parameters: student_id, question_id, selected_answer_id');
        }

        // Get original answer ID (convert from shuffled position if needed)
        $originalAnswerId = $shuffleEngine->getOriginalAnswerId(
            $studentId,
            $quizId,
            $questionId,
            $selectedAnswerId
        );

        // Verify answer with Moodle
        $isCorrect = $moodleConnector->verifyAnswer($questionId, $originalAnswerId);

        // Get feedback
        $feedback = $moodleConnector->getAnswerFeedback($questionId, $originalAnswerId);

        $response = [
            'success' => true,
            'is_correct' => $isCorrect,
            'selected_answer_id' => $selectedAnswerId,
            'original_answer_id' => $originalAnswerId,
            'feedback' => $feedback
        ];

        sendSuccess($response);

    } catch (\Exception $e) {
        error_log("Submit answer error: " . $e->getMessage());
        sendError(500, 'Failed to submit answer: ' . $e->getMessage());
    }
}

/**
 * Get shuffle mapping for admin/teacher
 */
function getShuffleMap($quizId)
{
    global $db;

    try {
        // Verify admin authentication
        // if (!isAdmin()) {
        //     sendError(403, 'Admin access required');
        // }

        $stmt = $db->prepare("
            SELECT
                sh.student_id,
                GROUP_CONCAT(sh.question_id ORDER BY sh.shuffled_position) as question_order,
                ss.question_seed
            FROM shuffle_history sh
            JOIN shuffle_seeds ss ON sh.student_id = ss.student_id AND sh.quiz_id = ss.quiz_id
            WHERE sh.quiz_id = :quiz_id
            GROUP BY sh.student_id
            ORDER BY sh.student_id
        ");

        $stmt->execute(['quiz_id' => $quizId]);
        $students = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $response = [
            'success' => true,
            'quiz_id' => $quizId,
            'total_students' => count($students),
            'students' => array_map(function($student) {
                return [
                    'student_id' => $student['student_id'],
                    'question_order' => explode(',', $student['question_order']),
                    'seed' => substr($student['question_seed'], 0, 16) . '...'
                ];
            }, $students)
        ];

        sendSuccess($response);

    } catch (\Exception $e) {
        error_log("Get shuffle map error: " . $e->getMessage());
        sendError(500, 'Failed to get shuffle map: ' . $e->getMessage());
    }
}

/**
 * Get quiz configuration
 */
function getQuizConfig($quizId)
{
    global $shuffleEngine;

    try {
        $config = $shuffleEngine->getQuizConfig($quizId);

        $response = [
            'success' => true,
            'quiz_id' => $quizId,
            'config' => $config
        ];

        sendSuccess($response);

    } catch (\Exception $e) {
        sendError(500, 'Failed to get quiz config: ' . $e->getMessage());
    }
}

/**
 * Update quiz configuration
 */
function updateQuizConfig($quizId)
{
    global $db;

    try {
        // Get POST data
        $input = json_decode(file_get_contents('php://input'), true);

        // Verify admin authentication
        // if (!isAdmin()) {
        //     sendError(403, 'Admin access required');
        // }

        $stmt = $db->prepare("
            INSERT INTO shuffle_config
                (quiz_id, shuffle_questions, shuffle_answers, seed_strategy, cache_duration, salt, enabled)
            VALUES
                (:quiz_id, :shuffle_questions, :shuffle_answers, :seed_strategy, :cache_duration, :salt, :enabled)
            ON DUPLICATE KEY UPDATE
                shuffle_questions = VALUES(shuffle_questions),
                shuffle_answers = VALUES(shuffle_answers),
                seed_strategy = VALUES(seed_strategy),
                cache_duration = VALUES(cache_duration),
                salt = VALUES(salt),
                enabled = VALUES(enabled),
                updated_at = CURRENT_TIMESTAMP
        ");

        $stmt->execute([
            'quiz_id' => $quizId,
            'shuffle_questions' => $input['shuffle_questions'] ?? true,
            'shuffle_answers' => $input['shuffle_answers'] ?? true,
            'seed_strategy' => $input['seed_strategy'] ?? 'combined',
            'cache_duration' => $input['cache_duration'] ?? 3600,
            'salt' => $input['salt'] ?? null,
            'enabled' => $input['enabled'] ?? true
        ]);

        sendSuccess([
            'success' => true,
            'message' => 'Quiz configuration updated successfully'
        ]);

    } catch (\Exception $e) {
        sendError(500, 'Failed to update quiz config: ' . $e->getMessage());
    }
}

/**
 * Get quiz statistics
 */
function getQuizStatistics($quizId)
{
    global $shuffleEngine;

    try {
        $stats = $shuffleEngine->getQuizStatistics($quizId);

        $response = [
            'success' => true,
            'quiz_id' => $quizId,
            'statistics' => $stats
        ];

        sendSuccess($response);

    } catch (\Exception $e) {
        sendError(500, 'Failed to get quiz statistics: ' . $e->getMessage());
    }
}

/**
 * Send success response
 */
function sendSuccess($data, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function sendError($statusCode, $message)
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => $statusCode,
            'message' => $message
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
