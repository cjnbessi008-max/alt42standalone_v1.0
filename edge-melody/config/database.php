<?php
/**
 * Moodle Database Configuration
 * MySQL 5.7 연결 설정
 */

return [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => getenv('DB_PORT') ?: '3306',
    'database' => getenv('DB_NAME') ?: 'moodle',
    'username' => getenv('DB_USER') ?: 'moodle_user',
    'password' => getenv('DB_PASS') ?: '',
    'charset' => 'utf8mb4',
    'prefix' => 'mdl_', // Moodle 기본 테이블 접두사
];
