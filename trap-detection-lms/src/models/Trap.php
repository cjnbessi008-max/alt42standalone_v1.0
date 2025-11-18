<?php
/**
 * Trap Model
 * Handles trap detection and management
 * Trap Detection LMS
 */

require_once __DIR__ . '/Database.php';

class Trap {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get trap by ID
     */
    public function findById($id) {
        $sql = "SELECT * FROM traps WHERE id = ?";
        return $this->db->fetchOne($sql, [$id]);
    }

    /**
     * Get all active traps for a question
     */
    public function getByQuestionId($questionId) {
        $sql = "SELECT t.*, qo.option_text,
                COUNT(DISTINCT ti.id) as incident_count,
                COUNT(DISTINCT ti.student_id) as affected_students
                FROM traps t
                LEFT JOIN question_options qo ON t.option_id = qo.id
                LEFT JOIN trap_incidents ti ON t.id = ti.trap_id
                WHERE t.question_id = ? AND t.is_active = 1
                GROUP BY t.id
                ORDER BY t.severity DESC, incident_count DESC";

        return $this->db->fetchAll($sql, [$questionId]);
    }

    /**
     * Create new trap
     */
    public function create($data) {
        $sql = "INSERT INTO traps (
            question_id, option_id, trap_type, trap_description,
            explanation, hint, severity, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $data['question_id'],
            $data['option_id'] ?? null,
            $data['trap_type'] ?? 'conceptual',
            $data['trap_description'],
            $data['explanation'],
            $data['hint'] ?? null,
            $data['severity'] ?? 'medium',
            $data['created_by'] ?? null,
        ];

        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * Update trap
     */
    public function update($id, $data) {
        $fields = [];
        $params = [];

        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $fields[] = "$key = ?";
                $params[] = $value;
            }
        }

        $params[] = $id;
        $sql = "UPDATE traps SET " . implode(', ', $fields) . " WHERE id = ?";

        return $this->db->execute($sql, $params);
    }

    /**
     * Increment detection count
     */
    public function incrementDetectionCount($trapId) {
        $sql = "UPDATE traps SET detection_count = detection_count + 1 WHERE id = ?";
        return $this->db->execute($sql, [$trapId]);
    }

    /**
     * Get trap with full details (including interventions)
     */
    public function getWithInterventions($id) {
        $trap = $this->findById($id);
        if (!$trap) {
            return null;
        }

        $sql = "SELECT * FROM interventions
                WHERE trap_id = ? AND is_active = 1
                ORDER BY effectiveness_score DESC, intervention_type";

        $trap['interventions'] = $this->db->fetchAll($sql, [$id]);

        return $trap;
    }

    /**
     * Auto-detect traps based on student attempt patterns
     */
    public function autoDetectTraps($questionId, $config = []) {
        $minAttempts = $config['min_attempts'] ?? 5;
        $occurrenceThreshold = $config['occurrence_threshold'] ?? 0.30;

        // Find frequently selected wrong answers
        $sql = "SELECT
                    sa.selected_option_id,
                    qo.option_text,
                    COUNT(*) as selection_count,
                    COUNT(DISTINCT sa.student_id) as unique_students,
                    (SELECT COUNT(DISTINCT student_id)
                     FROM student_attempts
                     WHERE question_id = ?) as total_students
                FROM student_attempts sa
                JOIN question_options qo ON sa.selected_option_id = qo.id
                WHERE sa.question_id = ?
                  AND sa.is_correct = 0
                  AND sa.selected_option_id IS NOT NULL
                GROUP BY sa.selected_option_id
                HAVING selection_count >= ?";

        $results = $this->db->fetchAll($sql, [$questionId, $questionId, $minAttempts]);

        $detectedTraps = [];

        foreach ($results as $result) {
            $occurrenceRate = $result['unique_students'] / max($result['total_students'], 1);

            if ($occurrenceRate >= $occurrenceThreshold) {
                // Check if trap already exists for this option
                $existingTrap = $this->db->fetchOne(
                    "SELECT id FROM traps WHERE question_id = ? AND option_id = ?",
                    [$questionId, $result['selected_option_id']]
                );

                if (!$existingTrap) {
                    // Create new trap
                    $trapData = [
                        'question_id' => $questionId,
                        'option_id' => $result['selected_option_id'],
                        'trap_type' => 'conceptual',
                        'trap_description' => "많은 학생들이 이 선택지를 선택했습니다 (" . round($occurrenceRate * 100, 1) . "%)",
                        'explanation' => "이 답은 일반적인 오개념입니다. 다시 한번 문제를 확인해보세요.",
                        'severity' => $this->calculateSeverity($occurrenceRate),
                        'created_by' => null,
                    ];

                    $trapId = $this->create($trapData);
                    $detectedTraps[] = $trapId;
                }
            }
        }

        return $detectedTraps;
    }

    /**
     * Calculate severity based on occurrence rate
     */
    private function calculateSeverity($occurrenceRate) {
        if ($occurrenceRate >= 0.60) return 'critical';
        if ($occurrenceRate >= 0.45) return 'high';
        if ($occurrenceRate >= 0.30) return 'medium';
        return 'low';
    }

    /**
     * Get trap statistics
     */
    public function getStatistics($trapId) {
        $sql = "SELECT
                    COUNT(ti.id) as total_incidents,
                    COUNT(DISTINCT ti.student_id) as unique_students,
                    SUM(CASE WHEN ti.was_resolved = 1 THEN 1 ELSE 0 END) as resolved_count,
                    AVG(ti.resolution_time_seconds) as avg_resolution_time,
                    AVG(ti.feedback_rating) as avg_feedback_rating
                FROM trap_incidents ti
                WHERE ti.trap_id = ?";

        return $this->db->fetchOne($sql, [$trapId]);
    }

    /**
     * Get most common traps (across all questions)
     */
    public function getMostCommonTraps($limit = 10, $filters = []) {
        $sql = "SELECT t.*, q.question_text, q.topic,
                COUNT(DISTINCT ti.id) as incident_count,
                COUNT(DISTINCT ti.student_id) as affected_students
                FROM traps t
                JOIN questions q ON t.question_id = q.id
                LEFT JOIN trap_incidents ti ON t.id = ti.trap_id
                WHERE t.is_active = 1";

        $params = [];

        if (!empty($filters['trap_type'])) {
            $sql .= " AND t.trap_type = ?";
            $params[] = $filters['trap_type'];
        }

        if (!empty($filters['severity'])) {
            $sql .= " AND t.severity = ?";
            $params[] = $filters['severity'];
        }

        if (!empty($filters['topic'])) {
            $sql .= " AND q.topic = ?";
            $params[] = $filters['topic'];
        }

        $sql .= " GROUP BY t.id
                  HAVING incident_count > 0
                  ORDER BY incident_count DESC, affected_students DESC
                  LIMIT ?";

        $params[] = $limit;

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Delete trap
     */
    public function delete($id) {
        $sql = "DELETE FROM traps WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }

    /**
     * Deactivate trap (soft delete)
     */
    public function deactivate($id) {
        $sql = "UPDATE traps SET is_active = 0 WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
}
