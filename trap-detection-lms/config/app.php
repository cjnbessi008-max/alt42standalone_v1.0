<?php
/**
 * Application Configuration
 * Trap Detection LMS
 */

return [
    'name' => 'Trap Detection LMS',
    'version' => '1.0.0',
    'timezone' => 'Asia/Seoul',
    'locale' => 'ko',
    'fallback_locale' => 'en',

    // Security
    'session_lifetime' => 7200, // 2 hours
    'session_name' => 'TRAP_DETECTION_SESSION',

    // LTI Configuration
    'lti' => [
        'consumer_key' => getenv('LTI_CONSUMER_KEY') ?: 'trap_detection_key',
        'consumer_secret' => getenv('LTI_CONSUMER_SECRET') ?: 'change_this_secret_in_production',
        'session_timeout' => 3600,
    ],

    // Moodle Integration
    'moodle' => [
        'base_url' => getenv('MOODLE_URL') ?: 'http://localhost/moodle',
        'api_token' => getenv('MOODLE_API_TOKEN') ?: '',
        'web_service_enabled' => true,
    ],

    // Trap Detection Algorithm
    'trap_detection' => [
        'min_attempts_for_pattern' => 5,
        'occurrence_threshold' => 0.30, // 30% of students
        'confidence_threshold' => 0.70, // 70% confidence
        'auto_create_traps' => true,
    ],

    // API Configuration
    'api' => [
        'rate_limit' => 100, // requests per minute
        'timeout' => 30,
    ],

    // Paths
    'paths' => [
        'root' => dirname(__DIR__),
        'public' => dirname(__DIR__) . '/public',
        'storage' => dirname(__DIR__) . '/storage',
        'logs' => dirname(__DIR__) . '/storage/logs',
    ],
];
