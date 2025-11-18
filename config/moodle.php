<?php
/**
 * Moodle Integration Configuration
 * Moodle 3.7 LMS Settings
 */

return [
    // Moodle URL (should end without trailing slash)
    'moodle_url' => getenv('MOODLE_URL') ?: 'http://localhost/moodle',

    // Web Service Token
    // Generate this from Moodle: Site administration > Plugins > Web services > Manage tokens
    'moodle_token' => getenv('MOODLE_TOKEN') ?: '',

    // Web Service Username (for token generation if needed)
    'ws_username' => getenv('MOODLE_WS_USER') ?: '',

    // Data Synchronization Settings
    'sync' => [
        // Interval in minutes
        'interval' => 5,

        // Enable automatic synchronization
        'auto_sync' => true,

        // Batch size for syncing
        'batch_size' => 100,
    ],

    // Time of Day Definitions (24-hour format)
    'time_periods' => [
        'morning' => ['start' => 6, 'end' => 12],
        'afternoon' => ['start' => 12, 'end' => 18],
        'evening' => ['start' => 18, 'end' => 24],
        'night' => ['start' => 0, 'end' => 6],
    ],

    // Activity Types to Track
    'tracked_activities' => [
        'quiz',
        'assign',      // Assignment
        'forum',
        'resource',
        'page',
        'lesson',
    ],

    // Analysis Settings
    'analysis' => [
        // Minimum activities required for meaningful analysis
        'min_activities' => 5,

        // Default analysis period (days)
        'default_period' => 30,

        // Confidence threshold for recommendations (%)
        'confidence_threshold' => 60,
    ],

    // API Settings
    'api' => [
        // Enable CORS
        'cors_enabled' => true,

        // Allowed origins for CORS
        'cors_origins' => ['*'],

        // Rate limiting (requests per hour)
        'rate_limit' => 1000,

        // Enable caching
        'cache_enabled' => true,

        // Cache TTL in seconds
        'cache_ttl' => 300,
    ],
];
