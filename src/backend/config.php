<?php
/**
 * Function Digest - Configuration
 * PHP 7.1.9 Compatible
 */

// Database Configuration (MySQL 5.7)
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_digest_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Configuration (Moodle 3.7)
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_WS_TOKEN', 'your_moodle_webservice_token_here');
define('MOODLE_WS_FUNCTION', 'core_question_get_questions');

// CORS Settings
define('ALLOW_ORIGIN', '*'); // Change in production

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Timezone
date_default_timezone_set('Asia/Seoul');
