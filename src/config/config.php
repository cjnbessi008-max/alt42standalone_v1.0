<?php
/**
 * Concept Avoidance Detection System
 * Configuration File
 *
 * PHP Version: 7.1.9
 * MySQL Version: 5.7
 */

// ========================================
// Database Configuration
// ========================================

// 독립형 앱 데이터베이스 (개념 회피 감지 시스템)
define('DB_HOST', 'localhost');
define('DB_NAME', 'concept_avoidance');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 데이터베이스 (읽기 전용)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'root');
define('MOODLE_DB_PASS', '');
define('MOODLE_DB_PREFIX', 'mdl_');
define('MOODLE_DB_CHARSET', 'utf8mb4');

// ========================================
// Application Settings
// ========================================

define('APP_NAME', 'Concept Avoidance Detection System');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');
define('APP_LOCALE', 'ko_KR');

// ========================================
// Detection Algorithm Settings
// ========================================

// 분석 최소 시도 횟수
define('MIN_ATTEMPTS_FOR_ANALYSIS', 3);

// 정답률 임계값 (%)
define('ACCURACY_THRESHOLD_LOW', 40.0);
define('ACCURACY_THRESHOLD_CRITICAL', 25.0);

// 빠른 건너뛰기 판단 시간 (초)
define('QUICK_SKIP_TIME_SECONDS', 10);

// 비정상 응답 시간 배수
define('ABNORMAL_TIME_MULTIPLIER', 3.0);

// 회피 패턴 신뢰도 임계값 (%)
define('CONFIDENCE_THRESHOLD', 70.0);

// 연속 실패 임계값
define('CONSECUTIVE_FAILURE_THRESHOLD', 4);

// ========================================
// Sync Settings
// ========================================

// 동기화 간격 (분)
define('SYNC_INTERVAL_MINUTES', 30);

// 동기화 배치 크기
define('SYNC_BATCH_SIZE', 100);

// ========================================
// API Settings
// ========================================

define('API_ENABLE_CORS', true);
define('API_ALLOWED_ORIGINS', '*'); // 프로덕션에서는 특정 도메인으로 제한
define('API_RATE_LIMIT', 100); // 시간당 요청 수
define('API_RESPONSE_FORMAT', 'json');

// ========================================
// Security Settings
// ========================================

define('ENABLE_DEBUG', true); // 프로덕션에서는 false로 설정
define('LOG_ERRORS', true);
define('LOG_PATH', __DIR__ . '/../../logs/');

// Session 설정
define('SESSION_LIFETIME', 3600); // 1시간
define('SESSION_NAME', 'CAD_SESSION');

// ========================================
// Paths
// ========================================

define('ROOT_PATH', dirname(dirname(__DIR__)));
define('SRC_PATH', ROOT_PATH . '/src');
define('LIB_PATH', SRC_PATH . '/lib');
define('API_PATH', SRC_PATH . '/api');
define('WEB_PATH', SRC_PATH . '/web');

// ========================================
// Error Reporting
// ========================================

if (ENABLE_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
}

// ========================================
// Timezone
// ========================================

date_default_timezone_set(APP_TIMEZONE);

// ========================================
// Auto-create log directory
// ========================================

if (!file_exists(LOG_PATH)) {
    mkdir(LOG_PATH, 0755, true);
}

// ========================================
// Helper Functions
// ========================================

/**
 * 로그 기록 함수
 */
function log_message($message, $level = 'INFO') {
    if (!LOG_ERRORS) return;

    $timestamp = date('Y-m-d H:i:s');
    $log_file = LOG_PATH . date('Y-m-d') . '.log';
    $log_entry = "[{$timestamp}] [{$level}] {$message}\n";

    file_put_contents($log_file, $log_entry, FILE_APPEND);
}

/**
 * JSON 응답 전송
 */
function send_json_response($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json; charset=utf-8');

    if (API_ENABLE_CORS) {
        header('Access-Control-Allow-Origin: ' . API_ALLOWED_ORIGINS);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답 전송
 */
function send_error_response($message, $status_code = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => [
            'message' => $message,
            'code' => $status_code
        ]
    ];

    if ($details && ENABLE_DEBUG) {
        $response['error']['details'] = $details;
    }

    log_message("Error: {$message}", 'ERROR');
    send_json_response($response, $status_code);
}

/**
 * 성공 응답 전송
 */
function send_success_response($data = null, $message = 'Success') {
    $response = [
        'success' => true,
        'message' => $message
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    send_json_response($response, 200);
}
