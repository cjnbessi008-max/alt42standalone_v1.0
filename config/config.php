<?php
/**
 * Configuration File for Weak Concept Link Detection System
 *
 * @package WeakLinkDetector
 * @version 1.0.0
 */

// Database Configuration (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_NAME', 'weak_link_detector');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Integration Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');  // Change to your Moodle URL
define('MOODLE_TOKEN', '');  // Web service token from Moodle
define('MOODLE_SERVICE', 'moodle_mobile_app');  // Service name

// Moodle Web Service Functions Used
define('MOODLE_WS_GET_QUIZZES', 'mod_quiz_get_quizzes_by_courses');
define('MOODLE_WS_GET_QUIZ_ATTEMPTS', 'mod_quiz_get_user_attempts');
define('MOODLE_WS_GET_ATTEMPT_DATA', 'mod_quiz_get_attempt_data');
define('MOODLE_WS_GET_QUESTIONS', 'core_question_get_random_question_summaries');

// Analysis Configuration
define('WEAK_LINK_THRESHOLD', 0.4);  // Links with strength < 0.4 are considered weak
define('LOW_ACCURACY_THRESHOLD', 60);  // Accuracy < 60% flags a concept as difficult
define('MIN_ATTEMPTS_FOR_ANALYSIS', 5);  // Minimum attempts needed for reliable analysis
define('CORRELATION_THRESHOLD', 0.7);  // High error correlation threshold

// System Configuration
define('TIMEZONE', 'Asia/Seoul');
define('DATE_FORMAT', 'Y-m-d H:i:s');
define('DEBUG_MODE', true);  // Set to false in production

// Set timezone
date_default_timezone_set(TIMEZONE);

// Error reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Application paths
define('BASE_PATH', dirname(__DIR__));
define('SRC_PATH', BASE_PATH . '/src');
define('PUBLIC_PATH', BASE_PATH . '/public');
define('SQL_PATH', BASE_PATH . '/sql');

// Auto-load classes
spl_autoload_register(function ($class) {
    $file = SRC_PATH . '/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});
