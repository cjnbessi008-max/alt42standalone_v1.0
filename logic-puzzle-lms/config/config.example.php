<?php
/**
 * Logic Puzzle LMS - Configuration File
 *
 * 이 파일을 복사하여 api/config.php로 저장하고 실제 값으로 수정하세요.
 */

return [
    // ====================================
    // Database Configuration
    // ====================================
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'logic_puzzle_lms',
        'username' => 'logic_puzzle_user',
        'password' => 'your_secure_password_here',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    // ====================================
    // Moodle Configuration
    // ====================================
    'moodle' => [
        // Moodle 사이트 URL
        'site_url' => 'https://your-moodle-site.com',

        // Moodle Web Services 토큰
        // Moodle 관리자 페이지에서 생성: 사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리
        'ws_token' => 'your_moodle_webservice_token_here',

        // REST 프로토콜 사용
        'ws_format' => 'json',

        // 타임아웃 (초)
        'timeout' => 30,

        // 문제 카테고리 ID (Logic Puzzle 문제가 있는 카테고리)
        'question_category_id' => 1,

        // 코스 ID
        'course_id' => 1,
    ],

    // ====================================
    // Application Configuration
    // ====================================
    'app' => [
        // 애플리케이션 이름
        'name' => 'Logic Puzzle LMS',

        // 환경 (development, production)
        'environment' => 'development',

        // 디버그 모드
        'debug' => true,

        // 타임존
        'timezone' => 'Asia/Seoul',

        // 기본 언어
        'language' => 'ko',

        // 세션 타임아웃 (초)
        'session_timeout' => 3600,
    ],

    // ====================================
    // Security Configuration
    // ====================================
    'security' => [
        // CSRF 보호 활성화
        'csrf_protection' => true,

        // API 요청 제한 (분당 최대 요청 수)
        'rate_limit' => 60,

        // 허용된 출처 (CORS)
        'allowed_origins' => [
            'http://localhost:8000',
            'http://127.0.0.1:8000',
        ],

        // 세션 쿠키 설정
        'session_cookie_secure' => false, // HTTPS 사용 시 true로 설정
        'session_cookie_httponly' => true,
        'session_cookie_samesite' => 'Lax',
    ],

    // ====================================
    // Puzzle Configuration
    // ====================================
    'puzzle' => [
        // 최대 시도 횟수
        'max_attempts' => 5,

        // 기본 제한 시간 (초)
        'default_time_limit' => 300,

        // 점수 계산 방식
        'scoring' => [
            'perfect_match' => 100, // 완벽한 정답
            'partial_credit' => true, // 부분 점수 허용
            'wrong_answer' => 0,
        ],

        // 힌트 제공 여부
        'hints_enabled' => true,

        // 자동 저장 간격 (초)
        'auto_save_interval' => 30,
    ],

    // ====================================
    // Logging Configuration
    // ====================================
    'logging' => [
        // 로그 레벨: DEBUG, INFO, WARNING, ERROR
        'level' => 'INFO',

        // 로그 파일 경로
        'file' => __DIR__ . '/../logs/app.log',

        // 최대 파일 크기 (MB)
        'max_file_size' => 10,

        // 로그 회전
        'rotate' => true,
    ],

    // ====================================
    // Cache Configuration
    // ====================================
    'cache' => [
        // 캐시 사용 여부
        'enabled' => true,

        // 캐시 드라이버: file, redis, memcached
        'driver' => 'file',

        // 캐시 디렉토리 (file 드라이버 사용 시)
        'directory' => __DIR__ . '/../cache',

        // 기본 TTL (초)
        'default_ttl' => 600,
    ],
];
