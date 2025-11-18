<?php
/**
 * API Router
 * Handles all API requests
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/controllers/ApiController.php';

// Enable CORS (adjust for production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Parse request
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$requestUri = strtok($requestUri, '?');

// Remove /api.php prefix if present
$requestUri = preg_replace('#^/api\.php#', '', $requestUri);

// Remove /api/v1 prefix
$requestUri = preg_replace('#^/api/v1#', '', $requestUri);

// Create controller
$controller = new ApiController();

// Route the request
try {
    // Questions routes
    if (preg_match('#^/questions/(\d+)$#', $requestUri, $matches)) {
        if ($requestMethod === 'GET') {
            $controller->getQuestion($matches[1]);
        }
    }
    else if (preg_match('#^/questions/(\d+)/components$#', $requestUri, $matches)) {
        if ($requestMethod === 'GET') {
            $components = $controller->getComponents($matches[1]);
            echo json_encode(['success' => true, 'components' => $components]);
        }
    }

    // Assembly routes
    else if ($requestUri === '/assembly/validate') {
        if ($requestMethod === 'POST') {
            $controller->validateAssembly();
        }
    }
    else if ($requestUri === '/assembly/save') {
        if ($requestMethod === 'POST') {
            $controller->saveAssembly();
        }
    }

    // Interactions
    else if ($requestUri === '/interactions/log') {
        if ($requestMethod === 'POST') {
            $controller->logInteraction();
        }
    }

    // Moodle sync
    else if (preg_match('#^/moodle/sync/(\d+)$#', $requestUri, $matches)) {
        if ($requestMethod === 'POST') {
            $controller->syncFromMoodle($matches[1]);
        }
    }

    // Student progress
    else if (preg_match('#^/students/(\d+)/progress$#', $requestUri, $matches)) {
        if ($requestMethod === 'GET') {
            $controller->getStudentProgress($matches[1]);
        }
    }

    // 404 - Not found
    else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Endpoint not found',
            'request_uri' => $requestUri,
            'method' => $requestMethod
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => APP_DEBUG ? $e->getMessage() : 'Internal server error'
    ]);
}
