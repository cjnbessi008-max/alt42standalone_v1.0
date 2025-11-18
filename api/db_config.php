<?php
/**
 * Database Configuration
 * MySQL 5.7 설정
 */

// 데이터베이스 연결 정보
define('DB_HOST', 'localhost');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_NAME', 'moodle_wavy');
define('DB_PORT', 3306);

// Moodle 설정 (선택적)
define('MOODLE_DB_PREFIX', 'mdl_');
define('MOODLE_VERSION', '3.7');

// 애플리케이션 설정
define('APP_DEBUG', true);
define('APP_TIMEZONE', 'Asia/Seoul');

// 타임존 설정
date_default_timezone_set(APP_TIMEZONE);

// 보안 설정
define('SESSION_LIFETIME', 7200); // 2시간
define('API_KEY_ENABLED', false); // API 키 인증 사용 여부

// CORS 설정
define('ALLOWED_ORIGINS', [
    'http://localhost',
    'http://localhost:8000',
    'http://127.0.0.1',
    'http://127.0.0.1:8000'
]);
?>
