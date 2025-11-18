<?php
/**
 * Factor Lego - Moodle Integration Configuration
 * PHP 7.1.9 Compatible
 */

// Moodle 데이터베이스 연결 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'your_password_here');
define('MOODLE_DB_PREFIX', 'mdl_');

// Factor Lego 데이터베이스 연결 설정
define('FACTOR_DB_HOST', 'localhost');
define('FACTOR_DB_NAME', 'factor_lego');
define('FACTOR_DB_USER', 'factor_user');
define('FACTOR_DB_PASS', 'your_password_here');

// 기타 설정
define('DEBUG_MODE', true);
define('SESSION_TIMEOUT', 3600); // 1 hour
define('API_VERSION', '1.0');

// CORS 설정 (Moodle에서 접근 허용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
