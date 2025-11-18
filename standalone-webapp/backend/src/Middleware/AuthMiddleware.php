<?php

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->unauthorizedResponse('No token provided');
        }

        $token = $matches[1];

        try {
            $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-this';
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            // Add user data to request
            $request = $request->withAttribute('user_id', $decoded->user_id);
            $request = $request->withAttribute('user_role', $decoded->role);
            $request = $request->withAttribute('user_email', $decoded->email);

            return $handler->handle($request);

        } catch (\Exception $e) {
            return $this->unauthorizedResponse('Invalid or expired token');
        }
    }

    private function unauthorizedResponse(string $message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'error' => $message
        ]));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}
