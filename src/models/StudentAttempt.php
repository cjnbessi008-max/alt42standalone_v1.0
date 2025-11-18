<?php
/**
 * StudentAttempt Model
 */

require_once __DIR__ . '/BaseModel.php';

class StudentAttempt extends BaseModel {
    protected $table = 'student_attempts';

    /**
     * Get attempts by student
     */
    public function getByStudent($studentId, $limit = null, $offset = 0) {
        $sql = "SELECT * FROM {$this->table} WHERE student_id = ? ORDER BY attempted_at DESC";

        if ($limit) {
            $sql .= " LIMIT ? OFFSET ?";
            $stmt = $this->query($sql, [$studentId, $limit, $offset]);
        } else {
            $stmt = $this->query($sql, [$studentId]);
        }

        return $stmt->fetchAll();
    }

    /**
     * Get attempts by problem
     */
    public function getByProblem($problemId) {
        return $this->where(['problem_id' => $problemId]);
    }

    /**
     * Get student's attempts for specific problem
     */
    public function getStudentProblemAttempts($studentId, $problemId) {
        $sql = "SELECT * FROM {$this->table}
                WHERE student_id = ? AND problem_id = ?
                ORDER BY attempt_number ASC";

        $stmt = $this->query($sql, [$studentId, $problemId]);
        return $stmt->fetchAll();
    }

    /**
     * Record new attempt
     */
    public function recordAttempt(array $data) {
        // Get attempt number for this student-problem combination
        $attemptNumber = $this->getNextAttemptNumber($data['student_id'], $data['problem_id']);
        $data['attempt_number'] = $attemptNumber;

        // Determine if correct
        $data['is_correct'] = ($data['selected_solution_id'] == $data['correct_solution_id']) ? 1 : 0;

        $attemptId = $this->create($data);

        // Update student progress
        $this->updateStudentProgress($data['student_id']);

        return $attemptId;
    }

    /**
     * Get next attempt number
     */
    private function getNextAttemptNumber($studentId, $problemId) {
        $sql = "SELECT MAX(attempt_number) as max_attempt
                FROM {$this->table}
                WHERE student_id = ? AND problem_id = ?";

        $stmt = $this->query($sql, [$studentId, $problemId]);
        $result = $stmt->fetch();

        return ($result['max_attempt'] ?? 0) + 1;
    }

    /**
     * Update student progress
     */
    private function updateStudentProgress($studentId) {
        $sql = "
            INSERT INTO student_progress (
                student_id,
                total_attempts,
                correct_identifications,
                accuracy_rate,
                average_time_seconds
            )
            SELECT
                student_id,
                COUNT(*) as total_attempts,
                SUM(is_correct) as correct_identifications,
                ROUND(AVG(is_correct) * 100, 2) as accuracy_rate,
                ROUND(AVG(time_spent_seconds), 0) as average_time_seconds
            FROM student_attempts
            WHERE student_id = ?
            GROUP BY student_id
            ON DUPLICATE KEY UPDATE
                total_attempts = VALUES(total_attempts),
                correct_identifications = VALUES(correct_identifications),
                accuracy_rate = VALUES(accuracy_rate),
                average_time_seconds = VALUES(average_time_seconds),
                last_activity = CURRENT_TIMESTAMP
        ";

        $this->query($sql, [$studentId]);
    }

    /**
     * Get student statistics
     */
    public function getStudentStats($studentId) {
        $sql = "
            SELECT
                COUNT(*) as total_attempts,
                SUM(is_correct) as correct_identifications,
                ROUND(AVG(is_correct) * 100, 2) as accuracy_rate,
                ROUND(AVG(time_spent_seconds), 2) as avg_time_seconds,
                ROUND(AVG(hints_used), 2) as avg_hints_used,
                COUNT(DISTINCT problem_id) as unique_problems_attempted
            FROM {$this->table}
            WHERE student_id = ?
        ";

        $stmt = $this->query($sql, [$studentId]);
        return $stmt->fetch();
    }

    /**
     * Get student's performance by mistake type
     */
    public function getPerformanceByMistakeType($studentId) {
        $sql = "
            SELECT
                s.mistake_type,
                COUNT(sa.id) as attempts,
                SUM(sa.is_correct) as correct,
                ROUND(AVG(sa.is_correct) * 100, 2) as accuracy_rate
            FROM student_attempts sa
            JOIN solutions s ON sa.incorrect_solution_id = s.id
            WHERE sa.student_id = ?
            GROUP BY s.mistake_type
            ORDER BY accuracy_rate ASC
        ";

        $stmt = $this->query($sql, [$studentId]);
        return $stmt->fetchAll();
    }

    /**
     * Get recent attempts with details
     */
    public function getRecentWithDetails($studentId, $limit = 10) {
        $sql = "
            SELECT
                sa.*,
                p.title as problem_title,
                p.subject,
                p.difficulty_level,
                s_correct.title as correct_solution_title,
                s_incorrect.title as incorrect_solution_title,
                s_incorrect.mistake_type
            FROM student_attempts sa
            JOIN problems p ON sa.problem_id = p.id
            JOIN solutions s_correct ON sa.correct_solution_id = s_correct.id
            JOIN solutions s_incorrect ON sa.incorrect_solution_id = s_incorrect.id
            WHERE sa.student_id = ?
            ORDER BY sa.attempted_at DESC
            LIMIT ?
        ";

        $stmt = $this->query($sql, [$studentId, $limit]);
        return $stmt->fetchAll();
    }
}
