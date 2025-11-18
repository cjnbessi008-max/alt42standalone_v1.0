<?php
/**
 * Number Beat Configuration
 *
 * Configuration for database connection and Moodle integration
 * Compatible with PHP 7.1.9, MySQL 5.7, Moodle 3.7
 */

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'number_beat');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: ''); // Web service token
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Web service name

// Application Settings
define('APP_NAME', 'Number Beat');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');
define('SESSION_LIFETIME', 3600); // 1 hour

// Game Settings
define('DEFAULT_TIME_LIMIT', 60); // seconds
define('RHYTHM_TOLERANCE', 200); // milliseconds tolerance for rhythm accuracy
define('MIN_ACCURACY_FOR_BONUS', 90); // percentage

// Scoring
define('BASE_SCORE_EASY', 100);
define('BASE_SCORE_MEDIUM', 150);
define('BASE_SCORE_HARD', 200);
define('TIME_BONUS_MULTIPLIER', 1.5);
define('RHYTHM_BONUS_MULTIPLIER', 1.2);

// Paths
define('BASE_PATH', dirname(__DIR__));
define('API_PATH', BASE_PATH . '/api');
define('PUBLIC_PATH', BASE_PATH . '/public');

// CORS Settings
define('ALLOWED_ORIGINS', getenv('ALLOWED_ORIGINS') ?: '*');

// Error Reporting (disable in production)
define('DEBUG_MODE', getenv('DEBUG_MODE') === 'true');

if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

// Database Connection Class
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed']));
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Helper Functions
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return "Missing required field: $field";
        }
    }
    return null;
}

function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}
