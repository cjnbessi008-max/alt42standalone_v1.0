<?php
/**
 * Substitution Shift - Configuration File
 *
 * MySQL 5.7 + PHP 7.1.9 + Moodle 3.7 compatible
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'substitution_shift');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle Integration
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
define('MOODLE_SERVICE', 'moodle_mobile_app'); // or custom service

// API Settings
define('API_VERSION', 'v1');
define('API_BASE_PATH', '/api');

// CORS Settings
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',
    'https://your-moodle-site.com',
]);

// Security
define('SECRET_KEY', 'your-secret-key-change-this-in-production');
define('SESSION_LIFETIME', 3600); // 1 hour in seconds

// Application Settings
define('DEFAULT_LANGUAGE', 'ko');
define('SUPPORTED_LANGUAGES', ['ko', 'en']);

// Animation Defaults
define('DEFAULT_TRANSITION_MS', 800);
define('DEFAULT_HIGHLIGHT_MS', 1500);

// Error Reporting (set to false in production)
define('DEBUG_MODE', true);

// File Upload (if needed)
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_ALLOWED_TYPES', ['json', 'tex']);

// Logging
define('LOG_PATH', __DIR__ . '/../../logs');
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR

// Cache
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 300); // 5 minutes

?>
