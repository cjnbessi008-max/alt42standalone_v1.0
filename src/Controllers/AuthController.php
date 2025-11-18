<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\User;
use App\Utils\JWTHelper;

class AuthController
{
    /**
     * POST /api/auth/register - User registration
     */
    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validate required fields
        if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Username, email, and password are required',
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Check if user exists
        if (User::where('username', $data['username'])->orWhere('email', $data['email'])->exists()) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Username or email already exists',
            ]));
            return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
        }

        // Create user
        $user = User::create([
            'username' => $data['username'],
            'email' => $data['email'],
            'password_hash' => User::hashPassword($data['password']),
            'role' => $data['role'] ?? 'student',
            'full_name' => $data['full_name'] ?? $data['username'],
        ]);

        // Generate JWT token
        $token = JWTHelper::createUserToken($user->id, $user->role);

        $responseData = [
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'full_name' => $user->full_name,
                ],
                'token' => $token,
            ],
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/auth/login - User login
     */
    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (empty($data['username']) || empty($data['password'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Username and password are required',
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Find user
        $user = User::where('username', $data['username'])->first();

        if (!$user || !$user->verifyPassword($data['password'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Invalid credentials',
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        if (!$user->is_active) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Account is inactive',
            ]));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        // Generate JWT token
        $token = JWTHelper::createUserToken($user->id, $user->role);

        $responseData = [
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'full_name' => $user->full_name,
                ],
                'token' => $token,
            ],
        ];

        $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/auth/me - Get current user
     */
    public function me(Request $request, Response $response): Response
    {
        // Get token from Authorization header
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Authorization token required',
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $token = $matches[1];

        try {
            $userId = JWTHelper::getUserIdFromToken($token);

            if (!$userId) {
                throw new \Exception('Invalid token');
            }

            $user = User::find($userId);

            if (!$user) {
                throw new \Exception('User not found');
            }

            $responseData = [
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'full_name' => $user->full_name,
                    'moodle_user_id' => $user->moodle_user_id,
                ],
            ];

            $response->getBody()->write(json_encode($responseData, JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Invalid or expired token',
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }
}
