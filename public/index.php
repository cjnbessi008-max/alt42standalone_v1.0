<?php
/**
 * Main Entry Point for Cognitive Recovery System
 */

require_once __DIR__ . '/../config/config.php';

// Set headers
header('Content-Type: application/json; charset=utf-8');

if (ENABLE_CORS) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple router
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

// Remove 'index.php' if present
if (isset($pathParts[0]) && $pathParts[0] === 'index.php') {
    array_shift($pathParts);
}

// API routing
if (isset($pathParts[0]) && $pathParts[0] === 'api') {
    require_once __DIR__ . '/api.php';
    exit;
}

// Default response
echo json_encode([
    'success' => true,
    'message' => 'Cognitive Recovery System API',
    'version' => APP_VERSION,
    'endpoints' => [
        'GET /api/status' => 'System status',
        'GET /api/moodle/test' => 'Test Moodle connection',
        'POST /api/moodle/sync/users' => 'Sync users from Moodle',
        'POST /api/moodle/sync/courses' => 'Sync courses from Moodle',
        'POST /api/assessments/create' => 'Create new assessment',
        'POST /api/assessments/{id}/start' => 'Start assessment',
        'POST /api/assessments/{id}/respond' => 'Submit response',
        'POST /api/assessments/{id}/complete' => 'Complete assessment',
        'GET /api/assessments/{id}' => 'Get assessment details',
        'GET /api/users/{id}/assessments' => 'Get user assessments',
        'POST /api/rest-sessions/create' => 'Create rest session',
        'POST /api/rest-sessions/{id}/start' => 'Start rest session',
        'POST /api/rest-sessions/{id}/complete' => 'Complete rest session',
        'GET /api/rest-sessions/{id}' => 'Get session details',
        'GET /api/recovery-metrics/{sessionId}' => 'Get recovery metrics',
        'POST /api/recovery-metrics/calculate' => 'Calculate recovery metrics',
        'GET /api/users/{id}/recovery-history' => 'Get user recovery history'
    ]
]);
