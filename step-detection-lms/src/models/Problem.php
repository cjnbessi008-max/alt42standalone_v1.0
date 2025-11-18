<?php
/**
 * Problem Model
 * 문제 관리 모델
 */

class Problem {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all problems with optional filters
     */
    public function getAll($filters = []) {
        $sql = "SELECT p.*, pt.display_name as type_name, pt.category,
                       t.full_name as creator_name
                FROM problems p
                LEFT JOIN problem_types pt ON p.problem_type_id = pt.id
                LEFT JOIN teachers t ON p.created_by = t.id
                WHERE p.is_active = 1";

        $params = [];

        if (!empty($filters['problem_type_id'])) {
            $sql .= " AND p.problem_type_id = :problem_type_id";
            $params[':problem_type_id'] = $filters['problem_type_id'];
        }

        if (!empty($filters['difficulty_level'])) {
            $sql .= " AND p.difficulty_level = :difficulty_level";
            $params[':difficulty_level'] = $filters['difficulty_level'];
        }

        if (!empty($filters['category'])) {
            $sql .= " AND pt.category = :category";
            $params[':category'] = $filters['category'];
        }

        $sql .= " ORDER BY p.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /**
     * Get problem by ID with steps
     */
    public function getById($id) {
        // Get problem details
        $sql = "SELECT p.*, pt.display_name as type_name, pt.category
                FROM problems p
                LEFT JOIN problem_types pt ON p.problem_type_id = pt.id
                WHERE p.id = :id AND p.is_active = 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $problem = $stmt->fetch();

        if (!$problem) {
            return null;
        }

        // Get problem steps
        $problem['steps'] = $this->getSteps($id);

        // Decode JSON fields
        if ($problem['correct_answer']) {
            $problem['correct_answer'] = json_decode($problem['correct_answer'], true);
        }
        if ($problem['metadata']) {
            $problem['metadata'] = json_decode($problem['metadata'], true);
        }

        return $problem;
    }

    /**
     * Get steps for a problem
     */
    public function getSteps($problemId) {
        $sql = "SELECT * FROM problem_steps
                WHERE problem_id = :problem_id
                ORDER BY step_order ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':problem_id' => $problemId]);

        return $stmt->fetchAll();
    }

    /**
     * Get problem types
     */
    public function getTypes() {
        $sql = "SELECT * FROM problem_types WHERE is_active = 1 ORDER BY category, display_name";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * Create a new problem
     */
    public function create($data) {
        $sql = "INSERT INTO problems (problem_type_id, title, description, difficulty_level,
                                      expected_time_seconds, correct_answer, metadata, created_by)
                VALUES (:problem_type_id, :title, :description, :difficulty_level,
                        :expected_time_seconds, :correct_answer, :metadata, :created_by)";

        $stmt = $this->db->prepare($sql);

        $params = [
            ':problem_type_id' => $data['problem_type_id'],
            ':title' => $data['title'],
            ':description' => $data['description'],
            ':difficulty_level' => $data['difficulty_level'] ?? 1,
            ':expected_time_seconds' => $data['expected_time_seconds'] ?? 300,
            ':correct_answer' => isset($data['correct_answer']) ? json_encode($data['correct_answer']) : null,
            ':metadata' => isset($data['metadata']) ? json_encode($data['metadata']) : null,
            ':created_by' => $data['created_by'] ?? null
        ];

        $stmt->execute($params);
        return $this->db->lastInsertId();
    }

    /**
     * Add step to problem
     */
    public function addStep($problemId, $stepData) {
        $sql = "INSERT INTO problem_steps (problem_id, step_order, step_name, display_name,
                                           description, is_required, expected_time_seconds,
                                           validation_rule, hint_text)
                VALUES (:problem_id, :step_order, :step_name, :display_name,
                        :description, :is_required, :expected_time_seconds,
                        :validation_rule, :hint_text)";

        $stmt = $this->db->prepare($sql);

        $params = [
            ':problem_id' => $problemId,
            ':step_order' => $stepData['step_order'],
            ':step_name' => $stepData['step_name'],
            ':display_name' => $stepData['display_name'],
            ':description' => $stepData['description'] ?? null,
            ':is_required' => $stepData['is_required'] ?? 1,
            ':expected_time_seconds' => $stepData['expected_time_seconds'] ?? 60,
            ':validation_rule' => $stepData['validation_rule'] ?? null,
            ':hint_text' => $stepData['hint_text'] ?? null
        ];

        $stmt->execute($params);
        return $this->db->lastInsertId();
    }

    /**
     * Get problem statistics
     */
    public function getStatistics($problemId) {
        $sql = "SELECT * FROM problem_statistics WHERE problem_id = :problem_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':problem_id' => $problemId]);

        return $stmt->fetch();
    }

    /**
     * Update problem statistics
     */
    public function updateStatistics($problemId) {
        $sql = "INSERT INTO problem_statistics (problem_id, total_attempts, correct_attempts,
                                                avg_time_seconds, avg_score, skip_detection_rate)
                SELECT
                    :problem_id,
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(total_time_seconds) as avg_time_seconds,
                    AVG(score) as avg_score,
                    (SELECT COUNT(DISTINCT solution_id) * 100.0 / COUNT(*)
                     FROM skip_detections sd
                     JOIN student_solutions ss ON sd.solution_id = ss.id
                     WHERE ss.problem_id = :problem_id) as skip_detection_rate
                FROM student_solutions
                WHERE problem_id = :problem_id AND status = 'submitted'
                ON DUPLICATE KEY UPDATE
                    total_attempts = VALUES(total_attempts),
                    correct_attempts = VALUES(correct_attempts),
                    avg_time_seconds = VALUES(avg_time_seconds),
                    avg_score = VALUES(avg_score),
                    skip_detection_rate = VALUES(skip_detection_rate)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':problem_id' => $problemId]);
    }
}
