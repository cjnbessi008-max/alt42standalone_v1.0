<?php
/**
 * Gap Detection API
 * Provides REST endpoints for accessing gap detection results
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../moodle-integration/MoodleClient.php';
require_once __DIR__ . '/../moodle-integration/GapDetector.php';
require_once __DIR__ . '/../moodle-integration/DatabaseManager.php';

// Load configuration
$configFile = __DIR__ . '/../moodle-integration/config.php';
if (!file_exists($configFile)) {
    respondError('Configuration file not found', 500);
}

$config = require $configFile;

// Check if API is enabled
if (!$config['api']['enabled']) {
    respondError('API is disabled', 503);
}

// Authenticate request
if ($config['api']['auth_required']) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $apiKey = str_replace('Bearer ', '', $authHeader);

    if ($apiKey !== $config['api']['api_key']) {
        respondError('Unauthorized', 401);
    }
}

// Initialize services
try {
    $dbManager = new DatabaseManager($config['database']);
    $db = $dbManager->getConnection();
    $moodleClient = new MoodleClient($config['moodle']);
    $gapDetector = new GapDetector($config, $moodleClient, $db);
} catch (Exception $e) {
    respondError('Service initialization failed: ' . $e->getMessage(), 500);
}

// Route request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = array_filter(explode('/', $path));

// GET /api/gaps/student/{userId}
// GET /api/gaps/student/{userId}/course/{courseId}
if ($method === 'GET' && in_array('student', $pathParts)) {
    $userId = getPathParam($pathParts, 'student');
    $courseId = getPathParam($pathParts, 'course');

    if (!$userId) {
        respondError('User ID is required', 400);
    }

    try {
        $gaps = $gapDetector->getStudentGaps($userId, $courseId);
        respond(['gaps' => $gaps, 'count' => count($gaps)]);
    } catch (Exception $e) {
        respondError('Failed to fetch gaps: ' . $e->getMessage(), 500);
    }
}

// GET /api/gaps/course/{courseId}/statistics
elseif ($method === 'GET' && in_array('statistics', $pathParts)) {
    $courseId = getPathParam($pathParts, 'course');

    if (!$courseId) {
        respondError('Course ID is required', 400);
    }

    try {
        $stats = $gapDetector->getCourseGapStatistics($courseId);
        respond(['statistics' => $stats]);
    } catch (Exception $e) {
        respondError('Failed to fetch statistics: ' . $e->getMessage(), 500);
    }
}

// GET /api/gaps/course/{courseId}
elseif ($method === 'GET' && in_array('course', $pathParts)) {
    $courseId = getPathParam($pathParts, 'course');

    if (!$courseId) {
        respondError('Course ID is required', 400);
    }

    try {
        $stmt = $db->prepare('
            SELECT * FROM prerequisite_gaps
            WHERE course_id = ?
            ORDER BY confidence DESC, gap_severity DESC
        ');
        $stmt->execute([$courseId]);
        $gaps = $stmt->fetchAll();

        respond(['gaps' => $gaps, 'count' => count($gaps)]);
    } catch (Exception $e) {
        respondError('Failed to fetch course gaps: ' . $e->getMessage(), 500);
    }
}

// GET /api/gaps/summary
elseif ($method === 'GET' && in_array('summary', $pathParts)) {
    try {
        $stmt = $db->query('SELECT * FROM gap_summary');
        $summary = $stmt->fetchAll();

        respond(['summary' => $summary]);
    } catch (Exception $e) {
        respondError('Failed to fetch summary: ' . $e->getMessage(), 500);
    }
}

// POST /api/gaps/analyze
elseif ($method === 'POST' && in_array('analyze', $pathParts)) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['course_id']) || !isset($input['user_id'])) {
        respondError('course_id and user_id are required', 400);
    }

    $courseId = $input['course_id'];
    $userId = $input['user_id'];
    $conceptMap = $input['concept_map'] ?? [];

    // Load concept map from database if not provided
    if (empty($conceptMap)) {
        try {
            $stmt = $db->prepare('SELECT concept_name, keywords FROM concept_map WHERE course_id = ?');
            $stmt->execute([$courseId]);
            $rows = $stmt->fetchAll();

            foreach ($rows as $row) {
                $conceptMap[$row['concept_name']] = json_decode($row['keywords'], true);
            }
        } catch (Exception $e) {
            respondError('Failed to load concept map: ' . $e->getMessage(), 500);
        }
    }

    try {
        $gaps = $gapDetector->analyzeStudent($courseId, $userId, $conceptMap);
        respond([
            'success' => true,
            'gaps' => $gaps,
            'count' => count($gaps),
        ]);
    } catch (Exception $e) {
        respondError('Analysis failed: ' . $e->getMessage(), 500);
    }
}

// Unknown endpoint
else {
    respondError('Endpoint not found', 404);
}

/**
 * Send JSON response
 */
function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function respondError($message, $code = 400) {
    respond(['error' => $message], $code);
}

/**
 * Get parameter from path
 */
function getPathParam($pathParts, $paramName) {
    $key = array_search($paramName, array_values($pathParts));
    if ($key !== false && isset($pathParts[$key + 1])) {
        return $pathParts[$key + 1];
    }
    return null;
}
