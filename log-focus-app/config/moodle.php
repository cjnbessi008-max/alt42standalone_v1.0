<?php
/**
 * Moodle 3.7 Integration Configuration
 */

// Moodle Web Service Configuration
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', 'YOUR_MOODLE_WEB_SERVICE_TOKEN_HERE');
define('MOODLE_SERVICE', 'moodle_mobile_app'); // or your custom service name

// Moodle API Endpoints
define('MOODLE_API_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');

// Moodle Web Service Functions
define('MOODLE_FUNCTIONS', [
    'GET_QUIZ_ATTEMPTS' => 'mod_quiz_get_user_attempts',
    'GET_QUIZ_DATA' => 'mod_quiz_get_quizzes_by_courses',
    'GET_USER_INFO' => 'core_user_get_users_by_field',
    'GET_COURSE_LOGS' => 'core_course_get_recent_courses',
    'GET_ASSIGNMENT_SUBMISSIONS' => 'mod_assign_get_submissions',
]);

// Cache settings
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 300); // 5 minutes in seconds

// Debug mode
define('MOODLE_DEBUG', true);
