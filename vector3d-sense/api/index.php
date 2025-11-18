<?php
/**
 * Vector 3D Sense - REST API Endpoints
 * Provides API for Vector 3D visualization app
 *
 * @package    vector3d_sense
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Set headers for JSON API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include required files
require_once(__DIR__ . '/../moodle-integration/config.php');
require_once(__DIR__ . '/../moodle-integration/db_connector.php');
require_once(__DIR__ . '/../moodle-integration/problem_loader.php');

// Parse request
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

// Simple routing
$endpoint = $pathParts[count($pathParts) - 1] ?? 'index';

try {
    $problemLoader = new Vector3DProblemLoader();

    switch ($endpoint) {
        case 'problem':
            handleProblemRequest($problemLoader, $requestMethod);
            break;

        case 'submit':
            handleSubmitRequest($problemLoader, $requestMethod);
            break;

        case 'attempts':
            handleAttemptsRequest($problemLoader, $requestMethod);
            break;

        case 'session':
            handleSessionRequest($problemLoader, $requestMethod);
            break;

        case 'analytics':
            handleAnalyticsRequest($problemLoader, $requestMethod);
            break;

        default:
            sendResponse(array(
                'status' => 'success',
                'message' => 'Vector 3D Sense API v1.0',
                'endpoints' => array(
                    'GET /api/problem?question_id={id}&user_id={id}',
                    'POST /api/submit',
                    'GET /api/attempts?problem_id={id}&user_id={id}',
                    'POST /api/session',
                    'POST /api/analytics'
                )
            ));
            break;
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

/**
 * Handle problem retrieval requests
 */
function handleProblemRequest($loader, $method) {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }

    $questionId = $_GET['question_id'] ?? null;
    $userId = $_GET['user_id'] ?? null;

    if (!$questionId || !$userId) {
        sendError('Missing required parameters: question_id, user_id', 400);
    }

    $problem = $loader->loadProblem($questionId, $userId);

    if (!$problem) {
        sendError('Problem not found', 404);
    }

    sendResponse(array(
        'status' => 'success',
        'data' => $problem
    ));
}

/**
 * Handle answer submission
 */
function handleSubmitRequest($loader, $method) {
    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $problemId = $input['problem_id'] ?? null;
    $userId = $input['user_id'] ?? null;
    $answer = $input['answer'] ?? null;
    $timeSpent = $input['time_spent'] ?? 0;

    if (!$problemId || !$userId || !$answer) {
        sendError('Missing required parameters: problem_id, user_id, answer', 400);
    }

    $result = $loader->recordAttempt($problemId, $userId, $answer, $timeSpent);

    sendResponse(array(
        'status' => 'success',
        'data' => $result
    ));
}

/**
 * Handle attempts retrieval
 */
function handleAttemptsRequest($loader, $method) {
    if ($method !== 'GET') {
        sendError('Method not allowed', 405);
    }

    $problemId = $_GET['problem_id'] ?? null;
    $userId = $_GET['user_id'] ?? null;

    if (!$problemId || !$userId) {
        sendError('Missing required parameters: problem_id, user_id', 400);
    }

    $attempts = $loader->getStudentAttempts($problemId, $userId);

    sendResponse(array(
        'status' => 'success',
        'data' => $attempts
    ));
}

/**
 * Handle session updates
 */
function handleSessionRequest($loader, $method) {
    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $sessionToken = $input['session_token'] ?? null;
    $currentState = $input['current_state'] ?? null;
    $cameraPosition = $input['camera_position'] ?? null;

    if (!$sessionToken) {
        sendError('Missing required parameter: session_token', 400);
    }

    $db = Vector3DDatabase::getInstance();

    // Update session
    $query = "UPDATE visualization_sessions
              SET current_state = ?,
                  last_camera_position = ?,
                  last_activity_at = NOW()
              WHERE session_token = ?";

    $stateJson = json_encode($currentState);
    $cameraJson = json_encode($cameraPosition);

    $db->execute($query, 'sss', array($stateJson, $cameraJson, $sessionToken));

    sendResponse(array(
        'status' => 'success',
        'message' => 'Session updated'
    ));
}

/**
 * Handle analytics event tracking
 */
function handleAnalyticsRequest($loader, $method) {
    if ($method !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $sessionId = $input['session_id'] ?? null;
    $problemId = $input['problem_id'] ?? null;
    $userId = $input['user_id'] ?? null;
    $eventType = $input['event_type'] ?? null;
    $eventData = $input['event_data'] ?? null;
    $cameraPosition = $input['camera_position'] ?? null;

    if (!$problemId || !$userId || !$eventType) {
        sendError('Missing required parameters', 400);
    }

    $db = Vector3DDatabase::getInstance();

    $query = "INSERT INTO analytics_events
              (session_id, problem_id, moodle_user_id, event_type, event_data, camera_position, timestamp_ms)
              VALUES (?, ?, ?, ?, ?, ?, ?)";

    $timestampMs = round(microtime(true) * 1000);
    $eventDataJson = json_encode($eventData);
    $cameraJson = json_encode($cameraPosition);

    $db->execute($query, 'iiisssi', array(
        $sessionId,
        $problemId,
        $userId,
        $eventType,
        $eventDataJson,
        $cameraJson,
        $timestampMs
    ));

    sendResponse(array(
        'status' => 'success',
        'message' => 'Event tracked'
    ));
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendResponse(array(
        'status' => 'error',
        'message' => $message
    ), $statusCode);
}
