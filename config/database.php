<?php
/**
 * Database Configuration
 * For Dual Derivative Sync System
 * MySQL 5.7 Compatible
 */

// Database connection parameters
define('DB_HOST', 'localhost');
define('DB_NAME', 'derivative_sync');
define('DB_USER', 'root');  // Change in production
define('DB_PASS', '');      // Change in production
define('DB_CHARSET', 'utf8mb4');

// Moodle configuration
define('MOODLE_URL', ''); // Set your Moodle URL (e.g., 'https://moodle.example.com')
define('MOODLE_WS_TOKEN', ''); // Set your Moodle web service token

// Application settings
define('APP_DEBUG', true); // Set to false in production
define('APP_TIMEZONE', 'Asia/Seoul');
define('SESSION_TIMEOUT', 3600); // 1 hour in seconds

// Security settings
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', '*'); // Change to specific domain in production
define('MAX_UPLOAD_SIZE', 5242880); // 5MB

// Logging
define('ENABLE_LOGGING', true);
define('LOG_FILE', __DIR__ . '/../logs/app.log');

/**
 * Get database connection
 * @return PDO Database connection
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
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

            // Set timezone
            $pdo->exec("SET time_zone = '+09:00'"); // Korea timezone

        } catch (PDOException $e) {
            logError('Database connection failed: ' . $e->getMessage());
            throw new Exception('데이터베이스 연결 실패');
        }
    }

    return $pdo;
}

/**
 * Log error message
 * @param string $message Error message
 */
function logError($message) {
    if (!ENABLE_LOGGING) return;

    $logDir = dirname(LOG_FILE);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] ERROR: {$message}\n";

    file_put_contents(LOG_FILE, $logMessage, FILE_APPEND);
}

/**
 * Log info message
 * @param string $message Info message
 */
function logInfo($message) {
    if (!ENABLE_LOGGING || !APP_DEBUG) return;

    $logDir = dirname(LOG_FILE);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] INFO: {$message}\n";

    file_put_contents(LOG_FILE, $logMessage, FILE_APPEND);
}

/**
 * Set CORS headers
 */
function setCorsHeaders() {
    if (!ENABLE_CORS) return;

    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 3600');

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Send JSON response
 * @param mixed $data Response data
 * @param int $statusCode HTTP status code
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 */
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Send success response
 * @param mixed $data Response data
 * @param string $message Success message
 */
function sendSuccessResponse($data, $message = null) {
    $response = [
        'success' => true,
        'data' => $data
    ];

    if ($message !== null) {
        $response['message'] = $message;
    }

    sendJsonResponse($response, 200);
}

/**
 * Validate required fields
 * @param array $data Input data
 * @param array $required Required field names
 * @return bool True if all required fields present
 */
function validateRequiredFields($data, $required) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            return false;
        }
    }
    return true;
}

/**
 * Sanitize input
 * @param mixed $input Input to sanitize
 * @return mixed Sanitized input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }

    if (is_string($input)) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    return $input;
}

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

// Set CORS headers
setCorsHeaders();
