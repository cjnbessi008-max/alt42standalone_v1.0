<?php
/**
 * API Entry Point
 * RESTful API Router
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/controllers/ProblemController.php';
require_once __DIR__ . '/../src/controllers/AttemptController.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');
$segments = explode('/', $path);

// Get request data
$data = [];
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $rawData = file_get_contents('php://input');
    $data = json_decode($rawData, true) ?? [];
}

// Get query parameters
$params = $_GET;

// Initialize controllers
$problemController = new ProblemController();
$attemptController = new AttemptController();

try {
    // Route handling
    $resource = $segments[0] ?? '';
    $id = $segments[1] ?? null;
    $action = $segments[2] ?? null;

    switch ($resource) {
        case 'problems':
            handleProblemsRoute($problemController, $method, $id, $action, $data, $params);
            break;

        case 'attempts':
            handleAttemptsRoute($attemptController, $method, $id, $action, $data, $params);
            break;

        case 'health':
            echo json_encode([
                'status' => 'healthy',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => APP_VERSION
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => APP_ENV === 'development' ? $e->getMessage() : null
    ]);
}

/**
 * Handle /problems routes
 */
function handleProblemsRoute($controller, $method, $id, $action, $data, $params) {
    switch ($method) {
        case 'GET':
            if ($id) {
                if ($action === 'stats') {
                    // GET /problems/{id}/stats
                    echo $controller->stats($id);
                } elseif ($action === 'comparison') {
                    // GET /problems/{id}/comparison
                    echo $controller->getComparison($id);
                } else {
                    // GET /problems/{id}
                    echo $controller->show($id);
                }
            } elseif ($action === 'random') {
                // GET /problems/random
                echo $controller->random($params);
            } else {
                // GET /problems
                echo $controller->index($params);
            }
            break;

        case 'POST':
            if ($action === 'with-solutions') {
                // POST /problems/with-solutions
                echo $controller->createWithSolutions($data);
            } else {
                // POST /problems
                echo $controller->create($data);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
}

/**
 * Handle /attempts routes
 */
function handleAttemptsRoute($controller, $method, $id, $action, $data, $params) {
    switch ($method) {
        case 'GET':
            if ($id) {
                if ($action === 'stats') {
                    // GET /attempts/{student_id}/stats
                    echo $controller->getStats($id);
                } else {
                    // GET /attempts/{student_id}
                    echo $controller->getHistory($id, $params);
                }
            } elseif ($action === 'leaderboard') {
                // GET /attempts/leaderboard
                echo $controller->getLeaderboard($params);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Student ID required']);
            }
            break;

        case 'POST':
            // POST /attempts
            echo $controller->submit($data);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
}
