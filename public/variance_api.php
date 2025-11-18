<?php
/**
 * Variance Vibration API Endpoints
 * RESTful API for variance vibration feature
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

require_once __DIR__ . '/../src/autoload.php';

use Alt42\Services\VarianceVibrationService;
use Alt42\Database\Connection;

// Set headers for JSON API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/variance_api.php', '', $path);

// Initialize service
try {
    $db = Connection::getInstance()->getConnection();
    $service = new VarianceVibrationService($db);
} catch (Exception $e) {
    respondWithError(500, 'Database connection failed: ' . $e->getMessage());
}

// Route requests
try {
    if ($method === 'GET' && preg_match('/^\/problems\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
        // GET /problems/{id} - Get single problem
        $problemId = $matches[1];
        handleGetProblem($service, $problemId);

    } elseif ($method === 'GET' && $path === '/problems' || $path === '') {
        // GET /problems - Get problems by category/difficulty
        handleGetProblems($service);

    } elseif ($method === 'POST' && $path === '/calculate') {
        // POST /calculate - Calculate variance stats
        handleCalculateVariance($service);

    } elseif ($method === 'POST' && $path === '/submit') {
        // POST /submit - Submit answer
        handleSubmitAnswer($service);

    } elseif ($method === 'GET' && $path === '/config') {
        // GET /config - Get vibration configuration
        handleGetConfig($service);

    } else {
        respondWithError(404, 'Endpoint not found');
    }

} catch (Exception $e) {
    respondWithError(500, 'Server error: ' . $e->getMessage());
}

/**
 * Handle GET single problem request
 */
function handleGetProblem($service, $problemId)
{
    $problem = $service->getProblemById($problemId);

    if (!$problem) {
        respondWithError(404, 'Problem not found');
    }

    respondWithSuccess($problem);
}

/**
 * Handle GET problems list request
 */
function handleGetProblems($service)
{
    $category = $_GET['category'] ?? null;
    $difficulty = $_GET['difficulty'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    if (!$category) {
        respondWithError(400, 'Category parameter is required');
    }

    $problems = $service->getProblemsByCategory($category, $difficulty, $limit, $offset);

    respondWithSuccess([
        'problems' => $problems,
        'count' => count($problems),
        'limit' => $limit,
        'offset' => $offset,
    ]);
}

/**
 * Handle POST calculate variance request
 */
function handleCalculateVariance($service)
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['values']) || !is_array($input['values'])) {
        respondWithError(400, 'Values array is required');
    }

    $values = array_map('floatval', $input['values']);
    $isSample = $input['isSample'] ?? false;

    $stats = $service->calculateVarianceStats($values, $isSample);

    // Calculate vibration info
    $config = [
        'minIntensity' => $input['minIntensity'] ?? 1,
        'maxIntensity' => $input['maxIntensity'] ?? 10,
        'varianceThreshold' => $input['varianceThreshold'] ?? 100.0,
        'useNormalizedVariance' => $input['useNormalizedVariance'] ?? true,
    ];

    $intensity = $service->varianceToIntensity($stats['variance'], $stats['mean'], $config);
    $patternType = $input['patternType'] ?? 'progressive';
    $pattern = $service->generateVibrationPattern($intensity, $patternType);

    respondWithSuccess([
        'stats' => $stats,
        'vibration' => [
            'intensity' => $intensity,
            'pattern' => $pattern,
            'patternType' => $patternType,
        ],
    ]);
}

/**
 * Handle POST submit answer request
 */
function handleSubmitAnswer($service)
{
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required = ['problemId', 'studentId', 'submittedAnswer', 'timeSpentSeconds'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            respondWithError(400, "Field '{$field}' is required");
        }
    }

    $problemId = $input['problemId'];
    $studentId = $input['studentId'];
    $submittedAnswer = (float)$input['submittedAnswer'];
    $timeSpentSeconds = (int)$input['timeSpentSeconds'];
    $deviceInfo = $input['deviceInfo'] ?? [];

    try {
        $result = $service->submitAnswer(
            $problemId,
            $studentId,
            $submittedAnswer,
            $timeSpentSeconds,
            $deviceInfo
        );

        respondWithSuccess($result);

    } catch (Exception $e) {
        respondWithError(400, $e->getMessage());
    }
}

/**
 * Handle GET config request
 */
function handleGetConfig($service)
{
    // This would typically fetch from settings table
    // For now, return default config
    $config = [
        'vibration' => [
            'minIntensity' => 1,
            'maxIntensity' => 10,
            'varianceThreshold' => 100.0,
            'useNormalizedVariance' => true,
            'vibrationEnabled' => true,
            'patternType' => 'progressive',
            'debounceMs' => 300,
        ],
        'tolerance' => [
            'easy' => 0.15,
            'medium' => 0.10,
            'hard' => 0.05,
        ],
        'display' => [
            'showStats' => true,
            'autoVibrate' => true,
            'showHints' => true,
            'showVisualization' => true,
            'language' => 'ko',
        ],
    ];

    respondWithSuccess($config);
}

/**
 * Send success response
 */
function respondWithSuccess($data)
{
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 */
function respondWithError($code, $message)
{
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message,
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
