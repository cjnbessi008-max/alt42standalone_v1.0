<?php
/**
 * Application Configuration
 */

define('APP_NAME', 'Incorrect Solutions Comparison System');
define('APP_VERSION', '1.0.0');
define('APP_ENV', getenv('APP_ENV') ?: 'development');

// API Configuration
define('API_BASE_URL', getenv('API_BASE_URL') ?: 'http://localhost/api');
define('API_VERSION', 'v1');

// Moodle Integration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SYNC_ENABLED', getenv('MOODLE_SYNC_ENABLED') === 'true');

// AI Service Configuration (Claude API)
define('AI_PROVIDER', 'anthropic');
define('AI_API_KEY', getenv('ANTHROPIC_API_KEY') ?: '');
define('AI_MODEL', getenv('AI_MODEL') ?: 'claude-3-sonnet-20240229');
define('AI_MAX_TOKENS', 4096);

// Session Configuration
define('SESSION_LIFETIME', 7200); // 2 hours
define('SESSION_NAME', 'incorrect_solutions_session');

// Security
define('ENABLE_CSRF_PROTECTION', true);
define('ALLOWED_ORIGINS', explode(',', getenv('ALLOWED_ORIGINS') ?: '*'));

// Logging
define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'info');
define('LOG_PATH', __DIR__ . '/../logs');

// Paths
define('ROOT_PATH', dirname(__DIR__));
define('PUBLIC_PATH', ROOT_PATH . '/public');
define('UPLOAD_PATH', PUBLIC_PATH . '/uploads');

// Error Reporting
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');
