<?php

return [
    'consumer_key' => $_ENV['LTI_CONSUMER_KEY'] ?? '',
    'consumer_secret' => $_ENV['LTI_CONSUMER_SECRET'] ?? '',
    'version' => '1.3',

    // LTI 런치 URL
    'launch_url' => $_ENV['APP_URL'] . '/lti/launch',

    // 지원하는 LMS 타입
    'supported_lms' => [
        'moodle' => [
            'name' => 'Moodle',
            'min_version' => '3.7',
            'features' => ['grade_passback', 'roster_sync'],
        ],
        'canvas' => [
            'name' => 'Canvas',
            'min_version' => '1.0',
            'features' => ['grade_passback'],
        ],
    ],

    // 성적 전송 설정
    'grade_passback' => [
        'enabled' => true,
        'scale' => 100, // 0-100 scale
    ],

    // 세션 설정
    'session' => [
        'lifetime' => 3600, // 1 hour
        'cookie_name' => 'lti_session',
    ],
];
