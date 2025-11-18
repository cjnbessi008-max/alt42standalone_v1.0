<?php
/**
 * User Progress Model
 * Tracks student progress through problems
 */

require_once __DIR__ . '/../config/database.php';

class UserProgress {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create or get user
     */
    public function createOrGetUser($moodleUserId, $username, $email = null) {
        // Check if user exists
        $stmt = $this->db->prepare("
            SELECT * FROM users WHERE moodle_user_id = :moodle_id
        ");
        $stmt->execute(['moodle_id' => $moodleUserId]);
        $user = $stmt->fetch();

        if ($user) {
            return $user;
        }

        // Create new user
        $stmt = $this->db->prepare("
            INSERT INTO users (moodle_user_id, username, email)
            VALUES (:moodle_id, :username, :email)
        ");
        $stmt->execute([
            'moodle_id' => $moodleUserId,
            'username' => $username,
            'email' => $email
        ]);

        return [
            'id' => $this->db->lastInsertId(),
            'moodle_user_id' => $moodleUserId,
            'username' => $username,
            'email' => $email
        ];
    }

    /**
     * Start problem for user
     */
    public function startProblem($userId, $problemId, $totalSteps) {
        $stmt = $this->db->prepare("
            INSERT INTO user_progress (user_id, problem_id, current_step, total_steps)
            VALUES (:user_id, :problem_id, 1, :total_steps)
            ON DUPLICATE KEY UPDATE current_step = 1, completed = FALSE, updated_at = NOW()
        ");

        return $stmt->execute([
            'user_id' => $userId,
            'problem_id' => $problemId,
            'total_steps' => $totalSteps
        ]);
    }

    /**
     * Record step attempt
     */
    public function recordAttempt($userId, $problemId, $stepId, $userAnswer, $isCorrect, $timeSpent) {
        $stmt = $this->db->prepare("
            INSERT INTO user_attempts (user_id, problem_id, step_id, user_answer, is_correct, time_spent)
            VALUES (:user_id, :problem_id, :step_id, :answer, :correct, :time)
        ");

        return $stmt->execute([
            'user_id' => $userId,
            'problem_id' => $problemId,
            'step_id' => $stepId,
            'answer' => $userAnswer,
            'correct' => $isCorrect ? 1 : 0,
            'time' => $timeSpent
        ]);
    }

    /**
     * Update current step
     */
    public function updateStep($userId, $problemId, $newStep) {
        $stmt = $this->db->prepare("
            UPDATE user_progress
            SET current_step = :step, updated_at = NOW()
            WHERE user_id = :user_id AND problem_id = :problem_id
        ");

        return $stmt->execute([
            'step' => $newStep,
            'user_id' => $userId,
            'problem_id' => $problemId
        ]);
    }

    /**
     * Mark problem as completed
     */
    public function completeProblem($userId, $problemId, $score) {
        $stmt = $this->db->prepare("
            UPDATE user_progress
            SET completed = TRUE, score = :score, completed_at = NOW(), updated_at = NOW()
            WHERE user_id = :user_id AND problem_id = :problem_id
        ");

        return $stmt->execute([
            'score' => $score,
            'user_id' => $userId,
            'problem_id' => $problemId
        ]);
    }

    /**
     * Get user's progress for a problem
     */
    public function getProgress($userId, $problemId) {
        $stmt = $this->db->prepare("
            SELECT * FROM user_progress
            WHERE user_id = :user_id AND problem_id = :problem_id
        ");
        $stmt->execute([
            'user_id' => $userId,
            'problem_id' => $problemId
        ]);
        return $stmt->fetch();
    }

    /**
     * Get all user attempts for a problem
     */
    public function getAttempts($userId, $problemId) {
        $stmt = $this->db->prepare("
            SELECT ua.*, ss.step_number, ss.step_description
            FROM user_attempts ua
            JOIN solution_steps ss ON ua.step_id = ss.id
            WHERE ua.user_id = :user_id AND ua.problem_id = :problem_id
            ORDER BY ua.created_at DESC
        ");
        $stmt->execute([
            'user_id' => $userId,
            'problem_id' => $problemId
        ]);
        return $stmt->fetchAll();
    }

    /**
     * Calculate score based on attempts
     */
    public function calculateScore($userId, $problemId) {
        $stmt = $this->db->prepare("
            SELECT
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                COUNT(DISTINCT step_id) as unique_steps
            FROM user_attempts
            WHERE user_id = :user_id AND problem_id = :problem_id
        ");
        $stmt->execute([
            'user_id' => $userId,
            'problem_id' => $problemId
        ]);
        $stats = $stmt->fetch();

        // Calculate score: (correct attempts / total attempts) * 100
        if ($stats['total_attempts'] == 0) {
            return 0;
        }

        return round(($stats['correct_attempts'] / $stats['total_attempts']) * 100, 2);
    }
}
