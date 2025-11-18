<?php
/**
 * Solution Model
 */

require_once __DIR__ . '/BaseModel.php';

class Solution extends BaseModel {
    protected $table = 'solutions';

    /**
     * Get solutions by problem ID
     */
    public function getByProblem($problemId) {
        return $this->where(['problem_id' => $problemId]);
    }

    /**
     * Get correct solution for a problem
     */
    public function getCorrectSolution($problemId) {
        return $this->where(['problem_id' => $problemId, 'solution_type' => 'correct'], 1);
    }

    /**
     * Get incorrect solutions for a problem
     */
    public function getIncorrectSolutions($problemId) {
        return $this->where(['problem_id' => $problemId, 'solution_type' => 'incorrect']);
    }

    /**
     * Get a random incorrect solution
     */
    public function getRandomIncorrect($problemId) {
        $sql = "SELECT * FROM {$this->table}
                WHERE problem_id = ? AND solution_type = 'incorrect'
                ORDER BY RAND() LIMIT 1";

        $stmt = $this->query($sql, [$problemId]);
        return $stmt->fetch();
    }

    /**
     * Create solution with JSON validation
     */
    public function createSolution(array $data) {
        // Ensure steps is JSON
        if (isset($data['steps']) && is_array($data['steps'])) {
            $data['steps'] = json_encode($data['steps']);
        }

        return $this->create($data);
    }

    /**
     * Get solution comparison pair (1 correct, 1 incorrect)
     */
    public function getComparisonPair($problemId) {
        $correct = $this->getCorrectSolution($problemId);
        $incorrect = $this->getRandomIncorrect($problemId);

        if (!$correct || !$incorrect) {
            return null;
        }

        // Decode JSON fields
        $correct['steps'] = json_decode($correct['steps'], true);
        $incorrect['steps'] = json_decode($incorrect['steps'], true);

        // Randomly shuffle order (so correct isn't always first)
        $solutions = [$correct, $incorrect];
        shuffle($solutions);

        return [
            'solution_a' => $solutions[0],
            'solution_b' => $solutions[1],
            'correct_id' => $correct['id']
        ];
    }

    /**
     * Get solutions by mistake type
     */
    public function getByMistakeType($mistakeType) {
        return $this->where(['mistake_type' => $mistakeType, 'solution_type' => 'incorrect']);
    }

    /**
     * Update solution with feedback
     */
    public function updateSolution($id, array $data) {
        if (isset($data['steps']) && is_array($data['steps'])) {
            $data['steps'] = json_encode($data['steps']);
        }

        return $this->update($id, $data);
    }

    /**
     * Get solution statistics
     */
    public function getStats($solutionId) {
        $sql = "
            SELECT
                s.id,
                s.solution_type,
                s.mistake_type,
                COUNT(sa.id) as times_shown,
                SUM(CASE WHEN sa.selected_solution_id = s.id THEN 1 ELSE 0 END) as times_selected,
                ROUND(
                    SUM(CASE WHEN sa.selected_solution_id = s.id THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(COUNT(sa.id), 0),
                    2
                ) as selection_rate
            FROM solutions s
            LEFT JOIN student_attempts sa ON
                (sa.correct_solution_id = s.id OR sa.incorrect_solution_id = s.id)
            WHERE s.id = ?
            GROUP BY s.id
        ";

        $stmt = $this->query($sql, [$solutionId]);
        return $stmt->fetch();
    }
}
