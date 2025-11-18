<?php
/**
 * Application Configuration
 */

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Timezone
date_default_timezone_set('Asia/Seoul');

// CORS Settings
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Application Constants
define('APP_NAME', 'Logical Linker');
define('APP_VERSION', '1.0.0');
define('API_VERSION', 'v1');

// Paths
define('ROOT_PATH', dirname(__DIR__));
define('CONFIG_PATH', ROOT_PATH . '/config');
define('API_PATH', ROOT_PATH . '/api');
define('MODELS_PATH', ROOT_PATH . '/models');
define('LOGS_PATH', ROOT_PATH . '/logs');

// Moodle Configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app');

// Session Configuration
define('SESSION_TIMEOUT', 1800); // 30 minutes

// Application Settings
define('MAX_ATTEMPTS_PER_QUESTION', 3);
define('ANIMATION_ENABLED', true);
define('DEBUG_MODE', getenv('DEBUG_MODE') === 'true');

// Load autoloader
spl_autoload_register(function ($class) {
    $file = MODELS_PATH . '/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Utility Functions
/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => [
            'message' => $message,
            'code' => $statusCode
        ]
    ];

    if ($details !== null && DEBUG_MODE) {
        $response['error']['details'] = $details;
    }

    sendResponse($response, $statusCode);
}

/**
 * Validate required fields
 */
function validateRequired($data, $requiredFields) {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }
}

/**
 * Sanitize input
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Get request method
 */
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'];
}

/**
 * Get request body
 */
function getRequestBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

/**
 * Log message
 */
function logMessage($message, $level = 'INFO') {
    $logFile = LOGS_PATH . '/app.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
