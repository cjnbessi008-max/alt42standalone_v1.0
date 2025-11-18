<?php
/**
 * Function Mood API Endpoints
 * RESTful API for function analysis and mood visualization
 * PHP 7.1.9
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/FunctionAnalyzer.php';
require_once __DIR__ . '/../moodle-integration/MoodleConnector.php';

// Set JSON response header
header('Content-Type: application/json');

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : '';

// Route the request
try {
    switch ($path) {
        case 'analyze':
            handleAnalyze();
            break;

        case 'problem':
            handleProblem();
            break;

        case 'sync':
            handleSync();
            break;

        case 'moods':
            handleMoods();
            break;

        case 'test-connection':
            handleTestConnection();
            break;

        default:
            sendResponse(['error' => 'Invalid endpoint'], 404);
    }
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}

/**
 * Analyze a function
 * POST /api/?path=analyze
 * Body: { "function": "x^2", "domain_min": -10, "domain_max": 10 }
 */
function handleAnalyze() {
    global $method;

    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['function'])) {
        sendResponse(['error' => 'Function expression required'], 400);
        return;
    }

    $functionExpr = $input['function'];
    $domainMin = $input['domain_min'] ?? -10;
    $domainMax = $input['domain_max'] ?? 10;

    // Create a temporary problem entry
    $db = Database::getInstance();
    $problemId = $db->insert(
        "INSERT INTO problems (moodle_problem_id, moodle_course_id, problem_type, function_expression, domain_min, domain_max)
         VALUES (0, 0, 'api_request', :expr, :min, :max)",
        ['expr' => $functionExpr, 'min' => $domainMin, 'max' => $domainMax]
    );

    // Analyze the function
    $analyzer = new FunctionAnalyzer();
    $result = $analyzer->analyze($problemId, $functionExpr, $domainMin, $domainMax);

    sendResponse([
        'success' => true,
        'problem_id' => $problemId,
        'analysis' => $result
    ]);
}

/**
 * Get problem and its analysis
 * GET /api/?path=problem&id={id}
 */
function handleProblem() {
    global $method;

    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
        return;
    }

    $problemId = $_GET['id'] ?? null;

    if (!$problemId) {
        sendResponse(['error' => 'Problem ID required'], 400);
        return;
    }

    $db = Database::getInstance();

    // Get problem
    $problem = $db->fetchOne(
        "SELECT * FROM problems WHERE id = :id",
        ['id' => $problemId]
    );

    if (!$problem) {
        sendResponse(['error' => 'Problem not found'], 404);
        return;
    }

    // Get analysis
    $analyzer = new FunctionAnalyzer();
    $analysis = $analyzer->getAnalysis($problemId);

    // If no analysis exists, create one
    if (!$analysis) {
        $analysisResult = $analyzer->analyze(
            $problemId,
            $problem['function_expression'],
            $problem['domain_min'],
            $problem['domain_max']
        );

        $analysis = $analyzer->getAnalysis($problemId);
    }

    sendResponse([
        'success' => true,
        'problem' => $problem,
        'analysis' => $analysis
    ]);
}

/**
 * Sync problems from Moodle
 * POST /api/?path=sync
 * Body: { "course_id": 123 }
 */
function handleSync() {
    global $method;

    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['course_id'])) {
        sendResponse(['error' => 'Course ID required'], 400);
        return;
    }

    $courseId = $input['course_id'];

    $connector = new MoodleConnector();
    $result = $connector->syncCourseProblems($courseId);

    sendResponse([
        'success' => true,
        'sync_result' => $result
    ]);
}

/**
 * Get all mood configurations
 * GET /api/?path=moods
 */
function handleMoods() {
    global $method;

    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
        return;
    }

    $db = Database::getInstance();
    $moods = $db->fetchAll(
        "SELECT * FROM mood_configurations WHERE is_active = 1 ORDER BY id"
    );

    sendResponse([
        'success' => true,
        'moods' => $moods
    ]);
}

/**
 * Test Moodle connection
 * GET /api/?path=test-connection
 */
function handleTestConnection() {
    global $method;

    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
        return;
    }

    $connector = new MoodleConnector();
    $result = $connector->testConnection();

    sendResponse($result);
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
