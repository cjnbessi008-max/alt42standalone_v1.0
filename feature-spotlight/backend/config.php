<?php
/**
 * Feature Spotlight - Configuration File
 *
 * Database and Moodle integration configuration
 * Compatible with Moodle 3.7, MySQL 5.7, PHP 7.1.9
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'moodle_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_PREFIX', 'mdl_'); // Default Moodle table prefix
define('MOODLE_VERSION', '3.7');

// Feature Spotlight Database Configuration
define('FS_DB_NAME', 'feature_spotlight');
define('FS_TABLE_PREFIX', 'fs_');

// API Configuration
define('API_VERSION', '1.0');
define('API_TIMEOUT', 30); // seconds

// Feature Detection Settings
define('DERIVATIVE_EPSILON', 0.0001); // Numerical derivative step size
define('ZERO_THRESHOLD', 0.001); // Threshold for considering value as zero
define('ANALYSIS_RANGE_MIN', -10); // Default x-axis minimum
define('ANALYSIS_RANGE_MAX', 10); // Default x-axis maximum
define('ANALYSIS_SAMPLE_POINTS', 1000); // Number of sample points for analysis

// Cache Settings
define('CACHE_ENABLED', true);
define('CACHE_TTL', 3600); // 1 hour in seconds

// Security Settings
define('ALLOW_CORS', true);
define('ALLOWED_ORIGINS', ['http://localhost', 'https://yourdomain.com']);

// Error Reporting (set to false in production)
define('DEBUG_MODE', true);

if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');

/**
 * Get database connection
 *
 * @param string $dbname Database name (default: Moodle database)
 * @return mysqli Database connection object
 */
function getDBConnection($dbname = DB_NAME) {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, $dbname);

    if ($conn->connect_error) {
        if (DEBUG_MODE) {
            die("Connection failed: " . $conn->connect_error);
        } else {
            die("Database connection error");
        }
    }

    $conn->set_charset(DB_CHARSET);
    return $conn;
}

/**
 * Send JSON response
 *
 * @param mixed $data Response data
 * @param int $statusCode HTTP status code
 */
function sendJSONResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    if (ALLOW_CORS) {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        if (in_array($origin, ALLOWED_ORIGINS) || in_array('*', ALLOWED_ORIGINS)) {
            header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
        }
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Log error message
 *
 * @param string $message Error message
 * @param string $type Error type
 */
function logError($message, $type = 'ERROR') {
    $logFile = __DIR__ . '/../logs/error.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;

    error_log($logEntry, 3, $logFile);
}
