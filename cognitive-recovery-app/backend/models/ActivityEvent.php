<?php
/**
 * Activity Event Model
 * Tracks individual user activity events
 */

require_once __DIR__ . '/../config/database.php';

class ActivityEvent {
    private $db;
    private $table_name = "activity_events";

    public $id;
    public $session_id;
    public $event_type;
    public $event_timestamp;
    public $metadata;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Create a new event
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (session_id, event_type, event_timestamp, metadata)
                  VALUES (:session_id, :event_type, :event_timestamp, :metadata)";

        $stmt = $this->db->prepare($query);

        // Bind values
        $stmt->bindParam(':session_id', $this->session_id);
        $stmt->bindParam(':event_type', $this->event_type);
        $stmt->bindParam(':event_timestamp', $this->event_timestamp);
        $stmt->bindParam(':metadata', $this->metadata);

        return $stmt->execute();
    }

    /**
     * Batch insert events (more efficient)
     * @param array $events Array of event objects
     * @return bool
     */
    public function batchCreate($events) {
        if (empty($events)) {
            return false;
        }

        $placeholders = [];
        $values = [];

        foreach ($events as $event) {
            $placeholders[] = "(?, ?, ?, ?)";
            $values[] = $event['session_id'];
            $values[] = $event['event_type'];
            $values[] = $event['event_timestamp'];
            $values[] = json_encode($event['metadata']);
        }

        $query = "INSERT INTO " . $this->table_name . "
                  (session_id, event_type, event_timestamp, metadata)
                  VALUES " . implode(', ', $placeholders);

        try {
            $stmt = $this->db->prepare($query);
            return $stmt->execute($values);
        } catch (PDOException $e) {
            error_log("Batch insert error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get events for a session
     * @param int $sessionId
     * @param int $limit
     * @return array
     */
    public function getBySession($sessionId, $limit = 1000) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE session_id = :session_id
                  ORDER BY event_timestamp DESC
                  LIMIT :limit";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get last event for a session
     * @param int $sessionId
     * @return array|false
     */
    public function getLastEvent($sessionId) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE session_id = :session_id
                  ORDER BY event_timestamp DESC
                  LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get events within time range
     * @param int $sessionId
     * @param string $startTime
     * @param string $endTime
     * @return array
     */
    public function getEventsByTimeRange($sessionId, $startTime, $endTime) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE session_id = :session_id
                    AND event_timestamp BETWEEN :start_time AND :end_time
                  ORDER BY event_timestamp ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':start_time', $startTime);
        $stmt->bindParam(':end_time', $endTime);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate activity intensity for time window
     * @param int $sessionId
     * @param int $windowSeconds Duration of window in seconds
     * @return array
     */
    public function calculateActivityIntensity($sessionId, $windowSeconds = 60) {
        $query = "SELECT
                    DATE_FORMAT(event_timestamp, '%Y-%m-%d %H:%i:00') as minute,
                    COUNT(*) as total_events,
                    SUM(CASE WHEN event_type = 'mouse_move' THEN 1 ELSE 0 END) as mouse_events,
                    SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as click_events,
                    SUM(CASE WHEN event_type = 'keypress' THEN 1 ELSE 0 END) as keypress_events,
                    SUM(CASE WHEN event_type = 'scroll' THEN 1 ELSE 0 END) as scroll_events,
                    SUM(CASE WHEN event_type IN ('focus', 'blur') THEN 1 ELSE 0 END) as focus_changes
                  FROM " . $this->table_name . "
                  WHERE session_id = :session_id
                  GROUP BY minute
                  ORDER BY minute DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Detect inactivity gaps
     * @param int $sessionId
     * @param int $minGapSeconds Minimum gap in seconds to detect
     * @return array
     */
    public function detectInactivityGaps($sessionId, $minGapSeconds = 10) {
        $query = "SELECT
                    e1.event_timestamp as gap_start,
                    e2.event_timestamp as gap_end,
                    TIMESTAMPDIFF(SECOND, e1.event_timestamp, e2.event_timestamp) as gap_duration
                  FROM " . $this->table_name . " e1
                  INNER JOIN " . $this->table_name . " e2
                    ON e1.session_id = e2.session_id
                    AND e2.id = (
                        SELECT MIN(id)
                        FROM " . $this->table_name . "
                        WHERE session_id = e1.session_id
                          AND event_timestamp > e1.event_timestamp
                    )
                  WHERE e1.session_id = :session_id
                    AND TIMESTAMPDIFF(SECOND, e1.event_timestamp, e2.event_timestamp) >= :min_gap
                  ORDER BY e1.event_timestamp";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':min_gap', $minGapSeconds);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get event count by type
     * @param int $sessionId
     * @return array
     */
    public function getEventCountByType($sessionId) {
        $query = "SELECT
                    event_type,
                    COUNT(*) as count
                  FROM " . $this->table_name . "
                  WHERE session_id = :session_id
                  GROUP BY event_type
                  ORDER BY count DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Delete old events (cleanup)
     * @param int $daysOld
     * @return int Number of deleted rows
     */
    public function deleteOldEvents($daysOld = 90) {
        $query = "DELETE FROM " . $this->table_name . "
                  WHERE event_timestamp < DATE_SUB(NOW(), INTERVAL :days DAY)";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':days', $daysOld);
        $stmt->execute();

        return $stmt->rowCount();
    }
}
