<?php
/**
 * Moodle 3.7 Integration Configuration
 */

return [
    // Moodle Server Settings
    'base_url' => getenv('MOODLE_URL') ?: 'http://localhost/moodle',
    'webservice_endpoint' => '/webservice/rest/server.php',

    // Moodle Web Service Token
    'ws_token' => getenv('MOODLE_WS_TOKEN') ?: '',

    // Moodle Service Functions (Must be enabled in Moodle)
    'required_functions' => [
        'core_user_get_users_by_field',
        'core_course_get_contents',
        'mod_quiz_get_quizzes_by_courses',
        'mod_quiz_get_attempt_data',
        'mod_quiz_save_attempt',
        'core_grades_update_grades'
    ],

    // Connection Settings
    'timeout' => 30, // seconds
    'verify_ssl' => getenv('MOODLE_VERIFY_SSL') !== 'false',

    // Response Format
    'response_format' => 'json',

    // Custom Question Type for Color Pattern
    'question_type' => 'colorpattern',
    'question_category' => 'Pattern Classification',

    // Grade Settings
    'grade_method' => 'highest', // highest, average, first, last
    'max_grade' => 100,

    // Sync Settings
    'auto_sync_grades' => true,
    'sync_interval' => 300, // 5 minutes in seconds

    // Cache Settings
    'cache_enabled' => true,
    'cache_ttl' => 600, // 10 minutes
];
