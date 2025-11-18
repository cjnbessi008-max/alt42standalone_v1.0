<?php
/**
 * ProblemAttempt Model
 * Tracks student attempts and handles duplicate detection
 */

require_once __DIR__ . '/../config/database.php';

class ProblemAttempt {
    private $conn;
    private $table = 'problem_attempts';

    // Attempt properties
    public $id;
    public $rule_id;
    public $student_id;
    public $moodle_question_id;
    public $attempt_number;
    public $answer_data;
    public $is_duplicate;
    public $is_correct;
    public $time_spent_seconds;
    public $attempt_timestamp;

    /**
     * Constructor
     */
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Record a new attempt
     * @return bool
     */
    public function recordAttempt() {
        // Get next attempt number
        $this->attempt_number = $this->getNextAttemptNumber();

        $query = "INSERT INTO {$this->table}
                  (rule_id, student_id, moodle_question_id, attempt_number, answer_data,
                   is_duplicate, is_correct, time_spent_seconds)
                  VALUES (:rule_id, :student_id, :question_id, :attempt_number, :answer_data,
                          :is_duplicate, :is_correct, :time_spent)";

        $stmt = $this->conn->prepare($query);

        $answer_json = json_encode($this->answer_data);

        // Bind parameters
        $stmt->bindParam(':rule_id', $this->rule_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $this->student_id, PDO::PARAM_INT);
        $stmt->bindParam(':question_id', $this->moodle_question_id, PDO::PARAM_INT);
        $stmt->bindParam(':attempt_number', $this->attempt_number, PDO::PARAM_INT);
        $stmt->bindParam(':answer_data', $answer_json);
        $stmt->bindParam(':is_duplicate', $this->is_duplicate, PDO::PARAM_INT);
        $stmt->bindParam(':is_correct', $this->is_correct, PDO::PARAM_INT);
        $stmt->bindParam(':time_spent', $this->time_spent_seconds, PDO::PARAM_INT);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();

            // Log duplicate detection if applicable
            if ($this->is_duplicate) {
                $this->logDuplicateDetection();
            }

            return true;
        }

        return false;
    }

    /**
     * Get next attempt number for student and question
     * @return int
     */
    private function getNextAttemptNumber() {
        $query = "SELECT MAX(attempt_number) as max_attempt
                  FROM {$this->table}
                  WHERE student_id = :student_id AND moodle_question_id = :question_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $this->student_id, PDO::PARAM_INT);
        $stmt->bindParam(':question_id', $this->moodle_question_id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch();
        return ($result && $result['max_attempt']) ? $result['max_attempt'] + 1 : 1;
    }

    /**
     * Get student's attempts for a specific question
     * @param int $student_id
     * @param int $question_id
     * @return array
     */
    public function getStudentAttempts($student_id, $question_id) {
        $query = "SELECT * FROM {$this->table}
                  WHERE student_id = :student_id AND moodle_question_id = :question_id
                  ORDER BY attempt_timestamp DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->bindParam(':question_id', $question_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Check if answer is duplicate
     * @param int $student_id
     * @param int $question_id
     * @param array $answer_data
     * @return bool
     */
    public function isDuplicateAnswer($student_id, $question_id, $answer_data) {
        $query = "SELECT answer_data FROM {$this->table}
                  WHERE student_id = :student_id AND moodle_question_id = :question_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->bindParam(':question_id', $question_id, PDO::PARAM_INT);
        $stmt->execute();

        $previous_attempts = $stmt->fetchAll();
        $current_answer_json = json_encode($answer_data);

        foreach ($previous_attempts as $attempt) {
            if ($attempt['answer_data'] === $current_answer_json) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get attempt statistics
     * @param int $rule_id
     * @param int $student_id
     * @return array|null
     */
    public function getStatistics($rule_id, $student_id = null) {
        if ($student_id) {
            $query = "SELECT
                        COUNT(*) as total_attempts,
                        SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_count,
                        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
                        AVG(time_spent_seconds) as avg_time_spent,
                        MAX(attempt_number) as max_attempt_number
                      FROM {$this->table}
                      WHERE rule_id = :rule_id AND student_id = :student_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':rule_id', $rule_id, PDO::PARAM_INT);
            $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        } else {
            $query = "SELECT
                        COUNT(*) as total_attempts,
                        COUNT(DISTINCT student_id) as unique_students,
                        SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_count,
                        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
                        AVG(time_spent_seconds) as avg_time_spent
                      FROM {$this->table}
                      WHERE rule_id = :rule_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':rule_id', $rule_id, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * Log duplicate detection
     */
    private function logDuplicateDetection() {
        $query = "INSERT INTO activity_log (rule_id, student_id, action_type, details)
                  VALUES (:rule_id, :student_id, 'duplicate_detected', :details)";

        $stmt = $this->conn->prepare($query);

        $details = json_encode([
            'question_id' => $this->moodle_question_id,
            'attempt_number' => $this->attempt_number,
            'timestamp' => date('Y-m-d H:i:s')
        ]);

        $stmt->bindParam(':rule_id', $this->rule_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $this->student_id, PDO::PARAM_INT);
        $stmt->bindParam(':details', $details);

        $stmt->execute();
    }

    /**
     * Get recent attempts
     * @param int $limit
     * @return array
     */
    public function getRecentAttempts($limit = 10) {
        $query = "SELECT pa.*, r.rule_name
                  FROM {$this->table} pa
                  INNER JOIN rules r ON pa.rule_id = r.id
                  ORDER BY pa.attempt_timestamp DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
