<?php
/**
 * Angle Live - Database Configuration
 * PHP 7.1.9 Compatible
 * MySQL 5.7 Connection
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'angle_live');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'root');
define('MOODLE_DB_PASS', '');
define('MOODLE_DB_PREFIX', 'mdl_');

// Application Settings
define('APP_NAME', 'Angle Live');
define('APP_VERSION', '1.0.0');
define('SESSION_TIMEOUT', 3600); // 1 hour

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Seoul');

// CORS Headers (adjust for production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
