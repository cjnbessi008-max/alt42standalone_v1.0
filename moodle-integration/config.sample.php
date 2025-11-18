<?php
/**
 * Moodle Integration Configuration
 *
 * Copy this file to config.php and update with your settings
 */

return [
    // Moodle connection settings
    'moodle' => [
        'base_url' => 'https://your-moodle-site.com',
        'token' => 'your-web-service-token-here',
        'service' => 'moodle_mobile_app', // or your custom service
    ],

    // MySQL database settings
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'prerequisite_gaps',
        'username' => 'db_user',
        'password' => 'db_password',
        'charset' => 'utf8mb4',
    ],

    // Gap detection settings
    'gap_detection' => [
        // Minimum passing score (percentage)
        'passing_threshold' => 70,

        // Minimum number of attempts to analyze
        'min_attempts' => 3,

        // Time window for analysis (days)
        'analysis_window_days' => 30,

        // Confidence threshold for gap detection (0-1)
        'confidence_threshold' => 0.7,

        // Prerequisite relationship definitions
        // Format: 'current_concept' => ['prerequisite1', 'prerequisite2']
        'prerequisites' => [
            'fractions_multiplication' => ['fractions_basic', 'multiplication_basic'],
            'fractions_division' => ['fractions_multiplication', 'division_basic'],
            'algebra_equations' => ['arithmetic_operations', 'variables_basic'],
            'geometry_area' => ['shapes_basic', 'multiplication_basic'],
        ],
    ],

    // Sync settings
    'sync' => [
        'enabled' => true,
        'interval_minutes' => 60, // How often to sync
        'batch_size' => 100, // Number of students per batch
    ],

    // API settings
    'api' => [
        'enabled' => true,
        'auth_required' => true,
        'api_key' => 'your-api-key-here',
    ],

    // Logging settings
    'logging' => [
        'enabled' => true,
        'level' => 'info', // debug, info, warning, error
        'file' => __DIR__ . '/../logs/moodle-integration.log',
    ],
];
