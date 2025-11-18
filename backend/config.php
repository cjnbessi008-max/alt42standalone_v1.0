<?php
/**
 * Inequality Arrow App - Configuration File
 * Handles database and Moodle integration settings
 */

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'inequality_arrow_db');
define('DB_USER', getenv('DB_USER') ?: 'inequality_user');
define('DB_PASS', getenv('DB_PASS') ?: 'secure_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle Integration Configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'https://your-moodle-site.com');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: 'your_moodle_webservice_token');
define('MOODLE_SERVICE', 'inequality_arrow_service');

// Application Settings
define('APP_NAME', 'Inequality Arrow');
define('APP_VERSION', '1.0.0');
define('TIMEZONE', 'Asia/Seoul');
define('SESSION_TIMEOUT', 3600); // 1 hour

// API Settings
define('API_RATE_LIMIT', 100); // requests per minute
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', ['http://localhost', 'https://your-domain.com']);

// Set timezone
date_default_timezone_set(TIMEZONE);

/**
 * Database connection using PDO
 * @return PDO
 */
function getDatabaseConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
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

    if (ENABLE_CORS) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (in_array($origin, ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Max-Age: 3600');
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Get request input data
 * @return array
 */
function getRequestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (strpos($contentType, 'application/json') !== false) {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    return array_merge($_GET, $_POST);
}

/**
 * Validate session token
 * @param string $token
 * @return array|false
 */
function validateSession($token) {
    if (empty($token)) {
        return false;
    }

    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare("
        SELECT u.*, ls.session_id, ls.moodle_course_id
        FROM users u
        JOIN learning_sessions ls ON u.id = ls.user_id
        WHERE ls.session_id = ? AND ls.end_time IS NULL
    ");
    $stmt->execute([$token]);

    return $stmt->fetch() ?: false;
}

/**
 * Log error
 * @param string $message
 * @param array $context
 */
function logError($message, $context = []) {
    $logMessage = date('Y-m-d H:i:s') . " - " . $message;
    if (!empty($context)) {
        $logMessage .= " - Context: " . json_encode($context, JSON_UNESCAPED_UNICODE);
    }
    error_log($logMessage);
}

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (ENABLE_CORS) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Max-Age: 3600');
    }
    http_response_code(200);
    exit;
}
