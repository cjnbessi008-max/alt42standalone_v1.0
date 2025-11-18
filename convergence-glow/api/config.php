<?php
/**
 * Convergence Glow Configuration
 *
 * Moodle 3.7, PHP 7.1.9, MySQL 5.7 환경 설정
 */

// 에러 리포팅 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// MySQL 데이터베이스 설정
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'convergence_glow');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_DB_PREFIX', 'mdl_');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');

// 애플리케이션 설정
define('APP_NAME', 'Convergence Glow');
define('APP_VERSION', '1.0.0');
define('SESSION_TIMEOUT', 3600); // 1 hour

// 수열 계산 설정
define('MAX_SEQUENCE_TERMS', 100);
define('CONVERGENCE_THRESHOLD', 0.0001);
define('DIVERGENCE_THRESHOLD', 1000000);

// CORS 설정
define('ALLOWED_ORIGINS', [
    'http://localhost',
    'http://localhost:3000',
    MOODLE_URL
]);

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// 헤더 설정 함수
function setCorsHeaders() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: " . ALLOWED_ORIGINS[0]);
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json; charset=utf-8');
}

// JSON 응답 헬퍼 함수
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// 에러 응답 헬퍼 함수
function errorResponse($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($details !== null) {
        $response['details'] = $details;
    }

    jsonResponse($response, $statusCode);
}

// 성공 응답 헬퍼 함수
function successResponse($data, $message = null) {
    $response = [
        'success' => true,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($message !== null) {
        $response['message'] = $message;
    }

    jsonResponse($response);
}
