<?php
/**
 * Question Model
 * Trap Detection LMS
 */

require_once __DIR__ . '/Database.php';

class Question {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get question by ID
     */
    public function findById($id) {
        $sql = "SELECT * FROM questions WHERE id = ?";
        return $this->db->fetchOne($sql, [$id]);
    }

    /**
     * Get question by Moodle question ID
     */
    public function findByMoodleId($moodleQuestionId) {
        $sql = "SELECT * FROM questions WHERE moodle_question_id = ?";
        return $this->db->fetchOne($sql, [$moodleQuestionId]);
    }

    /**
     * Get all questions for a quiz
     */
    public function getByQuizId($quizId) {
        $sql = "SELECT * FROM questions WHERE quiz_id = ? ORDER BY id";
        return $this->db->fetchAll($sql, [$quizId]);
    }

    /**
     * Get questions by topic
     */
    public function getByTopic($topic) {
        $sql = "SELECT * FROM questions WHERE topic = ? ORDER BY difficulty_level, id";
        return $this->db->fetchAll($sql, [$topic]);
    }

    /**
     * Create new question
     */
    public function create($data) {
        $sql = "INSERT INTO questions (
            moodle_question_id, quiz_id, question_text, question_type,
            difficulty_level, subject, topic, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $data['moodle_question_id'] ?? null,
            $data['quiz_id'] ?? null,
            $data['question_text'],
            $data['question_type'] ?? 'multichoice',
            $data['difficulty_level'] ?? 1,
            $data['subject'] ?? 'mathematics',
            $data['topic'] ?? null,
            $data['created_by'] ?? null,
        ];

        $this->db->execute($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * Update question
     */
    public function update($id, $data) {
        $fields = [];
        $params = [];

        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $fields[] = "$key = ?";
                $params[] = $value;
            }
        }

        $params[] = $id;
        $sql = "UPDATE questions SET " . implode(', ', $fields) . " WHERE id = ?";

        return $this->db->execute($sql, $params);
    }

    /**
     * Delete question
     */
    public function delete($id) {
        $sql = "DELETE FROM questions WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }

    /**
     * Get question with options
     */
    public function getWithOptions($id) {
        $question = $this->findById($id);
        if (!$question) {
            return null;
        }

        $sql = "SELECT * FROM question_options WHERE question_id = ? ORDER BY option_order";
        $question['options'] = $this->db->fetchAll($sql, [$id]);

        return $question;
    }

    /**
     * Get question with traps
     */
    public function getWithTraps($id) {
        $question = $this->getWithOptions($id);
        if (!$question) {
            return null;
        }

        $sql = "SELECT t.*, COUNT(ti.id) as incident_count
                FROM traps t
                LEFT JOIN trap_incidents ti ON t.id = ti.trap_id
                WHERE t.question_id = ? AND t.is_active = 1
                GROUP BY t.id
                ORDER BY t.severity DESC, incident_count DESC";

        $question['traps'] = $this->db->fetchAll($sql, [$id]);

        return $question;
    }

    /**
     * Get questions with high trap rates
     */
    public function getQuestionsWithHighTrapRates($limit = 10) {
        $sql = "SELECT q.*, COUNT(DISTINCT ti.id) as trap_incident_count,
                COUNT(DISTINCT t.id) as trap_count
                FROM questions q
                INNER JOIN traps t ON q.id = t.question_id
                LEFT JOIN trap_incidents ti ON t.id = ti.trap_id
                WHERE t.is_active = 1
                GROUP BY q.id
                HAVING trap_incident_count > 0
                ORDER BY trap_incident_count DESC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$limit]);
    }

    /**
     * Search questions
     */
    public function search($keyword, $filters = []) {
        $sql = "SELECT * FROM questions WHERE 1=1";
        $params = [];

        if (!empty($keyword)) {
            $sql .= " AND question_text LIKE ?";
            $params[] = "%$keyword%";
        }

        if (!empty($filters['subject'])) {
            $sql .= " AND subject = ?";
            $params[] = $filters['subject'];
        }

        if (!empty($filters['topic'])) {
            $sql .= " AND topic = ?";
            $params[] = $filters['topic'];
        }

        if (!empty($filters['difficulty_level'])) {
            $sql .= " AND difficulty_level = ?";
            $params[] = $filters['difficulty_level'];
        }

        $sql .= " ORDER BY id DESC";

        return $this->db->fetchAll($sql, $params);
    }
}
