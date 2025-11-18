<?php
/**
 * Moodle Integration Configuration
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 *
 * @package AI_Education_Pipeline
 * @copyright 2025 KAIST Touch Math Academy
 */

return [
    /**
     * Moodle Instance Configuration
     */
    'moodle' => [
        // Moodle base URL (without trailing slash)
        'url' => getenv('MOODLE_URL') ?: 'https://lms.kaist.ac.kr',

        // Web Services Token (generate in Moodle Admin)
        // Site administration → Plugins → Web services → Manage tokens
        'token' => getenv('MOODLE_WS_TOKEN') ?: '',

        // API format (json or xml)
        'format' => 'json',

        // Connection timeout (seconds)
        'timeout' => 30,

        // Retry attempts on failure
        'retry_attempts' => 3,

        // SSL verification (set to false only for development)
        'ssl_verify' => true
    ],

    /**
     * LTI Configuration
     */
    'lti' => [
        // LTI Consumer Key (must match Moodle External Tool settings)
        'consumer_key' => getenv('LTI_CONSUMER_KEY') ?: 'kaist_aipipeline',

        // LTI Shared Secret (must match Moodle)
        'shared_secret' => getenv('LTI_SHARED_SECRET') ?: '',

        // LTI Version
        'version' => 'LTI-1p0',

        // Launch URL (this AI Pipeline endpoint)
        'launch_url' => getenv('APP_URL') . '/api/lti/launch.php',

        // Grade passback enabled
        'grade_passback_enabled' => true,

        // Session timeout (seconds)
        'session_timeout' => 3600,

        // Nonce cache expiration (seconds)
        'nonce_expiration' => 300,

        // Allowed Moodle domains (for security)
        'allowed_domains' => [
            'lms.kaist.ac.kr',
            'moodle.kaist.ac.kr'
        ]
    ],

    /**
     * Database Configuration for Moodle MySQL 5.7
     */
    'database' => [
        // Moodle database connection (read-only recommended)
        'moodle_db' => [
            'host' => getenv('MOODLE_DB_HOST') ?: 'localhost',
            'port' => getenv('MOODLE_DB_PORT') ?: 3306,
            'database' => getenv('MOODLE_DB_NAME') ?: 'moodle',
            'username' => getenv('MOODLE_DB_USER') ?: 'moodle_readonly',
            'password' => getenv('MOODLE_DB_PASS') ?: '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => 'mdl_',
            'read_only' => true // Safety measure
        ],

        // AI Pipeline database
        'aipipeline_db' => [
            'host' => getenv('DB_HOST') ?: 'localhost',
            'port' => getenv('DB_PORT') ?: 3306,
            'database' => getenv('DB_NAME') ?: 'aipipeline',
            'username' => getenv('DB_USER') ?: 'aipipeline',
            'password' => getenv('DB_PASS') ?: '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci'
        ]
    ],

    /**
     * SSO Configuration
     */
    'sso' => [
        // SSO method: 'saml', 'jwt', 'oauth', or 'disabled'
        'method' => 'jwt',

        // JWT configuration
        'jwt' => [
            'secret' => getenv('JWT_SECRET') ?: '',
            'algorithm' => 'HS256',
            'expiration' => 3600, // 1 hour
            'issuer' => getenv('APP_URL'),
            'audience' => getenv('MOODLE_URL')
        ],

        // SAML configuration (if using SAML)
        'saml' => [
            'sp_entity_id' => getenv('APP_URL') . '/saml/metadata',
            'sp_acs_url' => getenv('APP_URL') . '/saml/acs',
            'sp_sls_url' => getenv('APP_URL') . '/saml/sls',
            'idp_entity_id' => getenv('MOODLE_URL') . '/auth/saml2/idp/metadata.php',
            'idp_sso_url' => getenv('MOODLE_URL') . '/auth/saml2/idp/SSOService.php',
            'idp_cert' => '', // Path to IdP certificate
            'sp_key' => '', // Path to SP private key
            'sp_cert' => '' // Path to SP certificate
        ]
    ],

    /**
     * Synchronization Settings
     */
    'sync' => [
        // Enable automatic grade sync
        'auto_grade_sync' => true,

        // Grade sync interval (seconds)
        'grade_sync_interval' => 300, // 5 minutes

        // Enable completion tracking sync
        'auto_completion_sync' => true,

        // Batch size for bulk operations
        'batch_size' => 50,

        // Sync direction: 'bidirectional', 'moodle_to_pipeline', 'pipeline_to_moodle'
        'sync_direction' => 'bidirectional',

        // Conflict resolution: 'moodle_wins', 'pipeline_wins', 'latest_wins'
        'conflict_resolution' => 'latest_wins'
    ],

    /**
     * Logging Configuration
     */
    'logging' => [
        // Log level: 'debug', 'info', 'warning', 'error'
        'level' => getenv('LOG_LEVEL') ?: 'info',

        // Log file path
        'file' => __DIR__ . '/../logs/moodle_integration.log',

        // Log LTI requests
        'log_lti_requests' => true,

        // Log API calls
        'log_api_calls' => true,

        // Log grade operations
        'log_grade_operations' => true,

        // Sensitive data masking
        'mask_sensitive_data' => true
    ],

    /**
     * Cache Configuration
     */
    'cache' => [
        // Cache driver: 'redis', 'memcached', 'file'
        'driver' => 'redis',

        // Redis configuration
        'redis' => [
            'host' => getenv('REDIS_HOST') ?: 'localhost',
            'port' => getenv('REDIS_PORT') ?: 6379,
            'database' => getenv('REDIS_DB') ?: 0,
            'prefix' => 'moodle_integration:'
        ],

        // Cache TTL for different data types (seconds)
        'ttl' => [
            'user_data' => 3600, // 1 hour
            'course_data' => 7200, // 2 hours
            'module_data' => 1800, // 30 minutes
            'nonce' => 300 // 5 minutes
        ]
    ],

    /**
     * Module Mapping
     * Maps AI Pipeline module types to Moodle activity types
     */
    'module_mapping' => [
        'interactive_lesson' => 'url',
        'quiz' => 'quiz',
        'assignment' => 'assign',
        'resource' => 'url'
    ],

    /**
     * Security Settings
     */
    'security' => [
        // Enable IP whitelist
        'ip_whitelist_enabled' => false,

        // Allowed IP addresses (Moodle server IPs)
        'allowed_ips' => [
            // '192.168.1.100',
            // '10.0.0.50'
        ],

        // Enable request signature verification
        'verify_signatures' => true,

        // Enable CSRF protection
        'csrf_protection' => true,

        // Maximum request size (bytes)
        'max_request_size' => 10485760, // 10MB

        // Rate limiting
        'rate_limit' => [
            'enabled' => true,
            'max_requests' => 100,
            'per_minutes' => 60
        ]
    ],

    /**
     * Error Handling
     */
    'error_handling' => [
        // Display errors (set to false in production)
        'display_errors' => getenv('APP_ENV') === 'development',

        // Error reporting level
        'error_reporting' => E_ALL & ~E_DEPRECATED & ~E_STRICT,

        // Custom error page
        'error_page' => __DIR__ . '/../views/errors/moodle_error.php',

        // Email notifications for critical errors
        'email_on_error' => true,
        'admin_email' => getenv('ADMIN_EMAIL') ?: 'admin@kaist.ac.kr'
    ],

    /**
     * Feature Flags
     */
    'features' => [
        // Enable Deep Linking 2.0
        'deep_linking' => true,

        // Enable Names and Role Provisioning Services
        'nrps' => false,

        // Enable Assignment and Grade Services
        'ags' => true,

        // Enable custom parameter substitution
        'custom_params' => true,

        // Enable module duplication
        'module_duplication' => true,

        // Enable bulk enrollment
        'bulk_enrollment' => false
    ]
];

/**
 * Helper function to validate configuration
 * @return array Validation errors
 */
function validateMoodleConfig(): array
{
    $config = include __FILE__;
    $errors = [];

    // Check required environment variables
    if (empty($config['moodle']['url'])) {
        $errors[] = 'MOODLE_URL is required';
    }

    if (empty($config['moodle']['token'])) {
        $errors[] = 'MOODLE_WS_TOKEN is required';
    }

    if (empty($config['lti']['consumer_key'])) {
        $errors[] = 'LTI_CONSUMER_KEY is required';
    }

    if (empty($config['lti']['shared_secret'])) {
        $errors[] = 'LTI_SHARED_SECRET is required';
    }

    if ($config['sso']['method'] === 'jwt' && empty($config['sso']['jwt']['secret'])) {
        $errors[] = 'JWT_SECRET is required when using JWT SSO';
    }

    return $errors;
}
