<?php
/**
 * Configuration File Example
 * Copy this file to /public/api/config.php and update with your actual values
 */

return [
    // Database Configuration
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'focus_lms',
        'username' => 'your_db_username',
        'password' => 'your_db_password',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ],

    // Application Settings
    'app' => [
        'name' => 'Focus Tracking LMS',
        'version' => '1.0.0',
        'environment' => 'production', // development, staging, production
        'debug' => false,
        'timezone' => 'Asia/Seoul',
    ],

    // Security
    'security' => [
        'jwt_secret' => 'CHANGE_THIS_TO_RANDOM_STRING_MIN_32_CHARS',
        'jwt_algorithm' => 'HS256',
        'jwt_expiration' => 3600, // 1 hour in seconds
        'password_algorithm' => PASSWORD_DEFAULT,
        'session_lifetime' => 7200, // 2 hours
    ],

    // CORS Settings
    'cors' => [
        'allowed_origins' => ['http://localhost', 'http://localhost:8000'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'max_age' => 86400,
    ],

    // Focus Tracking Settings
    'focus' => [
        'idle_threshold_seconds' => 30, // 30초 이상 활동 없으면 idle
        'sampling_rate_ms' => 5000, // 5초마다 집중도 샘플링
        'min_focus_duration' => 5, // 최소 5초 집중 지속
        'difficulty_weights' => [
            1 => 1.0,
            2 => 1.2,
            3 => 1.5,
            4 => 1.8,
            5 => 2.0,
        ],
    ],

    // Scoring Algorithm Weights
    'scoring' => [
        'focus_weight' => 0.6,
        'stability_weight' => 0.2,
        'accuracy_weight' => 0.2,
    ],

    // Rate Limiting
    'rate_limit' => [
        'enabled' => true,
        'requests_per_minute' => 60,
        'requests_per_hour' => 1000,
    ],

    // Logging
    'logging' => [
        'enabled' => true,
        'level' => 'INFO', // DEBUG, INFO, WARNING, ERROR, CRITICAL
        'file' => __DIR__ . '/../logs/app.log',
    ],
];
