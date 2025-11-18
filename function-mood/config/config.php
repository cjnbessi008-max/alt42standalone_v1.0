<?php
/**
 * Function Mood Configuration
 * PHP 7.1.9 Compatible
 *
 * Configuration for LMS integration and database connection
 */

// Error Reporting (Development mode)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_mood');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle LMS Configuration
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', ''); // Set your Moodle web service token
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Default service name

// Moodle Database Configuration (for direct queries if needed)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'root');
define('MOODLE_DB_PASS', '');
define('MOODLE_DB_PREFIX', 'mdl_'); // Default Moodle table prefix

// Application Settings
define('APP_NAME', 'Function Mood');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');

// API Settings
define('API_RATE_LIMIT', 100); // Requests per minute
define('API_TIMEOUT', 30); // Seconds

// Function Analysis Settings
define('ANALYSIS_SAMPLE_POINTS', 100); // Number of points to sample for analysis
define('ANALYSIS_PRECISION', 4); // Decimal precision for calculations

// Smartphone Display Settings
define('SMARTPHONE_WIDTH', 375); // pixels
define('SMARTPHONE_HEIGHT', 667); // pixels (iPhone SE size)
define('SMARTPHONE_POSITION', 'bottom-right'); // Position on screen

// Session Configuration
ini_set('session.gc_maxlifetime', 3600); // 1 hour
session_start();

// Timezone
date_default_timezone_set(APP_TIMEZONE);

// Autoloader for classes
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../includes/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// CORS Headers (for API access)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
