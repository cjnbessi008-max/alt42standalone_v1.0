<?php
/**
 * Moodle Bridge API
 * Handles communication between Roll Along app and Moodle LMS
 *
 * Requirements:
 * - PHP 7.1.9+
 * - MySQL 5.7+
 * - Moodle 3.7+
 */

// Error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers (adjust for production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Session-ID');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load configuration
require_once __DIR__ . '/../config/db-config.php';
require_once __DIR__ . '/MoodleConnector.php';

// Initialize database connection
try {
    $db = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500);
}

// Initialize Moodle connector
$moodle = new MoodleConnector($db);

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? null;

// Route requests
try {
    switch ($action) {
        case 'getProblem':
            handleGetProblem($moodle);
            break;

        case 'submitProgress':
            handleSubmitProgress($moodle);
            break;

        case 'submitAnswer':
            handleSubmitAnswer($moodle);
            break;

        case 'getStudentData':
            handleGetStudentData($moodle);
            break;

        case 'health':
            sendSuccess(['status' => 'ok', 'timestamp' => time()]);
            break;

        default:
            sendError('Invalid action', 400);
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}

/**
 * Handle get problem request
 */
function handleGetProblem($moodle) {
    $problemId = $_GET['problemId'] ?? null;

    if (!$problemId) {
        sendError('Problem ID is required', 400);
    }

    $problem = $moodle->getProblem($problemId);

    if ($problem) {
        sendSuccess([
            'problem' => $problem
        ]);
    } else {
        sendError('Problem not found', 404);
    }
}

/**
 * Handle submit progress request
 */
function handleSubmitProgress($moodle) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError('Invalid request data', 400);
    }

    $required = ['userId', 'courseId', 'problemId', 'progress'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }

    $result = $moodle->saveProgress(
        $data['userId'],
        $data['courseId'],
        $data['problemId'],
        $data['progress'],
        $data['sessionId'] ?? null
    );

    if ($result) {
        sendSuccess([
            'message' => 'Progress saved successfully',
            'id' => $result
        ]);
    } else {
        sendError('Failed to save progress', 500);
    }
}

/**
 * Handle submit answer request
 */
function handleSubmitAnswer($moodle) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        sendError('Invalid request data', 400);
    }

    $required = ['userId', 'courseId', 'problemId', 'answer'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }

    $result = $moodle->submitAnswer(
        $data['userId'],
        $data['courseId'],
        $data['problemId'],
        $data['answer'],
        $data['sessionId'] ?? null
    );

    if ($result['success']) {
        sendSuccess([
            'message' => 'Answer submitted successfully',
            'grade' => $result['grade'] ?? null,
            'feedback' => $result['feedback'] ?? null
        ]);
    } else {
        sendError('Failed to submit answer', 500);
    }
}

/**
 * Handle get student data request
 */
function handleGetStudentData($moodle) {
    $userId = $_GET['userId'] ?? null;
    $courseId = $_GET['courseId'] ?? null;

    if (!$userId || !$courseId) {
        sendError('User ID and Course ID are required', 400);
    }

    $data = $moodle->getStudentData($userId, $courseId);

    if ($data) {
        sendSuccess([
            'student' => $data
        ]);
    } else {
        sendError('Student data not found', 404);
    }
}

/**
 * Send success response
 */
function sendSuccess($data) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ]);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => time()
    ]);
    exit();
}
