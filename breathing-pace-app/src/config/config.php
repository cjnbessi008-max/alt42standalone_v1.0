<?php
/**
 * Configuration File
 * Breathing Pace Learning Assistant
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'breathing_pace_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 기본 설정 (환경변수 또는 사용자 입력으로 오버라이드 가능)
define('MOODLE_URL', getenv('MOODLE_URL') ?: '');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');

// 호흡 템포 설정
define('BREATHING_TEMPLATES', [
    'easy' => [
        'inhale' => 4,
        'exhale' => 4,
        'description' => '빠른 템포 (4-4)'
    ],
    'medium' => [
        'inhale' => 4,
        'exhale' => 7,
        'description' => '중간 템포 (4-7)'
    ],
    'hard' => [
        'inhale' => 4,
        'exhale' => 8,
        'description' => '느린 템포 (4-8)'
    ],
    'very-hard' => [
        'inhale' => 5,
        'exhale' => 10,
        'description' => '매우 느린 템포 (5-10)'
    ]
]);

// 세션 설정
define('DEFAULT_CYCLES', 3);
define('SESSION_TIMEOUT', 1800); // 30분

// 디버그 모드
define('DEBUG_MODE', true);

// 에러 리포팅
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

?>
