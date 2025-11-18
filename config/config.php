<?php
/**
 * Configuration File
 * Math App with Extrema Tremor Fix - Moodle Integration
 */

// Database Configuration (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_NAME', 'moodle');
define('DB_PORT', 3306);

// Moodle Configuration
define('MOODLE_PREFIX', 'mdl_');
define('MOODLE_VERSION', '3.7');

// Application Settings
define('APP_NAME', 'Math App - Extrema Tremor Fix');
define('APP_VERSION', '1.0.0');
define('APP_ENV', 'development'); // development, production

// API Settings
define('API_TIMEOUT', 30); // seconds
define('API_MAX_REQUESTS_PER_MINUTE', 60);

// Session Settings
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_REFRESH_INTERVAL', 30); // seconds

// Graph Rendering Settings
define('DEFAULT_SAMPLING_RATE', 300);
define('DEFAULT_SMOOTHING_FACTOR', 0.3);
define('ENABLE_ANTI_TREMOR', true);

// Logging
define('LOG_ENABLED', true);
define('LOG_PATH', __DIR__ . '/../logs/app.log');
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR

// Security
define('ALLOWED_ORIGINS', '*'); // In production, specify exact domains
define('ENABLE_CSRF_PROTECTION', false); // Set to true in production
define('SESSION_SECURE', false); // Set to true when using HTTPS

// Paths
define('BASE_PATH', dirname(__DIR__));
define('PUBLIC_PATH', BASE_PATH . '/public');
define('SRC_PATH', BASE_PATH . '/src');
define('CONFIG_PATH', BASE_PATH . '/config');

// Error Handling
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Timezone
date_default_timezone_set('Asia/Seoul');

// PHP Settings
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '60');
