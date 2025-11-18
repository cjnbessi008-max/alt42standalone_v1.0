<?php
/**
 * Configuration File - Example
 * Copy this file to config.php and update with your settings
 */

return [
    // Database Configuration
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'prerequisite_checker',
        'username' => 'your_db_user',
        'password' => 'your_db_password',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ],

    // Moodle Configuration
    'moodle' => [
        'url' => 'https://your-moodle-site.com',
        'token' => 'your_moodle_webservice_token',
        'service' => 'moodle_mobile_app', // or your custom service
        'timeout' => 30, // API request timeout in seconds
    ],

    // Application Settings
    'app' => [
        'name' => 'Prerequisite Knowledge Checker',
        'version' => '1.0.0',
        'timezone' => 'Asia/Seoul',
        'debug' => true, // Set to false in production
        'log_level' => 'DEBUG', // DEBUG, INFO, WARNING, ERROR
    ],

    // Assessment Engine Settings
    'assessment' => [
        'default_mastery_threshold' => 0.70,
        'confidence_min_evidence' => 3,
        'assessment_decay_days' => 90,
        'grade_weight_quiz' => 0.7,
        'grade_weight_assignment' => 0.3,
    ],

    // Recommendation Settings
    'recommendation' => [
        'max_items' => 5,
        'high_priority_threshold' => 0.50,
        'medium_priority_threshold' => 0.65,
    ],

    // Sync Settings
    'sync' => [
        'interval_hours' => 24,
        'batch_size' => 100,
        'auto_sync_enabled' => true,
    ],

    // Security Settings
    'security' => [
        'session_lifetime' => 7200, // 2 hours in seconds
        'csrf_protection' => true,
        'allowed_origins' => ['*'], // CORS - Set specific domains in production
    ],

    // Paths
    'paths' => [
        'logs' => __DIR__ . '/../logs',
        'cache' => __DIR__ . '/../cache',
    ],
];
