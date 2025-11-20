<?php
/**
 * Authentication Helper
 * Manages student sessions and authentication
 */

class Auth
{
    /**
     * Check if user is authenticated
     *
     * @return bool
     */
    public static function check()
    {
        return isset($_SESSION['student_id']) && !empty($_SESSION['student_id']);
    }

    /**
     * Require authentication (or throw error)
     */
    public static function require()
    {
        if (!self::check()) {
            Response::unauthorized('Please log in to continue');
        }
    }

    /**
     * Get current authenticated student ID
     *
     * @return int|null
     */
    public static function studentId()
    {
        return $_SESSION['student_id'] ?? null;
    }

    /**
     * Get current authenticated student data
     *
     * @return array|null
     */
    public static function student()
    {
        return $_SESSION['student_data'] ?? null;
    }

    /**
     * Log in a student
     *
     * @param array $studentData Student data from database
     */
    public static function login($studentData)
    {
        // Regenerate session ID for security
        session_regenerate_id(true);

        // Store student data in session
        $_SESSION['student_id'] = $studentData['student_id'];
        $_SESSION['student_data'] = [
            'student_id' => $studentData['student_id'],
            'username' => $studentData['username'],
            'full_name' => $studentData['full_name'],
            'grade_level' => $studentData['grade_level'],
            'moodle_user_id' => $studentData['moodle_user_id'] ?? null,
        ];
        $_SESSION['login_time'] = time();

        // Update last login in database
        $pdo = require __DIR__ . '/../../config/database.php';
        $stmt = $pdo->prepare("UPDATE students SET last_login_at = NOW() WHERE student_id = ?");
        $stmt->execute([$studentData['student_id']]);
    }

    /**
     * Log out current student
     */
    public static function logout()
    {
        // Clear session data
        $_SESSION = [];

        // Destroy session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }

        // Destroy session
        session_destroy();
    }

    /**
     * Verify password (simple for now, can be enhanced with bcrypt later)
     *
     * @param string $inputPassword
     * @param string $storedPassword
     * @return bool
     */
    public static function verifyPassword($inputPassword, $storedPassword)
    {
        // For now, simple comparison (in production, use password_verify with hashed passwords)
        // TODO: Implement proper password hashing with password_hash() and password_verify()
        return $inputPassword === $storedPassword;
    }

    /**
     * Generate session token for game sessions
     *
     * @return string
     */
    public static function generateSessionToken()
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Check if session has timed out
     *
     * @return bool
     */
    public static function isSessionExpired()
    {
        if (!isset($_SESSION['login_time'])) {
            return true;
        }

        $elapsed = time() - $_SESSION['login_time'];
        return $elapsed > (SESSION_TIMEOUT_MINUTES * 60);
    }

    /**
     * Refresh session timestamp
     */
    public static function refreshSession()
    {
        $_SESSION['last_activity'] = time();
    }
}
