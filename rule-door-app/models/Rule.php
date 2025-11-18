<?php
/**
 * Rule Model
 * Handles rule creation, retrieval, and management
 */

require_once __DIR__ . '/../config/database.php';

class Rule {
    private $conn;
    private $table = 'rules';

    // Rule properties
    public $id;
    public $moodle_quiz_id;
    public $moodle_course_id;
    public $rule_name;
    public $rule_type;
    public $description;
    public $created_at;
    public $updated_at;
    public $is_active;

    /**
     * Constructor
     */
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Create a new rule
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO {$this->table}
                  (moodle_quiz_id, moodle_course_id, rule_name, rule_type, description, is_active)
                  VALUES (:quiz_id, :course_id, :name, :type, :description, :is_active)";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->rule_name = htmlspecialchars(strip_tags($this->rule_name));
        $this->rule_type = htmlspecialchars(strip_tags($this->rule_type));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Bind parameters
        $stmt->bindParam(':quiz_id', $this->moodle_quiz_id, PDO::PARAM_INT);
        $stmt->bindParam(':course_id', $this->moodle_course_id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $this->rule_name);
        $stmt->bindParam(':type', $this->rule_type);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':is_active', $this->is_active, PDO::PARAM_INT);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get rule by ID
     * @param int $id
     * @return array|null
     */
    public function getById($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get rule by quiz ID
     * @param int $quiz_id
     * @return array|null
     */
    public function getByQuizId($quiz_id) {
        $query = "SELECT * FROM {$this->table}
                  WHERE moodle_quiz_id = :quiz_id AND is_active = 1
                  ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get all active rules
     * @return array
     */
    public function getAllActive() {
        $query = "SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Update rule
     * @return bool
     */
    public function update() {
        $query = "UPDATE {$this->table} SET
                  rule_name = :name,
                  rule_type = :type,
                  description = :description,
                  is_active = :is_active
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->rule_name = htmlspecialchars(strip_tags($this->rule_name));
        $this->rule_type = htmlspecialchars(strip_tags($this->rule_type));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Bind parameters
        $stmt->bindParam(':name', $this->rule_name);
        $stmt->bindParam(':type', $this->rule_type);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':is_active', $this->is_active, PDO::PARAM_INT);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Delete rule (soft delete by setting is_active = 0)
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $query = "UPDATE {$this->table} SET is_active = 0 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Check if duplicates are allowed for this rule
     * @return bool
     */
    public function areDuplicatesAllowed() {
        return $this->rule_type === 'duplicate_allowed';
    }

    /**
     * Get rule statistics
     * @param int $rule_id
     * @return array|null
     */
    public function getStatistics($rule_id) {
        $query = "SELECT
                    r.id,
                    r.rule_name,
                    r.rule_type,
                    COUNT(DISTINCT pa.student_id) as total_students,
                    COUNT(pa.id) as total_attempts,
                    SUM(CASE WHEN pa.is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_attempts,
                    SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
                  FROM {$this->table} r
                  LEFT JOIN problem_attempts pa ON r.id = pa.rule_id
                  WHERE r.id = :rule_id
                  GROUP BY r.id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':rule_id', $rule_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }
}
