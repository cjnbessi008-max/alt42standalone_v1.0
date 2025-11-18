<?php
/**
 * Function Live Sync - Database Configuration
 * MySQL 5.7 연결 설정
 */

// 오류 표시 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS 허용 (개발용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// JSON 응답 헤더
header('Content-Type: application/json; charset=utf-8');

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_live_sync');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// 세션 설정
if (session_status() === PHP_STATUS_NONE) {
    session_start();
}

/**
 * 데이터베이스 연결
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
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

    return $pdo;
}

/**
 * JSON 응답 반환
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 응답 반환
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * 성공 응답 반환
 */
function successResponse($data = []) {
    jsonResponse(array_merge(['success' => true], $data));
}

/**
 * POST 데이터 가져오기
 */
function getPostData() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('Invalid JSON data');
    }

    return $data ?: [];
}

/**
 * 세션 토큰 생성
 */
function generateSessionToken() {
    return bin2hex(random_bytes(32));
}

/**
 * SQL Injection 방지를 위한 파라미터 검증
 */
function validateInput($input, $type = 'string', $maxLength = null) {
    switch ($type) {
        case 'int':
            return filter_var($input, FILTER_VALIDATE_INT) !== false ? (int)$input : null;

        case 'float':
            return filter_var($input, FILTER_VALIDATE_FLOAT) !== false ? (float)$input : null;

        case 'email':
            return filter_var($input, FILTER_VALIDATE_EMAIL) ?: null;

        case 'string':
        default:
            $sanitized = htmlspecialchars(strip_tags($input), ENT_QUOTES, 'UTF-8');
            if ($maxLength && strlen($sanitized) > $maxLength) {
                $sanitized = substr($sanitized, 0, $maxLength);
            }
            return $sanitized;
    }
}

/**
 * Moodle 세션 검증 (Moodle과 연동 시 사용)
 */
function validateMoodleSession($sessionId = null) {
    // TODO: Moodle API를 통한 세션 검증 구현
    // 현재는 개발용으로 항상 true 반환
    return true;
}

/**
 * 로깅
 */
function logMessage($message, $level = 'INFO') {
    $logFile = __DIR__ . '/../../logs/app.log';
    $logDir = dirname($logFile);

    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logEntry = sprintf("[%s] [%s] %s\n", $timestamp, $level, $message);

    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
