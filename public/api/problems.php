<?php
/**
 * API Endpoint for Math Problems
 * Moodle LMS Integration
 *
 * This script handles requests from the web app to fetch problem data
 * from Moodle LMS database
 */

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS headers for cross-origin requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include configuration and database handler
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/moodle_integration.php';

/**
 * Main request handler
 */
function handleRequest() {
    try {
        $action = $_GET['action'] ?? 'get_problem';

        switch ($action) {
            case 'get_problem':
                return getProblem();

            case 'check_updates':
                return checkUpdates();

            case 'submit_answer':
                return submitAnswer();

            case 'get_session_info':
                return getSessionInfo();

            default:
                return errorResponse('Invalid action', 400);
        }
    } catch (Exception $e) {
        error_log('API Error: ' . $e->getMessage());
        return errorResponse('Internal server error: ' . $e->getMessage(), 500);
    }
}

/**
 * Get problem data
 */
function getProblem() {
    $problemId = $_GET['problem_id'] ?? null;
    $sessionId = $_GET['session_id'] ?? null;

    if (!$problemId) {
        return errorResponse('Problem ID is required', 400);
    }

    $db = new Database();
    $moodle = new MoodleIntegration($db);

    // Fetch problem from database
    $problem = $moodle->getProblemById($problemId, $sessionId);

    if (!$problem) {
        return errorResponse('Problem not found', 404);
    }

    return successResponse($problem);
}

/**
 * Check for session updates
 */
function checkUpdates() {
    $sessionId = $_GET['session_id'] ?? null;

    if (!$sessionId) {
        return errorResponse('Session ID is required', 400);
    }

    $db = new Database();
    $moodle = new MoodleIntegration($db);

    $hasUpdates = $moodle->checkSessionUpdates($sessionId);

    return [
        'success' => true,
        'updated' => $hasUpdates
    ];
}

/**
 * Submit student answer
 */
function submitAnswer() {
    $input = json_decode(file_get_contents('php://input'), true);

    $problemId = $input['problem_id'] ?? null;
    $sessionId = $input['session_id'] ?? null;
    $answer = $input['answer'] ?? null;

    if (!$problemId || !$sessionId || !$answer) {
        return errorResponse('Missing required fields', 400);
    }

    $db = new Database();
    $moodle = new MoodleIntegration($db);

    $result = $moodle->submitAnswer($problemId, $sessionId, $answer);

    return successResponse([
        'submitted' => true,
        'correct' => $result['correct'],
        'feedback' => $result['feedback']
    ]);
}

/**
 * Get session information
 */
function getSessionInfo() {
    $sessionId = $_GET['session_id'] ?? null;

    if (!$sessionId) {
        return errorResponse('Session ID is required', 400);
    }

    $db = new Database();
    $moodle = new MoodleIntegration($db);

    $sessionInfo = $moodle->getSessionInfo($sessionId);

    if (!$sessionInfo) {
        return errorResponse('Session not found', 404);
    }

    return successResponse($sessionInfo);
}

/**
 * Success response helper
 */
function successResponse($data) {
    return [
        'success' => true,
        'problem' => $data
    ];
}

/**
 * Error response helper
 */
function errorResponse($message, $code = 400) {
    http_response_code($code);
    return [
        'success' => false,
        'error' => $message
    ];
}

// Execute request and output JSON
$response = handleRequest();
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
