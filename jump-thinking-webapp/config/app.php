<?php
/**
 * Application Configuration
 */

return [
    // 애플리케이션 기본 설정
    'name' => 'Jump Thinking Detection System',
    'version' => '1.0.0',
    'url' => getenv('APP_URL') ?: 'http://localhost',
    'timezone' => 'Asia/Seoul',
    'locale' => 'ko_KR',
    'debug' => getenv('APP_DEBUG') === 'true',

    // 비약 사고 감지 설정
    'jump_detection' => [
        // 비약 사고 감지 임계값 (0.0 - 1.0)
        'threshold' => 0.7,

        // 빠른 풀이 기준 (권장 시간의 배수)
        'fast_solve_multiplier' => 0.5,

        // 단계 건너뛰기 벌점
        'step_skip_penalty' => 20,

        // 순서 위반 벌점
        'sequence_violation_penalty' => 15,

        // 직접 답 도출 벌점
        'direct_answer_penalty' => 25,

        // 최대 점수
        'max_jump_score' => 100,

        // 최소 분석 문제 수
        'min_problems_for_analysis' => 3
    ],

    // 보안 설정
    'security' => [
        'session_name' => 'JT_SESSION',
        'session_lifetime' => 3600,
        'csrf_protection' => true,
        'allowed_origins' => ['*'], // 프로덕션에서는 Moodle URL로 제한
    ],

    // 로깅 설정
    'logging' => [
        'enabled' => true,
        'level' => 'info', // debug, info, warning, error
        'path' => __DIR__ . '/../logs',
        'max_files' => 30
    ],

    // 캐싱 설정
    'cache' => [
        'enabled' => false,
        'driver' => 'file', // file, redis
        'ttl' => 3600
    ]
];
