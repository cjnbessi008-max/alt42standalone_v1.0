<?php
/**
 * Session Model
 * Handles user session management
 */

class Session {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Create a new session
     */
    public function create($data) {
        $session_token = $this->generateToken();

        $sql = "INSERT INTO user_sessions (
            moodle_user_id,
            username,
            session_token,
            ip_address,
            user_agent
        ) VALUES (?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);

        $success = $stmt->execute([
            $data['moodle_user_id'],
            $data['username'] ?? null,
            $session_token,
            $data['ip_address'] ?? null,
            $data['user_agent'] ?? null
        ]);

        return $success ? $this->db->lastInsertId() : false;
    }

    /**
     * Get session by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM user_sessions WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get session by token
     */
    public function getByToken($token) {
        $stmt = $this->db->prepare("SELECT * FROM user_sessions WHERE session_token = ?");
        $stmt->execute([$token]);
        return $stmt->fetch();
    }

    /**
     * Get active sessions for a user
     */
    public function getActiveByUserId($user_id) {
        $stmt = $this->db->prepare("
            SELECT * FROM user_sessions
            WHERE moodle_user_id = ? AND is_active = 1
            ORDER BY last_activity DESC
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetchAll();
    }

    /**
     * Update session activity
     */
    public function updateActivity($id) {
        $stmt = $this->db->prepare("
            UPDATE user_sessions
            SET last_activity = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        return $stmt->execute([$id]);
    }

    /**
     * Deactivate session
     */
    public function deactivate($id) {
        $stmt = $this->db->prepare("
            UPDATE user_sessions
            SET is_active = 0
            WHERE id = ?
        ");
        return $stmt->execute([$id]);
    }

    /**
     * Clean up expired sessions
     */
    public function cleanupExpired($timeout_seconds = 3600) {
        $stmt = $this->db->prepare("
            UPDATE user_sessions
            SET is_active = 0
            WHERE is_active = 1
            AND TIMESTAMPDIFF(SECOND, last_activity, CURRENT_TIMESTAMP) > ?
        ");
        return $stmt->execute([$timeout_seconds]);
    }

    /**
     * Get session token
     */
    public function getToken($id) {
        $stmt = $this->db->prepare("SELECT session_token FROM user_sessions WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ? $result['session_token'] : null;
    }

    /**
     * Generate a unique session token
     */
    private function generateToken() {
        return bin2hex(random_bytes(32));
    }

    /**
     * Validate session
     */
    public function isValid($id) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count FROM user_sessions
            WHERE id = ? AND is_active = 1
            AND TIMESTAMPDIFF(SECOND, last_activity, CURRENT_TIMESTAMP) < 3600
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
}
