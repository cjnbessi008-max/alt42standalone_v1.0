<?php
/**
 * Student Progress Model
 * Tracks student attempts and progress
 */

namespace ColorPattern\Models;

use ColorPattern\Utils\Database;
use ColorPattern\Utils\Validator;

class StudentProgress {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Start a new attempt
     */
    public function startAttempt($moodleUserId, $problemId) {
        Validator::positiveInteger($moodleUserId, 'User ID');
        Validator::positiveInteger($problemId, 'Problem ID');

        // Get current attempt number
        $attemptNumber = $this->getAttemptCount($moodleUserId, $problemId) + 1;

        $sql = "INSERT INTO student_progress
                (moodle_user_id, problem_id, attempt_number, started_at)
                VALUES (?, ?, ?, NOW())";

        return $this->db->insert($sql, [$moodleUserId, $problemId, $attemptNumber]);
    }

    /**
     * Submit an attempt
     */
    public function submitAttempt($attemptId, $studentAnswer, $isCorrect, $score, $timeSpent = null) {
        Validator::positiveInteger($attemptId, 'Attempt ID');
        Validator::isArray($studentAnswer, 'Student Answer');
        Validator::required($isCorrect, 'Is Correct');

        $sql = "UPDATE student_progress
                SET student_answer = ?,
                    is_correct = ?,
                    score = ?,
                    time_spent_seconds = ?,
                    submitted_at = NOW()
                WHERE id = ?";

        $params = [
            json_encode($studentAnswer),
            $isCorrect ? 1 : 0,
            $score,
            $timeSpent,
            $attemptId
        ];

        return $this->db->update($sql, $params);
    }

    /**
     * Get attempt by ID
     */
    public function getAttemptById($attemptId) {
        Validator::positiveInteger($attemptId, 'Attempt ID');

        $sql = "SELECT sp.*, p.pattern_type, p.difficulty_level
                FROM student_progress sp
                JOIN problems p ON sp.problem_id = p.id
                WHERE sp.id = ?";

        $result = $this->db->selectOne($sql, [$attemptId]);

        if ($result && $result['student_answer']) {
            $result['student_answer'] = json_decode($result['student_answer'], true);
        }

        return $result;
    }

    /**
     * Get all attempts for a user and problem
     */
    public function getUserAttempts($moodleUserId, $problemId) {
        Validator::positiveInteger($moodleUserId, 'User ID');
        Validator::positiveInteger($problemId, 'Problem ID');

        $sql = "SELECT * FROM student_progress
                WHERE moodle_user_id = ? AND problem_id = ?
                ORDER BY attempt_number DESC";

        $results = $this->db->select($sql, [$moodleUserId, $problemId]);

        foreach ($results as &$result) {
            if ($result['student_answer']) {
                $result['student_answer'] = json_decode($result['student_answer'], true);
            }
        }

        return $results;
    }

    /**
     * Get attempt count for a user and problem
     */
    public function getAttemptCount($moodleUserId, $problemId) {
        Validator::positiveInteger($moodleUserId, 'User ID');
        Validator::positiveInteger($problemId, 'Problem ID');

        $sql = "SELECT COUNT(*) as count FROM student_progress
                WHERE moodle_user_id = ? AND problem_id = ?";

        $result = $this->db->selectOne($sql, [$moodleUserId, $problemId]);
        return (int)$result['count'];
    }

    /**
     * Get latest attempt for a user and problem
     */
    public function getLatestAttempt($moodleUserId, $problemId) {
        Validator::positiveInteger($moodleUserId, 'User ID');
        Validator::positiveInteger($problemId, 'Problem ID');

        $sql = "SELECT * FROM student_progress
                WHERE moodle_user_id = ? AND problem_id = ?
                ORDER BY attempt_number DESC LIMIT 1";

        $result = $this->db->selectOne($sql, [$moodleUserId, $problemId]);

        if ($result && $result['student_answer']) {
            $result['student_answer'] = json_decode($result['student_answer'], true);
        }

        return $result;
    }

    /**
     * Get best score for a user and problem
     */
    public function getBestScore($moodleUserId, $problemId) {
        Validator::positiveInteger($moodleUserId, 'User ID');
        Validator::positiveInteger($problemId, 'Problem ID');

        $sql = "SELECT MAX(score) as best_score
                FROM student_progress
                WHERE moodle_user_id = ? AND problem_id = ?
                AND submitted_at IS NOT NULL";

        $result = $this->db->selectOne($sql, [$moodleUserId, $problemId]);
        return $result['best_score'] ?? 0;
    }

    /**
     * Get user statistics
     */
    public function getUserStatistics($moodleUserId) {
        Validator::positiveInteger($moodleUserId, 'User ID');

        $sql = "SELECT
                    COUNT(DISTINCT problem_id) as problems_attempted,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    COUNT(*) as total_attempts,
                    AVG(score) as average_score,
                    AVG(time_spent_seconds) as average_time
                FROM student_progress
                WHERE moodle_user_id = ? AND submitted_at IS NOT NULL";

        return $this->db->selectOne($sql, [$moodleUserId]);
    }

    /**
     * Get user progress by pattern type
     */
    public function getUserProgressByPattern($moodleUserId) {
        Validator::positiveInteger($moodleUserId, 'User ID');

        $sql = "SELECT
                    p.pattern_type,
                    COUNT(DISTINCT sp.problem_id) as problems_attempted,
                    SUM(CASE WHEN sp.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(sp.score) as average_score
                FROM student_progress sp
                JOIN problems p ON sp.problem_id = p.id
                WHERE sp.moodle_user_id = ? AND sp.submitted_at IS NOT NULL
                GROUP BY p.pattern_type";

        return $this->db->select($sql, [$moodleUserId]);
    }

    /**
     * Check if max attempts reached
     */
    public function isMaxAttemptsReached($moodleUserId, $problemId) {
        $appConfig = require __DIR__ . '/../../config/app.php';
        $maxAttempts = $appConfig['max_attempts_per_problem'];

        $currentAttempts = $this->getAttemptCount($moodleUserId, $problemId);

        return $currentAttempts >= $maxAttempts;
    }

    /**
     * Delete attempt
     */
    public function deleteAttempt($attemptId) {
        Validator::positiveInteger($attemptId, 'Attempt ID');

        $sql = "DELETE FROM student_progress WHERE id = ?";
        return $this->db->delete($sql, [$attemptId]);
    }

    /**
     * Get recent attempts across all users (for admin)
     */
    public function getRecentAttempts($limit = 50) {
        $sql = "SELECT sp.*, p.pattern_type, p.difficulty_level
                FROM student_progress sp
                JOIN problems p ON sp.problem_id = p.id
                WHERE sp.submitted_at IS NOT NULL
                ORDER BY sp.submitted_at DESC
                LIMIT ?";

        $results = $this->db->select($sql, [(int)$limit]);

        foreach ($results as &$result) {
            if ($result['student_answer']) {
                $result['student_answer'] = json_decode($result['student_answer'], true);
            }
        }

        return $results;
    }

    /**
     * Get leaderboard
     */
    public function getLeaderboard($limit = 10) {
        $sql = "SELECT
                    moodle_user_id,
                    COUNT(DISTINCT problem_id) as problems_solved,
                    AVG(score) as average_score,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count
                FROM student_progress
                WHERE submitted_at IS NOT NULL AND is_correct = 1
                GROUP BY moodle_user_id
                ORDER BY problems_solved DESC, average_score DESC
                LIMIT ?";

        return $this->db->select($sql, [(int)$limit]);
    }
}
