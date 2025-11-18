<?php
/**
 * Sample Configuration File
 *
 * Copy this file to config.php and update with your settings
 *
 * Command: cp config.sample.php config.php
 */

// Error reporting (Change for production)
error_reporting(E_ALL);
ini_set('display_errors', 1);  // Set to 0 for production

// Timezone
date_default_timezone_set('Asia/Seoul');

// ========================================
// Application Settings
// ========================================

define('APP_NAME', 'Scaling Stream');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost');  // Change to your domain

// ========================================
// Moodle Settings
// ========================================

// Moodle installation URL
define('MOODLE_URL', 'http://localhost/moodle');

// Moodle Web Service Token (Optional - leave empty if not using web services)
define('MOODLE_TOKEN', '');

// Moodle Web Service Name
define('MOODLE_SERVICE', 'moodle_mobile_app');

// ========================================
// Database Settings
// ========================================

// These should match your Moodle database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', '');  // IMPORTANT: Set your password here
define('DB_CHARSET', 'utf8mb4');

// ========================================
// Scaling Stream Settings
// ========================================

// Maximum scale factor (how big shapes can grow)
define('MAX_SCALE_FACTOR', 10);

// Minimum scale factor (how small shapes can shrink)
define('MIN_SCALE_FACTOR', 0.1);

// Default scale factor
define('DEFAULT_SCALE_FACTOR', 1);

// Animation duration in milliseconds
define('ANIMATION_DURATION', 300);

// ========================================
// API Settings
// ========================================

// API request timeout in seconds
define('API_TIMEOUT', 30);

// Maximum number of results to return
define('API_MAX_RESULTS', 100);

// ========================================
// Security Settings
// ========================================

// Session settings
ini_set('session.cookie_httponly', 1);
session_start();

// CORS headers
// IMPORTANT: Adjust these for production
header('Access-Control-Allow-Origin: *');  // Change to specific domain in production
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========================================
// Production Settings
// ========================================

/*
// Uncomment these for production:

error_reporting(0);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/php/scaling-stream-errors.log');

// Restrict CORS to your domain
header('Access-Control-Allow-Origin: https://your-domain.com');
*/

?>
