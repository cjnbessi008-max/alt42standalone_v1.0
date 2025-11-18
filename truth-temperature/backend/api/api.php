<?php
/**
 * Truth Temperature REST API
 * Endpoints for Moodle integration and smartphone app
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../models/Problem.php';
require_once '../models/Session.php';
require_once '../models/Response.php';
require_once '../utils/InequalityEvaluator.php';

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Get endpoint
$endpoint = isset($path_parts[count($path_parts) - 1]) ? $path_parts[count($path_parts) - 1] : '';

// Route requests
try {
    switch ($endpoint) {
        case 'problems':
            if ($method === 'GET') {
                getProblems();
            } elseif ($method === 'POST') {
                createProblem();
            }
            break;

        case 'submit':
            if ($method === 'POST') {
                submitAnswer();
            }
            break;

        case 'session':
            if ($method === 'POST') {
                createSession();
            } elseif ($method === 'GET') {
                getSession();
            }
            break;

        case 'temperature':
            if ($method === 'GET') {
                getTemperature();
            }
            break;

        default:
            sendResponse(404, ['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    sendResponse(500, ['error' => $e->getMessage()]);
}

/**
 * Get all problems or filtered by category/difficulty
 */
function getProblems() {
    $db = Database::getInstance()->getConnection();
    $problem = new Problem($db);

    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : null;

    $problems = $problem->getAll($category, $difficulty);
    sendResponse(200, ['success' => true, 'data' => $problems]);
}

/**
 * Create a new problem
 */
function createProblem() {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['question_text']) || !isset($data['inequality_expression'])) {
        sendResponse(400, ['error' => 'Missing required fields']);
        return;
    }

    $db = Database::getInstance()->getConnection();
    $problem = new Problem($db);

    $problem_id = $problem->create($data);

    if ($problem_id) {
        sendResponse(201, ['success' => true, 'problem_id' => $problem_id]);
    } else {
        sendResponse(500, ['error' => 'Failed to create problem']);
    }
}

/**
 * Submit an answer and get temperature feedback
 */
function submitAnswer() {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['session_id']) || !isset($data['problem_id']) || !isset($data['user_answer'])) {
        sendResponse(400, ['error' => 'Missing required fields']);
        return;
    }

    $db = Database::getInstance()->getConnection();
    $problem = new Problem($db);
    $response_model = new Response($db);
    $evaluator = new InequalityEvaluator();

    // Get problem details
    $problem_data = $problem->getById($data['problem_id']);

    if (!$problem_data) {
        sendResponse(404, ['error' => 'Problem not found']);
        return;
    }

    // Evaluate inequality
    $correct_answer = $evaluator->evaluate(
        $problem_data['left_side'],
        $problem_data['operator'],
        $problem_data['right_side']
    );

    $user_answer = filter_var($data['user_answer'], FILTER_VALIDATE_BOOLEAN);
    $is_correct = ($user_answer === $correct_answer);

    // Calculate temperature based on correct answer (not user's answer)
    $temperature = calculateTemperature($correct_answer);

    // Save response
    $response_id = $response_model->create([
        'session_id' => $data['session_id'],
        'problem_id' => $data['problem_id'],
        'user_answer' => $user_answer,
        'is_correct' => $is_correct,
        'temperature_displayed' => $temperature,
        'response_time_ms' => isset($data['response_time_ms']) ? $data['response_time_ms'] : null
    ]);

    // Log temperature
    logTemperature($db, $data['session_id'], $data['problem_id'], $temperature, $correct_answer);

    sendResponse(200, [
        'success' => true,
        'is_correct' => $is_correct,
        'correct_answer' => $correct_answer,
        'temperature' => $temperature,
        'temperature_type' => getTemperatureType($temperature),
        'response_id' => $response_id
    ]);
}

/**
 * Create a new session
 */
function createSession() {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['moodle_user_id'])) {
        sendResponse(400, ['error' => 'Missing moodle_user_id']);
        return;
    }

    $db = Database::getInstance()->getConnection();
    $session = new Session($db);

    $session_data = [
        'moodle_user_id' => $data['moodle_user_id'],
        'username' => isset($data['username']) ? $data['username'] : null,
        'ip_address' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null
    ];

    $session_id = $session->create($session_data);

    if ($session_id) {
        $session_token = $session->getToken($session_id);
        sendResponse(201, [
            'success' => true,
            'session_id' => $session_id,
            'session_token' => $session_token
        ]);
    } else {
        sendResponse(500, ['error' => 'Failed to create session']);
    }
}

/**
 * Get session information
 */
function getSession() {
    $session_id = isset($_GET['session_id']) ? intval($_GET['session_id']) : 0;

    if ($session_id === 0) {
        sendResponse(400, ['error' => 'Missing session_id']);
        return;
    }

    $db = Database::getInstance()->getConnection();
    $session = new Session($db);

    $session_data = $session->getById($session_id);

    if ($session_data) {
        sendResponse(200, ['success' => true, 'data' => $session_data]);
    } else {
        sendResponse(404, ['error' => 'Session not found']);
    }
}

/**
 * Get current temperature for a session
 */
function getTemperature() {
    $session_id = isset($_GET['session_id']) ? intval($_GET['session_id']) : 0;

    if ($session_id === 0) {
        sendResponse(400, ['error' => 'Missing session_id']);
        return;
    }

    $db = Database::getInstance()->getConnection();

    $stmt = $db->prepare("
        SELECT temperature_value, temperature_type, is_truth
        FROM temperature_logs
        WHERE session_id = ?
        ORDER BY logged_at DESC
        LIMIT 1
    ");
    $stmt->execute([$session_id]);
    $temp_data = $stmt->fetch();

    if ($temp_data) {
        sendResponse(200, [
            'success' => true,
            'temperature' => $temp_data['temperature_value'],
            'temperature_type' => $temp_data['temperature_type'],
            'is_truth' => (bool)$temp_data['is_truth']
        ]);
    } else {
        sendResponse(404, ['error' => 'No temperature data found']);
    }
}

/**
 * Calculate temperature based on truth value
 */
function calculateTemperature($is_true) {
    if ($is_true) {
        // True: warm to hot (30-50 degrees)
        return rand(30, 50);
    } else {
        // False: cold to cool (-20 to 10 degrees)
        return rand(-20, 10);
    }
}

/**
 * Get temperature type based on value
 */
function getTemperatureType($temperature) {
    if ($temperature < 0) {
        return 'cold';
    } elseif ($temperature < 20) {
        return 'cool';
    } elseif ($temperature < 35) {
        return 'warm';
    } else {
        return 'hot';
    }
}

/**
 * Log temperature to database
 */
function logTemperature($db, $session_id, $problem_id, $temperature, $is_truth) {
    $stmt = $db->prepare("
        INSERT INTO temperature_logs (session_id, problem_id, temperature_value, temperature_type, is_truth)
        VALUES (?, ?, ?, ?, ?)
    ");

    $temp_type = getTemperatureType($temperature);
    $stmt->execute([$session_id, $problem_id, $temperature, $temp_type, $is_truth]);
}

/**
 * Send JSON response
 */
function sendResponse($status_code, $data) {
    http_response_code($status_code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}
