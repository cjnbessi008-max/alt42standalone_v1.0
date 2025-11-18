<?php
/**
 * Moodle Integration Configuration
 */

return [
    'url' => getenv('MOODLE_URL') ?: 'https://your-moodle-site.com',
    'token' => getenv('MOODLE_WS_TOKEN') ?: '',
    'ws_function_prefix' => getenv('MOODLE_WS_FUNCTION_PREFIX') ?: 'core_',
    'timeout' => 30,
    'verify_ssl' => getenv('APP_ENV') === 'production',
    'cache_ttl' => intval(getenv('CACHE_TTL') ?: 300) // 5 minutes
];
