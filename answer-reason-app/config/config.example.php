<?php
/**
 * Answer Reason Tracking System - Configuration Example
 *
 * Copy this file to config.php and update with your settings
 */

return [
    // Database Configuration
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'answer_reason_db',
        'username' => 'your_db_user',
        'password' => 'your_db_password',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    // Moodle Integration
    'moodle' => [
        'url' => 'https://your-moodle-site.com',
        'token' => 'your_moodle_webservice_token',
        'service' => 'moodle_mobile_app',
        'sync_enabled' => false,
        'sync_interval' => 300, // seconds
    ],

    // Application Settings
    'app' => [
        'name' => 'Answer Reason Tracker',
        'version' => '1.0.0',
        'timezone' => 'Asia/Seoul',
        'debug' => true,
        'base_url' => 'http://localhost/answer-reason-app',
    ],

    // Session Configuration
    'session' => [
        'name' => 'ANSWER_REASON_SESSION',
        'lifetime' => 7200, // 2 hours in seconds
        'secure' => false, // Set to true if using HTTPS
        'httponly' => true,
    ],

    // Security
    'security' => [
        'secret_key' => 'change_this_to_random_string',
        'password_hash_algo' => PASSWORD_BCRYPT,
        'password_hash_cost' => 12,
    ],

    // Reason Text Settings
    'reason' => [
        'min_length' => 10, // minimum characters
        'max_length' => 2000, // maximum characters
        'require_category' => false,
        'allowed_categories' => [
            'conceptual' => '개념 이해 부족',
            'calculation' => '계산 실수',
            'careless' => '부주의한 실수',
            'misread' => '문제 오독',
            'other' => '기타'
        ],
    ],

    // Logging
    'logging' => [
        'enabled' => true,
        'level' => 'debug', // debug, info, warning, error
        'path' => __DIR__ . '/../logs',
    ],
];
