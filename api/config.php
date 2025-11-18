<?php
/**
 * Focus Light 웹앱 - 데이터베이스 설정
 * PHP 7.1.9 호환
 */

// 에러 리포팅 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'focus_light_app');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// CORS 설정 (개발 환경)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * 데이터베이스 연결 함수
 * @return PDO
 */
function getDBConnection() {
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
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
 * JSON 응답 함수
 * @param bool $success
 * @param mixed $data
 * @param string $message
 */
function sendResponse($success, $data = null, $message = '') {
    $response = [
        'success' => $success,
        'data' => $data,
        'message' => $message
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 응답 함수
 * @param string $message
 * @param int $code
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    sendResponse(false, null, $message);
}
