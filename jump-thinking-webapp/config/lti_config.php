<?php
/**
 * LTI (Learning Tools Interoperability) Configuration
 * For Moodle 3.7 Integration
 */

return [
    // LTI Version
    'version' => 'LTI-1p0',

    // OAuth 설정
    'oauth_signature_method' => 'HMAC-SHA1',
    'oauth_version' => '1.0',

    // Consumer 키 설정 (Moodle에서 설정한 값과 동일해야 함)
    'default_consumer_key' => getenv('LTI_CONSUMER_KEY') ?: 'moodle_demo_key',
    'default_consumer_secret' => getenv('LTI_CONSUMER_SECRET') ?: 'moodle_demo_secret_12345',

    // 세션 타임아웃 (초)
    'session_timeout' => 3600,

    // Launch URL
    'launch_url' => getenv('APP_URL') . '/public/lti_launch.php',

    // Return URL (Moodle로 돌아가기)
    'return_url_param' => 'launch_presentation_return_url',

    // 지원하는 역할
    'supported_roles' => [
        'Instructor' => 'teacher',
        'TeachingAssistant' => 'teacher',
        'Learner' => 'student',
        'Student' => 'student'
    ],

    // 필수 LTI 파라미터
    'required_params' => [
        'lti_message_type',
        'lti_version',
        'resource_link_id',
        'user_id',
        'roles',
        'oauth_consumer_key'
    ],

    // Grade Passback 설정 (성적 전송)
    'enable_grade_passback' => true,
    'outcome_service_url_param' => 'lis_outcome_service_url',
    'result_sourcedid_param' => 'lis_result_sourcedid',

    // 디버깅 모드
    'debug_mode' => getenv('APP_DEBUG') === 'true',
    'log_lti_launches' => true
];
