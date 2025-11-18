<?php
/**
 * Standalone Web App Database Configuration
 *
 * MySQL 5.7 compatible configuration
 * PHP 7.1.9 compatible
 */

return [
    // Application Database Connection
    'app_db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'port' => getenv('DB_PORT') ?: '3306',
        'database' => getenv('DB_NAME') ?: 'math_learning_app',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASS') ?: '',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]
    ],

    // Session Configuration
    'session' => [
        'name' => 'MATH_APP_SESSION',
        'lifetime' => 7200, // 2 hours
        'path' => '/',
        'domain' => '',
        'secure' => false, // Set to true if using HTTPS
        'httponly' => true,
        'samesite' => 'Lax'
    ],

    // Cache Settings
    'cache' => [
        'enabled' => true,
        'driver' => 'file',
        'path' => __DIR__ . '/../cache',
        'ttl' => 3600, // 1 hour
    ],

    // Application Settings
    'app' => [
        'name' => 'Math Learning App',
        'url' => getenv('APP_URL') ?: 'http://localhost',
        'timezone' => 'Asia/Seoul',
        'locale' => 'ko',
        'debug' => getenv('APP_DEBUG') === 'true',
    ],

    // Security Settings
    'security' => [
        'password_min_length' => 6,
        'session_regenerate_interval' => 300, // 5 minutes
        'max_login_attempts' => 5,
        'lockout_duration' => 900, // 15 minutes
    ],

    // Recommendation Engine Settings
    'recommendation' => [
        'enabled' => true,
        'difficulty_increment' => 0.5, // How much to increase difficulty on success
        'difficulty_decrement' => 0.3, // How much to decrease on failure
        'mastery_threshold' => 80, // Percentage to consider mastered
        'questions_per_session' => 10,
        'adaptive_difficulty' => true,
    ],

    // Achievement Settings
    'achievements' => [
        'enabled' => true,
        'notify_on_earn' => true,
    ],

    // Upload Settings (for future image support)
    'uploads' => [
        'max_size' => 5242880, // 5MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif'],
        'path' => __DIR__ . '/../public/uploads',
    ],
];
