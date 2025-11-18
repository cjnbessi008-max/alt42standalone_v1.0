<?php
/**
 * API Router
 * Main entry point for all API requests
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/ProblemController.php';
require_once __DIR__ . '/SubmissionController.php';
require_once __DIR__ . '/MoodleController.php';

// Set CORS headers
header("Access-Control-Allow-Origin: " . CORS_ALLOW_ORIGIN);
header("Access-Control-Allow-Methods: " . CORS_ALLOW_METHODS);
header("Access-Control-Allow-Headers: " . CORS_ALLOW_HEADERS);
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Route the request to appropriate controller
 */
function route() {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    // Remove API base path
    $path = str_replace(API_BASE_PATH, '', $path);
    $path = trim($path, '/');

    // Split path into segments
    $segments = explode('/', $path);
    $resource = $segments[0] ?? '';

    try {
        switch ($resource) {
            case 'problems':
                $controller = new ProblemController();
                handleResource($controller, $method, $segments);
                break;

            case 'submissions':
                $controller = new SubmissionController();
                handleResource($controller, $method, $segments);
                break;

            case 'moodle':
                $controller = new MoodleController();
                handleResource($controller, $method, $segments);
                break;

            case 'health':
                echo json_encode([
                    'status' => 'ok',
                    'timestamp' => date('c'),
                    'version' => API_VERSION
                ]);
                break;

            default:
                sendError('Resource not found', 404);
                break;
        }
    } catch (Exception $e) {
        error_log("API Error: " . $e->getMessage());
        sendError($e->getMessage(), 500);
    }
}

/**
 * Handle resource routing
 */
function handleResource($controller, $method, $segments) {
    $id = $segments[1] ?? null;
    $action = $segments[2] ?? null;

    switch ($method) {
        case 'GET':
            if ($id) {
                if ($action) {
                    $controller->handleAction($id, $action);
                } else {
                    $controller->getOne($id);
                }
            } else {
                $controller->getAll();
            }
            break;

        case 'POST':
            if ($id && $action) {
                $controller->handleAction($id, $action);
            } else {
                $controller->create();
            }
            break;

        case 'PUT':
            if ($id) {
                $controller->update($id);
            } else {
                sendError('ID required for update', 400);
            }
            break;

        case 'DELETE':
            if ($id) {
                $controller->delete($id);
            } else {
                sendError('ID required for delete', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
            break;
    }
}

/**
 * Send JSON response
 */
function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'error' => true,
        'message' => $message,
        'code' => $code
    ]);
    exit();
}

/**
 * Get request body as JSON
 */
function getRequestBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?? [];
}

// Run the router
route();
