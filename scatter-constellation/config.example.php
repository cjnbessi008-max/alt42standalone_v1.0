<?php
/**
 * Configuration File for Scatter Constellation App
 * Copy this file to config.php and update with your settings
 */

// Database Configuration (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_NAME', 'scatter_constellation');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle Integration Settings
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
define('MOODLE_SERVICE', 'moodle_mobile_app'); // or your custom service name

// Application Settings
define('APP_NAME', 'Scatter Constellation');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true); // Set to false in production

// Timezone
date_default_timezone_set('Asia/Seoul');

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);

// CORS Settings (if needed)
define('ALLOW_CORS', true);
if (ALLOW_CORS) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}
