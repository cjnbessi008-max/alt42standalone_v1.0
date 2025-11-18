<?php
/**
 * Explosion Count Configuration Sample
 * 이 파일을 config.php로 복사하여 사용하세요
 * cp config.sample.php config.php
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'explosion_count');
define('DB_USER', 'your_username');  // 실제 사용자명으로 변경
define('DB_PASS', 'your_password');  // 실제 비밀번호로 변경
define('DB_CHARSET', 'utf8mb4');

// Moodle Integration
define('MOODLE_DIR', '/path/to/moodle');  // Moodle 설치 경로로 변경
define('MOODLE_DB_PREFIX', 'mdl_');
define('MOODLE_INTEGRATION_ENABLED', false);  // Moodle 연동 시 true로 변경

// Application Settings
define('APP_NAME', 'Explosion Count');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);  // 프로덕션에서는 false로 변경

// Animation Settings
define('DEFAULT_ANIMATION_SPEED', 1.0);
define('DEFAULT_ANIMATION_INTENSITY', 1.0);
define('MAX_COUNT_DISPLAY', 999999999);

// API Settings
define('API_TIMEOUT', 30);
define('API_RATE_LIMIT', 100);

// Session Settings
define('SESSION_TIMEOUT', 3600);

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');

// CORS Settings
define('ALLOW_CORS', true);
define('ALLOWED_ORIGINS', '*');  // 프로덕션에서는 특정 도메인으로 제한

?>
