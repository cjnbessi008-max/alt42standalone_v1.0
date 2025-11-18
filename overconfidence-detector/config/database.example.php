<?php
/**
 * Database Configuration
 * 데이터베이스 연결 설정
 *
 * 이 파일을 database.php로 복사하여 실제 설정값을 입력하세요.
 */

return [
    // 메인 데이터베이스 (과신 오류 탐지 시스템)
    'main' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'overconfidence_detector',
        'username' => 'your_username',
        'password' => 'your_password',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ],

    // Moodle 데이터베이스 (읽기 전용)
    'moodle' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'moodle',
        'username' => 'moodle_readonly',
        'password' => 'readonly_password',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => 'mdl_', // Moodle 테이블 접두사
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ]
];
