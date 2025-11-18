<?php
/**
 * Student Attempt Model
 * Tracks student answers and attempts
 * Trap Detection LMS
 */

require_once __DIR__ . '/Database.php';

class StudentAttempt {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Record student attempt
     */
    public function recordAttempt($data) {
        $sql = "INSERT INTO student_attempts (
            student_id, question_id, selected_option_id, answer_text,
            is_correct, time_spent_seconds, attempt_number, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $data['student_id'],
            $data['question_id'],
            $data['selected_option_id'] ?? null,
            $data['answer_text'] ?? null,
            $data['is_correct'] ? 1 : 0,
            $data['time_spent_seconds'] ?? 0,
            $data['attempt_number'] ?? 1,
            $data['session_id'] ?? null,
        ];

        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * Get attempts by student
     */
    public function getByStudent($studentId, $limit = 50) {
        $sql = "SELECT sa.*, q.question_text, q.topic, qo.option_text
                FROM student_attempts sa
                JOIN questions q ON sa.question_id = q.id
                LEFT JOIN question_options qo ON sa.selected_option_id = qo.id
                WHERE sa.student_id = ?
                ORDER BY sa.attempted_at DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$studentId, $limit]);
    }

    /**
     * Get attempts for a question
     */
    public function getByQuestion($questionId, $limit = 100) {
        $sql = "SELECT sa.*, u.username, u.full_name
                FROM student_attempts sa
                JOIN users u ON sa.student_id = u.id
                WHERE sa.question_id = ?
                ORDER BY sa.attempted_at DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$questionId, $limit]);
    }

    /**
     * Get student's attempt for a specific question
     */
    public function getStudentQuestionAttempts($studentId, $questionId) {
        $sql = "SELECT * FROM student_attempts
                WHERE student_id = ? AND question_id = ?
                ORDER BY attempted_at DESC";

        return $this->db->fetchAll($sql, [$studentId, $questionId]);
    }

    /**
     * Get latest attempt for student and question
     */
    public function getLatestAttempt($studentId, $questionId) {
        $sql = "SELECT * FROM student_attempts
                WHERE student_id = ? AND question_id = ?
                ORDER BY attempted_at DESC
                LIMIT 1";

        return $this->db->fetchOne($sql, [$studentId, $questionId]);
    }

    /**
     * Get attempt count for student
     */
    public function getAttemptCount($studentId, $questionId) {
        $sql = "SELECT COUNT(*) as count FROM student_attempts
                WHERE student_id = ? AND question_id = ?";

        $result = $this->db->fetchOne($sql, [$studentId, $questionId]);
        return $result['count'] ?? 0;
    }

    /**
     * Get student performance statistics
     */
    public function getStudentStats($studentId, $filters = []) {
        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
                    AVG(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100 as accuracy_rate,
                    AVG(time_spent_seconds) as avg_time_spent,
                    COUNT(DISTINCT question_id) as unique_questions
                FROM student_attempts
                WHERE student_id = ?";

        $params = [$studentId];

        if (!empty($filters['date_from'])) {
            $sql .= " AND attempted_at >= ?";
            $params[] = $filters['date_from'];
        }

        if (!empty($filters['date_to'])) {
            $sql .= " AND attempted_at <= ?";
            $params[] = $filters['date_to'];
        }

        return $this->db->fetchOne($sql, $params);
    }

    /**
     * Get question performance statistics
     */
    public function getQuestionStats($questionId) {
        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    COUNT(DISTINCT student_id) as unique_students,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
                    AVG(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100 as accuracy_rate,
                    AVG(time_spent_seconds) as avg_time_spent,
                    AVG(attempt_number) as avg_attempts_per_student
                FROM student_attempts
                WHERE question_id = ?";

        return $this->db->fetchOne($sql, [$questionId]);
    }

    /**
     * Check if attempt triggered a trap
     */
    public function checkForTraps($attemptId) {
        $sql = "SELECT sa.*, t.id as trap_id, t.trap_description, t.explanation, t.hint
                FROM student_attempts sa
                JOIN traps t ON sa.question_id = t.question_id
                    AND (sa.selected_option_id = t.option_id OR t.option_id IS NULL)
                WHERE sa.id = ? AND sa.is_correct = 0 AND t.is_active = 1";

        return $this->db->fetchAll($sql, [$attemptId]);
    }

    /**
     * Get students who fell into a specific trap
     */
    public function getStudentsInTrap($trapId, $limit = 50) {
        $sql = "SELECT u.id, u.username, u.full_name,
                COUNT(sa.id) as fall_count,
                MAX(sa.attempted_at) as last_fall_date
                FROM student_attempts sa
                JOIN users u ON sa.student_id = u.id
                JOIN traps t ON sa.question_id = t.question_id
                    AND (sa.selected_option_id = t.option_id OR t.option_id IS NULL)
                WHERE t.id = ? AND sa.is_correct = 0
                GROUP BY u.id
                ORDER BY fall_count DESC, last_fall_date DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$trapId, $limit]);
    }

    /**
     * Get answer distribution for a question
     */
    public function getAnswerDistribution($questionId) {
        $sql = "SELECT
                    qo.id as option_id,
                    qo.option_text,
                    qo.is_correct,
                    COUNT(sa.id) as selection_count,
                    COUNT(DISTINCT sa.student_id) as unique_students,
                    (COUNT(sa.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM student_attempts WHERE question_id = ?), 0)) as percentage
                FROM question_options qo
                LEFT JOIN student_attempts sa ON qo.id = sa.selected_option_id
                WHERE qo.question_id = ?
                GROUP BY qo.id
                ORDER BY qo.option_order";

        return $this->db->fetchAll($sql, [$questionId, $questionId]);
    }

    /**
     * Delete attempt
     */
    public function delete($id) {
        $sql = "DELETE FROM student_attempts WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
}
