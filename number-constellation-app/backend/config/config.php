<?php
/**
 * Application Configuration
 * Compatible with PHP 7.1.9
 */

// API Key for Moodle integration
define('API_KEY', getenv('API_KEY') ?: 'your-secret-api-key-here');

// CORS settings
define('CORS_ORIGIN', getenv('CORS_ORIGIN') ?: '*');

// Timezone
date_default_timezone_set('Asia/Seoul');

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Include database config
require_once __DIR__ . '/database.php';

/**
 * Validate API key
 * @return bool
 */
function validate_api_key() {
    $headers = getallheaders();
    $provided_key = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';
    return $provided_key === API_KEY;
}

/**
 * Set CORS headers
 */
function set_cors_headers() {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
    header('Content-Type: application/json; charset=utf-8');

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Send JSON response
 * @param mixed $data
 * @param int $status_code
 */
function send_json($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 * @param string $message
 * @param int $status_code
 */
function send_error($message, $status_code = 400) {
    send_json(['error' => $message, 'status' => $status_code], $status_code);
}
