<?php
/**
 * Application Configuration
 */

return [
    // Application Settings
    'app_name' => 'Color Pattern Classifier',
    'app_version' => '1.0.0',
    'app_env' => getenv('APP_ENV') ?: 'development',
    'debug' => getenv('APP_DEBUG') === 'true',

    // URL Settings
    'base_url' => getenv('APP_URL') ?: 'http://localhost',
    'api_prefix' => '/api',

    // Session Settings
    'session_lifetime' => 7200, // 2 hours in seconds
    'session_name' => 'COLOR_PATTERN_SESSION',

    // Security Settings
    'secret_key' => getenv('APP_SECRET_KEY') ?: 'change-this-secret-key-in-production',
    'allowed_origins' => explode(',', getenv('ALLOWED_ORIGINS') ?: '*'),

    // Timezone
    'timezone' => 'Asia/Seoul',

    // Logging
    'log_path' => __DIR__ . '/../logs',
    'log_level' => getenv('LOG_LEVEL') ?: 'info',

    // Pattern Classification Settings
    'max_sequence_length' => 20,
    'min_sequence_length' => 3,
    'max_attempts_per_problem' => 5,
    'passing_score' => 70, // Percentage

    // Virtual Phone Display
    'phone_viewport' => [
        'width' => 375,
        'height' => 667,
        'scale' => 1
    ],

    // Color Palette for Patterns
    'default_colors' => [
        '#FF6B6B', // Red - Arithmetic
        '#4ECDC4', // Teal - Geometric
        '#FFE66D', // Yellow - Fibonacci
        '#A8E6CF', // Green - Quadratic
        '#FF8B94', // Pink - Prime
        '#C7CEEA', // Purple - Exponential
    ]
];
