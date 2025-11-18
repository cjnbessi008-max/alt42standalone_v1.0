<?php
/**
 * Moodle Integration Configuration
 * Focus Highlights System
 */

// Moodle site configuration
define('MOODLE_URL', 'http://localhost/moodle'); // Change to your Moodle URL
define('MOODLE_TOKEN', ''); // Generate from Moodle: Site administration > Plugins > Web services > Manage tokens

// Moodle web service endpoints
define('MOODLE_WS_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');
define('MOODLE_WS_FORMAT', 'json');

// Moodle API functions we'll use
define('MOODLE_FUNCTIONS', [
    'core_user_get_users_by_field',
    'core_course_get_courses',
    'core_course_get_contents',
    'core_enrol_get_enrolled_users',
    'mod_quiz_get_user_attempts',
    'mod_assign_get_submissions',
]);

// Session configuration
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_NAME', 'FH_SESSION');

// Security
define('SESSION_SECURE', false); // Set to true for HTTPS
define('SESSION_HTTPONLY', true);
