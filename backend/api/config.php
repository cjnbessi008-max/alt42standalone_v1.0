<?php
/**
 * Database Configuration for Moodle Integration
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 */

// Prevent direct access
defined('MOODLE_INTERNAL') || die();

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'moodle');
define('DB_USER', getenv('DB_USER') ?: 'moodle_user');
define('DB_PASS', getenv('DB_PASS') ?: 'moodle_password');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', 'utf8mb4_unicode_ci');

// Moodle Table Prefix
define('MOODLE_PREFIX', getenv('MOODLE_PREFIX') ?: 'mdl_');

// API Configuration
define('API_VERSION', '1.0.0');
define('API_ENABLE_CORS', true);
define('API_DEBUG_MODE', getenv('API_DEBUG') === 'true');

// Security
define('API_SECRET_KEY', getenv('API_SECRET_KEY') ?: 'change-this-secret-key');
define('API_TOKEN_EXPIRY', 3600); // 1 hour

/**
 * Get database connection
 * @return PDO|null
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            return null;
        }
    }

    return $pdo;
}

/**
 * Send JSON response
 * @param mixed $data
 * @param int $statusCode
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    if (API_ENABLE_CORS) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 * @param string $message
 * @param int $statusCode
 */
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => time(),
    ], $statusCode);
}

/**
 * Send success response
 * @param mixed $data
 */
function sendSuccessResponse($data) {
    sendJsonResponse([
        'success' => true,
        'data' => $data,
        'timestamp' => time(),
    ], 200);
}
