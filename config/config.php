<?php
/**
 * Vector Star Map - Global Configuration
 *
 * LMS Integration for Educational Problem Visualization
 * Compatible with Moodle 3.7
 */

// Error Reporting (Development mode)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Application Settings
define('APP_NAME', 'Vector Star Map');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Asia/Seoul');
date_default_timezone_set(APP_TIMEZONE);

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'vector_star_map');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle LMS Integration
define('MOODLE_URL', 'http://localhost/moodle');  // Moodle 3.7 base URL
define('MOODLE_WS_TOKEN', '');  // Web Service Token (configure in Moodle)
define('MOODLE_WS_FUNCTION', 'core_course_get_contents');  // Default WS function

// Mobile Screen Simulator Settings
define('MOBILE_WIDTH', 375);   // iPhone X width
define('MOBILE_HEIGHT', 667);  // iPhone X height
define('MOBILE_POSITION', 'bottom-right');  // Position on screen

// Vector Star Map Settings
define('STAR_MAP_CANVAS_WIDTH', 350);
define('STAR_MAP_CANVAS_HEIGHT', 600);
define('STAR_MAP_MAX_VECTORS', 50);  // Maximum number of vectors/stars
define('STAR_MAP_CONNECTION_THRESHOLD', 0.7);  // Similarity threshold for connections

// Animation Settings
define('ANIMATION_DURATION', 1000);  // milliseconds
define('PARTICLE_EFFECT', true);
define('CONSTELLATION_GLOW', true);

// API Settings
define('API_RESPONSE_FORMAT', 'json');
define('API_TIMEOUT', 30);  // seconds

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
session_start();

// Helper Functions
function get_base_url() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $script = str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']);
    return $protocol . $host . $script;
}

define('BASE_URL', get_base_url());
?>
