<?php
/**
 * Area Walk - Configuration File (Example)
 *
 * 이 파일을 config.php로 복사하고 실제 환경에 맞게 수정하세요.
 * cp config.example.php config.php
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'area_walk');
define('DB_USER', 'area_walk_app');
define('DB_PASS', 'your_secure_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle 연동 설정
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', 'your_moodle_webservice_token_here');

// 애플리케이션 설정
define('APP_ENV', 'development'); // development, staging, production
define('APP_DEBUG', true);
define('APP_TIMEZONE', 'Asia/Seoul');

// API 설정
define('API_VERSION', 'v1');
define('API_BASE_URL', '/area-walk/api/' . API_VERSION);

// CORS 설정
define('CORS_ALLOWED_ORIGINS', '*'); // 프로덕션에서는 특정 도메인으로 제한
define('CORS_ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With');

// 보안 설정
define('JWT_SECRET', 'change_this_to_a_random_secret_key');
define('SESSION_LIFETIME', 7200); // 2시간 (초 단위)

// 파일 업로드 설정
define('UPLOAD_DIR', __DIR__ . '/../../frontend/assets/uploads');
define('MAX_UPLOAD_SIZE', 5242880); // 5MB

// 로그 설정
define('LOG_DIR', __DIR__ . '/../logs');
define('LOG_LEVEL', 'DEBUG'); // DEBUG, INFO, WARNING, ERROR

// 캐시 설정
define('CACHE_ENABLED', false);
define('CACHE_LIFETIME', 3600); // 1시간

// 적분 계산 설정
define('INTEGRAL_PRECISION', 1000); // Simpson's Rule 분할 수
define('INTEGRAL_TIMEOUT', 5); // 최대 계산 시간 (초)

// 에러 리포팅
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', LOG_DIR . '/php_errors.log');
}

// 타임존 설정
date_default_timezone_set(APP_TIMEZONE);

// 세션 설정
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // HTTPS 사용 시 1로 변경

// 보안 헤더
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// CORS 헤더
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGINS);
    header('Access-Control-Allow-Methods: ' . CORS_ALLOWED_METHODS);
    header('Access-Control-Allow-Headers: ' . CORS_ALLOWED_HEADERS);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // 24시간
}

// OPTIONS 요청 처리 (Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// JSON 응답 헤더
header('Content-Type: application/json; charset=utf-8');
