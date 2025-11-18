<?php

return [
    'name' => $_ENV['APP_NAME'] ?? 'LMS Concept System',
    'env' => $_ENV['APP_ENV'] ?? 'production',
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'url' => $_ENV['APP_URL'] ?? 'http://localhost:8000',

    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'] ?? 'change-this-secret-key',
        'expiration' => (int)($_ENV['JWT_EXPIRATION'] ?? 3600),
        'algorithm' => 'HS256',
    ],

    'cors' => [
        'allowed_origins' => explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? '*'),
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'max_age' => 86400,
    ],

    'pagination' => [
        'default_limit' => 20,
        'max_limit' => 100,
    ],

    'logging' => [
        'level' => $_ENV['LOG_LEVEL'] ?? 'info',
        'path' => $_ENV['LOG_PATH'] ?? 'logs/app.log',
    ],
];
