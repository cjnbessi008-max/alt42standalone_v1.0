<?php
/**
 * Magnitude Sound - Moodle Integration Configuration
 *
 * @package    magnitude-sound-app
 * @copyright  2025
 * @license    MIT
 */

// Moodle 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');

// CORS 설정 (개발 환경)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * 데이터베이스 연결 생성
 *
 * @return mysqli|null
 */
function getDbConnection() {
    $conn = new mysqli(
        MOODLE_DB_HOST,
        MOODLE_DB_USER,
        MOODLE_DB_PASS,
        MOODLE_DB_NAME
    );

    if ($conn->connect_error) {
        error_log("DB Connection failed: " . $conn->connect_error);
        return null;
    }

    $conn->set_charset('utf8mb4');
    return $conn;
}

/**
 * JSON 응답 전송
 *
 * @param mixed $data 응답 데이터
 * @param int $status HTTP 상태 코드
 */
function sendJsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 응답 전송
 *
 * @param string $message 에러 메시지
 * @param int $status HTTP 상태 코드
 */
function sendErrorResponse($message, $status = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => time()
    ], $status);
}

/**
 * 성공 응답 전송
 *
 * @param mixed $data 응답 데이터
 */
function sendSuccessResponse($data) {
    sendJsonResponse([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ], 200);
}
