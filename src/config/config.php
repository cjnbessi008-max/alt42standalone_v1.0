<?php
/**
 * ALT42 Standalone v1.0 Configuration
 * Moodle 3.7 연동 설정
 */

// 데이터베이스 설정 (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_NAME', 'alt42_db');
define('DB_USER', 'alt42_user');
define('DB_PASS', 'alt42_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle 연동 설정
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_API_TOKEN', 'your_moodle_api_token_here');
define('MOODLE_API_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');

// 앱 설정
define('APP_NAME', 'ALT42 Area Learning App');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true);

// 경로 설정
define('BASE_PATH', dirname(dirname(__FILE__)));
define('API_PATH', BASE_PATH . '/api');
define('ASSETS_PATH', BASE_PATH . '/assets');
define('VIEWS_PATH', BASE_PATH . '/views');

// 사운드 설정
define('CHIME_ENABLED', true);
define('CHIME_VOLUME', 0.5);
define('CHIME_FILE', '/src/assets/audio/area-chime.mp3');

// 세션 설정
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
session_start();

// 에러 리포팅
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// CORS 설정 (필요시)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
