<?php
/**
 * Moodle Integration Configuration
 * For Moodle 3.7 REST API integration
 */

return [
    // Moodle installation URL (update with your Moodle URL)
    'url' => 'http://localhost/moodle',

    // Web service token (generate from Moodle: Site administration > Plugins > Web services)
    'token' => '',

    // REST API endpoint
    'rest_endpoint' => '/webservice/rest/server.php',

    // Web service functions to use
    'functions' => [
        'get_users' => 'core_user_get_users',
        'get_user_by_field' => 'core_user_get_users_by_field',
        'get_courses' => 'core_course_get_courses',
        'get_quizzes' => 'mod_quiz_get_quizzes_by_courses',
        'update_grades' => 'core_grades_update_grades',
    ],

    // Sync settings
    'auto_sync_users' => true,
    'auto_sync_grades' => true,
    'sync_interval' => 3600, // 1 hour in seconds

    // API settings
    'timeout' => 30,
    'response_format' => 'json',
];
