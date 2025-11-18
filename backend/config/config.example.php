<?php
/**
 * Power Candle Configuration
 * Copy this file to config.php and update with your credentials
 */

return [
    // Database Configuration
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'power_candle',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
    ],

    // Moodle Integration
    'moodle' => [
        'url' => 'https://your-moodle-instance.com',
        'token' => 'your-webservice-token-here',
        'service' => 'moodle_mobile_app', // or your custom service
        'quiz_id' => 1, // Default quiz ID for Power Candle
    ],

    // Application Settings
    'app' => [
        'name' => 'Power Candle',
        'version' => '1.0.0',
        'debug' => true,
        'timezone' => 'Asia/Seoul',
        'session_lifetime' => 3600, // 1 hour in seconds
    ],

    // CORS Settings
    'cors' => [
        'allowed_origins' => [
            'http://localhost:3000', // React dev server
            'https://your-production-domain.com'
        ],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization'],
    ],

    // Security Settings
    'security' => [
        'max_attempts_per_minute' => 60,
        'session_cookie_name' => 'POWER_CANDLE_SESSION',
        'csrf_token_name' => 'csrf_token',
    ],

    // Logging
    'logging' => [
        'enabled' => true,
        'level' => 'debug', // debug, info, warning, error
        'path' => __DIR__ . '/../logs/',
    ],
];
