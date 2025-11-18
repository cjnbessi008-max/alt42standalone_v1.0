<?php
/**
 * Moodle Integration Configuration
 * Compatible with Moodle 3.7
 */

return [
    // Moodle database connection
    'moodle_db' => [
        'host' => getenv('MOODLE_DB_HOST') ?: 'localhost',
        'database' => getenv('MOODLE_DB_NAME') ?: 'moodle',
        'username' => getenv('MOODLE_DB_USER') ?: 'moodle',
        'password' => getenv('MOODLE_DB_PASS') ?: '',
        'prefix' => getenv('MOODLE_DB_PREFIX') ?: 'mdl_',
    ],

    // Moodle web service settings
    'webservice' => [
        'enabled' => true,
        'url' => getenv('MOODLE_URL') ?: 'http://localhost/moodle',
        'token' => getenv('MOODLE_WS_TOKEN') ?: '',
    ],

    // Question types to process
    'supported_question_types' => [
        'multichoice',
        'numerical',
        'essay',
        'calculated',
        'match',
    ],

    // Similarity detection settings
    'similarity_detection' => [
        'auto_detect' => true,
        'min_confidence' => 0.70,
        'max_hints_per_problem' => 5,
    ],
];
