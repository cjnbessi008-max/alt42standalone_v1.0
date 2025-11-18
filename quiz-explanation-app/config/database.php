<?php
/**
 * Database Configuration
 * MySQL 5.7 connection settings
 */

return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'quiz_explanation_app',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
