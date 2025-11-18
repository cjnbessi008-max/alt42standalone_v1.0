<?php
/**
 * Student model
 */

class Student {
    private $db;
    private $table = 'students';

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get student progress
     */
    public function getProgress($studentId) {
        $query = "SELECT
                    p.id as problem_id,
                    p.title,
                    COUNT(sv.id) as total_attempts,
                    SUM(CASE WHEN sv.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    MAX(sv.created_at) as last_attempt
                  FROM problems p
                  LEFT JOIN step_validations sv ON p.id = sv.problem_id
                  WHERE sv.student_id = :student_id
                  GROUP BY p.id, p.title
                  ORDER BY last_attempt DESC";

        $stmt = $this->db->prepare($query);
        $stmt->execute([':student_id' => $studentId]);

        return $stmt->fetchAll();
    }

    /**
     * Get student by ID
     */
    public function getById($studentId) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $studentId]);

        return $stmt->fetch();
    }
}
