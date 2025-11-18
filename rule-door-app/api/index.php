<?php
/**
 * Rule Door API - Main Entry Point
 * RESTful API for managing rules and door states
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

// Include configuration
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle_config.php';

// Include models
require_once __DIR__ . '/../models/Rule.php';
require_once __DIR__ . '/../models/DoorState.php';
require_once __DIR__ . '/../models/ProblemAttempt.php';
require_once __DIR__ . '/../moodle-integration/MoodleConnector.php';

// API Response Helper
class ApiResponse {
    public static function success($data, $message = 'Success', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    public static function error($message, $code = 400, $errors = null) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
}

// Get request method and path
$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path_parts = array_filter(explode('/', $path));
$path_parts = array_values($path_parts);

// Get request body for POST/PUT requests
$request_body = file_get_contents('php://input');
$data = json_decode($request_body, true);

// Route handling
try {
    // Health check endpoint
    if ($path_parts[0] === 'health' && $request_method === 'GET') {
        ApiResponse::success(['status' => 'healthy'], 'API is running');
    }

    // Rule endpoints
    if ($path_parts[0] === 'rules') {
        require_once __DIR__ . '/rules_api.php';
        handleRulesAPI($request_method, $path_parts, $data);
    }

    // Door state endpoints
    if ($path_parts[0] === 'door-state') {
        require_once __DIR__ . '/door_state_api.php';
        handleDoorStateAPI($request_method, $path_parts, $data);
    }

    // Attempt endpoints
    if ($path_parts[0] === 'attempts') {
        require_once __DIR__ . '/attempts_api.php';
        handleAttemptsAPI($request_method, $path_parts, $data);
    }

    // Moodle integration endpoints
    if ($path_parts[0] === 'moodle') {
        require_once __DIR__ . '/moodle_api.php';
        handleMoodleAPI($request_method, $path_parts, $data);
    }

    // Statistics endpoints
    if ($path_parts[0] === 'statistics') {
        require_once __DIR__ . '/statistics_api.php';
        handleStatisticsAPI($request_method, $path_parts, $data);
    }

    // If no route matched
    ApiResponse::error('Endpoint not found', 404);

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    ApiResponse::error('Internal server error: ' . $e->getMessage(), 500);
}
