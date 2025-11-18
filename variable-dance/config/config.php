<?php
/**
 * Variable Dance - Configuration File
 * Moodle 3.7 Integration with MySQL 5.7, PHP 7.1.9
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'variable_dance');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_WEBSERVICE_URL', MOODLE_URL . '/webservice/rest/server.php');
define('MOODLE_TOKEN', ''); // Moodle Web Services API Token (설정 필요)

// 애플리케이션 설정
define('APP_NAME', 'Variable Dance');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);

// CORS 설정
define('ALLOW_CORS', true);
define('CORS_ORIGIN', '*');

// 세션 설정
define('SESSION_LIFETIME', 3600); // 1시간

// 에러 리포팅
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// 데이터베이스 연결 함수
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        if (DEBUG_MODE) {
            die("Database connection failed: " . $e->getMessage());
        } else {
            die("Database connection failed");
        }
    }
}

// CORS 헤더 설정
function setCORSHeaders() {
    if (ALLOW_CORS) {
        header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        // Preflight 요청 처리
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}

// JSON 응답 헬퍼 함수
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// 에러 응답 함수
function errorResponse($message, $status = 400) {
    jsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], $status);
}

// 성공 응답 함수
function successResponse($data, $message = 'Success') {
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], 200);
}

// 로그 함수
function logEvent($message, $level = 'INFO') {
    $logFile = __DIR__ . '/../logs/app.log';
    $logDir = dirname($logFile);

    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}
