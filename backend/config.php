<?php
/**
 * Alt42 Value Bounce App - Configuration
 *
 * Moodle 3.7 integration configuration
 * PHP 7.1.9, MySQL 5.7
 */

// Moodle Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'moodle_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle Installation Path (adjust to your Moodle installation)
define('MOODLE_PATH', '/var/www/html/moodle');

// API Configuration
define('API_VERSION', '1.0');
define('API_BASE_URL', '/api');

// CORS Settings
define('CORS_ALLOWED_ORIGINS', '*'); // Adjust for production

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Seoul');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);

?>
