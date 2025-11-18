<?php
/**
 * Component Lego System Configuration
 * PHP 7.1.9 compatible
 */

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'component_lego');
define('DB_USER', getenv('DB_USER') ?: 'component_lego_user');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'https://your-moodle-site.com');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Or your custom service

// Application settings
define('APP_NAME', 'Component Lego');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');
define('APP_DEBUG', getenv('APP_DEBUG') === 'true');

// Session settings
define('SESSION_LIFETIME', 7200); // 2 hours
define('SESSION_NAME', 'component_lego_session');

// Component Lego specific settings
define('SMARTPHONE_WIDTH', 360);
define('SMARTPHONE_HEIGHT', 640);
define('MAX_ATTEMPTS_PER_QUESTION', 5);
define('HINT_PENALTY', 0.1);
define('AUTO_SAVE_INTERVAL', 30); // seconds

// Paths
define('BASE_PATH', dirname(dirname(__DIR__)));
define('SRC_PATH', BASE_PATH . '/src');
define('PUBLIC_PATH', BASE_PATH . '/public');
define('UPLOAD_PATH', PUBLIC_PATH . '/uploads');

// API settings
define('API_PREFIX', '/api');
define('API_VERSION', 'v1');

// Security
define('CSRF_TOKEN_NAME', 'csrf_token');
define('PASSWORD_HASH_ALGO', PASSWORD_BCRYPT);

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

// Error reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
