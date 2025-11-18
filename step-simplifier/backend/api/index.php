<?php
/**
 * Step Simplifier API Router
 * Main entry point for all API requests
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

// Exception handler
set_exception_handler(function($exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $exception->getMessage()
    ]);
});

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($path, '/');
$segments = explode('/', $path);

// Remove 'api' from segments if present
if ($segments[0] === 'api') {
    array_shift($segments);
}

// Route requests
try {
    switch ($segments[0]) {
        case 'problems':
            require_once __DIR__ . '/problems.php';
            handleProblems($method, array_slice($segments, 1));
            break;

        case 'progress':
            require_once __DIR__ . '/progress.php';
            handleProgress($method, array_slice($segments, 1));
            break;

        case 'moodle':
            require_once __DIR__ . '/moodle.php';
            handleMoodle($method, array_slice($segments, 1));
            break;

        case 'health':
            echo json_encode([
                'success' => true,
                'message' => 'Step Simplifier API is running',
                'version' => '1.0.0',
                'timestamp' => date('c')
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Endpoint not found'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Get request body as JSON
 */
function getRequestBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}
