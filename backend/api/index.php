<?php
/**
 * Hundred Art API - Main Entry Point
 * Simple Router for REST API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: ' . CORS_ALLOWED_METHODS);
header('Access-Control-Allow-Headers: ' . CORS_ALLOWED_HEADERS);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MoodleService.php';
require_once __DIR__ . '/routes.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/backend/api', '', $path); // Remove base path

// Parse path segments
$segments = array_filter(explode('/', $path));
$segments = array_values($segments);

// Route the request
try {
    $router = new Router();
    $response = $router->route($method, $segments);

    http_response_code($response['status'] ?? 200);
    echo json_encode($response['data'] ?? $response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => APP_DEBUG ? $e->getMessage() : 'Internal server error',
        'trace' => APP_DEBUG ? $e->getTraceAsString() : null
    ]);
}
