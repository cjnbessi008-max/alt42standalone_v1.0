<?php
/**
 * Calm Growth App - Database Configuration
 * MySQL 5.7 / Moodle 3.7 compatible
 */

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'calm_growth_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle database configuration (read-only access)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_'); // Default Moodle table prefix

// Application settings
define('APP_NAME', 'Calm Growth');
define('APP_VERSION', '1.0.0');
define('TIMEZONE', 'Asia/Seoul');

// Set timezone
date_default_timezone_set(TIMEZONE);

// CORS headers for API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

/**
 * Get database connection
 * @param bool $useMoodle - Connect to Moodle DB instead
 * @return PDO
 */
function getDBConnection($useMoodle = false) {
    try {
        if ($useMoodle) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                MOODLE_DB_HOST,
                MOODLE_DB_NAME,
                DB_CHARSET
            );
            $pdo = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS);
        } else {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );
            $pdo = new PDO($dsn, DB_USER, DB_PASS);
        }

        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => $e->getMessage()
        ]);
        exit;
    }
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}
