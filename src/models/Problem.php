<?php
/**
 * Problem Model
 * Handles math problems created by teachers
 */

class Problem {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Create new problem
     */
    public function create($data) {
        return $this->db->insert('problems', [
            'teacher_id' => $data['teacher_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'problem_statement' => $data['problem_statement'],
            'correct_answer' => $data['correct_answer'],
            'problem_type' => $data['problem_type'] ?? 'arithmetic',
            'difficulty_level' => $data['difficulty_level'] ?? 1,
            'points' => $data['points'] ?? 10.00,
            'hints' => $data['hints'] ?? null,
            'grading_rubric' => isset($data['grading_rubric']) ? json_encode($data['grading_rubric']) : null,
            'requires_work_shown' => $data['requires_work_shown'] ?? 1,
            'requires_verification' => $data['requires_verification'] ?? 1,
            'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
            'active' => $data['active'] ?? 1
        ]);
    }

    /**
     * Get problem by ID
     */
    public function getById($id) {
        $sql = "SELECT p.*, u.full_name as teacher_name
                FROM problems p
                JOIN users u ON p.teacher_id = u.id
                WHERE p.id = :id";
        $problem = $this->db->fetchOne($sql, [':id' => $id]);

        if ($problem && $problem['grading_rubric']) {
            $problem['grading_rubric'] = json_decode($problem['grading_rubric'], true);
        }

        return $problem;
    }

    /**
     * Get all problems by teacher
     */
    public function getByTeacher($teacherId, $activeOnly = true) {
        $sql = "SELECT * FROM problems WHERE teacher_id = :teacher_id";
        if ($activeOnly) {
            $sql .= " AND active = 1";
        }
        $sql .= " ORDER BY created_at DESC";

        return $this->db->fetchAll($sql, [':teacher_id' => $teacherId]);
    }

    /**
     * Get all active problems
     */
    public function getAllActive() {
        $sql = "SELECT p.*, u.full_name as teacher_name
                FROM problems p
                JOIN users u ON p.teacher_id = u.id
                WHERE p.active = 1
                ORDER BY p.created_at DESC";
        return $this->db->fetchAll($sql);
    }

    /**
     * Update problem
     */
    public function update($id, $data) {
        $updateData = [];

        $allowedFields = [
            'title', 'description', 'problem_statement', 'correct_answer',
            'problem_type', 'difficulty_level', 'points', 'hints',
            'grading_rubric', 'requires_work_shown', 'requires_verification',
            'time_limit_minutes', 'active'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'grading_rubric' && is_array($data[$field])) {
                    $updateData[$field] = json_encode($data[$field]);
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }

        return $this->db->update('problems', $updateData, 'id = :id', [':id' => $id]);
    }

    /**
     * Delete (deactivate) problem
     */
    public function delete($id) {
        return $this->db->update('problems', ['active' => 0], 'id = :id', [':id' => $id]);
    }

    /**
     * Check answer correctness
     */
    public function checkAnswer($problemId, $studentAnswer) {
        $problem = $this->getById($problemId);
        if (!$problem) {
            return false;
        }

        // Normalize both answers for comparison
        $correctAnswer = $this->normalizeAnswer($problem['correct_answer']);
        $studentAnswerNorm = $this->normalizeAnswer($studentAnswer);

        return $correctAnswer === $studentAnswerNorm;
    }

    /**
     * Normalize answer for comparison
     */
    private function normalizeAnswer($answer) {
        // Remove whitespace
        $answer = preg_replace('/\s+/', '', $answer);

        // Convert to lowercase
        $answer = strtolower($answer);

        // Try to evaluate as numeric
        if (is_numeric($answer)) {
            return floatval($answer);
        }

        return $answer;
    }

    /**
     * Get problem statistics
     */
    public function getStatistics($problemId) {
        $sql = "SELECT
                    COUNT(*) as total_submissions,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_submissions,
                    AVG(score) as avg_score,
                    AVG(time_spent_seconds) as avg_time_seconds
                FROM student_submissions
                WHERE problem_id = :problem_id AND status = 'graded'";

        return $this->db->fetchOne($sql, [':problem_id' => $problemId]);
    }
}
