<?php
/**
 * Session Utility
 * Handles session management and security
 */

require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../config/database.php';

class Session {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->initSession();
    }

    /**
     * Initialize session
     */
    private function initSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_name(SESSION_COOKIE_NAME);
            session_set_cookie_params([
                'lifetime' => SESSION_TIMEOUT,
                'path' => SESSION_COOKIE_PATH,
                'secure' => SESSION_COOKIE_SECURE,
                'httponly' => SESSION_COOKIE_HTTPONLY,
                'samesite' => 'Lax'
            ]);
            session_start();
        }
    }

    /**
     * Set session data
     */
    public function set($key, $value) {
        $_SESSION[$key] = $value;
    }

    /**
     * Get session data
     */
    public function get($key, $default = null) {
        return isset($_SESSION[$key]) ? $_SESSION[$key] : $default;
    }

    /**
     * Check if key exists
     */
    public function has($key) {
        return isset($_SESSION[$key]);
    }

    /**
     * Remove session data
     */
    public function remove($key) {
        unset($_SESSION[$key]);
    }

    /**
     * Clear all session data
     */
    public function clear() {
        $_SESSION = [];
    }

    /**
     * Destroy session
     */
    public function destroy() {
        $this->clear();
        session_destroy();
    }

    /**
     * Regenerate session ID
     */
    public function regenerate() {
        session_regenerate_id(true);
    }

    /**
     * Set user session
     */
    public function setUser($userId, $userData = []) {
        $this->set('user_id', $userId);
        $this->set('user_data', $userData);
        $this->set('login_time', time());
        $this->regenerate();

        // Log session
        $this->logSession($userId, 'login');
    }

    /**
     * Get current user ID
     */
    public function getUserId() {
        return $this->get('user_id');
    }

    /**
     * Get user data
     */
    public function getUserData() {
        return $this->get('user_data', []);
    }

    /**
     * Check if user is logged in
     */
    public function isLoggedIn() {
        return $this->has('user_id') && $this->has('login_time');
    }

    /**
     * Check if session is expired
     */
    public function isExpired() {
        if (!$this->has('login_time')) {
            return true;
        }

        $loginTime = $this->get('login_time');
        return (time() - $loginTime) > SESSION_TIMEOUT;
    }

    /**
     * Logout user
     */
    public function logout() {
        $userId = $this->getUserId();
        if ($userId) {
            $this->logSession($userId, 'logout');
        }
        $this->destroy();
    }

    /**
     * Generate CSRF token
     */
    public function generateCsrfToken() {
        if (!$this->has(CSRF_TOKEN_NAME)) {
            $token = bin2hex(random_bytes(CSRF_TOKEN_LENGTH));
            $this->set(CSRF_TOKEN_NAME, $token);
        }
        return $this->get(CSRF_TOKEN_NAME);
    }

    /**
     * Validate CSRF token
     */
    public function validateCsrfToken($token) {
        $sessionToken = $this->get(CSRF_TOKEN_NAME);
        return $sessionToken && hash_equals($sessionToken, $token);
    }

    /**
     * Set flash message
     */
    public function setFlash($key, $message) {
        if (!$this->has('_flash')) {
            $this->set('_flash', []);
        }
        $flash = $this->get('_flash');
        $flash[$key] = $message;
        $this->set('_flash', $flash);
    }

    /**
     * Get and clear flash message
     */
    public function getFlash($key, $default = null) {
        if (!$this->has('_flash')) {
            return $default;
        }

        $flash = $this->get('_flash');
        $message = isset($flash[$key]) ? $flash[$key] : $default;
        unset($flash[$key]);
        $this->set('_flash', $flash);

        return $message;
    }

    /**
     * Log session activity
     */
    private function logSession($userId, $activityType, $data = []) {
        try {
            $sql = "INSERT INTO session_logs
                    (moodle_user_id, session_token, ip_address, user_agent, activity_type, activity_data)
                    VALUES (?, ?, ?, ?, ?, ?)";

            $params = [
                $userId,
                session_id(),
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $activityType,
                json_encode($data)
            ];

            $this->db->query($sql, $params);
        } catch (Exception $e) {
            error_log("Failed to log session: " . $e->getMessage());
        }
    }

    /**
     * Get user's active sessions
     */
    public function getActiveSessions($userId) {
        $sql = "SELECT * FROM session_logs
                WHERE moodle_user_id = ?
                AND activity_type = 'login'
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ORDER BY created_at DESC";

        return $this->db->fetchAll($sql, [$userId]);
    }

    /**
     * Clean old sessions
     */
    public function cleanOldSessions() {
        $sql = "DELETE FROM session_logs
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)";

        return $this->db->query($sql);
    }
}
