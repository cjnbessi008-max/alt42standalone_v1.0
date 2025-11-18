<?php
/**
 * 데이터베이스 및 Moodle 연동 설정
 * MySQL 5.7, PHP 7.1.9, Moodle 3.7 환경
 */

// 에러 리포팅 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'moodle');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_WS_TOKEN', ''); // Web Service Token (설정 필요)
define('MOODLE_REST_FORMAT', 'json');

// 애플리케이션 설정
define('APP_NAME', 'Operation Trail');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);

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
 * 디버그 로그 함수
 */
function debug_log($message, $data = null) {
    if (DEBUG_MODE) {
        $log_message = date('[Y-m-d H:i:s] ') . $message;
        if ($data !== null) {
            $log_message .= "\n" . print_r($data, true);
        }
        error_log($log_message);
    }
}

/**
 * JSON 응답 반환
 */
function json_response($success, $data = null, $error = null) {
    $response = array(
        'success' => $success,
        'timestamp' => date('Y-m-d H:i:s')
    );

    if ($data !== null) {
        if (is_array($data)) {
            $response = array_merge($response, $data);
        } else {
            $response['data'] = $data;
        }
    }

    if ($error !== null) {
        $response['error'] = $error;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 응답 반환
 */
function error_response($message, $code = 400) {
    http_response_code($code);
    json_response(false, null, $message);
}

debug_log('Config loaded successfully');
?>
