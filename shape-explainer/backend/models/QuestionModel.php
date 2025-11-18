<?php
/**
 * Question Model
 * Handles Moodle questions and student progress
 */

require_once __DIR__ . '/../config/database.php';

class QuestionModel {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get or create question from Moodle
     */
    public function getOrCreateQuestion($moodleQuestionId, $questionData) {
        // Check if question exists
        $sql = "SELECT * FROM moodle_questions WHERE moodle_question_id = :moodle_id";
        $question = $this->db->fetchOne($sql, ['moodle_id' => $moodleQuestionId]);

        if ($question) {
            return $question;
        }

        // Create new question
        $data = [
            'moodle_question_id' => $moodleQuestionId,
            'moodle_course_id' => $questionData['course_id'],
            'shape_type_id' => $questionData['shape_type_id'],
            'question_text' => $questionData['question_text'],
            'question_type' => $questionData['question_type'],
            'difficulty_level' => $questionData['difficulty_level'] ?? 1,
            'animation_config' => isset($questionData['animation_config'])
                ? json_encode($questionData['animation_config'])
                : null
        ];

        $questionId = $this->db->insert('moodle_questions', $data);
        return $this->getQuestionById($questionId);
    }

    /**
     * Get question by ID
     */
    public function getQuestionById($questionId) {
        $sql = "SELECT * FROM moodle_questions WHERE id = :id";
        return $this->db->fetchOne($sql, ['id' => $questionId]);
    }

    /**
     * Get question by Moodle question ID
     */
    public function getQuestionByMoodleId($moodleQuestionId) {
        $sql = "SELECT * FROM moodle_questions WHERE moodle_question_id = :moodle_id";
        return $this->db->fetchOne($sql, ['moodle_id' => $moodleQuestionId]);
    }

    /**
     * Start student progress tracking
     */
    public function startProgress($userId, $moodleQuestionId) {
        $question = $this->getQuestionByMoodleId($moodleQuestionId);

        if (!$question) {
            throw new Exception("Question not found");
        }

        $data = [
            'moodle_user_id' => $userId,
            'moodle_question_id' => $question['id'],
            'shape_type_id' => $question['shape_type_id'],
            'started_at' => date('Y-m-d H:i:s')
        ];

        return $this->db->insert('student_progress', $data);
    }

    /**
     * Update progress
     */
    public function updateProgress($progressId, $data) {
        // Handle completed_at if marking as complete
        if (isset($data['completed']) && $data['completed']) {
            $data['completed_at'] = date('Y-m-d H:i:s');
            unset($data['completed']);
        }

        return $this->db->update(
            'student_progress',
            $data,
            'id = :id',
            ['id' => $progressId]
        );
    }

    /**
     * Get student progress
     */
    public function getProgress($userId, $moodleQuestionId) {
        $sql = "
            SELECT sp.*, mq.question_text, mq.question_type, st.name_ko as shape_name
            FROM student_progress sp
            JOIN moodle_questions mq ON sp.moodle_question_id = mq.id
            JOIN shape_types st ON sp.shape_type_id = st.id
            WHERE sp.moodle_user_id = :user_id
            AND mq.moodle_question_id = :moodle_question_id
            ORDER BY sp.started_at DESC
            LIMIT 1
        ";

        return $this->db->fetchOne($sql, [
            'user_id' => $userId,
            'moodle_question_id' => $moodleQuestionId
        ]);
    }

    /**
     * Get all progress for a user
     */
    public function getUserProgress($userId, $limit = 10) {
        $sql = "
            SELECT sp.*, mq.question_text, st.name_ko as shape_name
            FROM student_progress sp
            JOIN moodle_questions mq ON sp.moodle_question_id = mq.id
            JOIN shape_types st ON sp.shape_type_id = st.id
            WHERE sp.moodle_user_id = :user_id
            ORDER BY sp.started_at DESC
            LIMIT :limit
        ";

        return $this->db->fetchAll($sql, [
            'user_id' => $userId,
            'limit' => $limit
        ]);
    }

    /**
     * Complete progress with score
     */
    public function completeProgress($progressId, $score, $timeSpent) {
        $data = [
            'completed_at' => date('Y-m-d H:i:s'),
            'score' => $score,
            'time_spent' => $timeSpent
        ];

        return $this->updateProgress($progressId, $data);
    }

    /**
     * Track animation view
     */
    public function trackAnimationView($progressId) {
        return $this->updateProgress($progressId, [
            'animation_viewed' => true
        ]);
    }

    /**
     * Increment interaction count
     */
    public function incrementInteraction($progressId) {
        $sql = "
            UPDATE student_progress
            SET interaction_count = interaction_count + 1
            WHERE id = :id
        ";

        return $this->db->query($sql, ['id' => $progressId]);
    }

    /**
     * Get statistics for a question
     */
    public function getQuestionStats($moodleQuestionId) {
        $sql = "
            SELECT
                COUNT(*) as total_attempts,
                AVG(score) as avg_score,
                AVG(time_spent) as avg_time,
                SUM(CASE WHEN animation_viewed = 1 THEN 1 ELSE 0 END) as animation_views
            FROM student_progress sp
            JOIN moodle_questions mq ON sp.moodle_question_id = mq.id
            WHERE mq.moodle_question_id = :moodle_question_id
            AND sp.completed_at IS NOT NULL
        ";

        return $this->db->fetchOne($sql, ['moodle_question_id' => $moodleQuestionId]);
    }
}
