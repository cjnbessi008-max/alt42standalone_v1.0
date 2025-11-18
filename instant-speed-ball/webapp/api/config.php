<?php
/**
 * Database Configuration
 * MySQL 5.7 / Moodle 3.7 Compatible
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle table prefix (adjust if different)
define('MOODLE_PREFIX', 'mdl_');

// Custom table names
define('TABLE_PROBLEMS', 'isb_problems');
define('TABLE_ATTEMPTS', 'isb_student_attempts');

/**
 * Get database connection
 */
function getDBConnection() {
    static $conn = null;

    if ($conn === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    return $conn;
}

/**
 * Get current Moodle user ID (if integrated with Moodle)
 */
function getMoodleUserId() {
    // If integrated with Moodle, get user from session
    if (defined('MOODLE_INTERNAL')) {
        global $USER;
        return $USER->id;
    }

    // For standalone testing, use session or default
    session_start();
    return $_SESSION['user_id'] ?? 1;
}

/**
 * Send JSON response
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendJSON(['error' => $message], $statusCode);
}

// Enable error reporting for development
// Comment out in production
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORS headers (adjust for production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
