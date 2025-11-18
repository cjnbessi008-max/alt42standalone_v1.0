<?php
/**
 * Set MiniMap Configuration
 * PHP 7.1.9 Compatible
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'set_minimap');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', ''); // Moodle Web Service Token
define('MOODLE_SERVICE', 'moodle_mobile_app');

// Application Configuration
define('APP_TIMEZONE', 'Asia/Seoul');
define('APP_DEBUG', true);

// CORS Configuration
define('ALLOW_ORIGIN', '*');
define('ALLOW_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('ALLOW_HEADERS', 'Content-Type, Authorization');

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

// CORS Headers
header('Access-Control-Allow-Origin: ' . ALLOW_ORIGIN);
header('Access-Control-Allow-Methods: ' . ALLOW_METHODS);
header('Access-Control-Allow-Headers: ' . ALLOW_HEADERS);
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
