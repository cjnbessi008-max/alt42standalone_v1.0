<?php
/**
 * Application Configuration
 * Math Concept Game System
 */

// Error reporting (disable in production)
$env = getenv('APP_ENV') ?: 'development';
if ($env === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', ($env === 'production') ? 1 : 0); // HTTPS only in production

// Application settings
define('APP_NAME', 'Math Concept Game System');
define('APP_VERSION', '1.0.0');
define('APP_ENV', $env);

// Paths
define('BASE_PATH', dirname(__DIR__));
define('API_PATH', BASE_PATH . '/api');
define('PUBLIC_PATH', BASE_PATH . '/public');
define('CONFIG_PATH', BASE_PATH . '/config');

// URLs (adjust based on your server setup)
define('BASE_URL', ($env === 'development') ? 'http://localhost/math-game' : 'https://yourdomain.com');
define('API_URL', BASE_URL . '/api');

// Points configuration
define('POINTS_PER_STAGE_1', 20);
define('POINTS_PER_STAGE_2', 25);
define('POINTS_PER_STAGE_3', 30);
define('POINTS_PER_STAGE_4', 40);
define('POINTS_PER_STAGE_5', 50);
define('BONUS_PERFECT_SCORE', 10); // Extra points for 100% score
define('BONUS_SPEED_MULTIPLIER', 1.5); // Multiplier for fast completion

// Game configuration
define('MIN_STAGE_SCORE_TO_PASS', 60.0); // 60% minimum to complete a stage
define('SESSION_TIMEOUT_MINUTES', 30);

// Moodle integration (configure these based on your Moodle setup)
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_WS_TOKEN', getenv('MOODLE_WS_TOKEN') ?: '');
define('MOODLE_WS_FUNCTION', 'local_mathgame_sync'); // Custom Moodle web service function

// Security
define('API_KEY_HEADER', 'X-API-Key'); // For internal API calls
define('SESSION_NAME', 'MATH_GAME_SESSION');

// CORS settings (for widget integration)
$allowed_origins = [
    'http://localhost',
    'http://localhost:3000',
    // Add your production domains here
];

define('ALLOWED_ORIGINS', $allowed_origins);

// File upload limits (for future features like student avatars)
define('MAX_UPLOAD_SIZE', 2 * 1024 * 1024); // 2MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif']);

return [
    'env' => $env,
    'app_name' => APP_NAME,
    'version' => APP_VERSION,
    'base_url' => BASE_URL,
    'api_url' => API_URL,
];
