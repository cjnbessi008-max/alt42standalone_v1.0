<?php

namespace DualDance\Controllers;

use DualDance\Utils\Database;
use DualDance\Utils\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Authentication controller
 */
class AuthController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * User registration
     */
    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validate input
        $errors = [];
        if (empty($data['username'])) {
            $errors[] = 'Username is required';
        }
        if (empty($data['email'])) {
            $errors[] = 'Email is required';
        }
        if (empty($data['password'])) {
            $errors[] = 'Password is required';
        } elseif (strlen($data['password']) < 6) {
            $errors[] = 'Password must be at least 6 characters';
        }

        if (!empty($errors)) {
            return $this->jsonResponse($response, ['errors' => $errors], 400);
        }

        // Check if username/email already exists
        if ($this->db->exists('users', 'username = :username', ['username' => $data['username']])) {
            return $this->jsonResponse($response, ['error' => 'Username already exists'], 409);
        }

        if ($this->db->exists('users', 'email = :email', ['email' => $data['email']])) {
            return $this->jsonResponse($response, ['error' => 'Email already exists'], 409);
        }

        // Create user
        try {
            $userId = $this->db->insert('users', [
                'username' => $data['username'],
                'email' => $data['email'],
                'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
                'role' => $data['role'] ?? 'student'
            ]);

            // Generate JWT token
            $token = JWT::encode([
                'user_id' => $userId,
                'username' => $data['username'],
                'role' => $data['role'] ?? 'student'
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'user' => [
                    'id' => $userId,
                    'username' => $data['username'],
                    'email' => $data['email'],
                    'role' => $data['role'] ?? 'student'
                ],
                'token' => $token
            ], 201);
        } catch (\Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Registration failed'], 500);
        }
    }

    /**
     * User login
     */
    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (empty($data['username']) || empty($data['password'])) {
            return $this->jsonResponse($response, ['error' => 'Username and password are required'], 400);
        }

        try {
            $user = $this->db->fetchOne(
                'SELECT * FROM users WHERE username = :username AND is_active = 1',
                ['username' => $data['username']]
            );

            if (!$user || !password_verify($data['password'], $user['password_hash'])) {
                return $this->jsonResponse($response, ['error' => 'Invalid credentials'], 401);
            }

            // Update last login
            $this->db->update('users', ['last_login' => date('Y-m-d H:i:s')], 'id = :id', ['id' => $user['id']]);

            // Generate JWT token
            $token = JWT::encode([
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'settings' => json_decode($user['settings'] ?? '{}', true)
                ],
                'token' => $token
            ]);
        } catch (\Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Login failed'], 500);
        }
    }

    /**
     * Get current user
     */
    public function me(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');

        try {
            $user = $this->db->fetchOne(
                'SELECT u.*, g.average_grade, g.level, g.experience_points
                 FROM users u
                 LEFT JOIN grades g ON u.id = g.user_id
                 WHERE u.id = :id',
                ['id' => $userId]
            );

            if (!$user) {
                return $this->jsonResponse($response, ['error' => 'User not found'], 404);
            }

            unset($user['password_hash']);

            return $this->jsonResponse($response, [
                'success' => true,
                'user' => array_merge($user, [
                    'settings' => json_decode($user['settings'] ?? '{}', true)
                ])
            ]);
        } catch (\Exception $e) {
            error_log("Get user error: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Failed to get user'], 500);
        }
    }

    /**
     * Logout (client-side token removal)
     */
    public function logout(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, ['success' => true, 'message' => 'Logged out successfully']);
    }

    /**
     * Helper: JSON response
     */
    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
