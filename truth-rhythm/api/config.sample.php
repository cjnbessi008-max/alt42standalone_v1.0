<?php
/**
 * Truth Rhythm - Configuration File (Sample)
 *
 * 이 파일을 config.php로 복사하고 실제 환경에 맞게 수정하세요.
 * cp config.sample.php config.php
 */

// Error reporting (개발 환경에서만 활성화)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone 설정
date_default_timezone_set('Asia/Seoul');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'truth_rhythm');
define('DB_USER', 'root');  // 실제 환경에서는 변경 필요
define('DB_PASS', '');      // 실제 환경에서는 변경 필요
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');  // 실제 Moodle URL로 변경
define('MOODLE_TOKEN', 'your-moodle-webservice-token');  // 실제 토큰으로 변경
define('MOODLE_SERVICE', 'core_question_get_questions');

// Application Settings
define('APP_NAME', 'Truth Rhythm');
define('APP_VERSION', '1.0.0');
define('SESSION_TIMEOUT', 3600); // 1시간

// API Settings
define('API_RATE_LIMIT', 100); // 시간당 요청 제한
define('API_TIMEOUT', 30); // 초

// Sound Settings
define('SOUND_PATH', '../public/sounds/');
define('DEFAULT_TRUE_SOUND', 'true-rhythm.mp3');
define('DEFAULT_FALSE_SOUND', 'false-rhythm.mp3');

// CORS Settings
define('ALLOW_ORIGIN', '*'); // 프로덕션에서는 특정 도메인으로 변경
define('ALLOW_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('ALLOW_HEADERS', 'Content-Type, Authorization');

/**
 * Database Connection
 */
function getDbConnection() {
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
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed',
                'message' => $e->getMessage()
            ]);
            exit;
        }
    }

    return $pdo;
}

/**
 * CORS Headers
 */
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: ' . ALLOW_ORIGIN);
    header('Access-Control-Allow-Methods: ' . ALLOW_METHODS);
    header('Access-Control-Allow-Headers: ' . ALLOW_HEADERS);
    header('Content-Type: application/json; charset=UTF-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * JSON Response Helper
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Error Response Helper
 */
function errorResponse($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => $message
    ];

    if ($details !== null) {
        $response['details'] = $details;
    }

    jsonResponse($response, $statusCode);
}

/**
 * Success Response Helper
 */
function successResponse($data, $message = null) {
    $response = [
        'success' => true,
        'data' => $data
    ];

    if ($message !== null) {
        $response['message'] = $message;
    }

    jsonResponse($response, 200);
}

/**
 * Validate Required Parameters
 */
function validateParams($params, $required) {
    $missing = [];

    foreach ($required as $field) {
        if (!isset($params[$field]) || empty($params[$field])) {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        errorResponse('Missing required parameters: ' . implode(', ', $missing), 400);
    }

    return true;
}

/**
 * Sanitize Input
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }

    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Get Request Data
 */
function getRequestData() {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            return $_GET;
        case 'POST':
        case 'PUT':
        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            return $data !== null ? $data : $_POST;
        default:
            return [];
    }
}

/**
 * Session Management
 */
function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Get Current User ID
 */
function getCurrentUserId() {
    startSession();
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

/**
 * Set Current User
 */
function setCurrentUser($userId) {
    startSession();
    $_SESSION['user_id'] = $userId;
    $_SESSION['last_activity'] = time();
}

/**
 * Check if User is Logged In
 */
function isLoggedIn() {
    startSession();

    if (!isset($_SESSION['user_id'])) {
        return false;
    }

    if (isset($_SESSION['last_activity']) &&
        (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT)) {
        session_destroy();
        return false;
    }

    $_SESSION['last_activity'] = time();
    return true;
}

/**
 * Require Login
 */
function requireLogin() {
    if (!isLoggedIn()) {
        errorResponse('Authentication required', 401);
    }
}

/**
 * Log Message
 */
function logMessage($message, $level = 'INFO') {
    $logFile = __DIR__ . '/../logs/app.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;

    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
