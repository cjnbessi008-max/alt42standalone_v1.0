<?php
/**
 * Learning Session Manager
 */

namespace StressReset;

class SessionManager
{
    private $db;
    private $moodleClient;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->moodleClient = new MoodleClient();
    }

    /**
     * Create or get user from Moodle ID
     */
    public function ensureUser($moodleUserId)
    {
        // Check if user exists
        $sql = "SELECT * FROM users WHERE moodle_user_id = :moodle_user_id";
        $user = $this->db->fetchOne($sql, [':moodle_user_id' => $moodleUserId]);

        if ($user) {
            return $user;
        }

        // Fetch from Moodle and create
        try {
            $moodleUsers = $this->moodleClient->getUserInfo($moodleUserId);

            if (empty($moodleUsers)) {
                throw new \Exception('User not found in Moodle');
            }

            $moodleUser = $moodleUsers[0];

            $userId = $this->db->insert('users', [
                'moodle_user_id' => $moodleUserId,
                'username' => $moodleUser['username'] ?? 'user_' . $moodleUserId,
                'email' => $moodleUser['email'] ?? '',
                'full_name' => $moodleUser['fullname'] ?? '',
            ]);

            return $this->db->fetchOne('SELECT * FROM users WHERE id = :id', [':id' => $userId]);
        } catch (\Exception $e) {
            // If Moodle fetch fails, create basic user record
            error_log('Failed to fetch from Moodle: ' . $e->getMessage());

            $userId = $this->db->insert('users', [
                'moodle_user_id' => $moodleUserId,
                'username' => 'user_' . $moodleUserId,
                'email' => '',
                'full_name' => '',
            ]);

            return $this->db->fetchOne('SELECT * FROM users WHERE id = :id', [':id' => $userId]);
        }
    }

    /**
     * Start a new learning session
     */
    public function startSession($moodleUserId, $moodleCourseId = null)
    {
        $user = $this->ensureUser($moodleUserId);

        // End any existing active sessions for this user
        $this->endActiveSessions($user['id']);

        // Create new session
        $sessionId = $this->db->insert('learning_sessions', [
            'user_id' => $user['id'],
            'moodle_course_id' => $moodleCourseId,
            'is_active' => 1,
        ]);

        // Create default user settings if not exist
        $this->ensureUserSettings($user['id']);

        return [
            'session_id' => $sessionId,
            'user_id' => $user['id'],
            'started_at' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get active session for user
     */
    public function getActiveSession($moodleUserId)
    {
        $sql = "
            SELECT ls.*
            FROM learning_sessions ls
            INNER JOIN users u ON ls.user_id = u.id
            WHERE u.moodle_user_id = :moodle_user_id
            AND ls.is_active = 1
            ORDER BY ls.session_start DESC
            LIMIT 1
        ";

        return $this->db->fetchOne($sql, [':moodle_user_id' => $moodleUserId]);
    }

    /**
     * End active sessions for a user
     */
    public function endActiveSessions($userId)
    {
        $sql = "
            UPDATE learning_sessions
            SET is_active = 0,
                session_end = NOW(),
                duration_minutes = TIMESTAMPDIFF(MINUTE, session_start, NOW())
            WHERE user_id = :user_id
            AND is_active = 1
        ";

        return $this->db->query($sql, [':user_id' => $userId]);
    }

    /**
     * End specific session
     */
    public function endSession($sessionId)
    {
        $sql = "
            UPDATE learning_sessions
            SET is_active = 0,
                session_end = NOW(),
                duration_minutes = TIMESTAMPDIFF(MINUTE, session_start, NOW())
            WHERE id = :id
            AND is_active = 1
        ";

        return $this->db->query($sql, [':id' => $sessionId]);
    }

    /**
     * Update session activity heartbeat
     */
    public function updateHeartbeat($sessionId)
    {
        $sql = "
            UPDATE learning_sessions
            SET updated_at = NOW()
            WHERE id = :id
            AND is_active = 1
        ";

        return $this->db->query($sql, [':id' => $sessionId]);
    }

    /**
     * Get user settings
     */
    public function getUserSettings($userId)
    {
        $sql = "SELECT * FROM user_settings WHERE user_id = :user_id";
        $settings = $this->db->fetchOne($sql, [':user_id' => $userId]);

        if (!$settings) {
            // Return defaults
            $config = require __DIR__ . '/../config/stress_detection.php';
            return [
                'enable_stress_detection' => true,
                'time_threshold_minutes' => $config['time_threshold_minutes'],
                'enable_light_effect' => true,
                'enable_sound' => true,
            ];
        }

        return $settings;
    }

    /**
     * Ensure user settings exist
     */
    private function ensureUserSettings($userId)
    {
        $sql = "SELECT id FROM user_settings WHERE user_id = :user_id";
        $existing = $this->db->fetchOne($sql, [':user_id' => $userId]);

        if (!$existing) {
            $config = require __DIR__ . '/../config/stress_detection.php';
            $this->db->insert('user_settings', [
                'user_id' => $userId,
                'time_threshold_minutes' => $config['time_threshold_minutes'],
            ]);
        }
    }

    /**
     * Update user settings
     */
    public function updateUserSettings($userId, $settings)
    {
        $sql = "SELECT id FROM user_settings WHERE user_id = :user_id";
        $existing = $this->db->fetchOne($sql, [':user_id' => $userId]);

        $allowedFields = [
            'enable_stress_detection',
            'time_threshold_minutes',
            'enable_light_effect',
            'enable_sound',
        ];

        $updateData = [];
        foreach ($settings as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updateData[$key] = $value;
            }
        }

        if (empty($updateData)) {
            return false;
        }

        if ($existing) {
            return $this->db->update(
                'user_settings',
                $updateData,
                'user_id = :user_id',
                [':user_id' => $userId]
            );
        } else {
            $updateData['user_id'] = $userId;
            return $this->db->insert('user_settings', $updateData);
        }
    }

    /**
     * Get session statistics
     */
    public function getSessionStats($sessionId)
    {
        $session = $this->db->fetchOne(
            'SELECT * FROM learning_sessions WHERE id = :id',
            [':id' => $sessionId]
        );

        if (!$session) {
            return null;
        }

        $startTime = strtotime($session['session_start']);
        $currentTime = $session['is_active'] ? time() : strtotime($session['session_end']);
        $durationMinutes = ($currentTime - $startTime) / 60;

        // Get activity counts
        $activitySql = "
            SELECT
                activity_type,
                SUM(activity_count) as total_count
            FROM activity_tracking
            WHERE session_id = :session_id
            GROUP BY activity_type
        ";

        $activities = $this->db->fetchAll($activitySql, [':session_id' => $sessionId]);

        $activityCounts = [];
        foreach ($activities as $activity) {
            $activityCounts[$activity['activity_type']] = (int)$activity['total_count'];
        }

        // Get latest stress score
        $scoreSql = "
            SELECT * FROM stress_scores
            WHERE session_id = :session_id
            ORDER BY calculated_at DESC
            LIMIT 1
        ";

        $latestScore = $this->db->fetchOne($scoreSql, [':session_id' => $sessionId]);

        // Get reset count
        $resetCount = $this->db->fetchOne(
            'SELECT COUNT(*) as count FROM reset_events WHERE session_id = :session_id',
            [':session_id' => $sessionId]
        );

        return [
            'session_id' => $sessionId,
            'is_active' => (bool)$session['is_active'],
            'duration_minutes' => round($durationMinutes, 2),
            'activity_counts' => $activityCounts,
            'latest_stress_score' => $latestScore ? [
                'combined_score' => (float)$latestScore['combined_score'],
                'time_score' => (float)$latestScore['time_score'],
                'click_score' => (float)$latestScore['click_score'],
                'typing_score' => (float)$latestScore['typing_score'],
                'calculated_at' => $latestScore['calculated_at'],
            ] : null,
            'reset_count' => (int)$resetCount['count'],
        ];
    }
}
