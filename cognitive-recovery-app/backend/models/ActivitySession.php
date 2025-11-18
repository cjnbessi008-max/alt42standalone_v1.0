<?php
/**
 * Activity Session Model
 * Manages user learning sessions
 */

require_once __DIR__ . '/../config/database.php';

class ActivitySession {
    private $db;
    private $table_name = "activity_sessions";

    public $id;
    public $user_id;
    public $session_token;
    public $course_id;
    public $module_id;
    public $started_at;
    public $ended_at;
    public $total_duration;
    public $is_active;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Create a new session
     * @return int|false Session ID or false on failure
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (user_id, session_token, course_id, module_id, is_active)
                  VALUES (:user_id, :session_token, :course_id, :module_id, 1)";

        $stmt = $this->db->prepare($query);

        // Generate session token
        $this->session_token = $this->generateSessionToken();

        // Bind values
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':session_token', $this->session_token);
        $stmt->bindParam(':course_id', $this->course_id);
        $stmt->bindParam(':module_id', $this->module_id);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return $this->id;
        }

        return false;
    }

    /**
     * Get session by token
     * @param string $token
     * @return bool
     */
    public function getByToken($token) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE session_token = :token AND is_active = 1
                  LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->user_id = $row['user_id'];
            $this->session_token = $row['session_token'];
            $this->course_id = $row['course_id'];
            $this->module_id = $row['module_id'];
            $this->started_at = $row['started_at'];
            $this->ended_at = $row['ended_at'];
            $this->total_duration = $row['total_duration'];
            $this->is_active = $row['is_active'];
            return true;
        }

        return false;
    }

    /**
     * End session
     * @return bool
     */
    public function end() {
        $query = "UPDATE " . $this->table_name . "
                  SET ended_at = NOW(),
                      is_active = 0,
                      total_duration = TIMESTAMPDIFF(SECOND, started_at, NOW())
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Update session heartbeat
     * @return bool
     */
    public function updateHeartbeat() {
        $query = "UPDATE " . $this->table_name . "
                  SET total_duration = TIMESTAMPDIFF(SECOND, started_at, NOW())
                  WHERE id = :id AND is_active = 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Get user's active sessions
     * @param int $userId
     * @return array
     */
    public function getUserActiveSessions($userId) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE user_id = :user_id AND is_active = 1
                  ORDER BY started_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get session statistics
     * @param int $sessionId
     * @return array|false
     */
    public function getSessionStats($sessionId) {
        $query = "SELECT
                    s.*,
                    COUNT(DISTINCT e.id) as total_events,
                    COUNT(DISTINCT r.id) as recovery_periods,
                    AVG(r.duration) as avg_recovery_duration,
                    SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) as total_clicks,
                    SUM(CASE WHEN e.event_type = 'keypress' THEN 1 ELSE 0 END) as total_keypress
                  FROM " . $this->table_name . " s
                  LEFT JOIN activity_events e ON s.id = e.session_id
                  LEFT JOIN cognitive_recovery_periods r ON s.id = r.session_id
                  WHERE s.id = :session_id
                  GROUP BY s.id";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Generate unique session token
     * @return string
     */
    private function generateSessionToken() {
        return bin2hex(random_bytes(32));
    }

    /**
     * End all user's active sessions
     * @param int $userId
     * @return bool
     */
    public function endUserActiveSessions($userId) {
        $query = "UPDATE " . $this->table_name . "
                  SET ended_at = NOW(),
                      is_active = 0,
                      total_duration = TIMESTAMPDIFF(SECOND, started_at, NOW())
                  WHERE user_id = :user_id AND is_active = 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);

        return $stmt->execute();
    }
}
