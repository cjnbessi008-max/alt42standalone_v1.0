<?php

/**
 * Dual Dance Standalone Web App - API Entry Point
 */

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = parse_ini_file(__DIR__ . '/../.env');
    foreach ($dotenv as $key => $value) {
        if (!getenv($key)) {
            putenv("$key=$value");
        }
    }
}

// Initialize Slim App
$config = [
    'settings' => [
        'displayErrorDetails' => getenv('APP_DEBUG') === 'true',
        'addContentLengthHeader' => false,
        'determineRouteBeforeAppMiddleware' => true,
    ]
];

$app = new \Slim\App($config);

// Get container
$container = $app->getContainer();

// Load middleware
$middleware = require __DIR__ . '/../src/middleware.php';

// Add CORS middleware (global)
$app->add($middleware['cors']);

// Set error handler
if (isset($middleware['errorHandler'])) {
    $container['errorHandler'] = $middleware['errorHandler'];
    $container['phpErrorHandler'] = $middleware['errorHandler'];
}

// Load routes
$routes = require __DIR__ . '/../src/routes.php';
$routes($app, $middleware);

// Run application
$app->run();
