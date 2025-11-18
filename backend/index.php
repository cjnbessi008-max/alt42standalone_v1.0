<?php
/**
 * Main API Router
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
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
});

// Get request path
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$path = str_replace($scriptName, '', $requestUri);
$path = parse_url($path, PHP_URL_PATH);
$path = trim($path, '/');

// Parse path segments
$segments = explode('/', $path);
$resource = $segments[0] ?? '';
$action = $segments[1] ?? '';

// Route request
switch ($resource) {
    case 'api':
        handleApiRequest($action, array_slice($segments, 2));
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Endpoint not found'
        ]);
        break;
}

/**
 * Handle API requests
 */
function handleApiRequest($endpoint, $params) {
    switch ($endpoint) {
        case 'filters':
            require_once __DIR__ . '/api/filters.php';
            break;

        case 'moodle':
            require_once __DIR__ . '/api/moodle.php';
            break;

        case 'problems':
            require_once __DIR__ . '/api/problems.php';
            break;

        case 'sessions':
            require_once __DIR__ . '/api/sessions.php';
            break;

        case 'students':
            require_once __DIR__ . '/api/students.php';
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'API endpoint not found'
            ]);
            break;
    }
}

/**
 * Get request body
 */
function getRequestBody() {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?? [];
}

/**
 * Send JSON response
 */
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}
