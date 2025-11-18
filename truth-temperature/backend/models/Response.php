<?php
/**
 * Response Model
 * Handles user responses to problems
 */

class Response {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Create a new response
     */
    public function create($data) {
        $sql = "INSERT INTO user_responses (
            session_id,
            problem_id,
            user_answer,
            is_correct,
            temperature_displayed,
            response_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);

        $success = $stmt->execute([
            $data['session_id'],
            $data['problem_id'],
            $data['user_answer'],
            $data['is_correct'],
            $data['temperature_displayed'],
            $data['response_time_ms'] ?? null
        ]);

        return $success ? $this->db->lastInsertId() : false;
    }

    /**
     * Get response by ID
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM user_responses WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get all responses for a session
     */
    public function getBySessionId($session_id) {
        $stmt = $this->db->prepare("
            SELECT ur.*, p.question_text, p.inequality_expression
            FROM user_responses ur
            JOIN problems p ON ur.problem_id = p.id
            WHERE ur.session_id = ?
            ORDER BY ur.submitted_at DESC
        ");
        $stmt->execute([$session_id]);
        return $stmt->fetchAll();
    }

    /**
     * Get all responses for a problem
     */
    public function getByProblemId($problem_id) {
        $stmt = $this->db->prepare("
            SELECT * FROM user_responses
            WHERE problem_id = ?
            ORDER BY submitted_at DESC
        ");
        $stmt->execute([$problem_id]);
        return $stmt->fetchAll();
    }

    /**
     * Get user statistics for a session
     */
    public function getSessionStats($session_id) {
        $stmt = $this->db->prepare("
            SELECT
                COUNT(*) as total_responses,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_responses,
                AVG(response_time_ms) as avg_response_time,
                MIN(response_time_ms) as min_response_time,
                MAX(response_time_ms) as max_response_time
            FROM user_responses
            WHERE session_id = ?
        ");
        $stmt->execute([$session_id]);
        return $stmt->fetch();
    }

    /**
     * Get accuracy rate for a session
     */
    public function getAccuracyRate($session_id) {
        $stats = $this->getSessionStats($session_id);

        if ($stats['total_responses'] == 0) {
            return 0;
        }

        return ($stats['correct_responses'] / $stats['total_responses']) * 100;
    }

    /**
     * Check if user has already answered a problem in this session
     */
    public function hasAnswered($session_id, $problem_id) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count FROM user_responses
            WHERE session_id = ? AND problem_id = ?
        ");
        $stmt->execute([$session_id, $problem_id]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }

    /**
     * Get recent responses for a user
     */
    public function getRecentByUserId($user_id, $limit = 10) {
        $stmt = $this->db->prepare("
            SELECT ur.*, p.question_text, p.inequality_expression
            FROM user_responses ur
            JOIN user_sessions us ON ur.session_id = us.id
            JOIN problems p ON ur.problem_id = p.id
            WHERE us.moodle_user_id = ?
            ORDER BY ur.submitted_at DESC
            LIMIT ?
        ");
        $stmt->execute([$user_id, $limit]);
        return $stmt->fetchAll();
    }
}
