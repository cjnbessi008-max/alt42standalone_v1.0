<?php
/**
 * Moodle LTI Integration Configuration
 * Compatible with Moodle 3.7
 */

// Moodle instance settings
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');

// LTI settings
define('LTI_KEY', getenv('LTI_KEY') ?: 'sequence_puzzle_key');
define('LTI_SECRET', getenv('LTI_SECRET') ?: 'change_this_secret');

// Application settings
define('APP_URL', getenv('APP_URL') ?: 'http://localhost');
define('APP_NAME', 'Sequence Puzzle');
define('APP_VERSION', '1.0.0');

// Session settings
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_NAME', 'sequence_puzzle_session');

// Security settings
define('ENABLE_CSRF_PROTECTION', true);
define('ALLOWED_ORIGINS', getenv('ALLOWED_ORIGINS') ?: '*');

// Debug mode
define('DEBUG_MODE', getenv('DEBUG_MODE') === 'true');

// Timezone
date_default_timezone_set('Asia/Seoul');

// Error reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}
