<?php
/**
 * Authentication System
 *
 * Handles user login, logout, and session management
 * PHP 7.1.9 compatible
 */

namespace App\Core;

use App\Database\Connection;

class Auth
{
    private static $instance = null;
    private $db;
    private $config;
    private $user = null;

    private function __construct()
    {
        $this->config = require __DIR__ . '/../../config/database.php';
        $this->db = Connection::getInstance($this->config);
        $this->startSession();
        $this->loadUser();
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Start session with security settings
     */
    private function startSession()
    {
        if (session_status() === PHP_SESSION_NONE) {
            $sessionConfig = $this->config['session'];

            ini_set('session.cookie_httponly', $sessionConfig['httponly']);
            ini_set('session.cookie_lifetime', $sessionConfig['lifetime']);
            ini_set('session.use_strict_mode', 1);

            session_name($sessionConfig['name']);
            session_start();

            // Regenerate session ID periodically
            if (!isset($_SESSION['last_regeneration'])) {
                $_SESSION['last_regeneration'] = time();
            } elseif (time() - $_SESSION['last_regeneration'] > $this->config['security']['session_regenerate_interval']) {
                session_regenerate_id(true);
                $_SESSION['last_regeneration'] = time();
            }
        }
    }

    /**
     * Load user from session
     */
    private function loadUser()
    {
        if (isset($_SESSION['user_id'])) {
            $query = "SELECT id, username, email, full_name, role, grade_level, created_at
                      FROM users
                      WHERE id = :user_id AND is_active = 1
                      LIMIT 1";

            $this->user = $this->db->fetchOne($query, ['user_id' => $_SESSION['user_id']]);
        }
    }

    /**
     * Attempt to log in user
     *
     * @param string $username
     * @param string $password
     * @return bool Success status
     */
    public function login($username, $password)
    {
        // Check login attempts (simple version without table)
        if (isset($_SESSION['login_attempts']) && $_SESSION['login_attempts'] >= $this->config['security']['max_login_attempts']) {
            if (time() - $_SESSION['lockout_time'] < $this->config['security']['lockout_duration']) {
                return false; // Still locked out
            } else {
                // Reset lockout
                unset($_SESSION['login_attempts']);
                unset($_SESSION['lockout_time']);
            }
        }

        $query = "SELECT id, username, password, email, full_name, role, grade_level
                  FROM users
                  WHERE username = :username AND is_active = 1
                  LIMIT 1";

        $user = $this->db->fetchOne($query, ['username' => $username]);

        if ($user && password_verify($password, $user['password'])) {
            // Successful login
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];

            unset($_SESSION['login_attempts']);
            unset($_SESSION['lockout_time']);

            // Update last login
            $this->db->execute(
                "UPDATE users SET last_login = NOW() WHERE id = :id",
                ['id' => $user['id']]
            );

            $this->user = $user;
            return true;
        }

        // Failed login
        if (!isset($_SESSION['login_attempts'])) {
            $_SESSION['login_attempts'] = 0;
        }
        $_SESSION['login_attempts']++;

        if ($_SESSION['login_attempts'] >= $this->config['security']['max_login_attempts']) {
            $_SESSION['lockout_time'] = time();
        }

        return false;
    }

    /**
     * Log out user
     */
    public function logout()
    {
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        $this->user = null;
    }

    /**
     * Check if user is logged in
     */
    public function check()
    {
        return $this->user !== null;
    }

    /**
     * Get current user
     */
    public function user()
    {
        return $this->user;
    }

    /**
     * Get user ID
     */
    public function id()
    {
        return $this->user ? $this->user['id'] : null;
    }

    /**
     * Check if user has role
     */
    public function hasRole($role)
    {
        return $this->user && $this->user['role'] === $role;
    }

    /**
     * Check if user is teacher
     */
    public function isTeacher()
    {
        return $this->hasRole('teacher');
    }

    /**
     * Check if user is student
     */
    public function isStudent()
    {
        return $this->hasRole('student');
    }

    /**
     * Require authentication
     */
    public function requireAuth()
    {
        if (!$this->check()) {
            header('Location: /login.php');
            exit;
        }
    }

    /**
     * Require teacher role
     */
    public function requireTeacher()
    {
        $this->requireAuth();
        if (!$this->isTeacher()) {
            header('HTTP/1.1 403 Forbidden');
            die('Access denied. Teacher privileges required.');
        }
    }

    /**
     * Register new user
     */
    public function register($username, $password, $email, $fullName, $role = 'student', $gradeLevel = null)
    {
        // Validate password length
        if (strlen($password) < $this->config['security']['password_min_length']) {
            throw new \Exception('Password too short');
        }

        // Check if username exists
        $existing = $this->db->fetchOne(
            "SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1",
            ['username' => $username, 'email' => $email]
        );

        if ($existing) {
            throw new \Exception('Username or email already exists');
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Insert user
        $query = "INSERT INTO users (username, password, email, full_name, role, grade_level)
                  VALUES (:username, :password, :email, :full_name, :role, :grade_level)";

        $this->db->execute($query, [
            'username' => $username,
            'password' => $hashedPassword,
            'email' => $email,
            'full_name' => $fullName,
            'role' => $role,
            'grade_level' => $gradeLevel
        ]);

        return true;
    }
}
