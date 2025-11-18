<?php
/**
 * Moodle Self-Grading Math System Configuration
 * PHP 7.1.9 Compatible
 */

// Error Reporting (set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Seoul');

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'moodle_selfgrading');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('APP_NAME', 'Moodle Self-Grading Math System');
define('APP_VERSION', '1.0.0');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost:8000');
define('APP_ENV', getenv('APP_ENV') ?: 'development');

// Session Configuration
define('SESSION_LIFETIME', 7200); // 2 hours
define('SESSION_NAME', 'MOODLE_SG_SESSION');

// LTI Configuration
define('LTI_VERSION', 'LTI-1p0');
define('LTI_TOOL_NAME', 'Math Self-Grading Tool');
define('LTI_TOOL_DESCRIPTION', 'Students solve problems and provide self-verification');
define('LTI_LAUNCH_URL', APP_URL . '/lti/launch.php');

// AI Configuration (Claude API)
define('AI_ENABLED', getenv('AI_ENABLED') ?: true);
define('AI_PROVIDER', 'claude');
define('CLAUDE_API_KEY', getenv('CLAUDE_API_KEY') ?: '');
define('CLAUDE_API_URL', 'https://api.anthropic.com/v1/messages');
define('CLAUDE_MODEL', 'claude-3-sonnet-20240229');
define('CLAUDE_MAX_TOKENS', 2000);

// File Upload Configuration
define('UPLOAD_MAX_SIZE', 5242880); // 5MB
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf']);

// Grading Configuration
define('DEFAULT_MAX_SCORE', 100);
define('VERIFICATION_WEIGHT', 0.3); // 30% of grade from verification quality
define('ANSWER_WEIGHT', 0.7); // 70% of grade from correct answer

// Security
define('CSRF_TOKEN_NAME', 'csrf_token');
define('CSRF_TOKEN_EXPIRE', 3600); // 1 hour

// Paths
define('ROOT_PATH', dirname(dirname(__DIR__)));
define('SRC_PATH', ROOT_PATH . '/src');
define('VIEW_PATH', SRC_PATH . '/views');
define('LIB_PATH', SRC_PATH . '/lib');
define('UPLOAD_PATH', ROOT_PATH . '/uploads');

// Auto-create upload directory
if (!file_exists(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0755, true);
}

// Logging
define('LOG_PATH', ROOT_PATH . '/logs');
define('LOG_LEVEL', 'DEBUG'); // DEBUG, INFO, WARNING, ERROR

// Auto-create log directory
if (!file_exists(LOG_PATH)) {
    mkdir(LOG_PATH, 0755, true);
}
