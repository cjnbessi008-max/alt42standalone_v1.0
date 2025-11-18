<?php
/**
 * Database Configuration for Moodle Integration
 * MySQL 5.7 + PHP 7.1.9 + Moodle 3.7
 */

// Database connection settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_CHARSET', 'utf8mb4');

// Table prefix (Moodle uses mdl_ by default)
define('TABLE_PREFIX', 'mdl_');

// Custom table names for this application
define('TABLE_CRITICAL_POINT_PROBLEMS', TABLE_PREFIX . 'critical_point_problems');
define('TABLE_CRITICAL_POINT_ATTEMPTS', TABLE_PREFIX . 'critical_point_attempts');
define('TABLE_CRITICAL_POINT_SESSIONS', TABLE_PREFIX . 'critical_point_sessions');

// Application settings
define('APP_DEBUG', true);
define('APP_TIMEZONE', 'Asia/Seoul');

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

/**
 * Get database connection
 * @return PDO Database connection
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (APP_DEBUG) {
                die(json_encode([
                    'error' => true,
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ]));
            } else {
                die(json_encode([
                    'error' => true,
                    'message' => 'Database connection failed'
                ]));
            }
        }
    }

    return $pdo;
}

/**
 * Send JSON response
 * @param array $data Response data
 * @param int $statusCode HTTP status code
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Log error
 * @param string $message Error message
 * @param Exception $exception Optional exception
 */
function logError($message, $exception = null) {
    $logFile = __DIR__ . '/../logs/error.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message\n";

    if ($exception) {
        $logMessage .= "Exception: " . $exception->getMessage() . "\n";
        $logMessage .= "Trace: " . $exception->getTraceAsString() . "\n";
    }

    $logMessage .= str_repeat('-', 80) . "\n";

    file_put_contents($logFile, $logMessage, FILE_APPEND);
}
