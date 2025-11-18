<?php
/**
 * Application Configuration
 * 애플리케이션 설정
 */

return [
    // 애플리케이션 기본 설정
    'app' => [
        'name' => 'Overconfidence Error Detection System',
        'version' => '1.0.0',
        'timezone' => 'Asia/Seoul',
        'locale' => 'ko_KR',
        'debug' => true, // 프로덕션에서는 false로 변경
    ],

    // 과신 오류 탐지 설정
    'detection' => [
        // Z-score 임계값
        'thresholds' => [
            'caution' => -1.5,  // 주의 (Level 1)
            'warning' => -2.0,  // 경고 (Level 2)
            'danger' => -2.5,   // 위험 (Level 3)
        ],

        // 통계 계산 최소 샘플 수
        'min_sample_size' => 30,

        // 연속 빠른 풀이 임계값
        'consecutive_fast_threshold' => 3,

        // 최소 풀이 시간 (초) - 이보다 짧으면 무조건 플래그
        'absolute_min_time' => 5,

        // 난이도별 가중치
        'difficulty_weights' => [
            'easy' => 0.8,
            'medium' => 1.0,
            'hard' => 1.2,
            'very_hard' => 1.5,
        ],
    ],

    // Moodle 동기화 설정
    'sync' => [
        'interval_minutes' => 10, // 자동 동기화 주기
        'batch_size' => 1000, // 한 번에 처리할 레코드 수
        'lookback_days' => 30, // 동기화할 과거 데이터 범위 (일)
    ],

    // 로깅 설정
    'logging' => [
        'enabled' => true,
        'level' => 'info', // debug, info, warning, error
        'path' => __DIR__ . '/../logs/app.log',
        'max_files' => 30, // 보관할 로그 파일 수
    ],

    // 캐싱 설정
    'cache' => [
        'enabled' => true,
        'ttl' => 300, // 캐시 유효 시간 (초)
        'prefix' => 'ocd_', // 캐시 키 접두사
    ],

    // UI 설정
    'ui' => [
        'items_per_page' => 20,
        'dashboard_refresh_seconds' => 30,
        'chart_colors' => [
            'caution' => '#ffc107',
            'warning' => '#ff9800',
            'danger' => '#f44336',
        ],
    ],

    // 알림 설정
    'notifications' => [
        'email_enabled' => false,
        'slack_enabled' => false,
        'danger_level_notify' => true, // Level 3만 즉시 알림
    ],

    // 보안 설정
    'security' => [
        'csrf_protection' => true,
        'session_timeout' => 3600, // 세션 타임아웃 (초)
        'allowed_ips' => [], // 빈 배열 = 모든 IP 허용
    ],
];
