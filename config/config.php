<?php
/**
 * Root Glow Configuration File
 * 설정을 환경에 맞게 수정하세요
 */

// ============================================
// Database Configuration (MySQL 5.7)
// ============================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'root_glow_db');
define('DB_USER', 'root');
define('DB_PASS', '');  // 실제 환경에서는 안전한 비밀번호 사용
define('DB_CHARSET', 'utf8mb4');

// ============================================
// Moodle Configuration (Moodle 3.7)
// ============================================
define('MOODLE_ENABLED', false);  // Moodle 연동 사용 여부
define('MOODLE_URL', 'https://your-moodle-site.com');  // Moodle 사이트 URL
define('MOODLE_TOKEN', '');  // Moodle Web Service 토큰

// Moodle Web Service 설정
// Moodle 관리자 페이지에서 다음 설정 필요:
// 1. 사이트 관리 > 플러그인 > 웹 서비스 > 개요 > 웹 서비스 활성화
// 2. 외부 서비스 생성
// 3. 토큰 생성

// ============================================
// Application Settings
// ============================================
define('APP_NAME', 'Root Glow');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true);  // 프로덕션에서는 false로 설정

// ============================================
// Security Settings
// ============================================
define('SESSION_LIFETIME', 3600);  // 세션 유지 시간 (초)
define('CSRF_PROTECTION', true);
define('PASSWORD_HASH_ALGO', PASSWORD_BCRYPT);

// ============================================
// API Settings
// ============================================
define('API_RATE_LIMIT', 100);  // 시간당 API 호출 제한
define('API_TIMEOUT', 30);  // API 타임아웃 (초)

// ============================================
// File Paths
// ============================================
define('ROOT_PATH', dirname(__DIR__));
define('CONFIG_PATH', ROOT_PATH . '/config');
define('SRC_PATH', ROOT_PATH . '/src');
define('DATABASE_PATH', ROOT_PATH . '/database');

// ============================================
// Error Reporting
// ============================================
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', ROOT_PATH . '/logs/php-error.log');
}

// ============================================
// Timezone
// ============================================
date_default_timezone_set('Asia/Seoul');

// ============================================
// Session Configuration
// ============================================
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0);  // HTTPS 사용 시 1로 설정
ini_set('session.use_strict_mode', 1);

// ============================================
// Custom Constants
// ============================================
define('DEFAULT_ROOTS_TOLERANCE', 0.01);  // 근 비교 허용 오차
define('DEFAULT_SEARCH_MIN', -10);  // 기본 검색 범위 최소값
define('DEFAULT_SEARCH_MAX', 10);   // 기본 검색 범위 최대값
define('MAX_ITERATIONS', 100);  // 최대 반복 횟수

// ============================================
// Helper Functions
// ============================================

/**
 * 환경 변수 가져오기
 */
function env($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

/**
 * 설정 값 가져오기
 */
function config($key, $default = null) {
    return defined($key) ? constant($key) : $default;
}

/**
 * 로그 작성
 */
function writeLog($message, $level = 'INFO') {
    $logFile = ROOT_PATH . '/logs/app.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;

    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// ============================================
// Auto-load Environment Variables (optional)
// ============================================
$envFile = ROOT_PATH . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (!array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
        }
    }
}
