<?php
/**
 * Hundred Art - Configuration File
 * MySQL 5.7, PHP 7.1.9 Compatible
 */

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'hundred_art');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: ''); // Moodle Web Service Token
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Moodle service name

// Application Configuration
define('APP_NAME', 'Hundred Art');
define('APP_VERSION', '1.0.0');
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('APP_DEBUG', APP_ENV === 'development');

// API Configuration
define('API_PREFIX', '/api');
define('API_VERSION', 'v1');

// CORS Configuration
define('CORS_ALLOWED_ORIGINS', getenv('CORS_ORIGINS') ?: '*');
define('CORS_ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With');

// Session Configuration
define('SESSION_LIFETIME', 3600); // 1 hour
define('SESSION_NAME', 'HUNDRED_ART_SESSION');

// File Upload Configuration
define('UPLOAD_MAX_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/svg+xml']);

// Logging Configuration
define('LOG_PATH', __DIR__ . '/../../logs');
define('LOG_LEVEL', APP_DEBUG ? 'DEBUG' : 'INFO');

// Timezone
date_default_timezone_set('Asia/Seoul');

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
