<?php
/**
 * Database Configuration for Shape Guide Lines Generator
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'shape_guide_lines');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle integration settings
define('MOODLE_DIR', '/path/to/moodle');
define('MOODLE_DB_PREFIX', 'mdl_');

// CORS settings
define('ALLOWED_ORIGINS', '*');

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Seoul');

/**
 * Get database connection
 * @return PDO
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
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
        }
    }

    return $pdo;
}

/**
 * Set CORS headers
 */
function setCORSHeaders() {
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Send JSON response
 * @param mixed $data
 * @param int $status_code
 */
function sendJSON($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Get current user ID (integrate with Moodle session if needed)
 * @return int
 */
function getCurrentUserId() {
    // TODO: Integrate with Moodle user session
    // For now, return test user ID
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;
}
