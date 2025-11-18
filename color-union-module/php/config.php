<?php
/**
 * Color Union Module - Configuration
 * PHP 7.1.9 Compatible
 * For integration with Moodle 3.7
 */

// Prevent direct access
defined('COLOR_UNION') or define('COLOR_UNION', true);

// Database Configuration (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'color_union_db');
define('DB_USER', 'color_union_user');
define('DB_PASS', 'your_password_here'); // Change in production
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_DIR', '/var/www/html/moodle'); // Adjust to your Moodle installation
define('MOODLE_REQUIRE', MOODLE_DIR . '/config.php');

// Module Configuration
define('MODULE_NAME', 'Color Union');
define('MODULE_VERSION', '1.0.0');
define('MODULE_PREFIX', 'cu_');

// Session Configuration
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_PREFIX', 'color_union_');

// Scoring Configuration
define('POINTS_CORRECT', 10);
define('POINTS_INCORRECT', -2);
define('TIME_BONUS_ENABLED', true);
define('TIME_BONUS_MULTIPLIER', 0.1);

// Security
define('ENABLE_CSRF_PROTECTION', true);
define('CSRF_TOKEN_NAME', 'cu_csrf_token');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php-errors.log');

// Timezone
date_default_timezone_set('Asia/Seoul');

/**
 * Database Connection Class
 */
class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            die(json_encode([
                'success' => false,
                'error' => 'Database connection failed'
            ]));
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * Helper Functions
 */

/**
 * Get database connection
 */
function getDB() {
    return Database::getInstance()->getConnection();
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
 * Validate CSRF token
 */
function validateCSRFToken($token) {
    if (!ENABLE_CSRF_PROTECTION) {
        return true;
    }

    session_start();
    return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    session_start();
    if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

/**
 * Get current user from Moodle session
 */
function getCurrentUser() {
    if (!file_exists(MOODLE_REQUIRE)) {
        return null;
    }

    require_once(MOODLE_REQUIRE);
    global $USER, $DB;

    require_login();

    if (!isloggedin() || isguestuser()) {
        return null;
    }

    return [
        'id' => $USER->id,
        'username' => $USER->username,
        'email' => $USER->email,
        'firstname' => $USER->firstname,
        'lastname' => $USER->lastname,
        'fullname' => fullname($USER)
    ];
}

/**
 * Get course module details
 */
function getCourseModuleDetails($cmid) {
    if (!file_exists(MOODLE_REQUIRE)) {
        return null;
    }

    require_once(MOODLE_REQUIRE);
    global $DB;

    $cm = get_coursemodule_from_id('colorunion', $cmid, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', ['id' => $cm->course], '*', MUST_EXIST);

    return [
        'cmid' => $cm->id,
        'course' => $course,
        'module' => $cm
    ];
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate integer
 */
function validateInt($value, $min = null, $max = null) {
    $value = filter_var($value, FILTER_VALIDATE_INT);
    if ($value === false) {
        return false;
    }

    if ($min !== null && $value < $min) {
        return false;
    }

    if ($max !== null && $value > $max) {
        return false;
    }

    return $value;
}

/**
 * Log event
 */
function logEvent($userId, $sessionId, $eventType, $eventData = null) {
    try {
        $db = getDB();
        $stmt = $db->prepare("
            INSERT INTO cu_events (user_id, session_id, event_type, event_data, ip_address, user_agent)
            VALUES (:user_id, :session_id, :event_type, :event_data, :ip_address, :user_agent)
        ");

        $stmt->execute([
            'user_id' => $userId,
            'session_id' => $sessionId,
            'event_type' => $eventType,
            'event_data' => $eventData ? json_encode($eventData) : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

        return true;
    } catch (PDOException $e) {
        error_log('Failed to log event: ' . $e->getMessage());
        return false;
    }
}

/**
 * Get or create user in local database
 */
function getOrCreateUser($moodleUserId, $username, $email, $fullName) {
    try {
        $db = getDB();

        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM cu_users WHERE moodle_user_id = :moodle_user_id");
        $stmt->execute(['moodle_user_id' => $moodleUserId]);
        $user = $stmt->fetch();

        if ($user) {
            // Update user info
            $stmt = $db->prepare("
                UPDATE cu_users
                SET username = :username, email = :email, full_name = :full_name, updated_at = NOW()
                WHERE moodle_user_id = :moodle_user_id
            ");
            $stmt->execute([
                'moodle_user_id' => $moodleUserId,
                'username' => $username,
                'email' => $email,
                'full_name' => $fullName
            ]);

            return $user['id'];
        } else {
            // Create new user
            $stmt = $db->prepare("
                INSERT INTO cu_users (moodle_user_id, username, email, full_name)
                VALUES (:moodle_user_id, :username, :email, :full_name)
            ");
            $stmt->execute([
                'moodle_user_id' => $moodleUserId,
                'username' => $username,
                'email' => $email,
                'full_name' => $fullName
            ]);

            return $db->lastInsertId();
        }
    } catch (PDOException $e) {
        error_log('Failed to get or create user: ' . $e->getMessage());
        return null;
    }
}
