<?php
/**
 * Database Configuration
 */

return [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'name' => getenv('DB_NAME') ?: 'alt42_lms',
    'user' => getenv('DB_USER') ?: 'alt42_user',
    'pass' => getenv('DB_PASS') ?: 'alt42_pass',
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
