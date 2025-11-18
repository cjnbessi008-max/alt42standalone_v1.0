<?php
/**
 * Truth Light App - Configuration File
 *
 * 환경 설정 파일 - 실제 배포시 config.local.php로 오버라이드
 */

// Error Reporting (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'truth_light_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: ''); // Moodle Web Service Token
define('MOODLE_REST_FORMAT', 'json'); // json or xml

// Application Settings
define('APP_NAME', 'Truth Light');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');
define('APP_LANG', 'ko');

// Security Settings
define('SESSION_TIMEOUT', 3600); // 1 hour
define('CSRF_TOKEN_LENGTH', 32);
define('PASSWORD_HASH_ALGO', PASSWORD_BCRYPT);

// Light Brightness Settings (조명 밝기 설정)
define('LIGHT_MIN_BRIGHTNESS', 0);    // 완전히 어두움 (거짓)
define('LIGHT_MAX_BRIGHTNESS', 100);  // 최대 밝기 (참)
define('LIGHT_TRANSITION_SPEED', 500); // ms

// API Settings
define('API_RATE_LIMIT', 60); // requests per minute
define('API_CORS_ENABLED', true);
define('API_CORS_ORIGIN', '*'); // 프로덕션에서는 특정 도메인으로 제한

// Logging
define('LOG_ENABLED', true);
define('LOG_LEVEL', 'DEBUG'); // DEBUG, INFO, WARNING, ERROR
define('LOG_PATH', __DIR__ . '/../logs/app.log');

// Timezone 설정
date_default_timezone_set(APP_TIMEZONE);

// Load local configuration (if exists)
$localConfigPath = __DIR__ . '/config.local.php';
if (file_exists($localConfigPath)) {
    require_once $localConfigPath;
}
