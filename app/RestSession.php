<?php
/**
 * Rest Session Management
 * Tracks rest periods and associated assessments
 */

class RestSession {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new rest session
     * @param int $userId User ID
     * @param int $plannedDuration Duration in seconds
     * @param int|null $courseId Optional course ID
     * @param string $sessionType Type of session
     * @return int Session ID
     */
    public function createSession($userId, $plannedDuration = null, $courseId = null, $sessionType = 'manual') {
        if ($plannedDuration === null) {
            $plannedDuration = DEFAULT_REST_DURATION;
        }

        // Validate duration
        if ($plannedDuration < MIN_REST_DURATION) {
            $plannedDuration = MIN_REST_DURATION;
        }
        if ($plannedDuration > MAX_REST_DURATION) {
            $plannedDuration = MAX_REST_DURATION;
        }

        $sql = "INSERT INTO rest_sessions
                (user_id, course_id, session_type, start_time, planned_duration, status)
                VALUES (:user_id, :course_id, :session_type, NOW(), :planned_duration, 'scheduled')";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':course_id' => $courseId,
            ':session_type' => $sessionType,
            ':planned_duration' => $plannedDuration
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Start a rest session
     * @param int $sessionId Session ID
     * @return bool Success status
     */
    public function startSession($sessionId) {
        $sql = "UPDATE rest_sessions
                SET status = 'in_progress', start_time = NOW()
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $sessionId]);
    }

    /**
     * Complete a rest session
     * @param int $sessionId Session ID
     * @return array Session data
     */
    public function completeSession($sessionId) {
        // Get session start time
        $sql = "SELECT start_time, planned_duration FROM rest_sessions WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $sessionId]);
        $session = $stmt->fetch();

        if (!$session) {
            throw new Exception('Session not found');
        }

        $actualDuration = time() - strtotime($session['start_time']);

        // Update session
        $updateSql = "UPDATE rest_sessions
                      SET status = 'completed',
                          end_time = NOW(),
                          actual_duration = :actual_duration
                      WHERE id = :id";

        $stmt = $this->db->prepare($updateSql);
        $stmt->execute([
            ':actual_duration' => $actualDuration,
            ':id' => $sessionId
        ]);

        return [
            'session_id' => $sessionId,
            'planned_duration' => $session['planned_duration'],
            'actual_duration' => $actualDuration
        ];
    }

    /**
     * Cancel a rest session
     * @param int $sessionId Session ID
     * @return bool Success status
     */
    public function cancelSession($sessionId) {
        $sql = "UPDATE rest_sessions
                SET status = 'cancelled', end_time = NOW()
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $sessionId]);
    }

    /**
     * Get session details
     * @param int $sessionId Session ID
     * @return array Session data
     */
    public function getSession($sessionId) {
        $sql = "SELECT rs.*, u.username, u.email, c.course_name
                FROM rest_sessions rs
                JOIN users u ON rs.user_id = u.id
                LEFT JOIN courses c ON rs.course_id = c.id
                WHERE rs.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $sessionId]);
        return $stmt->fetch();
    }

    /**
     * Get user's rest sessions
     * @param int $userId User ID
     * @param int $limit Number of results
     * @return array Sessions
     */
    public function getUserSessions($userId, $limit = 50) {
        $sql = "SELECT rs.*, c.course_name
                FROM rest_sessions rs
                LEFT JOIN courses c ON rs.course_id = c.id
                WHERE rs.user_id = :user_id
                ORDER BY rs.start_time DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get assessments for a rest session
     * @param int $sessionId Session ID
     * @return array Assessments (pre and post)
     */
    public function getSessionAssessments($sessionId) {
        $sql = "SELECT ca.*, at.type_name
                FROM cognitive_assessments ca
                JOIN assessment_types at ON ca.assessment_type_id = at.id
                WHERE ca.rest_session_id = :session_id
                ORDER BY ca.assessment_timing, ca.started_at";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':session_id' => $sessionId]);

        $assessments = $stmt->fetchAll();
        $result = [
            'pre_rest' => null,
            'post_rest' => null
        ];

        foreach ($assessments as $assessment) {
            if ($assessment['assessment_timing'] === 'pre_rest') {
                $result['pre_rest'] = $assessment;
            } elseif ($assessment['assessment_timing'] === 'post_rest') {
                $result['post_rest'] = $assessment;
            }
        }

        return $result;
    }

    /**
     * Check if session has both pre and post assessments completed
     * @param int $sessionId Session ID
     * @return bool
     */
    public function hasCompleteAssessments($sessionId) {
        $sql = "SELECT COUNT(*) as count
                FROM cognitive_assessments
                WHERE rest_session_id = :session_id
                AND assessment_timing IN ('pre_rest', 'post_rest')
                AND status = 'completed'";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':session_id' => $sessionId]);
        $result = $stmt->fetch();

        return $result['count'] >= 2;
    }
}
