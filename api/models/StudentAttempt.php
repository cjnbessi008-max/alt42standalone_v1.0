<?php
/**
 * Student Attempt Model
 */

class StudentAttempt {
    private $conn;
    private $table_name = "student_attempts";

    public $id;
    public $student_id;
    public $problem_id;
    public $answer_numerator;
    public $answer_denominator;
    public $is_correct;
    public $time_spent_seconds;
    public $hint_requested;
    public $hint_type_used;
    public $visual_tool_clicks;
    public $step_by_step_views;
    public $interactive_manipulations;
    public $attempt_number;
    public $attempted_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Record a student attempt
     */
    public function create() {
        // Get current attempt number for this student-problem combination
        $attempt_num = $this->getAttemptNumber($this->student_id, $this->problem_id);

        $query = "INSERT INTO " . $this->table_name . "
                  (student_id, problem_id, answer_numerator, answer_denominator, is_correct,
                   time_spent_seconds, hint_requested, hint_type_used,
                   visual_tool_clicks, step_by_step_views, interactive_manipulations,
                   attempt_number)
                  VALUES
                  (:student_id, :problem_id, :answer_numerator, :answer_denominator, :is_correct,
                   :time_spent_seconds, :hint_requested, :hint_type_used,
                   :visual_tool_clicks, :step_by_step_views, :interactive_manipulations,
                   :attempt_number)";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->student_id = htmlspecialchars(strip_tags($this->student_id));
        $this->problem_id = htmlspecialchars(strip_tags($this->problem_id));
        $this->answer_numerator = htmlspecialchars(strip_tags($this->answer_numerator));
        $this->answer_denominator = htmlspecialchars(strip_tags($this->answer_denominator));
        $this->is_correct = (bool)$this->is_correct;
        $this->time_spent_seconds = htmlspecialchars(strip_tags($this->time_spent_seconds));
        $this->hint_requested = (bool)($this->hint_requested ?? false);
        $this->hint_type_used = htmlspecialchars(strip_tags($this->hint_type_used ?? 'none'));
        $this->visual_tool_clicks = (int)($this->visual_tool_clicks ?? 0);
        $this->step_by_step_views = (int)($this->step_by_step_views ?? 0);
        $this->interactive_manipulations = (int)($this->interactive_manipulations ?? 0);

        // Bind
        $stmt->bindParam(':student_id', $this->student_id);
        $stmt->bindParam(':problem_id', $this->problem_id);
        $stmt->bindParam(':answer_numerator', $this->answer_numerator);
        $stmt->bindParam(':answer_denominator', $this->answer_denominator);
        $stmt->bindParam(':is_correct', $this->is_correct, PDO::PARAM_BOOL);
        $stmt->bindParam(':time_spent_seconds', $this->time_spent_seconds);
        $stmt->bindParam(':hint_requested', $this->hint_requested, PDO::PARAM_BOOL);
        $stmt->bindParam(':hint_type_used', $this->hint_type_used);
        $stmt->bindParam(':visual_tool_clicks', $this->visual_tool_clicks);
        $stmt->bindParam(':step_by_step_views', $this->step_by_step_views);
        $stmt->bindParam(':interactive_manipulations', $this->interactive_manipulations);
        $stmt->bindParam(':attempt_number', $attempt_num);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get attempt number for student-problem combination
     */
    private function getAttemptNumber($student_id, $problem_id) {
        $query = "SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
                  FROM " . $this->table_name . "
                  WHERE student_id = :student_id AND problem_id = :problem_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':problem_id', $problem_id);
        $stmt->execute();

        $result = $stmt->fetch();
        return $result['next_attempt'] ?? 1;
    }

    /**
     * Get student's attempts for a problem
     */
    public function getByStudentAndProblem($student_id, $problem_id) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE student_id = :student_id AND problem_id = :problem_id
                  ORDER BY attempted_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':problem_id', $problem_id);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Get recent attempts by student
     */
    public function getRecentByStudent($student_id, $limit = 20) {
        $query = "SELECT sa.*, fp.problem_type, fp.difficulty_level, fp.problem_text
                  FROM " . $this->table_name . " sa
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

    /**
     * Get behavior metrics for pattern analysis
     */
    public function getBehaviorMetrics($student_id) {
        $query = "SELECT
                    SUM(visual_tool_clicks) as total_visual_clicks,
                    SUM(step_by_step_views) as total_analytical_views,
                    SUM(interactive_manipulations) as total_experimental_manips,
                    COUNT(*) as total_attempts,
                    AVG(time_spent_seconds) as avg_time,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as total_correct,
                    COUNT(DISTINCT problem_id) as unique_problems
                  FROM " . $this->table_name . "
                  WHERE student_id = :student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Delete attempts (for testing)
     */
    public function deleteByStudent($student_id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE student_id = :student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);

        return $stmt->execute();
    }
}
