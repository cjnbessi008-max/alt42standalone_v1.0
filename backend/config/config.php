<?php
/**
 * ALT42 Standalone Configuration
 * Moodle LMS Integration Settings
 */

// Database Configuration (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
define('MOODLE_WS_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');

// Application Settings
define('APP_NAME', 'ALT42 Live Graph');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);

// API Settings
define('API_RATE_LIMIT', 100); // requests per hour
define('CORS_ALLOWED_ORIGINS', '*'); // Change in production

// Graph Update Interval (milliseconds)
define('GRAPH_UPDATE_INTERVAL', 5000);

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');
