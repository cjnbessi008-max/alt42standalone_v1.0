<?php
/**
 * Problem Model
 * Handles database operations for problems
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/EquationSolver.php';

class Problem {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new problem
     */
    public function create($moodleQuestionId, $equationText, $difficulty = 'medium') {
        try {
            // Insert problem
            $stmt = $this->db->prepare("
                INSERT INTO problems (moodle_question_id, equation_text, difficulty_level)
                VALUES (:moodle_id, :equation, :difficulty)
            ");

            $stmt->execute([
                'moodle_id' => $moodleQuestionId,
                'equation' => $equationText,
                'difficulty' => $difficulty
            ]);

            $problemId = $this->db->lastInsertId();

            // Generate solution steps
            $solver = new EquationSolver($equationText);
            $steps = $solver->solve();

            // Insert solution steps
            $this->insertSteps($problemId, $steps);

            return $problemId;
        } catch (PDOException $e) {
            error_log("Error creating problem: " . $e->getMessage());
            throw new Exception("Failed to create problem");
        }
    }

    /**
     * Insert solution steps
     */
    private function insertSteps($problemId, $steps) {
        $stmt = $this->db->prepare("
            INSERT INTO solution_steps
            (problem_id, step_number, step_description, step_equation, step_type, hint_text)
            VALUES (:problem_id, :step_number, :description, :equation, :type, :hint)
        ");

        foreach ($steps as $step) {
            $stmt->execute([
                'problem_id' => $problemId,
                'step_number' => $step['step_number'],
                'description' => $step['step_description'],
                'equation' => $step['step_equation'],
                'type' => $step['step_type'],
                'hint' => $step['hint_text']
            ]);
        }
    }

    /**
     * Get problem by ID
     */
    public function getById($problemId) {
        $stmt = $this->db->prepare("
            SELECT * FROM problems WHERE id = :id
        ");
        $stmt->execute(['id' => $problemId]);
        return $stmt->fetch();
    }

    /**
     * Get problem by Moodle question ID
     */
    public function getByMoodleId($moodleQuestionId) {
        $stmt = $this->db->prepare("
            SELECT * FROM problems WHERE moodle_question_id = :moodle_id
        ");
        $stmt->execute(['moodle_id' => $moodleQuestionId]);
        return $stmt->fetch();
    }

    /**
     * Get all solution steps for a problem
     */
    public function getSteps($problemId) {
        $stmt = $this->db->prepare("
            SELECT * FROM solution_steps
            WHERE problem_id = :problem_id
            ORDER BY step_number ASC
        ");
        $stmt->execute(['problem_id' => $problemId]);
        return $stmt->fetchAll();
    }

    /**
     * Get specific step
     */
    public function getStep($problemId, $stepNumber) {
        $stmt = $this->db->prepare("
            SELECT * FROM solution_steps
            WHERE problem_id = :problem_id AND step_number = :step_number
        ");
        $stmt->execute([
            'problem_id' => $problemId,
            'step_number' => $stepNumber
        ]);
        return $stmt->fetch();
    }

    /**
     * Get all problems
     */
    public function getAll($limit = 50, $offset = 0) {
        $stmt = $this->db->prepare("
            SELECT * FROM problems
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Delete problem
     */
    public function delete($problemId) {
        $stmt = $this->db->prepare("DELETE FROM problems WHERE id = :id");
        return $stmt->execute(['id' => $problemId]);
    }
}
