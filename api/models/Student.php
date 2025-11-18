<?php
/**
 * Student Model
 */

class Student {
    private $conn;
    private $table_name = "students";

    public $id;
    public $student_code;
    public $name;
    public $grade_level;
    public $moodle_user_id;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all students
     */
    public function getAll() {
        $query = "SELECT s.*, lp.dominant_pattern, lp.confidence_level, lp.accuracy_rate
                  FROM " . $this->table_name . " s
                  LEFT JOIN learning_patterns lp ON s.id = lp.student_id
                  ORDER BY s.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Get student by ID
     */
    public function getById($id) {
        $query = "SELECT s.*, lp.dominant_pattern, lp.confidence_level, lp.accuracy_rate,
                         lp.total_problems_attempted, lp.total_correct,
                         lp.visual_score, lp.analytical_score, lp.experimental_score
                  FROM " . $this->table_name . " s
                  LEFT JOIN learning_patterns lp ON s.id = lp.student_id
                  WHERE s.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get student by student code
     */
    public function getByCode($code) {
        $query = "SELECT s.*, lp.dominant_pattern, lp.confidence_level, lp.accuracy_rate
                  FROM " . $this->table_name . " s
                  LEFT JOIN learning_patterns lp ON s.id = lp.student_id
                  WHERE s.student_code = :code";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':code', $code);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Create new student
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (student_code, name, grade_level, moodle_user_id)
                  VALUES (:student_code, :name, :grade_level, :moodle_user_id)";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->student_code = htmlspecialchars(strip_tags($this->student_code));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->grade_level = htmlspecialchars(strip_tags($this->grade_level));
        $this->moodle_user_id = htmlspecialchars(strip_tags($this->moodle_user_id));

        // Bind
        $stmt->bindParam(':student_code', $this->student_code);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':grade_level', $this->grade_level);
        $stmt->bindParam(':moodle_user_id', $this->moodle_user_id);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get student's learning progress
     */
    public function getProgress($student_id) {
        $query = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(time_spent_seconds) as avg_time,
                    MIN(attempted_at) as first_attempt,
                    MAX(attempted_at) as last_attempt,
                    lp.dominant_pattern,
                    lp.visual_score,
                    lp.analytical_score,
                    lp.experimental_score,
                    lp.confidence_level,
                    lp.accuracy_rate
                  FROM student_attempts sa
                  LEFT JOIN learning_patterns lp ON sa.student_id = lp.student_id
                  WHERE sa.student_id = :student_id
                  GROUP BY sa.student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get student's recent attempts
     */
    public function getRecentAttempts($student_id, $limit = 10) {
        $query = "SELECT sa.*, fp.problem_type, fp.difficulty_level,
                         fp.numerator_1, fp.denominator_1, fp.numerator_2, fp.denominator_2
                  FROM student_attempts sa
                  JOIN fraction_problems fp ON sa.problem_id = fp.id
                  WHERE sa.student_id = :student_id
                  ORDER BY sa.attempted_at DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt;
    }
}
