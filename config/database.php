<?php
/**
 * Database Configuration
 * Root Wave 앱 데이터베이스 설정
 */

return [
    // Root Wave 앱 데이터베이스
    'host' => getenv('DB_HOST') ?: 'localhost',
    'database' => getenv('DB_NAME') ?: 'root_wave',
    'username' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASS') ?: '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',

    // Moodle 데이터베이스 (별도)
    'moodle' => [
        'host' => getenv('MOODLE_DB_HOST') ?: 'localhost',
        'database' => getenv('MOODLE_DB_NAME') ?: 'moodle',
        'username' => getenv('MOODLE_DB_USER') ?: 'root',
        'password' => getenv('MOODLE_DB_PASS') ?: '',
        'prefix' => 'mdl_',
    ],

    // 데이터베이스 옵션
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ],
];
