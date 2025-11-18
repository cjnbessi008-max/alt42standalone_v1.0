<?php
/**
 * Log Flow 설정 파일 예시
 *
 * 이 파일을 config.php로 복사하여 사용하세요:
 * cp config.example.php config.php
 */

// =====================================================
// 데이터베이스 설정
// =====================================================

define('DB_HOST', 'localhost');              // 데이터베이스 호스트
define('DB_NAME', 'moodle');                 // 데이터베이스 이름
define('DB_USER', 'moodle_user');            // 데이터베이스 사용자
define('DB_PASS', 'your_password_here');     // 데이터베이스 비밀번호
define('DB_CHARSET', 'utf8mb4');             // 문자셋

// =====================================================
// Moodle 설정
// =====================================================

define('MOODLE_URL', 'http://your-moodle.com');           // Moodle 서버 URL
define('MOODLE_VERSION', '3.7');                          // Moodle 버전
define('MOODLE_WS_PROTOCOL', 'rest');                     // 웹 서비스 프로토콜 (rest/soap)

// =====================================================
// 세션 설정
// =====================================================

define('SESSION_LIFETIME', 3600);            // 세션 유효 시간 (초) - 1시간
define('SESSION_NAME', 'LOGFLOW_SESSION');   // 세션 이름
define('SESSION_SECURE', false);             // HTTPS 필수 여부
define('SESSION_HTTPONLY', true);            // HttpOnly 쿠키

// =====================================================
// 애플리케이션 설정
// =====================================================

define('APP_NAME', 'Log Flow');              // 앱 이름
define('APP_VERSION', '1.0.0');              // 앱 버전
define('APP_DEBUG', true);                   // 디버그 모드 (프로덕션에서는 false)
define('APP_TIMEZONE', 'Asia/Seoul');        // 타임존

// =====================================================
// 로그 설정
// =====================================================

define('LOG_ENABLED', true);                 // 로그 활성화
define('LOG_PATH', __DIR__ . '/logs/');      // 로그 파일 경로
define('LOG_LEVEL', 'info');                 // 로그 레벨 (debug, info, warning, error)
define('LOG_MAX_FILES', 30);                 // 최대 로그 파일 개수

// =====================================================
// 보안 설정
// =====================================================

define('ENABLE_CSRF_PROTECTION', true);      // CSRF 보호 활성화
define('ALLOWED_ORIGINS', [                  // CORS 허용 도메인
    'http://localhost:8000',
    'http://127.0.0.1:8000'
]);

// =====================================================
// API 설정
// =====================================================

define('API_RATE_LIMIT', 100);               // API 호출 제한 (분당)
define('API_TIMEOUT', 30);                   // API 타임아웃 (초)
define('API_RETRY_COUNT', 3);                // API 재시도 횟수

// =====================================================
// 캐시 설정
// =====================================================

define('CACHE_ENABLED', true);               // 캐시 활성화
define('CACHE_TYPE', 'file');                // 캐시 타입 (file, redis, memcached)
define('CACHE_PATH', __DIR__ . '/cache/');   // 파일 캐시 경로
define('CACHE_TTL', 3600);                   // 캐시 유효 시간 (초)

// Redis 설정 (CACHE_TYPE이 'redis'일 때)
define('REDIS_HOST', '127.0.0.1');
define('REDIS_PORT', 6379);
define('REDIS_PASSWORD', '');
define('REDIS_DATABASE', 0);

// =====================================================
// 파일 업로드 설정
// =====================================================

define('UPLOAD_MAX_SIZE', 10485760);         // 최대 업로드 크기 (10MB)
define('UPLOAD_ALLOWED_TYPES', [             // 허용된 파일 타입
    'image/jpeg',
    'image/png',
    'application/pdf'
]);

// =====================================================
// 이메일 설정
// =====================================================

define('MAIL_ENABLED', false);               // 이메일 기능 활성화
define('MAIL_HOST', 'smtp.gmail.com');       // SMTP 호스트
define('MAIL_PORT', 587);                    // SMTP 포트
define('MAIL_USERNAME', 'your@email.com');   // SMTP 사용자명
define('MAIL_PASSWORD', 'your_password');    // SMTP 비밀번호
define('MAIL_ENCRYPTION', 'tls');            // 암호화 (tls, ssl)
define('MAIL_FROM_ADDRESS', 'noreply@logflow.com');
define('MAIL_FROM_NAME', 'Log Flow');

// =====================================================
// 개발 환경 설정
// =====================================================

if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 타임존 설정
date_default_timezone_set(APP_TIMEZONE);

// =====================================================
// 경로 설정
// =====================================================

define('BASE_PATH', __DIR__);
define('API_PATH', BASE_PATH . '/api');
define('ASSETS_PATH', BASE_PATH . '/assets');
define('TEMP_PATH', BASE_PATH . '/temp');

// =====================================================
// 커스텀 설정 (선택사항)
// =====================================================

// 애니메이션 기본 속도
define('DEFAULT_ANIMATION_SPEED', 1.0);

// 지원하는 로그 밑의 범위
define('MIN_LOG_BASE', 2);
define('MAX_LOG_BASE', 100);

// 지원하는 진수의 범위
define('MIN_LOG_VALUE', 1);
define('MAX_LOG_VALUE', 10000);

// 문제당 최대 시도 횟수 (0 = 무제한)
define('MAX_ATTEMPTS_PER_PROBLEM', 0);

// =====================================================
// 환경별 설정 오버라이드
// =====================================================

// 환경 감지
if (isset($_SERVER['SERVER_NAME'])) {
    $hostname = $_SERVER['SERVER_NAME'];

    // 프로덕션 환경
    if (strpos($hostname, 'production.com') !== false) {
        define('ENVIRONMENT', 'production');
        // 프로덕션 전용 설정
        define('APP_DEBUG', false);
        define('CACHE_ENABLED', true);
    }
    // 스테이징 환경
    elseif (strpos($hostname, 'staging.com') !== false) {
        define('ENVIRONMENT', 'staging');
    }
    // 개발 환경
    else {
        define('ENVIRONMENT', 'development');
    }
} else {
    define('ENVIRONMENT', 'development');
}

// =====================================================
// 헬퍼 함수
// =====================================================

/**
 * 설정 값 가져오기
 */
function config($key, $default = null) {
    return defined($key) ? constant($key) : $default;
}

/**
 * 환경 확인
 */
function is_production() {
    return ENVIRONMENT === 'production';
}

function is_development() {
    return ENVIRONMENT === 'development';
}
