<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Dotenv\Dotenv;
use App\Utils\Database;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Initialize database
Database::init();

// Create Slim app
$app = AppFactory::create();

// Add error middleware
$app->addErrorMiddleware(
    filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    true,
    true
);

// Add routing middleware
$app->addRoutingMiddleware();

// CORS Middleware
$app->add(function (Request $request, $handler) {
    $response = $handler->handle($request);
    $config = require __DIR__ . '/../config/app.php';

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', implode(', ', $config['cors']['allowed_headers']))
        ->withHeader('Access-Control-Allow-Methods', implode(', ', $config['cors']['allowed_methods']));
});

// Health check endpoint
$app->get('/', function (Request $request, Response $response) {
    $data = [
        'status' => 'ok',
        'message' => 'LMS Concept System API',
        'version' => '1.0.0',
    ];
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
});

// Load routes
require __DIR__ . '/../src/routes/concepts.php';
require __DIR__ . '/../src/routes/problems.php';
require __DIR__ . '/../src/routes/ai.php';
require __DIR__ . '/../src/routes/auth.php';
require __DIR__ . '/../src/routes/lti.php';

$app->run();
