<?php
/**
 * Problem model
 */

class Problem {
    private $db;
    private $table = 'problems';

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get current active problem
     */
    public function getCurrent() {
        $query = "SELECT * FROM {$this->table}
                  WHERE status = 'active'
                  ORDER BY created_at DESC
                  LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->execute();

        $problem = $stmt->fetch();

        if ($problem) {
            // Decode JSON fields
            $problem['reasoning_steps'] = json_decode($problem['reasoning_steps'], true);
            return $problem;
        }

        return null;
    }

    /**
     * Save step validation result
     */
    public function saveStepValidation($problemId, $stepIndex, $isCorrect, $studentId) {
        $query = "INSERT INTO step_validations
                  (problem_id, step_index, is_correct, student_id, created_at)
                  VALUES (:problem_id, :step_index, :is_correct, :student_id, NOW())";

        $stmt = $this->db->prepare($query);

        return $stmt->execute([
            ':problem_id' => $problemId,
            ':step_index' => $stepIndex,
            ':is_correct' => $isCorrect ? 1 : 0,
            ':student_id' => $studentId
        ]);
    }

    /**
     * Create new problem
     */
    public function create($title, $description, $reasoningSteps, $moodleId = null) {
        $query = "INSERT INTO {$this->table}
                  (title, description, reasoning_steps, moodle_id, status, created_at)
                  VALUES (:title, :description, :reasoning_steps, :moodle_id, 'active', NOW())";

        $stmt = $this->db->prepare($query);

        return $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':reasoning_steps' => json_encode($reasoningSteps),
            ':moodle_id' => $moodleId
        ]);
    }
}
