<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\User;
use Firebase\JWT\JWT;

class AuthController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function register(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody()->getContents(), true);

        // Validation
        $errors = [];
        if (empty($data['email'])) $errors[] = 'Email is required';
        if (empty($data['password'])) $errors[] = 'Password is required';
        if (empty($data['name'])) $errors[] = 'Name is required';
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email format';

        if (!empty($errors)) {
            $response->getBody()->write(json_encode(['errors' => $errors]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Check if email already exists
        if ($this->userModel->findByEmail($data['email'])) {
            $response->getBody()->write(json_encode(['error' => 'Email already registered']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
        }

        // Create user
        $userId = $this->userModel->create($data);

        if (!$userId) {
            $response->getBody()->write(json_encode(['error' => 'Failed to create user']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }

        $user = $this->userModel->findById($userId);
        $token = $this->generateToken($user);

        $response->getBody()->write(json_encode([
            'message' => 'User registered successfully',
            'user' => $this->sanitizeUser($user),
            'token' => $token
        ]));

        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    public function login(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody()->getContents(), true);

        if (empty($data['email']) || empty($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Email and password are required']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $user = $this->userModel->findByEmail($data['email']);

        if (!$user || !$this->userModel->verifyPassword($data['password'], $user->password)) {
            $response->getBody()->write(json_encode(['error' => 'Invalid credentials']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        if (!$user->is_active) {
            $response->getBody()->write(json_encode(['error' => 'Account is inactive']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        $token = $this->generateToken($user);

        $response->getBody()->write(json_encode([
            'message' => 'Login successful',
            'user' => $this->sanitizeUser($user),
            'token' => $token
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function me(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $user = $this->userModel->findById($userId);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'User not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        // Get courses based on role
        if ($user->role === 'student') {
            $courses = $this->userModel->getEnrolledCourses($userId);
        } elseif ($user->role === 'teacher') {
            $courses = $this->userModel->getTaughtCourses($userId);
        } else {
            $courses = [];
        }

        $response->getBody()->write(json_encode([
            'user' => $this->sanitizeUser($user),
            'courses' => $courses
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function logout(Request $request, Response $response): Response
    {
        // For JWT, logout is handled client-side by removing the token
        // Here we can add token to blacklist if needed
        $response->getBody()->write(json_encode(['message' => 'Logged out successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function refresh(Request $request, Response $response): Response
    {
        // Token refresh logic
        // For simplicity, we'll require re-login for now
        $response->getBody()->write(json_encode(['message' => 'Please login again']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }

    private function generateToken(object $user): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-this';
        $expiration = time() + ($_ENV['JWT_EXPIRATION'] ?? 3600);

        $payload = [
            'iat' => time(),
            'exp' => $expiration,
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    private function sanitizeUser(object $user): object
    {
        $sanitized = clone $user;
        unset($sanitized->password);
        return $sanitized;
    }
}
