<?php
/**
 * Question Service
 * Handles retrieval of multiple choice questions from Moodle database
 *
 * Compatible with Moodle 3.7
 */

namespace ALT42\Services;

use ALT42\Database\Connection;

class QuestionService {
    private $db;
    private $prefix;
    private $config;

    public function __construct() {
        $connection = Connection::getInstance();
        $this->db = $connection->getConnection();
        $this->prefix = $connection->getPrefix();
        $this->config = require __DIR__ . '/../../config/config.php';
    }

    /**
     * Get multiple choice questions
     *
     * @param int $limit Number of questions to retrieve
     * @param int $offset Offset for pagination
     * @param int $categoryId Optional category filter
     * @return array Array of questions with choices
     */
    public function getMultipleChoiceQuestions($limit = 10, $offset = 0, $categoryId = null) {
        $sql = "
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.category as category_id,
                qc.name as category_name,
                q.defaultmark as points,
                q.timecreated,
                q.timemodified
            FROM {$this->prefix}question q
            LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
            WHERE q.qtype = 'multichoice'
                AND q.hidden = 0
        ";

        $params = [];

        if ($categoryId !== null) {
            $sql .= " AND q.category = :category_id";
            $params['category_id'] = $categoryId;
        }

        $sql .= " ORDER BY q.timecreated DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', (int)$limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, \PDO::PARAM_INT);

        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }

        $stmt->execute();
        $questions = $stmt->fetchAll();

        // Get choices for each question
        foreach ($questions as &$question) {
            $question['choices'] = $this->getQuestionChoices($question['id']);
            $question['questiontext'] = $this->cleanQuestionText($question['questiontext']);
        }

        return $questions;
    }

    /**
     * Get a single question by ID
     *
     * @param int $questionId
     * @return array|null Question with choices
     */
    public function getQuestion($questionId) {
        $sql = "
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.category as category_id,
                qc.name as category_name,
                q.defaultmark as points,
                q.timecreated,
                q.timemodified
            FROM {$this->prefix}question q
            LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
            WHERE q.id = :id AND q.qtype = 'multichoice'
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $questionId]);
        $question = $stmt->fetch();

        if ($question) {
            $question['choices'] = $this->getQuestionChoices($question['id']);
            $question['questiontext'] = $this->cleanQuestionText($question['questiontext']);
        }

        return $question;
    }

    /**
     * Get choices for a question
     *
     * @param int $questionId
     * @return array Array of answer choices
     */
    private function getQuestionChoices($questionId) {
        $sql = "
            SELECT
                qa.id,
                qa.answer,
                qa.fraction,
                qa.feedback
            FROM {$this->prefix}question_answers qa
            WHERE qa.question = :question_id
            ORDER BY qa.id ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['question_id' => $questionId]);
        $choices = $stmt->fetchAll();

        // Process choices
        foreach ($choices as &$choice) {
            $choice['answer'] = $this->cleanQuestionText($choice['answer']);
            $choice['feedback'] = $this->cleanQuestionText($choice['feedback']);
            $choice['is_correct'] = ($choice['fraction'] > 0);
        }

        return $choices;
    }

    /**
     * Get question categories
     *
     * @return array Array of categories
     */
    public function getCategories() {
        $sql = "
            SELECT
                id,
                name,
                parent,
                contextid,
                info,
                infoformat
            FROM {$this->prefix}question_categories
            WHERE parent > 0
            ORDER BY name ASC
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * Get random multiple choice question
     *
     * @param int $categoryId Optional category filter
     * @return array|null Random question with choices
     */
    public function getRandomQuestion($categoryId = null) {
        $sql = "
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.category as category_id,
                qc.name as category_name,
                q.defaultmark as points
            FROM {$this->prefix}question q
            LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
            WHERE q.qtype = 'multichoice'
                AND q.hidden = 0
        ";

        $params = [];

        if ($categoryId !== null) {
            $sql .= " AND q.category = :category_id";
            $params['category_id'] = $categoryId;
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $question = $stmt->fetch();

        if ($question) {
            $question['choices'] = $this->getQuestionChoices($question['id']);
            $question['questiontext'] = $this->cleanQuestionText($question['questiontext']);
        }

        return $question;
    }

    /**
     * Clean question text (remove HTML tags, decode entities)
     *
     * @param string $text
     * @return string
     */
    private function cleanQuestionText($text) {
        // Remove HTML tags
        $text = strip_tags($text);

        // Decode HTML entities
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Trim whitespace
        $text = trim($text);

        return $text;
    }

    /**
     * Get total count of multiple choice questions
     *
     * @param int $categoryId Optional category filter
     * @return int
     */
    public function getQuestionCount($categoryId = null) {
        $sql = "
            SELECT COUNT(*) as count
            FROM {$this->prefix}question q
            WHERE q.qtype = 'multichoice'
                AND q.hidden = 0
        ";

        $params = [];

        if ($categoryId !== null) {
            $sql .= " AND q.category = :category_id";
            $params['category_id'] = $categoryId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();

        return (int)$result['count'];
    }
}
