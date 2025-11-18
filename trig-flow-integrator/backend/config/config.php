<?php
/**
 * Trig Flow Integrator - General Configuration
 */

// 에러 리포팅 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 세션 설정
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // HTTPS 사용 시 1로 설정

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// CORS 설정 (필요시 조정)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 애플리케이션 설정
define('APP_NAME', 'Trig Flow Integrator');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true); // 프로덕션에서는 false로 설정

// Moodle 연동 설정
define('MOODLE_URL', 'http://localhost/moodle'); // Moodle 기본 URL
define('MOODLE_WS_TOKEN', ''); // Moodle Web Service 토큰 (설정 필요)

// 시각화 기본 설정
define('DEFAULT_ANIMATION_SPEED', 1.0);
define('DEFAULT_CURVE_POINTS', 100);
define('CANVAS_WIDTH', 800);
define('CANVAS_HEIGHT', 600);

// 헬퍼 함수들
function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function respondError($message, $status = 400) {
    respond(['error' => $message, 'status' => $status], $status);
}

function respondSuccess($data, $message = 'Success') {
    respond(['success' => true, 'message' => $message, 'data' => $data]);
}

function validateRequired($data, $required_fields) {
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            respondError("Missing required field: $field", 400);
        }
    }
}

function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        respondError('Invalid JSON input', 400);
    }
    return $data;
}

function logActivity($type, $data) {
    $log_file = __DIR__ . '/../../logs/activity.log';
    $log_dir = dirname($log_file);

    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }

    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => $type,
        'data' => $data,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];

    file_put_contents($log_file, json_encode($log_entry) . "\n", FILE_APPEND);
}
