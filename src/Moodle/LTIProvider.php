<?php
/**
 * LTI Provider for Moodle Integration
 * Handles LTI launch requests and session management
 */

class LTIProvider {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Validate LTI launch request
     */
    public function validateLaunchRequest($params) {
        // Check required LTI parameters
        $required = ['oauth_consumer_key', 'oauth_signature', 'user_id'];
        foreach ($required as $param) {
            if (!isset($params[$param])) {
                return false;
            }
        }

        // Verify OAuth signature
        return $this->verifyOAuthSignature($params);
    }

    /**
     * Verify OAuth 1.0 signature
     */
    private function verifyOAuthSignature($params) {
        if ($params['oauth_consumer_key'] !== LTI_KEY) {
            return false;
        }

        // Simple signature validation (in production, use proper OAuth library)
        $baseString = $this->buildBaseString($params);
        $signature = base64_encode(hash_hmac('sha1', $baseString, LTI_SECRET, true));

        return $signature === $params['oauth_signature'];
    }

    /**
     * Build OAuth base string
     */
    private function buildBaseString($params) {
        $parts = [];
        ksort($params);
        foreach ($params as $key => $value) {
            if ($key !== 'oauth_signature') {
                $parts[] = rawurlencode($key) . '=' . rawurlencode($value);
            }
        }
        return implode('&', $parts);
    }

    /**
     * Create or update student session
     */
    public function createSession($ltiParams) {
        $moodleUserId = intval($ltiParams['user_id']);
        $userName = $ltiParams['lis_person_name_full'] ?? 'Student';
        $userEmail = $ltiParams['lis_person_contact_email_primary'] ?? '';

        // Generate session token
        $sessionToken = bin2hex(random_bytes(32));

        // Check if session exists
        $existing = $this->db->fetchOne(
            "SELECT id FROM student_sessions WHERE moodle_user_id = ? AND is_active = 1",
            [$moodleUserId]
        );

        if ($existing) {
            // Update existing session
            $this->db->execute(
                "UPDATE student_sessions SET session_token = ?, last_activity = NOW() WHERE id = ?",
                [$sessionToken, $existing['id']]
            );
            $sessionId = $existing['id'];
        } else {
            // Create new session
            $this->db->execute(
                "INSERT INTO student_sessions (moodle_user_id, session_token, user_name, user_email)
                 VALUES (?, ?, ?, ?)",
                [$moodleUserId, $sessionToken, $userName, $userEmail]
            );
            $sessionId = $this->db->lastInsertId();

            // Initialize learning progress
            $this->db->execute(
                "INSERT INTO learning_progress (session_id) VALUES (?)",
                [$sessionId]
            );
        }

        // Store in PHP session
        $_SESSION['session_id'] = $sessionId;
        $_SESSION['session_token'] = $sessionToken;
        $_SESSION['moodle_user_id'] = $moodleUserId;
        $_SESSION['user_name'] = $userName;

        return [
            'session_id' => $sessionId,
            'session_token' => $sessionToken
        ];
    }

    /**
     * Validate session token
     */
    public function validateSession($sessionToken) {
        $session = $this->db->fetchOne(
            "SELECT * FROM student_sessions
             WHERE session_token = ? AND is_active = 1",
            [$sessionToken]
        );

        if (!$session) {
            return false;
        }

        // Check timeout
        $lastActivity = strtotime($session['last_activity']);
        if (time() - $lastActivity > SESSION_TIMEOUT) {
            $this->db->execute(
                "UPDATE student_sessions SET is_active = 0 WHERE id = ?",
                [$session['id']]
            );
            return false;
        }

        // Update last activity
        $this->db->execute(
            "UPDATE student_sessions SET last_activity = NOW() WHERE id = ?",
            [$session['id']]
        );

        return $session;
    }

    /**
     * Get session by ID
     */
    public function getSession($sessionId) {
        return $this->db->fetchOne(
            "SELECT * FROM student_sessions WHERE id = ?",
            [$sessionId]
        );
    }
}
