<?php
/**
 * Question Model
 * Fetch questions from Moodle database
 */

require_once __DIR__ . '/../config/database.php';

class Question {

    private $db;
    private $prefix;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->prefix = Database::getPrefix();
    }

    /**
     * Get question by ID from Moodle
     *
     * @param int $questionId
     * @return array|null
     */
    public function getById($questionId) {
        $sql = "SELECT
                    q.id,
                    q.category,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark,
                    q.generalfeedback,
                    qc.name as categoryname
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $questionId]);
        $question = $stmt->fetch();

        if ($question) {
            // Fetch answers if multiple choice
            if ($question['qtype'] === 'multichoice') {
                $question['answers'] = $this->getAnswers($questionId);
            }
        }

        return $question;
    }

    /**
     * Get answers for multiple choice questions
     *
     * @param int $questionId
     * @return array
     */
    private function getAnswers($questionId) {
        $sql = "SELECT
                    id,
                    answer,
                    fraction,
                    feedback
                FROM {$this->prefix}question_answers
                WHERE question = :question_id
                ORDER BY id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['question_id' => $questionId]);
        return $stmt->fetchAll();
    }

    /**
     * Get random question from a category
     *
     * @param int $categoryId
     * @return array|null
     */
    public function getRandomByCategory($categoryId) {
        $sql = "SELECT
                    q.id,
                    q.category,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark,
                    q.generalfeedback
                FROM {$this->prefix}question q
                WHERE q.category = :category_id
                ORDER BY RAND()
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['category_id' => $categoryId]);
        $question = $stmt->fetch();

        if ($question && $question['qtype'] === 'multichoice') {
            $question['answers'] = $this->getAnswers($question['id']);
        }

        return $question;
    }

    /**
     * Get all categories
     *
     * @return array
     */
    public function getCategories() {
        $sql = "SELECT
                    id,
                    name,
                    parent,
                    info
                FROM {$this->prefix}question_categories
                ORDER BY name";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * Search questions by text
     *
     * @param string $searchTerm
     * @param int $limit
     * @return array
     */
    public function search($searchTerm, $limit = 10) {
        $sql = "SELECT
                    q.id,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    qc.name as categoryname
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.questiontext LIKE :search
                   OR q.name LIKE :search
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':search', "%{$searchTerm}%", PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Clean HTML from question text for display
     *
     * @param string $html
     * @return string
     */
    public static function cleanText($html) {
        // Remove HTML tags but preserve basic formatting
        $text = strip_tags($html, '<p><br><strong><em><ul><ol><li>');
        return trim($text);
    }
}
