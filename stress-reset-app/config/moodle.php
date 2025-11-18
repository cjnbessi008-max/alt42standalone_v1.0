<?php
/**
 * Moodle Integration Configuration
 * Compatible with Moodle 3.7
 */

return [
    // Moodle base URL
    'base_url' => getenv('MOODLE_URL') ?: 'http://localhost/moodle',

    // Moodle web service token
    'ws_token' => getenv('MOODLE_TOKEN') ?: '',

    // REST API endpoint
    'ws_endpoint' => '/webservice/rest/server.php',

    // Response format
    'format' => 'json',

    // Timeout for API requests (seconds)
    'timeout' => 30,

    // SSL verification (set to false for local development)
    'ssl_verify' => getenv('MOODLE_SSL_VERIFY') !== 'false',
];
