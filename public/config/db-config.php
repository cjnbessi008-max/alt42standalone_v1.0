<?php
/**
 * Database Configuration for Roll Along App
 * Compatible with Moodle 3.7, MySQL 5.7, PHP 7.1.9
 */

// Database credentials
// IMPORTANT: Change these values to match your Moodle installation
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');  // Your Moodle database name
define('DB_USER', 'moodle_user');  // Your Moodle database user
define('DB_PASS', 'your_password_here');  // Your Moodle database password
define('DB_PORT', 3306);

// Moodle table prefix (usually 'mdl_')
define('MOODLE_PREFIX', 'mdl_');

// Roll Along app settings
define('APP_NAME', 'Roll Along');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true);  // Set to false in production

// Session settings
define('SESSION_TIMEOUT', 3600);  // 1 hour

// Security settings
define('API_KEY', 'your_api_key_here');  // Change this!
define('REQUIRE_AUTH', false);  // Set to true in production

// Paths
define('BASE_PATH', dirname(__DIR__));
define('PUBLIC_PATH', BASE_PATH . '/public');
define('API_PATH', PUBLIC_PATH . '/api');

// Error handling
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');

/**
 * Example configuration for different environments:
 *
 * DEVELOPMENT:
 * - DB_HOST: 'localhost'
 * - DB_NAME: 'moodle_dev'
 * - APP_DEBUG: true
 *
 * PRODUCTION:
 * - DB_HOST: 'your-production-db-host'
 * - DB_NAME: 'moodle_prod'
 * - APP_DEBUG: false
 * - REQUIRE_AUTH: true
 */
