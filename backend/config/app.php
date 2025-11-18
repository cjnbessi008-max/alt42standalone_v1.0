<?php
/**
 * Application Configuration
 */

return [
    'name' => getenv('APP_NAME') ?: 'Deviation Breeze',
    'env' => getenv('APP_ENV') ?: 'development',
    'debug' => filter_var(getenv('APP_DEBUG'), FILTER_VALIDATE_BOOLEAN),
    'url' => getenv('APP_URL') ?: 'http://localhost:8080',

    'timezone' => 'Asia/Seoul',

    'log' => [
        'level' => getenv('LOG_LEVEL') ?: 'debug',
        'path' => getenv('LOG_PATH') ?: __DIR__ . '/../../logs/app.log'
    ],

    'cors' => [
        'allowed_origins' => ['*'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With']
    ]
];
