<?php
/**
 * Absolute Tunnel Configuration
 * Moodle 3.7 + MySQL 5.7 + PHP 7.1.9
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'absolute_tunnel');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', ''); // Moodle Web Service Token
define('MOODLE_SERVICE', 'absolute_tunnel_service');

// App Configuration
define('APP_NAME', 'Absolute Tunnel');
define('APP_VERSION', '1.0.0');
define('SESSION_TIMEOUT', 3600); // 1 hour
define('DEBUG_MODE', true);

// API Endpoints
define('API_BASE_URL', '/absolute-tunnel/api');

// Timezone
date_default_timezone_set('Asia/Seoul');

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// CORS Headers (개발용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
