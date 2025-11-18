<?php
/**
 * Authentication and Authorization Handler
 */

require_once __DIR__ . '/db.php';

class Auth {
    private $config;
    private $db;

    public function __construct() {
        $this->config = require __DIR__ . '/config.php';
        $this->db = db()->getConnection();
    }

    /**
     * Login user and return JWT token
     */
    public function login($username, $password) {
        $sql = "SELECT id, username, password_hash, email, full_name, role
                FROM users
                WHERE username = ? AND is_active = 1
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }

        // Update last login
        $updateSql = "UPDATE users SET last_login = NOW() WHERE id = ?";
        $this->db->prepare($updateSql)->execute([$user['id']]);

        // Generate JWT
        $token = $this->generateJWT($user);

        unset($user['password_hash']);

        return [
            'success' => true,
            'token' => $token,
            'user' => $user
        ];
    }

    /**
     * Generate JWT token
     */
    private function generateJWT($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        $payload = json_encode([
            'iss' => $this->config['app']['name'],
            'iat' => time(),
            'exp' => time() + $this->config['security']['jwt_expiration'],
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ]);

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payload);

        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            $this->config['security']['jwt_secret'],
            true
        );
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Verify JWT token
     */
    public function verifyJWT($token) {
        if (empty($token)) {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        $signature = $this->base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            $this->config['security']['jwt_secret'],
            true
        );

        if (!hash_equals($signature, $expectedSignature)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($base64UrlPayload), true);

        if ($payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Get current authenticated user from request
     */
    public function getCurrentUser() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            return $this->verifyJWT($token);
        }

        return null;
    }

    /**
     * Require authentication
     */
    public function requireAuth() {
        $user = $this->getCurrentUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        return $user;
    }

    /**
     * Require specific role
     */
    public function requireRole($roles) {
        $user = $this->requireAuth();

        if (!is_array($roles)) {
            $roles = [$roles];
        }

        if (!in_array($user['role'], $roles)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }

        return $user;
    }

    /**
     * Register new user
     */
    public function register($data) {
        // Validate required fields
        $required = ['username', 'password', 'email', 'full_name'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'message' => "Field '$field' is required"];
            }
        }

        // Check if username or email already exists
        $checkSql = "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1";
        $stmt = $this->db->prepare($checkSql);
        $stmt->execute([$data['username'], $data['email']]);

        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'Username or email already exists'];
        }

        // Hash password
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

        // Insert user
        $insertSql = "INSERT INTO users (username, password_hash, email, full_name, role, grade_level)
                      VALUES (?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($insertSql);
        $result = $stmt->execute([
            $data['username'],
            $passwordHash,
            $data['email'],
            $data['full_name'],
            $data['role'] ?? 'student',
            $data['grade_level'] ?? null
        ]);

        if ($result) {
            $userId = $this->db->lastInsertId();
            return ['success' => true, 'user_id' => $userId];
        }

        return ['success' => false, 'message' => 'Registration failed'];
    }

    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

// Helper function
function auth() {
    static $instance = null;
    if ($instance === null) {
        $instance = new Auth();
    }
    return $instance;
}
