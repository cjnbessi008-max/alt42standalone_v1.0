<?php
/**
 * Moodle 연동 설정 파일 예제
 * 이 파일을 config.php로 복사하고 실제 값으로 수정하세요
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'moodle_password');

// Moodle 설치 경로
define('MOODLE_PATH', '/var/www/html/moodle');

// Moodle 버전
define('MOODLE_VERSION', '3.7');

// API 설정
define('API_KEY', 'your_api_key_here');
define('API_SECRET', 'your_api_secret_here');

// 디버그 모드
define('DEBUG_MODE', false);
?>
