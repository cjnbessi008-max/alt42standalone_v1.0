<?php
/**
 * SessionManager - Handle session and progress tracking
 */

defined('AREA_RECOM_APP') or define('AREA_RECOM_APP', true);

class SessionManager {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Start a new learning session
     */
    public function startSession($userId, $courseId, $shapeId) {
        $sql = "
            INSERT INTO student_sessions
            (moodle_user_id, moodle_course_id, shape_id, session_start)
            VALUES (?, ?, ?, NOW())
        ";

        $sessionId = $this->db->insert($sql, [$userId, $courseId, $shapeId]);

        $this->logActivity("Session $sessionId started for user $userId");

        return $sessionId;
    }

    /**
     * Get session information
     */
    public function getSession($sessionId) {
        $sql = "
            SELECT ss.*, s.shape_name, s.shape_type, s.vertices,
                   s.original_area, s.difficulty_level, s.color_code
            FROM student_sessions ss
            JOIN shapes s ON ss.shape_id = s.id
            WHERE ss.id = ?
        ";

        $session = $this->db->fetchOne($sql, [$sessionId]);

        if (!$session) {
            throw new Exception('Session not found');
        }

        // Parse JSON fields
        if (isset($session['vertices'])) {
            $session['vertices'] = json_decode($session['vertices'], true);
        }
        if (isset($session['session_data']) && !empty($session['session_data'])) {
            $session['session_data'] = json_decode($session['session_data'], true);
        }

        return $session;
    }

    /**
     * Update session data
     */
    public function updateSession($sessionId, $data) {
        $sessionData = isset($data['session_data']) ? $data['session_data'] : null;

        $sql = "
            UPDATE student_sessions
            SET session_data = ?
            WHERE id = ?
        ";

        $this->db->execute($sql, [
            $sessionData ? json_encode($sessionData) : null,
            $sessionId
        ]);

        return true;
    }

    /**
     * Complete a session
     */
    public function completeSession($sessionId, $score, $sessionData) {
        try {
            $this->db->beginTransaction();

            // Get session info
            $session = $this->db->fetchOne(
                "SELECT moodle_user_id, moodle_course_id, shape_id, session_start
                 FROM student_sessions WHERE id = ?",
                [$sessionId]
            );

            if (!$session) {
                throw new Exception('Session not found');
            }

            // Update session
            $sql = "
                UPDATE student_sessions
                SET session_end = NOW(),
                    completed = TRUE,
                    score = ?,
                    session_data = ?
                WHERE id = ?
            ";

            $this->db->execute($sql, [$score, $sessionData, $sessionId]);

            // Calculate session duration
            $durationSql = "
                SELECT TIMESTAMPDIFF(SECOND, session_start, session_end) as duration
                FROM student_sessions
                WHERE id = ?
            ";
            $durationResult = $this->db->fetchOne($durationSql, [$sessionId]);
            $duration = $durationResult['duration'];

            // Update student progress
            $this->updateStudentProgress(
                $session['moodle_user_id'],
                $session['moodle_course_id'],
                $score,
                $duration,
                $session['shape_id']
            );

            $this->db->commit();

            $this->logActivity("Session $sessionId completed with score $score");

            return true;

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Update student overall progress
     */
    private function updateStudentProgress($userId, $courseId, $score, $duration, $shapeId) {
        // Get shape difficulty
        $shape = $this->db->fetchOne(
            "SELECT difficulty_level FROM shapes WHERE id = ?",
            [$shapeId]
        );
        $difficulty = $shape['difficulty_level'];

        // Check if progress record exists
        $existing = $this->db->fetchOne(
            "SELECT * FROM student_progress WHERE moodle_user_id = ? AND moodle_course_id = ?",
            [$userId, $courseId]
        );

        if ($existing) {
            // Update existing record
            $totalAttempts = $existing['total_attempts'] + 1;
            $avgScore = (($existing['average_score'] * $existing['total_attempts']) + $score) / $totalAttempts;

            $sql = "
                UPDATE student_progress
                SET total_shapes_completed = total_shapes_completed + 1,
                    total_attempts = total_attempts + 1,
                    average_score = ?,
                    total_time_spent = total_time_spent + ?,
                    highest_difficulty_level = GREATEST(highest_difficulty_level, ?),
                    last_activity = NOW()
                WHERE moodle_user_id = ? AND moodle_course_id = ?
            ";

            $this->db->execute($sql, [$avgScore, $duration, $difficulty, $userId, $courseId]);

        } else {
            // Create new record
            $sql = "
                INSERT INTO student_progress
                (moodle_user_id, moodle_course_id, total_shapes_completed,
                 total_attempts, average_score, total_time_spent, highest_difficulty_level)
                VALUES (?, ?, 1, 1, ?, ?, ?)
            ";

            $this->db->insert($sql, [$userId, $courseId, $score, $duration, $difficulty]);
        }

        // Check for achievements
        $this->checkAchievements($userId, $courseId);
    }

    /**
     * Log manipulation action
     */
    public function logManipulation($sessionId, $actionType, $actionData, $calculatedArea = null) {
        $sql = "
            INSERT INTO shape_manipulations
            (session_id, action_type, action_data, calculated_area, timestamp)
            VALUES (?, ?, ?, ?, NOW())
        ";

        $manipulationId = $this->db->insert($sql, [
            $sessionId,
            $actionType,
            json_encode($actionData),
            $calculatedArea
        ]);

        // Increment session attempts
        $this->db->execute(
            "UPDATE student_sessions SET attempts = attempts + 1 WHERE id = ?",
            [$sessionId]
        );

        return $manipulationId;
    }

    /**
     * Get student progress
     */
    public function getStudentProgress($userId, $courseId) {
        $sql = "
            SELECT * FROM student_progress
            WHERE moodle_user_id = ? AND moodle_course_id = ?
        ";

        $progress = $this->db->fetchOne($sql, [$userId, $courseId]);

        if (!$progress) {
            return [
                'total_shapes_completed' => 0,
                'total_attempts' => 0,
                'average_score' => 0,
                'total_time_spent' => 0,
                'highest_difficulty_level' => 0,
                'achievements' => []
            ];
        }

        // Parse achievements JSON
        if (isset($progress['achievements']) && !empty($progress['achievements'])) {
            $progress['achievements'] = json_decode($progress['achievements'], true);
        } else {
            $progress['achievements'] = [];
        }

        return $progress;
    }

    /**
     * Get user statistics
     */
    public function getUserStatistics($userId, $courseId) {
        $sql = "
            SELECT * FROM v_student_performance
            WHERE moodle_user_id = ? AND moodle_course_id = ?
            ORDER BY session_start DESC
        ";

        $sessions = $this->db->fetchAll($sql, [$userId, $courseId]);

        $progress = $this->getStudentProgress($userId, $courseId);

        return [
            'progress' => $progress,
            'recent_sessions' => $sessions,
            'total_sessions' => count($sessions)
        ];
    }

    /**
     * Check and award achievements
     */
    private function checkAchievements($userId, $courseId) {
        $progress = $this->getStudentProgress($userId, $courseId);
        $achievements = $progress['achievements'];

        // First Shape - Complete 1 shape
        if ($progress['total_shapes_completed'] >= 1 && !in_array('first_shape', $achievements)) {
            $achievements[] = 'first_shape';
        }

        // Shape Master - Complete 10 shapes
        if ($progress['total_shapes_completed'] >= 10 && !in_array('shape_master', $achievements)) {
            $achievements[] = 'shape_master';
        }

        // Perfect Score - Get 100 points
        if ($progress['average_score'] >= 100 && !in_array('perfect_score', $achievements)) {
            $achievements[] = 'perfect_score';
        }

        // Difficulty Champion - Complete level 3 shape
        if ($progress['highest_difficulty_level'] >= 3 && !in_array('difficulty_champion', $achievements)) {
            $achievements[] = 'difficulty_champion';
        }

        // Speed Demon - Complete shape in under 60 seconds
        $fastSession = $this->db->fetchOne(
            "SELECT id FROM student_sessions
             WHERE moodle_user_id = ? AND moodle_course_id = ?
             AND completed = TRUE
             AND TIMESTAMPDIFF(SECOND, session_start, session_end) < 60
             LIMIT 1",
            [$userId, $courseId]
        );

        if ($fastSession && !in_array('speed_demon', $achievements)) {
            $achievements[] = 'speed_demon';
        }

        // Update achievements
        if (count($achievements) > count($progress['achievements'])) {
            $sql = "
                UPDATE student_progress
                SET achievements = ?
                WHERE moodle_user_id = ? AND moodle_course_id = ?
            ";

            $this->db->execute($sql, [json_encode($achievements), $userId, $courseId]);
        }

        return $achievements;
    }

    /**
     * Get all sessions for a user
     */
    public function getUserSessions($userId, $courseId, $limit = 10) {
        $sql = "
            SELECT ss.*, s.shape_name, s.difficulty_level
            FROM student_sessions ss
            JOIN shapes s ON ss.shape_id = s.id
            WHERE ss.moodle_user_id = ? AND ss.moodle_course_id = ?
            ORDER BY ss.session_start DESC
            LIMIT ?
        ";

        return $this->db->fetchAll($sql, [$userId, $courseId, $limit]);
    }

    /**
     * Log activity
     */
    private function logActivity($message) {
        if (defined('LOG_FILE')) {
            $timestamp = date('Y-m-d H:i:s');
            $logMessage = "[$timestamp] $message" . PHP_EOL;

            $logDir = dirname(LOG_FILE);
            if (!file_exists($logDir)) {
                mkdir($logDir, 0755, true);
            }

            error_log($logMessage, 3, LOG_FILE);
        }
    }
}
