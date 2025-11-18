<?php
/**
 * ALT42 Standalone Configuration
 * Moodle 3.7 연동 설정
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_VERSION', '3.7');

// API Configuration
define('API_KEY', 'your_api_key_here');
define('API_CORS_ORIGIN', 'http://localhost:3000'); // React dev server

// Application Settings
define('DEBUG_MODE', true);
define('TIMEZONE', 'Asia/Seoul');

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set(TIMEZONE);
