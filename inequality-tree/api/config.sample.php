<?php
/**
 * Inequality Tree - Database Configuration Sample
 *
 * 이 파일을 복사하여 config.php로 저장하고 실제 값을 입력하세요.
 * cp config.sample.php config.php
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'inequality_tree_db');
define('DB_USER', 'your_database_username');  // 실제 값으로 변경
define('DB_PASS', 'your_database_password');  // 실제 값으로 변경
define('DB_CHARSET', 'utf8mb4');

// Moodle 데이터베이스 설정 (선택적)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_username');  // 실제 값으로 변경
define('MOODLE_DB_PASS', 'moodle_password');  // 실제 값으로 변경

// 애플리케이션 설정
define('APP_NAME', 'Inequality Tree Visualizer');
define('APP_VERSION', '1.0.0');
define('TIMEZONE', 'Asia/Seoul');

// 개발 모드 (프로덕션에서는 false로 설정)
define('DEV_MODE', true);

if (DEV_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
