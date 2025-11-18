<?php
/**
 * LearningSession Model
 * Represents a student's quiz attempt session
 */

require_once __DIR__ . '/../config/database.php';

class LearningSession {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Create a new learning session
     */
    public function create($data) {
        $sessionData = [
            'moodle_user_id' => $data['moodle_user_id'],
            'moodle_quiz_id' => $data['moodle_quiz_id'],
            'moodle_attempt_id' => $data['moodle_attempt_id'],
            'student_name' => $data['student_name'],
            'quiz_name' => $data['quiz_name'],
            'total_questions' => $data['total_questions'] ?? 0,
            'correct_answers' => $data['correct_answers'] ?? 0,
            'score' => $data['score'] ?? null,
            'status' => $data['status'] ?? 'in_progress'
        ];

        if (isset($data['started_at'])) {
            $sessionData['started_at'] = $data['started_at'];
        }

        if (isset($data['completed_at'])) {
            $sessionData['completed_at'] = $data['completed_at'];
        }

        return $this->db->insert('learning_sessions', $sessionData);
    }

    /**
     * Get session by ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM learning_sessions WHERE id = ?";
        return $this->db->fetchOne($sql, [$id]);
    }

    /**
     * Get session by Moodle attempt ID
     */
    public function getByAttemptId($attemptId) {
        $sql = "SELECT * FROM learning_sessions WHERE moodle_attempt_id = ?";
        return $this->db->fetchOne($sql, [$attemptId]);
    }

    /**
     * Get all sessions for a user
     */
    public function getByUserId($userId, $limit = 20) {
        $sql = "SELECT * FROM learning_sessions
                WHERE moodle_user_id = ?
                ORDER BY created_at DESC
                LIMIT ?";
        return $this->db->fetchAll($sql, [$userId, $limit]);
    }

    /**
     * Get all sessions for a quiz
     */
    public function getByQuizId($quizId, $limit = 50) {
        $sql = "SELECT * FROM learning_sessions
                WHERE moodle_quiz_id = ?
                ORDER BY created_at DESC
                LIMIT ?";
        return $this->db->fetchAll($sql, [$quizId, $limit]);
    }

    /**
     * Update session
     */
    public function update($id, $data) {
        return $this->db->update('learning_sessions', $data, 'id = ?', [$id]);
    }

    /**
     * Mark session as completed
     */
    public function markCompleted($id, $score = null) {
        $data = [
            'status' => 'completed',
            'completed_at' => date('Y-m-d H:i:s')
        ];

        if ($score !== null) {
            $data['score'] = $score;
        }

        return $this->update($id, $data);
    }

    /**
     * Add question response to session
     */
    public function addQuestionResponse($sessionId, $questionData) {
        $data = [
            'session_id' => $sessionId,
            'moodle_question_id' => $questionData['moodle_question_id'],
            'question_text' => $questionData['question_text'],
            'question_type' => $questionData['question_type'],
            'student_answer' => $questionData['student_answer'] ?? null,
            'correct_answer' => $questionData['correct_answer'] ?? null,
            'is_correct' => $questionData['is_correct'] ? 1 : 0,
            'points_earned' => $questionData['points_earned'] ?? 0,
            'max_points' => $questionData['max_points'] ?? 0,
            'time_spent_seconds' => $questionData['time_spent_seconds'] ?? null,
            'attempt_count' => $questionData['attempt_count'] ?? 1
        ];

        return $this->db->insert('question_responses', $data);
    }

    /**
     * Get all question responses for a session
     */
    public function getQuestionResponses($sessionId) {
        $sql = "SELECT * FROM question_responses
                WHERE session_id = ?
                ORDER BY id ASC";
        return $this->db->fetchAll($sql, [$sessionId]);
    }

    /**
     * Get session with all related data (questions, summary, reflection)
     */
    public function getFullSession($sessionId) {
        $session = $this->getById($sessionId);

        if (!$session) {
            return null;
        }

        // Get question responses
        $session['questions'] = $this->getQuestionResponses($sessionId);

        // Get learning summary
        $sql = "SELECT * FROM learning_summaries WHERE session_id = ? LIMIT 1";
        $session['summary'] = $this->db->fetchOne($sql, [$sessionId]);

        // Get student reflection
        $sql = "SELECT * FROM student_reflections WHERE session_id = ? LIMIT 1";
        $session['reflection'] = $this->db->fetchOne($sql, [$sessionId]);

        return $session;
    }

    /**
     * Get sessions with summaries for dashboard
     */
    public function getSessionsWithSummaries($userId, $limit = 10) {
        $sql = "SELECT
                    ls.*,
                    lsum.concepts_learned,
                    lsum.strengths,
                    lsum.recommendations,
                    lsum.generated_at as summary_generated_at
                FROM learning_sessions ls
                LEFT JOIN learning_summaries lsum ON ls.id = lsum.session_id
                WHERE ls.moodle_user_id = ?
                ORDER BY ls.created_at DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$userId, $limit]);
    }

    /**
     * Delete session and all related data
     */
    public function delete($id) {
        // Foreign key constraints will cascade delete related data
        return $this->db->delete('learning_sessions', 'id = ?', [$id]);
    }

    /**
     * Get statistics for a user
     */
    public function getUserStatistics($userId) {
        $sql = "SELECT
                    COUNT(*) as total_sessions,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
                    AVG(score) as average_score,
                    SUM(total_questions) as total_questions_attempted,
                    SUM(correct_answers) as total_correct_answers
                FROM learning_sessions
                WHERE moodle_user_id = ?";

        return $this->db->fetchOne($sql, [$userId]);
    }

    /**
     * Get recent activity
     */
    public function getRecentActivity($limit = 20) {
        $sql = "SELECT
                    ls.*,
                    COUNT(DISTINCT lsum.id) as has_summary,
                    COUNT(DISTINCT sr.id) as has_reflection
                FROM learning_sessions ls
                LEFT JOIN learning_summaries lsum ON ls.id = lsum.session_id
                LEFT JOIN student_reflections sr ON ls.id = sr.session_id
                WHERE ls.status = 'completed'
                GROUP BY ls.id
                ORDER BY ls.completed_at DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$limit]);
    }

    /**
     * Check if session exists for attempt
     */
    public function existsForAttempt($attemptId) {
        $sql = "SELECT COUNT(*) as count FROM learning_sessions WHERE moodle_attempt_id = ?";
        $result = $this->db->fetchOne($sql, [$attemptId]);
        return $result['count'] > 0;
    }
}
