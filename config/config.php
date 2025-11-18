<?php
/**
 * Moodle LMS Integration Configuration
 *
 * MySQL 5.7 compatible configuration
 * PHP 7.1.9 compatible
 */

return [
    // Moodle Database Connection Settings
    'moodle_db' => [
        'host' => getenv('MOODLE_DB_HOST') ?: 'localhost',
        'port' => getenv('MOODLE_DB_PORT') ?: '3306',
        'database' => getenv('MOODLE_DB_NAME') ?: 'moodle',
        'username' => getenv('MOODLE_DB_USER') ?: 'moodle_user',
        'password' => getenv('MOODLE_DB_PASS') ?: '',
        'charset' => 'utf8mb4',
        'prefix' => 'mdl_', // Moodle default table prefix
    ],

    // Cache Settings (simple file-based caching to avoid heavy computation)
    'cache' => [
        'enabled' => true,
        'driver' => 'file', // file-based cache for simplicity
        'path' => __DIR__ . '/../cache',
        'ttl' => 3600, // 1 hour cache time
    ],

    // Question Display Settings
    'display' => [
        'per_page' => 10,
        'default_category' => null, // null = all categories
        'show_hidden' => false,
        'order_by' => 'name', // name, created, modified
        'order_direction' => 'ASC',
    ],

    // Performance Settings
    'performance' => [
        'enable_query_cache' => true,
        'max_questions_per_query' => 100,
        'use_prepared_statements' => true,
    ],
];
