<?php
/**
 * Configuration File
 * PHP 7.1.9 compatible
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'symmetry_discovery');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration
define('MOODLE_ENABLED', true);
define('MOODLE_DIR', '/path/to/moodle'); // Update with actual Moodle installation path
define('MOODLE_WWWROOT', 'https://your-moodle-site.com');
define('MOODLE_DATAROOT', '/path/to/moodledata');

// Session Configuration
define('SESSION_TIMEOUT', 3600); // 1 hour in seconds
define('SESSION_COOKIE_NAME', 'sym_session');

// Security Configuration
define('API_SECRET_KEY', 'your-secret-key-here'); // Change this in production
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', '*'); // Restrict in production

// Application Configuration
define('APP_NAME', 'Symmetry Discovery');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', false); // Set to false in production

// Scoring Configuration
define('BASE_SCORE_PER_SYMMETRY', 100);
define('COMPLETION_BONUS', 500);
define('HINT_PENALTY', 0);
define('MAX_HINTS_PER_SHAPE', 3);

// Leaderboard Configuration
define('LEADERBOARD_MAX_ENTRIES', 100);
define('LEADERBOARD_CACHE_TIME', 300); // 5 minutes

// Logging Configuration
define('ENABLE_EVENT_LOGGING', true);
define('LOG_FILE_PATH', __DIR__ . '/../logs/app.log');

// Timezone
date_default_timezone_set('Asia/Seoul');

// Error Reporting (Production Settings)
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', LOG_FILE_PATH);
}

// Security Headers
if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
}
