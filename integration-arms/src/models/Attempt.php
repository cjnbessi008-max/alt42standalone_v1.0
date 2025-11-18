<?php
/**
 * Attempt Model
 * Handles student attempt records
 */

require_once __DIR__ . '/../config/database.php';

class Attempt {
    private $db;

    public $id;
    public $moodleUserId;
    public $problemId;
    public $selectedU;
    public $selectedDv;
    public $isCorrect;
    public $attemptTime;
    public $hintUsed;
    public $feedback;
    public $createdAt;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get attempt by ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM student_attempts WHERE id = ?";
        $result = $this->db->fetchOne($sql, [$id]);

        if ($result) {
            $this->hydrate($result);
            return $this;
        }
        return null;
    }

    /**
     * Get all attempts by user
     */
    public function getByUserId($userId, $limit = 100) {
        $sql = "SELECT * FROM student_attempts
                WHERE moodle_user_id = ?
                ORDER BY created_at DESC
                LIMIT ?";
        return $this->db->fetchAll($sql, [$userId, $limit]);
    }

    /**
     * Get attempts by problem
     */
    public function getByProblemId($problemId, $limit = 100) {
        $sql = "SELECT * FROM student_attempts
                WHERE problem_id = ?
                ORDER BY created_at DESC
                LIMIT ?";
        return $this->db->fetchAll($sql, [$problemId, $limit]);
    }

    /**
     * Get user attempts for specific problem
     */
    public function getUserProblemAttempts($userId, $problemId) {
        $sql = "SELECT * FROM student_attempts
                WHERE moodle_user_id = ? AND problem_id = ?
                ORDER BY created_at DESC";
        return $this->db->fetchAll($sql, [$userId, $problemId]);
    }

    /**
     * Create new attempt
     */
    public function create($data) {
        $sql = "INSERT INTO student_attempts
                (moodle_user_id, problem_id, selected_u, selected_dv, is_correct,
                 attempt_time, hint_used, feedback)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $data['moodle_user_id'],
            $data['problem_id'],
            $data['selected_u'] ?? null,
            $data['selected_dv'] ?? null,
            $data['is_correct'] ?? false,
            $data['attempt_time'] ?? null,
            $data['hint_used'] ?? 0,
            $data['feedback'] ?? null
        ];

        $this->db->query($sql, $params);
        $this->id = $this->db->lastInsertId();

        return $this->getById($this->id);
    }

    /**
     * Update attempt
     */
    public function update($id, $data) {
        $fields = [];
        $params = [];

        $allowedFields = [
            'selected_u', 'selected_dv', 'is_correct',
            'attempt_time', 'hint_used', 'feedback'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $dbField = $this->camelToSnake($field);
                $fields[] = "$dbField = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $sql = "UPDATE student_attempts SET " . implode(', ', $fields) . " WHERE id = ?";

        $this->db->query($sql, $params);
        return $this->getById($id);
    }

    /**
     * Get user statistics
     */
    public function getUserStats($userId) {
        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(attempt_time) as avg_time,
                    AVG(hint_used) as avg_hints,
                    COUNT(DISTINCT problem_id) as unique_problems
                FROM student_attempts
                WHERE moodle_user_id = ?";

        return $this->db->fetchOne($sql, [$userId]);
    }

    /**
     * Get problem statistics
     */
    public function getProblemStats($problemId) {
        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(attempt_time) as avg_time,
                    AVG(hint_used) as avg_hints,
                    COUNT(DISTINCT moodle_user_id) as unique_users
                FROM student_attempts
                WHERE problem_id = ?";

        return $this->db->fetchOne($sql, [$problemId]);
    }

    /**
     * Get recent attempts (for activity feed)
     */
    public function getRecentAttempts($limit = 20) {
        $sql = "SELECT sa.*, ip.problem_latex, ip.difficulty
                FROM student_attempts sa
                JOIN integration_problems ip ON sa.problem_id = ip.id
                ORDER BY sa.created_at DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$limit]);
    }

    /**
     * Check if user has attempted problem
     */
    public function hasAttempted($userId, $problemId) {
        $sql = "SELECT COUNT(*) as count
                FROM student_attempts
                WHERE moodle_user_id = ? AND problem_id = ?";

        $result = $this->db->fetchOne($sql, [$userId, $problemId]);
        return $result['count'] > 0;
    }

    /**
     * Get first attempt success rate
     */
    public function getFirstAttemptSuccessRate($userId = null) {
        if ($userId) {
            $sql = "SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
                    FROM (
                        SELECT is_correct, problem_id, MIN(created_at)
                        FROM student_attempts
                        WHERE moodle_user_id = ?
                        GROUP BY problem_id
                    ) as first_attempts";
            $result = $this->db->fetchOne($sql, [$userId]);
        } else {
            $sql = "SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
                    FROM (
                        SELECT is_correct, moodle_user_id, problem_id, MIN(created_at)
                        FROM student_attempts
                        GROUP BY moodle_user_id, problem_id
                    ) as first_attempts";
            $result = $this->db->fetchOne($sql);
        }

        if ($result['total'] > 0) {
            return round(($result['correct'] / $result['total']) * 100, 2);
        }
        return 0;
    }

    /**
     * Convert camelCase to snake_case
     */
    private function camelToSnake($input) {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
    }

    /**
     * Hydrate object from database result
     */
    private function hydrate($data) {
        $this->id = $data['id'];
        $this->moodleUserId = $data['moodle_user_id'];
        $this->problemId = $data['problem_id'];
        $this->selectedU = $data['selected_u'];
        $this->selectedDv = $data['selected_dv'];
        $this->isCorrect = $data['is_correct'];
        $this->attemptTime = $data['attempt_time'];
        $this->hintUsed = $data['hint_used'];
        $this->feedback = $data['feedback'];
        $this->createdAt = $data['created_at'];
    }

    /**
     * Convert to array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'moodleUserId' => $this->moodleUserId,
            'problemId' => $this->problemId,
            'selectedU' => $this->selectedU,
            'selectedDv' => $this->selectedDv,
            'isCorrect' => (bool)$this->isCorrect,
            'attemptTime' => $this->attemptTime,
            'hintUsed' => $this->hintUsed,
            'feedback' => $this->feedback,
            'createdAt' => $this->createdAt,
        ];
    }
}
