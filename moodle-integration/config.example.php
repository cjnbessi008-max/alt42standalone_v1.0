<?php
/**
 * Example Configuration File
 * Copy this to backend/config/ and rename appropriately
 */

// ========================================
// DATABASE CONFIGURATION
// ========================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle_integration_app');
define('DB_USER', 'moodle_app');
define('DB_PASS', 'your_secure_password_here');
define('DB_CHARSET', 'utf8mb4');

// ========================================
// MOODLE LMS CONFIGURATION
// ========================================
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_web_service_token_here');
define('MOODLE_SERVICE', 'moodle_mobile_app');

// Web Service Functions
define('MOODLE_WS_FUNCTION_GET_QUIZ', 'mod_quiz_get_quizzes_by_courses');
define('MOODLE_WS_FUNCTION_GET_QUESTIONS', 'mod_quiz_get_quiz_questions');
define('MOODLE_WS_FUNCTION_START_ATTEMPT', 'mod_quiz_start_attempt');
define('MOODLE_WS_FUNCTION_PROCESS_ATTEMPT', 'mod_quiz_process_attempt');
define('MOODLE_WS_FUNCTION_GET_USER_ATTEMPTS', 'mod_quiz_get_user_attempts');

// ========================================
// APPLICATION SETTINGS
// ========================================

// Environment (development, production)
define('APP_ENV', 'development');

// Debugging
define('DEBUG_MODE', true);
define('ERROR_REPORTING', E_ALL);

// Timezone
date_default_timezone_set('Asia/Seoul');

// ========================================
// CROSS WAVE SETTINGS
// ========================================
define('WAVE_DEFAULT_COLOR', '#4CAF50');
define('WAVE_DEFAULT_DURATION', 2000);
define('WAVE_DEFAULT_MAX_RADIUS', 500);
define('WAVE_DEFAULT_INTENSITY', 100);

// ========================================
// SECURITY SETTINGS
// ========================================

// Session settings
define('SESSION_LIFETIME', 3600); // 1 hour
define('SESSION_NAME', 'MOODLE_QUIZ_APP');

// CORS settings
define('CORS_ALLOWED_ORIGINS', '*'); // Change to specific domain in production
define('CORS_ALLOWED_METHODS', 'GET, POST, OPTIONS');
define('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization');

// Rate limiting
define('RATE_LIMIT_ENABLED', false);
define('RATE_LIMIT_MAX_REQUESTS', 100);
define('RATE_LIMIT_TIME_WINDOW', 3600); // 1 hour

// ========================================
// LOGGING SETTINGS
// ========================================
define('LOG_ENABLED', true);
define('LOG_PATH', __DIR__ . '/../../logs/');
define('LOG_LEVEL', 'debug'); // debug, info, warning, error

// ========================================
// CACHE SETTINGS
// ========================================
define('CACHE_ENABLED', true);
define('CACHE_QUESTIONS', true);
define('CACHE_TTL', 3600); // 1 hour

// ========================================
// API SETTINGS
// ========================================
define('API_TIMEOUT', 30); // seconds
define('API_MAX_RETRIES', 3);

// ========================================
// FEATURE FLAGS
// ========================================
define('FEATURE_WAVE_PARTICLES', true);
define('FEATURE_WAVE_CROSS_LINES', true);
define('FEATURE_WAVE_SHIMMER', true);
define('FEATURE_SMARTPHONE_DRAGGABLE', true);
define('FEATURE_DEMO_MODE', true); // Allow demo questions when Moodle unavailable

// ========================================
// CONSTANTS
// ========================================
define('APP_NAME', 'Moodle Quiz Cross Wave App');
define('APP_VERSION', '1.0.0');
define('APP_AUTHOR', 'Your Name');

?>
