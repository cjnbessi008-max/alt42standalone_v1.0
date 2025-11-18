<?php
/**
 * Graph Chime Configuration - Example File
 * Copy this file to config.php and update with your settings
 */

// Database Configuration (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_NAME', 'graph_chime');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration (Moodle 3.7)
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_moodle_webservice_token_here');
define('MOODLE_WS_FUNCTION_PREFIX', 'local_graphchime_');

// Application Settings
define('APP_NAME', 'Graph Chime');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true); // Set to false in production

// Audio Settings
define('AUDIO_ENABLED', true);
define('DEFAULT_WAVE_TYPE', 'sine');
define('DEFAULT_DURATION_MS', 500);

// Session Settings
define('SESSION_TIMEOUT', 3600); // 1 hour

// CORS Settings (for development)
define('ALLOW_CORS', true);
define('ALLOWED_ORIGINS', ['http://localhost', 'http://127.0.0.1']);

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Seoul');
