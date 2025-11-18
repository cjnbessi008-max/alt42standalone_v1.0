<?php
/**
 * Question Model for Moodle Integration
 */

require_once __DIR__ . '/../config/database.php';

class Question {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Cache question from Moodle
     */
    public function cacheQuestion($moodleQuestionId, $quizId, $questionData) {
        $sql = "INSERT INTO question_cache
                (moodle_question_id, quiz_id, question_type, question_text, options, correct_answer, difficulty)
                VALUES (:moodle_question_id, :quiz_id, :question_type, :question_text, :options, :correct_answer, :difficulty)
                ON DUPLICATE KEY UPDATE
                question_text = :question_text,
                options = :options,
                correct_answer = :correct_answer,
                updated_at = CURRENT_TIMESTAMP";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':moodle_question_id' => $moodleQuestionId,
            ':quiz_id' => $quizId,
            ':question_type' => $questionData['type'],
            ':question_text' => $questionData['text'],
            ':options' => json_encode($questionData['options']),
            ':correct_answer' => $questionData['correct_answer'],
            ':difficulty' => $questionData['difficulty'] ?? 'medium'
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Get cached question
     */
    public function getCachedQuestion($moodleQuestionId) {
        $sql = "SELECT * FROM question_cache WHERE moodle_question_id = :moodle_question_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':moodle_question_id' => $moodleQuestionId]);

        $result = $stmt->fetch();
        if ($result && isset($result['options'])) {
            $result['options'] = json_decode($result['options'], true);
        }

        return $result;
    }

    /**
     * Get questions by quiz ID
     */
    public function getQuestionsByQuizId($quizId) {
        $sql = "SELECT * FROM question_cache WHERE quiz_id = :quiz_id ORDER BY id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':quiz_id' => $quizId]);

        $results = $stmt->fetchAll();
        foreach ($results as &$result) {
            if (isset($result['options'])) {
                $result['options'] = json_decode($result['options'], true);
            }
        }

        return $results;
    }

    /**
     * Create quiz session
     */
    public function createSession($userId, $moodleQuizId, $totalQuestions) {
        $sql = "INSERT INTO quiz_sessions (user_id, moodle_quiz_id, total_questions)
                VALUES (:user_id, :moodle_quiz_id, :total_questions)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':moodle_quiz_id' => $moodleQuizId,
            ':total_questions' => $totalQuestions
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Record question attempt
     */
    public function recordAttempt($sessionId, $moodleQuestionId, $questionText, $userAnswer, $correctAnswer, $timeSpent) {
        $isCorrect = strtolower(trim($userAnswer)) === strtolower(trim($correctAnswer));

        $sql = "INSERT INTO question_attempts
                (session_id, moodle_question_id, question_text, user_answer, correct_answer, is_correct, time_spent)
                VALUES (:session_id, :moodle_question_id, :question_text, :user_answer, :correct_answer, :is_correct, :time_spent)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':session_id' => $sessionId,
            ':moodle_question_id' => $moodleQuestionId,
            ':question_text' => $questionText,
            ':user_answer' => $userAnswer,
            ':correct_answer' => $correctAnswer,
            ':is_correct' => $isCorrect ? 1 : 0,
            ':time_spent' => $timeSpent
        ]);

        $attemptId = $this->db->lastInsertId();

        // Update session statistics
        if ($isCorrect) {
            $this->updateSessionStats($sessionId);
        }

        return [
            'attempt_id' => $attemptId,
            'is_correct' => $isCorrect
        ];
    }

    /**
     * Update session statistics
     */
    private function updateSessionStats($sessionId) {
        $sql = "UPDATE quiz_sessions SET
                correct_answers = correct_answers + 1,
                score = (correct_answers / total_questions) * 100
                WHERE id = :session_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':session_id' => $sessionId]);
    }

    /**
     * Log wave effect
     */
    public function logWaveEffect($attemptId, $position, $color = '#4CAF50', $intensity = 100) {
        $sql = "INSERT INTO wave_effects (attempt_id, trigger_position, color, intensity)
                VALUES (:attempt_id, :trigger_position, :color, :intensity)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':attempt_id' => $attemptId,
            ':trigger_position' => json_encode($position),
            ':color' => $color,
            ':intensity' => $intensity
        ]);

        // Mark wave effect as triggered
        $updateSql = "UPDATE question_attempts SET wave_effect_triggered = 1 WHERE id = :attempt_id";
        $updateStmt = $this->db->prepare($updateSql);
        $updateStmt->execute([':attempt_id' => $attemptId]);

        return $this->db->lastInsertId();
    }

    /**
     * Complete session
     */
    public function completeSession($sessionId) {
        $sql = "UPDATE quiz_sessions SET completed_at = CURRENT_TIMESTAMP WHERE id = :session_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':session_id' => $sessionId]);
    }

    /**
     * Get session statistics
     */
    public function getSessionStats($sessionId) {
        $sql = "SELECT * FROM session_statistics WHERE id = :session_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':session_id' => $sessionId]);

        return $stmt->fetch();
    }
}
