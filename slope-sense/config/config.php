<?php
/**
 * Slope Sense Configuration
 * Compatible with PHP 7.1.9, MySQL 5.7, Moodle 3.7
 */

// Prevent direct access
defined('SLOPE_SENSE') || define('SLOPE_SENSE', true);

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'slope_sense');
define('DB_USER', 'slope_user');
define('DB_PASS', 'change_this_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_DIR', '/path/to/moodle'); // Update this path
define('MOODLE_URL', 'https://your-moodle-site.com'); // Update this URL

// Application Settings
define('APP_NAME', 'Slope Sense');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', false);
define('SESSION_TIMEOUT', 3600); // 1 hour in seconds

// Animation Settings
define('ANIMATION_SPEED_MIN', 0.5);
define('ANIMATION_SPEED_MAX', 3.0);
define('GRID_SIZE', 20);
define('CANVAS_WIDTH', 360);
define('CANVAS_HEIGHT', 640);

// Security Settings
define('ENABLE_CSRF_PROTECTION', true);
define('SESSION_COOKIE_HTTPONLY', true);
define('SESSION_COOKIE_SECURE', false); // Set to true in production with HTTPS

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/error.log');
}

// Timezone
date_default_timezone_set('Asia/Seoul');

// Auto-create logs directory
$logsDir = __DIR__ . '/../logs';
if (!file_exists($logsDir)) {
    mkdir($logsDir, 0755, true);
}
