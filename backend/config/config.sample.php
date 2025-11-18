<?php
/**
 * Eye Tracking Attention Detection System
 * Configuration File (Sample)
 *
 * Copy this file to config.php and update with your environment settings
 */

return [
    // Database Configuration
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'eye_tracking_attention',
        'username' => 'your_db_user',
        'password' => 'your_db_password',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ],

    // Moodle Configuration
    'moodle' => [
        'url' => 'https://your-moodle-site.com',
        'webservice_token' => 'your_moodle_webservice_token',
        'rest_format' => 'json', // or 'xml'
    ],

    // Tracking Settings
    'tracking' => [
        'sampling_rate_ms' => 100, // 눈 추적 샘플링 간격 (밀리초)
        'window_duration_ms' => 30000, // 분석 윈도우 크기 (30초)
        'max_events_per_request' => 100, // 한 번에 처리할 최대 이벤트 수
        'session_timeout_minutes' => 30, // 세션 타임아웃 (분)
    ],

    // Attention Detection Thresholds
    'thresholds' => [
        // 눈 깜빡임 (분당 횟수)
        'blink_rate_min' => 10.0,
        'blink_rate_max' => 35.0,
        'blink_rate_optimal_min' => 15.0,
        'blink_rate_optimal_max' => 20.0,

        // 시선 이탈
        'gaze_away_warning_ms' => 5000, // 5초
        'gaze_away_critical_ms' => 10000, // 10초
        'gaze_on_screen_min_ratio' => 0.7, // 70% 이상

        // 얼굴 감지
        'face_away_warning_ms' => 5000,
        'face_away_critical_ms' => 10000,
        'no_face_warning_ms' => 10000,
        'no_face_critical_ms' => 20000,
        'face_detected_min_ratio' => 0.8, // 80% 이상

        // 집중도 레벨
        'attention_high_threshold' => 80,
        'attention_medium_threshold' => 60,
        'attention_low_threshold' => 40,
    ],

    // Alert Settings
    'alerts' => [
        'enabled' => true,
        'notification_methods' => ['database', 'email'], // 'database', 'email', 'webhook'
        'email_recipients' => [
            'admin@example.com',
        ],
        'webhook_url' => null, // 옵션
    ],

    // Data Retention
    'data_retention' => [
        'events_days' => 30, // 원시 이벤트 데이터 보존 기간
        'metrics_days' => 90, // 분석 메트릭 보존 기간
        'sessions_days' => 180, // 세션 데이터 보존 기간
        'logs_days' => 30, // 시스템 로그 보존 기간
    ],

    // CORS Settings
    'cors' => [
        'enabled' => true,
        'allowed_origins' => [
            'https://your-moodle-site.com',
            'http://localhost:3000', // 개발용
        ],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Session-ID'],
        'max_age' => 3600,
    ],

    // Security Settings
    'security' => [
        'api_key_required' => false, // API 키 인증 사용 여부
        'api_keys' => [
            // 'your-api-key-here' => 'Description',
        ],
        'rate_limiting' => [
            'enabled' => true,
            'max_requests_per_minute' => 60,
        ],
        'ip_whitelist' => [], // 비워두면 모든 IP 허용
        'ip_blacklist' => [],
    ],

    // Logging
    'logging' => [
        'enabled' => true,
        'level' => 'info', // debug, info, warning, error, critical
        'log_to_database' => true,
        'log_to_file' => true,
        'log_file_path' => __DIR__ . '/../../logs/app.log',
        'log_api_requests' => true,
        'log_errors' => true,
    ],

    // Performance
    'performance' => [
        'cache_enabled' => true,
        'cache_driver' => 'file', // file, redis, memcached
        'cache_ttl' => 3600, // 초
        'query_cache_enabled' => true,
    ],

    // Development/Debug
    'app' => [
        'environment' => 'production', // development, staging, production
        'debug' => false,
        'timezone' => 'Asia/Seoul',
        'locale' => 'ko_KR',
    ],
];
