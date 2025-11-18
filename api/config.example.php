<?php
/**
 * Database Configuration Example
 * Copy this file to config.php and update with your settings
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'touchmath_graphs');
define('DB_USER', 'touchmath_user');
define('DB_PASS', 'CHANGE_THIS_PASSWORD');
define('DB_CHARSET', 'utf8mb4');

// Moodle configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'CHANGE_THIS_TO_YOUR_MOODLE_WEBSERVICE_TOKEN');

// Application settings
define('APP_DEBUG', true); // Set to false in production
define('APP_TIMEZONE', 'Asia/Seoul');

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

/**
 * Get database connection
 * @return mysqli Database connection
 */
function getDbConnection() {
    static $conn = null;

    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($conn->connect_error) {
            error_log("Database connection failed: " . $conn->connect_error);
            die(json_encode([
                'success' => false,
                'message' => 'Database connection failed'
            ]));
        }

        $conn->set_charset(DB_CHARSET);
    }

    return $conn;
}

/**
 * Send JSON response
 * @param array $data Response data
 */
function sendJsonResponse($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Log error message
 * @param string $message Error message
 */
function logError($message) {
    if (APP_DEBUG) {
        error_log("[TouchMath] " . $message);
    }
}

/**
 * Sanitize input string
 * @param string $input Input string
 * @return string Sanitized string
 */
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

// Enable CORS for development (restrict in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
