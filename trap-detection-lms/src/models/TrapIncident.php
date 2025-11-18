<?php
/**
 * Trap Incident Model
 * Records when students fall into traps
 * Trap Detection LMS
 */

require_once __DIR__ . '/Database.php';

class TrapIncident {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Record trap incident
     */
    public function recordIncident($data) {
        $sql = "INSERT INTO trap_incidents (
            trap_id, student_id, attempt_id, help_requested
        ) VALUES (?, ?, ?, ?)";

        $params = [
            $data['trap_id'],
            $data['student_id'],
            $data['attempt_id'],
            $data['help_requested'] ?? 0,
        ];

        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * Mark incident as resolved
     */
    public function markResolved($incidentId, $resolutionTimeSeconds = null, $feedbackRating = null) {
        $sql = "UPDATE trap_incidents
                SET was_resolved = 1,
                    resolution_time_seconds = ?,
                    feedback_rating = ?,
                    resolved_at = NOW()
                WHERE id = ?";

        return $this->db->execute($sql, [$resolutionTimeSeconds, $feedbackRating, $incidentId]);
    }

    /**
     * Get incidents by student
     */
    public function getByStudent($studentId, $includeResolved = true) {
        $sql = "SELECT ti.*, t.trap_description, t.explanation, t.trap_type,
                q.question_text, q.topic
                FROM trap_incidents ti
                JOIN traps t ON ti.trap_id = t.id
                JOIN questions q ON t.question_id = q.id
                WHERE ti.student_id = ?";

        $params = [$studentId];

        if (!$includeResolved) {
            $sql .= " AND ti.was_resolved = 0";
        }

        $sql .= " ORDER BY ti.created_at DESC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get active (unresolved) incidents for student
     */
    public function getActiveIncidents($studentId) {
        return $this->getByStudent($studentId, false);
    }

    /**
     * Get incidents by trap
     */
    public function getByTrap($trapId, $limit = 50) {
        $sql = "SELECT ti.*, u.username, u.full_name
                FROM trap_incidents ti
                JOIN users u ON ti.student_id = u.id
                WHERE ti.trap_id = ?
                ORDER BY ti.created_at DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$trapId, $limit]);
    }

    /**
     * Get incident by ID
     */
    public function findById($id) {
        $sql = "SELECT * FROM trap_incidents WHERE id = ?";
        return $this->db->fetchOne($sql, [$id]);
    }

    /**
     * Get student trap incident statistics
     */
    public function getStudentStats($studentId) {
        $sql = "SELECT
                    COUNT(*) as total_incidents,
                    SUM(CASE WHEN was_resolved = 1 THEN 1 ELSE 0 END) as resolved_count,
                    SUM(CASE WHEN was_resolved = 0 THEN 1 ELSE 0 END) as unresolved_count,
                    AVG(resolution_time_seconds) as avg_resolution_time,
                    AVG(feedback_rating) as avg_feedback_rating,
                    COUNT(DISTINCT trap_id) as unique_traps_encountered
                FROM trap_incidents
                WHERE student_id = ?";

        return $this->db->fetchOne($sql, [$studentId]);
    }

    /**
     * Get recent trap incidents (for dashboard)
     */
    public function getRecentIncidents($limit = 20, $filters = []) {
        $sql = "SELECT ti.*, t.trap_description, t.trap_type, t.severity,
                u.username, u.full_name, q.question_text, q.topic
                FROM trap_incidents ti
                JOIN traps t ON ti.trap_id = t.id
                JOIN users u ON ti.student_id = u.id
                JOIN questions q ON t.question_id = q.id
                WHERE 1=1";

        $params = [];

        if (!empty($filters['trap_type'])) {
            $sql .= " AND t.trap_type = ?";
            $params[] = $filters['trap_type'];
        }

        if (!empty($filters['severity'])) {
            $sql .= " AND t.severity = ?";
            $params[] = $filters['severity'];
        }

        if (!empty($filters['resolved'])) {
            $sql .= " AND ti.was_resolved = ?";
            $params[] = $filters['resolved'] ? 1 : 0;
        }

        if (!empty($filters['date_from'])) {
            $sql .= " AND ti.created_at >= ?";
            $params[] = $filters['date_from'];
        }

        $sql .= " ORDER BY ti.created_at DESC LIMIT ?";
        $params[] = $limit;

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Request help for incident
     */
    public function requestHelp($incidentId) {
        $sql = "UPDATE trap_incidents SET help_requested = 1 WHERE id = ?";
        return $this->db->execute($sql, [$incidentId]);
    }

    /**
     * Get help requests
     */
    public function getHelpRequests($resolved = false) {
        $sql = "SELECT ti.*, t.trap_description, t.explanation,
                u.username, u.full_name, q.question_text
                FROM trap_incidents ti
                JOIN traps t ON ti.trap_id = t.id
                JOIN users u ON ti.student_id = u.id
                JOIN questions q ON t.question_id = q.id
                WHERE ti.help_requested = 1 AND ti.was_resolved = ?
                ORDER BY ti.created_at ASC";

        return $this->db->fetchAll($sql, [$resolved ? 1 : 0]);
    }

    /**
     * Delete incident
     */
    public function delete($id) {
        $sql = "DELETE FROM trap_incidents WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
}
