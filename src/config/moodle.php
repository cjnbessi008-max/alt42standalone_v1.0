<?php
/**
 * Moodle 3.7 API Configuration
 */

return [
    'base_url' => getenv('MOODLE_URL') ?: 'http://localhost/moodle',
    'api_token' => getenv('MOODLE_TOKEN') ?: '',
    'webservice_endpoint' => '/webservice/rest/server.php',
    'format' => 'json',

    // API function names for Moodle 3.7
    'functions' => [
        'get_questions' => 'mod_quiz_get_quiz_questions',
        'get_attempts' => 'mod_quiz_get_user_attempts',
        'get_quiz' => 'mod_quiz_get_quizzes_by_courses',
        'get_question_bank' => 'core_question_get_questions',
    ],

    // Cache settings
    'cache_enabled' => true,
    'cache_ttl' => 300, // 5 minutes
];
