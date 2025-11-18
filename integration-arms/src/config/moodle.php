<?php
/**
 * Moodle Integration Configuration
 * Integration Arms - Moodle 3.7
 */

// Moodle connection settings
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'integration_arms_service');

// Moodle Web Services endpoints
define('MOODLE_WS_URL', MOODLE_URL . '/webservice/rest/server.php');
define('MOODLE_WS_FORMAT', 'json');

// Required Moodle capabilities
define('MOODLE_REQUIRED_CAPABILITIES', [
    'mod/quiz:view',
    'mod/quiz:attempt',
    'mod/quiz:submit',
]);

// Moodle question type
define('MOODLE_QUESTION_TYPE', 'qtype_integration');

// Session settings
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_COOKIE_NAME', 'integration_arms_session');
define('SESSION_COOKIE_PATH', '/');
define('SESSION_COOKIE_SECURE', false); // Set to true in production with HTTPS
define('SESSION_COOKIE_HTTPONLY', true);

// CSRF protection
define('CSRF_TOKEN_NAME', 'csrf_token');
define('CSRF_TOKEN_LENGTH', 32);

// API rate limiting
define('API_RATE_LIMIT', 100); // requests per minute
define('API_RATE_WINDOW', 60); // seconds

// Logging
define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'INFO'); // DEBUG, INFO, WARNING, ERROR
define('LOG_FILE', __DIR__ . '/../../logs/integration_arms.log');
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10MB

// Error handling
define('DISPLAY_ERRORS', getenv('ENVIRONMENT') === 'development');
define('ERROR_REPORTING_LEVEL', E_ALL);

// Application settings
define('APP_NAME', 'Integration Arms');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

// Error reporting
error_reporting(ERROR_REPORTING_LEVEL);
ini_set('display_errors', DISPLAY_ERRORS ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', LOG_FILE);
