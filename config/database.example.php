<?php
/**
 * Moodle 데이터베이스 연결 설정
 * 이 파일을 database.php로 복사하고 실제 값으로 수정하세요
 */

return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'moodle',
    'username' => 'moodle_user',
    'password' => 'your_password_here',
    'charset' => 'utf8mb4',

    // Moodle 테이블 prefix (기본값: mdl_)
    'prefix' => 'mdl_',

    // 연결 옵션
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
