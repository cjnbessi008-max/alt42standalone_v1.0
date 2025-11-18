<?php

use DualDance\Utils\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * CORS Middleware
 */
$corsMiddleware = function (Request $request, Response $response, callable $next) {
    $response = $next($request, $response);

    $allowedOrigins = explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: '*');
    $origin = $request->getHeaderLine('Origin') ?: '*';

    if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
        $response = $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    }

    return $response;
};

/**
 * JWT Authentication Middleware
 */
$authMiddleware = function (Request $request, Response $response, callable $next) {
    $authHeader = $request->getHeaderLine('Authorization');
    $token = JWT::extractFromHeader($authHeader);

    if (!$token || !JWT::validate($token)) {
        $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }

    $userId = JWT::getUserId($token);
    if (!$userId) {
        $response->getBody()->write(json_encode(['error' => 'Invalid token']));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }

    // Add user ID to request attributes
    $request = $request->withAttribute('user_id', $userId);

    return $next($request, $response);
};

/**
 * JSON Body Parser Middleware
 */
$jsonBodyParser = function (Request $request, Response $response, callable $next) {
    $contentType = $request->getHeaderLine('Content-Type');

    if (strpos($contentType, 'application/json') !== false) {
        $contents = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $request = $request->withParsedBody($contents);
        }
    }

    return $next($request, $response);
};

/**
 * Error Handler
 */
$errorHandler = function (Request $request, Response $response, Exception $exception) use ($container) {
    $statusCode = $exception->getCode() ?: 500;
    $statusCode = $statusCode >= 100 && $statusCode < 600 ? $statusCode : 500;

    $error = [
        'error' => $exception->getMessage()
    ];

    if (getenv('APP_DEBUG') === 'true') {
        $error['trace'] = $exception->getTraceAsString();
    }

    $response->getBody()->write(json_encode($error));

    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus($statusCode);
};

return [
    'cors' => $corsMiddleware,
    'auth' => $authMiddleware,
    'jsonBodyParser' => $jsonBodyParser,
    'errorHandler' => $errorHandler
];
