<?php
/**
 * Fraction Problem Model
 */

class FractionProblem {
    private $conn;
    private $table_name = "fraction_problems";

    public $id;
    public $problem_type;
    public $numerator_1;
    public $denominator_1;
    public $numerator_2;
    public $denominator_2;
    public $visual_type;
    public $difficulty_level;
    public $recommended_for_pattern;
    public $answer_numerator;
    public $answer_denominator;
    public $problem_text;
    public $hint_visual;
    public $hint_analytical;
    public $hint_experimental;
    public $created_by;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all problems
     */
    public function getAll($filters = []) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE 1=1";

        if (isset($filters['difficulty'])) {
            $query .= " AND difficulty_level = :difficulty";
        }

        if (isset($filters['problem_type'])) {
            $query .= " AND problem_type = :problem_type";
        }

        if (isset($filters['pattern'])) {
            $query .= " AND (recommended_for_pattern = :pattern OR recommended_for_pattern = 'all')";
        }

        $query .= " ORDER BY difficulty_level, id";

        $stmt = $this->conn->prepare($query);

        if (isset($filters['difficulty'])) {
            $stmt->bindParam(':difficulty', $filters['difficulty']);
        }

        if (isset($filters['problem_type'])) {
            $stmt->bindParam(':problem_type', $filters['problem_type']);
        }

        if (isset($filters['pattern'])) {
            $stmt->bindParam(':pattern', $filters['pattern']);
        }

        $stmt->execute();
        return $stmt;
    }

    /**
     * Get problem by ID
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get problems for specific pattern and difficulty
     */
    public function getByPatternAndDifficulty($pattern, $difficulty) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE (recommended_for_pattern = :pattern OR recommended_for_pattern = 'all')
                  AND difficulty_level = :difficulty
                  ORDER BY RAND()
                  LIMIT 5";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':pattern', $pattern);
        $stmt->bindParam(':difficulty', $difficulty);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Check if answer is correct
     */
    public function checkAnswer($problem_id, $answer_num, $answer_den) {
        $problem = $this->getById($problem_id);

        if (!$problem) {
            return false;
        }

        // Simplify both fractions for comparison
        $correct_simplified = $this->simplifyFraction($problem['answer_numerator'], $problem['answer_denominator']);
        $student_simplified = $this->simplifyFraction($answer_num, $answer_den);

        return ($correct_simplified['numerator'] == $student_simplified['numerator'] &&
                $correct_simplified['denominator'] == $student_simplified['denominator']);
    }

    /**
     * Simplify fraction to lowest terms
     */
    private function simplifyFraction($numerator, $denominator) {
        $gcd = $this->gcd(abs($numerator), abs($denominator));

        return [
            'numerator' => $numerator / $gcd,
            'denominator' => $denominator / $gcd
        ];
    }

    /**
     * Calculate GCD (Greatest Common Divisor)
     */
    private function gcd($a, $b) {
        return ($b == 0) ? $a : $this->gcd($b, $a % $b);
    }

    /**
     * Get hint for specific learning pattern
     */
    public function getHint($problem_id, $pattern) {
        $problem = $this->getById($problem_id);

        if (!$problem) {
            return null;
        }

        switch ($pattern) {
            case 'visual':
                return $problem['hint_visual'];
            case 'analytical':
                return $problem['hint_analytical'];
            case 'experimental':
                return $problem['hint_experimental'];
            default:
                return $problem['hint_analytical']; // Default to analytical
        }
    }

    /**
     * Create new problem
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (problem_type, numerator_1, denominator_1, numerator_2, denominator_2,
                   visual_type, difficulty_level, recommended_for_pattern,
                   answer_numerator, answer_denominator, problem_text,
                   hint_visual, hint_analytical, hint_experimental, created_by)
                  VALUES
                  (:problem_type, :numerator_1, :denominator_1, :numerator_2, :denominator_2,
                   :visual_type, :difficulty_level, :recommended_for_pattern,
                   :answer_numerator, :answer_denominator, :problem_text,
                   :hint_visual, :hint_analytical, :hint_experimental, :created_by)";

        $stmt = $this->conn->prepare($query);

        // Bind parameters
        $stmt->bindParam(':problem_type', $this->problem_type);
        $stmt->bindParam(':numerator_1', $this->numerator_1);
        $stmt->bindParam(':denominator_1', $this->denominator_1);
        $stmt->bindParam(':numerator_2', $this->numerator_2);
        $stmt->bindParam(':denominator_2', $this->denominator_2);
        $stmt->bindParam(':visual_type', $this->visual_type);
        $stmt->bindParam(':difficulty_level', $this->difficulty_level);
        $stmt->bindParam(':recommended_for_pattern', $this->recommended_for_pattern);
        $stmt->bindParam(':answer_numerator', $this->answer_numerator);
        $stmt->bindParam(':answer_denominator', $this->answer_denominator);
        $stmt->bindParam(':problem_text', $this->problem_text);
        $stmt->bindParam(':hint_visual', $this->hint_visual);
        $stmt->bindParam(':hint_analytical', $this->hint_analytical);
        $stmt->bindParam(':hint_experimental', $this->hint_experimental);
        $stmt->bindParam(':created_by', $this->created_by);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get problem statistics
     */
    public function getStatistics($problem_id) {
        $query = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(time_spent_seconds) as avg_time,
                    AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100 as success_rate
                  FROM student_attempts
                  WHERE problem_id = :problem_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':problem_id', $problem_id);
        $stmt->execute();

        return $stmt->fetch();
    }
}
