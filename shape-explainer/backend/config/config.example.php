<?php
/**
 * Shape Explainer Configuration
 * PHP 7.1.9 호환
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'shape_explainer');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', 'your-moodle-webservice-token');
define('MOODLE_SERVICE', 'shape_explainer_service');

// Application Settings
define('APP_DEBUG', true);
define('APP_TIMEZONE', 'Asia/Seoul');
define('APP_LANGUAGE', 'ko');

// Session Settings
define('SESSION_LIFETIME', 7200); // 2 hours in seconds
define('SESSION_NAME', 'SHAPE_EXPLAINER_SESSION');

// API Settings
define('API_VERSION', 'v1');
define('API_RATE_LIMIT', 100); // requests per hour

// Animation Settings
define('DEFAULT_ANIMATION_SPEED', 1.0);
define('MAX_ANIMATION_STEPS', 20);

// Security Settings
define('ALLOWED_ORIGINS', 'http://localhost,http://localhost/moodle');
define('ENABLE_CORS', true);

// Error Reporting (disable in production)
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set timezone
date_default_timezone_set(APP_TIMEZONE);
