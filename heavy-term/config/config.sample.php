<?php
/**
 * Heavy Term Configuration Sample
 * Copy this file to config.php and update with your settings
 */

// Database Configuration
define('HEAVY_TERM_DB_HOST', 'localhost');
define('HEAVY_TERM_DB_NAME', 'heavy_term');
define('HEAVY_TERM_DB_USER', 'heavy_term_user');
define('HEAVY_TERM_DB_PASSWORD', 'YOUR_PASSWORD_HERE');

// Moodle Configuration
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASSWORD', 'YOUR_MOODLE_PASSWORD_HERE');

// Application Settings
define('HEAVY_TERM_DEBUG', true);
define('HEAVY_TERM_VERSION', '1.0.0');

// Paths
define('HEAVY_TERM_ROOT', dirname(__DIR__));
define('HEAVY_TERM_API_PATH', HEAVY_TERM_ROOT . '/api');
define('HEAVY_TERM_LIB_PATH', HEAVY_TERM_ROOT . '/lib');

// Error Reporting
if (HEAVY_TERM_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', HEAVY_TERM_ROOT . '/logs/error.log');
}

// Timezone
date_default_timezone_set('Asia/Seoul');

// CORS Settings
define('ALLOWED_ORIGINS', [
    'http://localhost',
    'http://127.0.0.1',
]);

// Session Settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS

// Security Settings
define('CSRF_TOKEN_LENGTH', 32);
define('SESSION_TIMEOUT', 3600);

// Physics Default Settings
define('DEFAULT_GRAVITY_STRENGTH', 9.8);
define('DEFAULT_GRAVITY_MULTIPLIER', 2.0);
define('DEFAULT_BOUNCE_DAMPING', 0.7);
define('DEFAULT_FRICTION_COEFFICIENT', 0.98);
define('DEFAULT_MAX_VELOCITY', 500);

// Moodle Integration Settings
define('MOODLE_INTEGRATION_ENABLED', false);
define('MOODLE_ROOT_PATH', '/path/to/moodle');
