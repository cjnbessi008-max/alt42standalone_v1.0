<?php
/**
 * DoorState Model
 * Manages door open/closed states based on duplicate rules
 */

require_once __DIR__ . '/../config/database.php';

class DoorState {
    private $conn;
    private $table = 'door_states';

    // Door state properties
    public $id;
    public $rule_id;
    public $student_id;
    public $door_status;
    public $reason;
    public $metadata;
    public $created_at;
    public $updated_at;

    /**
     * Constructor
     */
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Create or update door state
     * @return bool
     */
    public function save() {
        // Check if state exists for this rule and student
        $existing = $this->getCurrentState($this->rule_id, $this->student_id);

        if ($existing) {
            return $this->update();
        } else {
            return $this->create();
        }
    }

    /**
     * Create a new door state
     * @return bool
     */
    private function create() {
        $query = "INSERT INTO {$this->table}
                  (rule_id, student_id, door_status, reason, metadata)
                  VALUES (:rule_id, :student_id, :status, :reason, :metadata)";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->reason = htmlspecialchars(strip_tags($this->reason));
        $metadata_json = json_encode($this->metadata);

        // Bind parameters
        $stmt->bindParam(':rule_id', $this->rule_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $this->student_id, PDO::PARAM_INT);
        $stmt->bindParam(':status', $this->door_status);
        $stmt->bindParam(':reason', $this->reason);
        $stmt->bindParam(':metadata', $metadata_json);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            $this->logActivity('door_' . $this->door_status);
            return true;
        }

        return false;
    }

    /**
     * Update existing door state
     * @return bool
     */
    private function update() {
        $query = "UPDATE {$this->table} SET
                  door_status = :status,
                  reason = :reason,
                  metadata = :metadata
                  WHERE rule_id = :rule_id AND student_id = :student_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->reason = htmlspecialchars(strip_tags($this->reason));
        $metadata_json = json_encode($this->metadata);

        // Bind parameters
        $stmt->bindParam(':status', $this->door_status);
        $stmt->bindParam(':reason', $this->reason);
        $stmt->bindParam(':metadata', $metadata_json);
        $stmt->bindParam(':rule_id', $this->rule_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $this->student_id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            $this->logActivity('door_' . $this->door_status);
            return true;
        }

        return false;
    }

    /**
     * Get current door state for a rule and student
     * @param int $rule_id
     * @param int $student_id
     * @return array|null
     */
    public function getCurrentState($rule_id, $student_id = null) {
        if ($student_id) {
            $query = "SELECT * FROM {$this->table}
                      WHERE rule_id = :rule_id AND student_id = :student_id
                      ORDER BY updated_at DESC LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':rule_id', $rule_id, PDO::PARAM_INT);
            $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        } else {
            $query = "SELECT * FROM {$this->table}
                      WHERE rule_id = :rule_id AND student_id IS NULL
                      ORDER BY updated_at DESC LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':rule_id', $rule_id, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * Evaluate door state based on rule type and attempt history
     * @param object $rule
     * @param int $student_id
     * @param array $current_answer
     * @return string 'open' or 'closed'
     */
    public function evaluateDoorState($rule, $student_id, $current_answer) {
        // If duplicates are allowed, door is always open
        if ($rule->rule_type === 'duplicate_allowed') {
            $this->door_status = 'open';
            $this->reason = 'Duplicate answers are allowed for this quiz';
            return 'open';
        }

        // Check for duplicate attempts
        $is_duplicate = $this->checkDuplicateAnswer($rule->id, $student_id, $current_answer);

        if ($is_duplicate) {
            $this->door_status = 'closed';
            $this->reason = 'Duplicate answer detected - submission not allowed';
            return 'closed';
        } else {
            $this->door_status = 'open';
            $this->reason = 'Unique answer - submission allowed';
            return 'open';
        }
    }

    /**
     * Check if the current answer is a duplicate
     * @param int $rule_id
     * @param int $student_id
     * @param array $current_answer
     * @return bool
     */
    private function checkDuplicateAnswer($rule_id, $student_id, $current_answer) {
        $query = "SELECT answer_data FROM problem_attempts
                  WHERE rule_id = :rule_id AND student_id = :student_id
                  ORDER BY attempt_timestamp DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':rule_id', $rule_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->execute();

        $previous_attempts = $stmt->fetchAll();

        $current_answer_json = json_encode($current_answer);

        foreach ($previous_attempts as $attempt) {
            if ($attempt['answer_data'] === $current_answer_json) {
                return true; // Duplicate found
            }
        }

        return false; // No duplicate
    }

    /**
     * Get all door states for a student
     * @param int $student_id
     * @return array
     */
    public function getStudentDoorStates($student_id) {
        $query = "SELECT ds.*, r.rule_name, r.rule_type, r.moodle_quiz_id
                  FROM {$this->table} ds
                  INNER JOIN rules r ON ds.rule_id = r.id
                  WHERE ds.student_id = :student_id
                  ORDER BY ds.updated_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Log door activity
     * @param string $action_type
     */
    private function logActivity($action_type) {
        $query = "INSERT INTO activity_log (rule_id, student_id, action_type, details, ip_address, user_agent)
                  VALUES (:rule_id, :student_id, :action_type, :details, :ip, :user_agent)";

        $stmt = $this->conn->prepare($query);

        $details = json_encode([
            'door_status' => $this->door_status,
            'reason' => $this->reason,
            'timestamp' => date('Y-m-d H:i:s')
        ]);

        $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

        $stmt->bindParam(':rule_id', $this->rule_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $this->student_id, PDO::PARAM_INT);
        $stmt->bindParam(':action_type', $action_type);
        $stmt->bindParam(':details', $details);
        $stmt->bindParam(':ip', $ip_address);
        $stmt->bindParam(':user_agent', $user_agent);

        $stmt->execute();
    }

    /**
     * Get door state statistics
     * @param int $rule_id
     * @return array
     */
    public function getStatistics($rule_id) {
        $query = "SELECT
                    door_status,
                    COUNT(*) as count,
                    COUNT(DISTINCT student_id) as unique_students
                  FROM {$this->table}
                  WHERE rule_id = :rule_id
                  GROUP BY door_status";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':rule_id', $rule_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
