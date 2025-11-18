<?php
/**
 * User Model
 *
 * @package AlternativeSolutions
 * @version 1.0
 */

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Find user by ID
     */
    public function findById($id) {
        $sql = "SELECT * FROM users WHERE id = ? AND is_active = 1";
        return $this->db->fetchOne($sql, [$id]);
    }

    /**
     * Find user by username
     */
    public function findByUsername($username) {
        $sql = "SELECT * FROM users WHERE username = ? AND is_active = 1";
        return $this->db->fetchOne($sql, [$username]);
    }

    /**
     * Find user by email
     */
    public function findByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = ? AND is_active = 1";
        return $this->db->fetchOne($sql, [$email]);
    }

    /**
     * Create new user
     */
    public function create($data) {
        $sql = "INSERT INTO users (username, email, password, full_name, role, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())";

        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        return $this->db->insert($sql, [
            $data['username'],
            $data['email'],
            $hashedPassword,
            $data['full_name'] ?? null,
            $data['role'] ?? 'student'
        ]);
    }

    /**
     * Update user
     */
    public function update($id, $data) {
        $fields = [];
        $params = [];

        foreach ($data as $key => $value) {
            if ($key !== 'id' && $key !== 'password') {
                $fields[] = "$key = ?";
                $params[] = $value;
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = ?";

        return $this->db->execute($sql, $params);
    }

    /**
     * Update password
     */
    public function updatePassword($id, $newPassword) {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $sql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";

        return $this->db->execute($sql, [$hashedPassword, $id]);
    }

    /**
     * Verify password
     */
    public function verifyPassword($user, $password) {
        return password_verify($password, $user['password']);
    }

    /**
     * Update last login
     */
    public function updateLastLogin($id) {
        $sql = "UPDATE users SET last_login = NOW() WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }

    /**
     * Get all users by role
     */
    public function getAllByRole($role) {
        $sql = "SELECT id, username, email, full_name, role, created_at, last_login
                FROM users
                WHERE role = ? AND is_active = 1
                ORDER BY created_at DESC";

        return $this->db->fetchAll($sql, [$role]);
    }

    /**
     * Get all students
     */
    public function getAllStudents() {
        return $this->getAllByRole('student');
    }

    /**
     * Get all teachers
     */
    public function getAllTeachers() {
        return $this->getAllByRole('teacher');
    }

    /**
     * Check if username exists
     */
    public function usernameExists($username, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM users WHERE username = ?";
        $params = [$username];

        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }

        $result = $this->db->fetchOne($sql, $params);
        return $result['count'] > 0;
    }

    /**
     * Check if email exists
     */
    public function emailExists($email, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM users WHERE email = ?";
        $params = [$email];

        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }

        $result = $this->db->fetchOne($sql, $params);
        return $result['count'] > 0;
    }

    /**
     * Deactivate user
     */
    public function deactivate($id) {
        $sql = "UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }

    /**
     * Activate user
     */
    public function activate($id) {
        $sql = "UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }

    /**
     * Delete user (soft delete)
     */
    public function delete($id) {
        return $this->deactivate($id);
    }

    /**
     * Get user statistics
     */
    public function getStatistics($userId) {
        $sql = "SELECT
                    (SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND status = 'completed') as completed_activities,
                    (SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND status = 'in_progress') as in_progress_activities,
                    (SELECT COUNT(*) FROM attempts WHERE user_id = ?) as total_attempts,
                    (SELECT AVG(confidence_level) FROM attempts WHERE user_id = ?) as avg_confidence";

        return $this->db->fetchOne($sql, [$userId, $userId, $userId, $userId]);
    }
}
