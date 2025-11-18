<?php
/**
 * Moodle Database Configuration
 * MySQL 5.7, PHP 7.1.9, Moodle 3.7
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle_db');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_PORT', 3306);

// Moodle 설정
define('MOODLE_VERSION', '3.7');
define('MOODLE_API_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_webservice_token_here');

// Transform Scene 설정
define('TRANSFORM_SCENE_VERSION', '1.0.0');
define('TRANSFORM_SCENE_ENABLED', true);

// 디버그 모드
define('DEBUG_MODE', false);

// 세션 설정
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);

// 에러 리포팅 설정
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// UTF-8 설정
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');
?>
