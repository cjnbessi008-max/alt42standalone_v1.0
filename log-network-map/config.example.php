<?php
/**
 * Configuration File Example
 * Copy this file to config.php and update with your settings
 */

return [
    // Database Configuration
    'DB_HOST' => 'localhost',
    'DB_NAME' => 'log_network_map',
    'DB_USER' => 'root',
    'DB_PASS' => '',

    // Moodle Configuration
    'MOODLE_URL' => 'http://localhost/moodle',
    'MOODLE_TOKEN' => 'your_moodle_webservice_token_here',

    // Application Settings
    'APP_NAME' => 'Log Network Map',
    'APP_VERSION' => '1.0.0',
    'APP_ENV' => 'development', // development, production

    // Security
    'ALLOWED_ORIGINS' => [
        'http://localhost',
        'http://localhost:8080',
        'http://127.0.0.1'
    ],

    // Session
    'SESSION_TIMEOUT' => 3600, // 1 hour

    // API Rate Limiting
    'RATE_LIMIT_REQUESTS' => 100,
    'RATE_LIMIT_PERIOD' => 60, // seconds

    // Debug
    'DEBUG' => true,
    'LOG_ERRORS' => true,
    'ERROR_LOG_PATH' => __DIR__ . '/logs/error.log'
];
