<?php
/**
 * Invariant Finder - Configuration File
 *
 * @package InvariantFinder
 * @version 1.0
 * @copyright 2025 KAIST Touch Math Academy
 */

// Prevent direct access
defined('APP_ACCESS') or define('APP_ACCESS', true);

// Environment (development, staging, production)
define('ENVIRONMENT', 'development');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'invariant_finder');
define('DB_USER', 'root');  // Change in production
define('DB_PASS', '');      // Change in production
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('APP_NAME', 'Invariant Finder');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost/invariant-finder');  // Update to your domain

// Security Settings
define('SESSION_LIFETIME', 7200);  // 2 hours in seconds
define('PASSWORD_MIN_LENGTH', 6);
define('CSRF_TOKEN_NAME', '_csrf_token');

// File Paths
define('ROOT_PATH', dirname(__FILE__));
define('INCLUDES_PATH', ROOT_PATH . '/includes');
define('API_PATH', ROOT_PATH . '/api');
define('ASSETS_PATH', ROOT_PATH . '/assets');

// Error Reporting
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', ROOT_PATH . '/logs/error.log');
}

// Timezone
date_default_timezone_set('Asia/Seoul');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0);  // Set to 1 if using HTTPS
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Auto-regenerate session ID for security
if (!isset($_SESSION['session_created'])) {
    $_SESSION['session_created'] = time();
} else if (time() - $_SESSION['session_created'] > 1800) {
    // Regenerate session ID every 30 minutes
    session_regenerate_id(true);
    $_SESSION['session_created'] = time();
}

// Shape Types Configuration
define('SHAPE_TYPES', [
    'triangle' => [
        'name' => 'Triangle',
        'invariants' => ['angleSum', 'angleRatios', 'sideRatios'],
        'color' => '#3498db'
    ],
    'rectangle' => [
        'name' => 'Rectangle',
        'invariants' => ['rightAngles', 'aspectRatio', 'parallelSides'],
        'color' => '#e74c3c'
    ],
    'circle' => [
        'name' => 'Circle',
        'invariants' => ['pi', 'circleRatio'],
        'color' => '#2ecc71'
    ],
    'parallelogram' => [
        'name' => 'Parallelogram',
        'invariants' => ['parallelSides', 'oppositeAngles', 'sideRatios'],
        'color' => '#9b59b6'
    ]
]);

// Difficulty Levels
define('DIFFICULTY_LEVELS', [
    1 => 'Beginner',
    2 => 'Easy',
    3 => 'Medium',
    4 => 'Hard',
    5 => 'Expert'
]);

// Scoring Configuration
define('BASE_SCORE_WEIGHT', 0.70);  // 70% for finding invariants
define('EFFICIENCY_BONUS_WEIGHT', 0.20);  // 20% for efficiency
define('TIME_BONUS_WEIGHT', 0.10);  // 10% for speed

// Load required files
require_once INCLUDES_PATH . '/db.php';
require_once INCLUDES_PATH . '/functions.php';
require_once INCLUDES_PATH . '/auth.php';
