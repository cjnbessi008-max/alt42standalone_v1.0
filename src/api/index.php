<?php
/**
 * API Router
 * Main entry point for all API requests
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load configuration
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/MoodleSync.php';
require_once __DIR__ . '/../lib/AvoidanceDetector.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/src/api/', '', $path);
$path = trim($path, '/');

// Parse path segments
$segments = explode('/', $path);
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;

// Get request body for POST/PUT
$input = null;
if (in_array($method, ['POST', 'PUT'])) {
    $input = json_decode(file_get_contents('php://input'), true);
}

try {
    // Route handling
    switch ($resource) {
        case 'sync':
            require_once __DIR__ . '/sync.php';
            break;

        case 'detection':
            require_once __DIR__ . '/detection.php';
            break;

        case 'students':
            require_once __DIR__ . '/students.php';
            break;

        case 'concepts':
            require_once __DIR__ . '/concepts.php';
            break;

        case 'patterns':
            require_once __DIR__ . '/patterns.php';
            break;

        case 'dashboard':
            require_once __DIR__ . '/dashboard.php';
            break;

        case 'health':
            // Health check endpoint
            send_success_response([
                'status' => 'healthy',
                'version' => APP_VERSION,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;

        default:
            send_error_response('Unknown resource: ' . $resource, 404);
    }

} catch (Exception $e) {
    log_message('API Error: ' . $e->getMessage(), 'ERROR');
    send_error_response($e->getMessage(), 500, ENABLE_DEBUG ? $e->getTrace() : null);
}
