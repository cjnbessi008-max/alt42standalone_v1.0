<?php
/**
 * Database Configuration
 * MySQL 연결 설정 (Moodle 3.7 연동)
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 테이블 접두사 (기본값: mdl_)
define('MOODLE_PREFIX', 'mdl_');

// CORS 헤더 설정 (필요한 경우)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

/**
 * 데이터베이스 연결 생성
 * @return PDO|null
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("데이터베이스 연결 오류: " . $e->getMessage());
        return null;
    }
}

/**
 * JSON 응답 전송
 * @param array $data
 * @param int $statusCode
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 오류 응답 전송
 * @param string $message
 * @param int $statusCode
 */
function sendError($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * 성공 응답 전송
 * @param mixed $data
 */
function sendSuccess($data) {
    sendJsonResponse([
        'success' => true,
        'data' => $data
    ]);
}
?>
