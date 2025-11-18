<?php
/**
 * Application Configuration
 * Step Detection LMS
 */

// Error Reporting (Development mode)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Seoul');

// Application Settings
define('APP_NAME', 'Step Detection LMS');
define('APP_VERSION', '1.0.0');
define('APP_ENV', getenv('APP_ENV') ?: 'development');

// Paths
define('ROOT_PATH', dirname(__DIR__));
define('SRC_PATH', ROOT_PATH . '/src');
define('PUBLIC_PATH', ROOT_PATH . '/public');
define('CONFIG_PATH', ROOT_PATH . '/config');

// API Settings
define('API_VERSION', 'v1');
define('API_PREFIX', '/api/' . API_VERSION);

// Session Settings
define('SESSION_LIFETIME', 3600); // 1 hour
define('SESSION_NAME', 'step_detection_session');

// Skip Detection Thresholds
define('TIME_ANOMALY_THRESHOLD', 0.5); // 50% of average time
define('LOGICAL_INCONSISTENCY_PENALTY', 25); // Score penalty
define('HINT_DEPENDENCY_THRESHOLD', 0.7); // 70% hint usage = dependency
define('SEQUENCE_VIOLATION_PENALTY', 30); // Score penalty

// Moodle Integration
define('MOODLE_ENABLED', getenv('MOODLE_ENABLED') === 'true');
define('MOODLE_URL', getenv('MOODLE_URL') ?: '');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');

// CORS Settings
define('CORS_ALLOWED_ORIGINS', '*'); // Change in production
define('CORS_ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization');

// Security
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change-this-secret-key-in-production');
define('JWT_EXPIRATION', 3600); // 1 hour

// Load database configuration
require_once CONFIG_PATH . '/database.php';

/**
 * Autoloader for classes
 */
spl_autoload_register(function ($class) {
    $paths = [
        SRC_PATH . '/models/',
        SRC_PATH . '/controllers/',
        SRC_PATH . '/services/',
        SRC_PATH . '/utils/'
    ];

    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

/**
 * Helper function to send JSON response
 */
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Helper function to send error response
 */
function sendError($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => $message
    ];

    if ($details !== null) {
        $response['details'] = $details;
    }

    sendJson($response, $statusCode);
}

/**
 * Helper function to send success response
 */
function sendSuccess($data = null, $message = null) {
    $response = ['success' => true];

    if ($message !== null) {
        $response['message'] = $message;
    }

    if ($data !== null) {
        $response['data'] = $data;
    }

    sendJson($response);
}

/**
 * Set CORS headers
 */
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGINS);
    header('Access-Control-Allow-Methods: ' . CORS_ALLOWED_METHODS);
    header('Access-Control-Allow-Headers: ' . CORS_ALLOWED_HEADERS);

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
