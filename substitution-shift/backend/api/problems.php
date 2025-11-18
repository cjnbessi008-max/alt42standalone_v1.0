<?php
/**
 * Problems API Endpoint
 *
 * GET /api/problems.php - Get all problems or specific problem
 * GET /api/problems.php?id={id} - Get problem by ID
 * GET /api/problems.php?moodle_id={id} - Get problem by Moodle question ID
 * GET /api/problems.php?random=1&difficulty={level} - Get random problem
 */

header('Content-Type: application/json; charset=utf-8');

// Include required files
require_once '../config/config.php';
require_once '../config/Database.php';
require_once '../models/Problem.php';

// CORS headers
if (in_array($_SERVER['HTTP_ORIGIN'] ?? '', ALLOWED_ORIGINS)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Only GET is supported.'
    ]);
    exit();
}

try {
    // Database connection
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception('Database connection failed');
    }

    // Create Problem instance
    $problem = new Problem($db);

    // Get specific problem by ID
    if (isset($_GET['id'])) {
        $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);

        if ($id === false || $id < 1) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid problem ID'
            ]);
            exit();
        }

        $result = $problem->getById($id);

        if ($result) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Problem not found'
            ]);
        }
        exit();
    }

    // Get problem by Moodle question ID
    if (isset($_GET['moodle_id'])) {
        $moodle_id = filter_var($_GET['moodle_id'], FILTER_VALIDATE_INT);

        if ($moodle_id === false || $moodle_id < 1) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid Moodle question ID'
            ]);
            exit();
        }

        $result = $problem->getByMoodleQuestionId($moodle_id);

        if ($result) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Problem not found for Moodle question ID: ' . $moodle_id
            ]);
        }
        exit();
    }

    // Get random problem
    if (isset($_GET['random']) && $_GET['random'] == '1') {
        $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : null;

        // Validate difficulty
        $valid_difficulties = ['easy', 'medium', 'hard'];
        if ($difficulty && !in_array($difficulty, $valid_difficulties)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid difficulty level. Must be: easy, medium, or hard'
            ]);
            exit();
        }

        $result = $problem->getRandom($difficulty);

        if ($result) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'No problems found'
            ]);
        }
        exit();
    }

    // Get all problems with optional filters
    $filters = [];
    if (isset($_GET['difficulty'])) {
        $filters['difficulty'] = $_GET['difficulty'];
    }
    if (isset($_GET['category'])) {
        $filters['category'] = $_GET['category'];
    }

    $limit = isset($_GET['limit']) ? filter_var($_GET['limit'], FILTER_VALIDATE_INT) : 20;
    $offset = isset($_GET['offset']) ? filter_var($_GET['offset'], FILTER_VALIDATE_INT) : 0;

    // Validate limit and offset
    if ($limit === false || $limit < 1 || $limit > 100) {
        $limit = 20;
    }
    if ($offset === false || $offset < 0) {
        $offset = 0;
    }

    $results = $problem->getAll($filters, $limit, $offset);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count' => count($results),
        'data' => $results
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . ($DEBUG_MODE ? $e->getMessage() : 'Internal error')
    ]);

    if (DEBUG_MODE) {
        error_log("API Error: " . $e->getMessage());
        error_log("Trace: " . $e->getTraceAsString());
    }
}

?>
