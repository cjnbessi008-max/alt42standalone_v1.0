<?php
/**
 * Database Configuration
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

// Database connection settings
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'blend_difference_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle integration settings
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app');

// API settings
define('API_VERSION', 'v1');
define('API_BASE_PATH', '/api');

// CORS settings
define('CORS_ALLOW_ORIGIN', getenv('CORS_ALLOW_ORIGIN') ?: '*');
define('CORS_ALLOW_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('CORS_ALLOW_HEADERS', 'Content-Type, Authorization, X-Requested-With');

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Timezone
date_default_timezone_set('UTC');
