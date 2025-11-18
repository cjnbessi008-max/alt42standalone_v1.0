<?php
/**
 * Inequality Tree - Database Configuration
 * MySQL 5.7 & PHP 7.1.9 Compatible
 */

// 에러 리포팅 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'inequality_tree_db');
define('DB_USER', 'root');  // 실제 환경에서는 변경 필요
define('DB_PASS', '');      // 실제 환경에서는 변경 필요
define('DB_CHARSET', 'utf8mb4');

// Moodle 데이터베이스 설정 (선택적 - Moodle 연동 시)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_pass');

// 애플리케이션 설정
define('APP_NAME', 'Inequality Tree Visualizer');
define('APP_VERSION', '1.0.0');
define('TIMEZONE', 'Asia/Seoul');
date_default_timezone_set(TIMEZONE);

// CORS 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * 데이터베이스 연결 함수
 */
function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => $e->getMessage()
        ]);
        exit();
    }
}

/**
 * Moodle 데이터베이스 연결 함수 (선택적)
 */
function getMoodleConnection() {
    try {
        $dsn = "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ];

        return new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
    } catch (PDOException $e) {
        return null;  // Moodle 연결 실패 시 null 반환
    }
}

/**
 * JSON 응답 헬퍼 함수
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 응답 헬퍼 함수
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
 * 성공 응답 헬퍼 함수
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
 * 입력값 검증 및 정제
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * GET 파라미터 가져오기
 */
function getParam($key, $default = null) {
    return isset($_GET[$key]) ? sanitizeInput($_GET[$key]) : $default;
}

/**
 * POST 데이터 가져오기 (JSON)
 */
function getPostData() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('Invalid JSON data', 400);
    }

    return $data;
}

/**
 * 세션 토큰 생성
 */
function generateSessionToken() {
    return bin2hex(random_bytes(32));
}

/**
 * 세션 검증
 */
function validateSession($token) {
    $db = getDbConnection();
    $stmt = $db->prepare("
        SELECT * FROM learning_sessions
        WHERE session_token = :token
        AND is_active = 1
        AND TIMESTAMPDIFF(HOUR, last_activity, NOW()) < 24
    ");
    $stmt->execute(['token' => $token]);
    return $stmt->fetch();
}
