<?php
/**
 * Database Configuration for Log Gear App
 * MySQL 5.7 Connection Settings
 */

// Database credentials
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'log_gear_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Integration Settings
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Default Moodle web service

// Application Settings
define('APP_DEBUG', getenv('APP_DEBUG') ?: false);
define('SESSION_LIFETIME', 3600); // 1 hour in seconds

/**
 * Get database connection
 * @return PDO
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
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
            if (APP_DEBUG) {
                die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
            } else {
                die(json_encode(['error' => 'Database connection failed']));
            }
        }
    }

    return $pdo;
}

/**
 * Send JSON response
 * @param mixed $data
 * @param int $statusCode
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
