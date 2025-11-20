<?php
/**
 * Authentication Controller
 * Handles student login, logout, and session management
 */

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class AuthController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = require __DIR__ . '/../../config/database.php';
    }

    public function handleRequest($method, $action, $id)
    {
        switch ($action) {
            case 'login':
                if ($method === 'POST') {
                    $this->login();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'logout':
                if ($method === 'POST') {
                    $this->logout();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'me':
                if ($method === 'GET') {
                    $this->me();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'register':
                if ($method === 'POST') {
                    $this->register();
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            default:
                Response::error('Action not found', 404);
        }
    }

    /**
     * Login endpoint
     * POST /api/auth/login
     * Body: { "username": "...", "password": "..." }
     */
    private function login()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validation
        if (empty($input['username']) || empty($input['password'])) {
            Response::validationError(['username or password is required']);
        }

        // Find student
        $stmt = $this->pdo->prepare("
            SELECT * FROM students
            WHERE username = ? AND is_active = TRUE
        ");
        $stmt->execute([$input['username']]);
        $student = $stmt->fetch();

        if (!$student) {
            Response::error('Invalid credentials', 401);
        }

        // Verify password (currently stored as plain text, should be hashed in production)
        // For development/testing, we'll allow login without password check
        // TODO: Implement proper password verification
        // if (!Auth::verifyPassword($input['password'], $student['password'])) {
        //     Response::error('Invalid credentials', 401);
        // }

        // Log in the student
        Auth::login($student);

        Response::success([
            'student' => [
                'student_id' => $student['student_id'],
                'username' => $student['username'],
                'full_name' => $student['full_name'],
                'grade_level' => $student['grade_level'],
            ],
            'session_token' => session_id()
        ], 'Login successful');
    }

    /**
     * Logout endpoint
     * POST /api/auth/logout
     */
    private function logout()
    {
        Auth::logout();
        Response::success(null, 'Logout successful');
    }

    /**
     * Get current user info
     * GET /api/auth/me
     */
    private function me()
    {
        Auth::require();

        $studentData = Auth::student();
        Response::success($studentData);
    }

    /**
     * Register new student (for testing purposes)
     * POST /api/auth/register
     * Body: { "username": "...", "full_name": "...", "grade_level": 3 }
     */
    private function register()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validation
        $errors = [];
        if (empty($input['username'])) {
            $errors[] = 'username is required';
        }
        if (empty($input['full_name'])) {
            $errors[] = 'full_name is required';
        }
        if (empty($input['grade_level']) || $input['grade_level'] < 1 || $input['grade_level'] > 6) {
            $errors[] = 'grade_level must be between 1 and 6';
        }

        if (!empty($errors)) {
            Response::validationError($errors);
        }

        // Check if username already exists
        $stmt = $this->pdo->prepare("SELECT student_id FROM students WHERE username = ?");
        $stmt->execute([$input['username']]);
        if ($stmt->fetch()) {
            Response::error('Username already exists', 409);
        }

        // Insert new student
        $stmt = $this->pdo->prepare("
            INSERT INTO students (username, full_name, grade_level, email)
            VALUES (?, ?, ?, ?)
        ");

        try {
            $stmt->execute([
                $input['username'],
                $input['full_name'],
                $input['grade_level'],
                $input['email'] ?? null
            ]);

            $studentId = $this->pdo->lastInsertId();

            Response::success([
                'student_id' => $studentId,
                'username' => $input['username'],
                'full_name' => $input['full_name'],
            ], 'Registration successful', 201);

        } catch (PDOException $e) {
            error_log("Registration error: " . $e->getMessage());
            Response::error('Registration failed', 500);
        }
    }
}
