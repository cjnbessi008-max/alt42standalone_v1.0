<?php
/**
 * Area Recombination App - Configuration
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

// Prevent direct access
defined('AREA_RECOM_APP') or define('AREA_RECOM_APP', true);

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'area_recombination');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle Integration
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'your_password_here');
define('MOODLE_DB_PREFIX', 'mdl_');

// Application Settings
define('APP_VERSION', '1.0.0');
define('APP_NAME', '넓이 재조합기');
define('APP_DEBUG', false);

// Session Settings
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_NAME', 'area_recom_session');

// Canvas Settings
define('CANVAS_WIDTH', 300);
define('CANVAS_HEIGHT', 400);

// Smartphone Display Settings
define('SMARTPHONE_WIDTH', 375);
define('SMARTPHONE_HEIGHT', 667);
define('SMARTPHONE_SCALE', 0.8);

// Area Calculation Tolerance (5%)
define('AREA_TOLERANCE', 0.05);

// Max Attempts
define('MAX_ATTEMPTS', 5);

// API Settings
define('API_ENDPOINT', '/api');
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', ['http://localhost', 'https://your-moodle-domain.com']);

// Logging
define('LOG_FILE', __DIR__ . '/../logs/app.log');
define('ERROR_LOG_FILE', __DIR__ . '/../logs/error.log');

// Timezone
date_default_timezone_set('Asia/Seoul');

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
    ini_set('display_errors', 0);
}

// Set JSON response header
header('Content-Type: application/json; charset=utf-8');

// CORS handling
if (ENABLE_CORS) {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    }

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
