<?php
/**
 * API Entry Point
 * Math Concept Game System
 *
 * Routes all API requests to appropriate handlers
 */

// Include configuration
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/helpers/Auth.php';

// Start session
session_name(SESSION_NAME);
session_start();

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set JSON content type
header('Content-Type: application/json; charset=utf-8');

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path); // Remove /api prefix if present
$path = trim($path, '/');

// Parse path segments
$segments = explode('/', $path);
$resource = $segments[0] ?? '';
$action = $segments[1] ?? '';
$id = $segments[2] ?? '';

// Route to appropriate controller
try {
    switch ($resource) {
        case 'auth':
            require_once __DIR__ . '/controllers/AuthController.php';
            $controller = new AuthController();
            break;

        case 'games':
            require_once __DIR__ . '/controllers/GameController.php';
            $controller = new GameController();
            break;

        case 'cards':
            require_once __DIR__ . '/controllers/CardController.php';
            $controller = new CardController();
            break;

        case 'progress':
            require_once __DIR__ . '/controllers/ProgressController.php';
            $controller = new ProgressController();
            break;

        case 'moodle':
            require_once __DIR__ . '/controllers/MoodleController.php';
            $controller = new MoodleController();
            break;

        case 'points':
            require_once __DIR__ . '/controllers/PointsController.php';
            $controller = new PointsController();
            break;

        case '':
            // API root - return API info
            Response::success([
                'name' => APP_NAME,
                'version' => APP_VERSION,
                'status' => 'operational',
                'endpoints' => [
                    '/auth/login',
                    '/auth/logout',
                    '/auth/me',
                    '/games',
                    '/games/{concept_name}/launch',
                    '/cards',
                    '/progress',
                    '/moodle/trigger',
                    '/moodle/complete',
                ]
            ]);
            break;

        default:
            Response::error('Endpoint not found', 404);
    }

    // Handle the request
    $controller->handleRequest($method, $action, $id);

} catch (Exception $e) {
    // Log error
    error_log("API Error: " . $e->getMessage());

    // Return error response
    if (APP_ENV === 'development') {
        Response::error($e->getMessage(), 500, [
            'trace' => $e->getTraceAsString()
        ]);
    } else {
        Response::error('Internal server error', 500);
    }
}
