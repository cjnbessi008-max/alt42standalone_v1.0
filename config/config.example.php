<?php
/**
 * Example Configuration File
 * Copy this file to config.php and edit the values
 */

// App Configuration
define('APP_NAME', 'ALT42 Learning System');
define('APP_VERSION', '1.0.0');

// Local Database Configuration (for app data)
$config = [
    // Local database for ALT42 app data
    'db_host' => 'localhost',
    'db_name' => 'alt42_app',
    'db_user' => 'your_db_user',
    'db_pass' => 'your_db_password',

    // Moodle Database Configuration
    // If Moodle uses the same database server, just change db_name
    // If Moodle is on a different server, change all four values
    'moodle_db_host' => 'localhost',
    'moodle_db_name' => 'moodle',
    'moodle_db_user' => 'moodle_user',
    'moodle_db_pass' => 'moodle_password',
];

// Moodle Installation Path
// Update this to point to your Moodle installation directory
// Example: '/var/www/html/moodle' or '/home/user/public_html/moodle'
define('MOODLE_PATH', '/path/to/your/moodle');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_lifetime', 86400); // 24 hours

// Timezone Configuration
// Change this to your timezone
// See: https://www.php.net/manual/en/timezones.php
date_default_timezone_set('Asia/Seoul');

// Development Mode
// Set to false in production!
define('DEV_MODE', true);

if (DEV_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
}

// Application Settings
define('MAX_ATTEMPTS_PER_PROBLEM', 3);
define('SESSION_TIMEOUT', 3600); // 1 hour
define('POINTS_PER_LEVEL', 100);

// Feature Flags
define('ENABLE_MOODLE_INTEGRATION', true);
define('ENABLE_SOUND_EFFECTS', true);
define('ENABLE_ACHIEVEMENTS', true);
