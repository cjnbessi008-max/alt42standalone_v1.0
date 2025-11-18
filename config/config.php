<?php
/**
 * Cognitive Recovery System Configuration
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'cognitive_recovery');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: ''); // Web service token
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Or your custom service name

// Application Settings
define('APP_NAME', 'Cognitive Recovery Tracker');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');

// Session Configuration
define('SESSION_LIFETIME', 7200); // 2 hours in seconds
define('SESSION_NAME', 'COGNITIVE_RECOVERY_SESSION');

// API Configuration
define('API_RATE_LIMIT', 100); // requests per minute
define('API_TIMEOUT', 30); // seconds

// Assessment Configuration
define('DEFAULT_ASSESSMENT_DURATION', 600); // 10 minutes in seconds
define('DEFAULT_REST_DURATION', 900); // 15 minutes in seconds
define('MIN_REST_DURATION', 300); // 5 minutes minimum
define('MAX_REST_DURATION', 3600); // 1 hour maximum

// Recovery Thresholds (percentage improvement)
define('RECOVERY_EXCELLENT', 20);
define('RECOVERY_GOOD', 10);
define('RECOVERY_MODERATE', 0);
define('RECOVERY_POOR', -10);

// Security
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', ['*']); // Configure for production
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change-this-secret-key');
define('JWT_EXPIRATION', 3600); // 1 hour

// Logging
define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'INFO'); // DEBUG, INFO, WARNING, ERROR
define('LOG_PATH', __DIR__ . '/../logs/');

// File Paths
define('ROOT_PATH', dirname(__DIR__));
define('APP_PATH', ROOT_PATH . '/app');
define('PUBLIC_PATH', ROOT_PATH . '/public');
define('STORAGE_PATH', ROOT_PATH . '/storage');

// Error Reporting (disable in production)
if (getenv('APP_ENV') === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Timezone
date_default_timezone_set(APP_TIMEZONE);

// Autoload function
spl_autoload_register(function ($class) {
    $file = APP_PATH . '/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});
