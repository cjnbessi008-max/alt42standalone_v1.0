<?php
/**
 * Moodle Connector Class
 * Handles integration with Moodle 3.7
 * Compatible with PHP 7.1.9
 */

namespace SimilarityDetector\Moodle;

use PDO;
use PDOException;

class MoodleConnector
{
    private $db;
    private $config;
    private $prefix;

    /**
     * Constructor
     * @param array $config Moodle configuration
     */
    public function __construct(array $config)
    {
        $this->config = $config;
        $this->prefix = $config['prefix'] ?? 'mdl_';
        $this->connect();
    }

    /**
     * Establish database connection
     */
    private function connect()
    {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                $this->config['host'],
                $this->config['database']
            );

            $this->db = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            throw new \Exception("Moodle database connection failed: " . $e->getMessage());
        }
    }

    /**
     * Get question by ID
     * @param int $questionId
     * @return array|null
     */
    public function getQuestion($questionId)
    {
        $sql = "SELECT q.*, qc.name as category_name
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $questionId]);

        return $stmt->fetch() ?: null;
    }

    /**
     * Get questions by category
     * @param int $categoryId
     * @param int $limit
     * @return array
     */
    public function getQuestionsByCategory($categoryId, $limit = 100)
    {
        $sql = "SELECT q.*, qc.name as category_name
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.category = :category
                ORDER BY q.id DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':category', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get questions by type
     * @param string $questionType
     * @param int $limit
     * @return array
     */
    public function getQuestionsByType($questionType, $limit = 100)
    {
        $sql = "SELECT q.*, qc.name as category_name
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.qtype = :qtype
                ORDER BY q.id DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':qtype', $questionType, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get user information
     * @param int $userId
     * @return array|null
     */
    public function getUser($userId)
    {
        $sql = "SELECT id, username, firstname, lastname, email
                FROM {$this->prefix}user
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $userId]);

        return $stmt->fetch() ?: null;
    }

    /**
     * Get quiz questions
     * @param int $quizId
     * @return array
     */
    public function getQuizQuestions($quizId)
    {
        $sql = "SELECT q.*, qs.slot, qs.page, qs.maxmark
                FROM {$this->prefix}quiz_slots qs
                INNER JOIN {$this->prefix}question q ON qs.questionid = q.id
                WHERE qs.quizid = :quizid
                ORDER BY qs.slot";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['quizid' => $quizId]);

        return $stmt->fetchAll();
    }

    /**
     * Get user quiz attempts
     * @param int $userId
     * @param int $quizId
     * @return array
     */
    public function getUserQuizAttempts($userId, $quizId)
    {
        $sql = "SELECT qa.*, q.name as quiz_name
                FROM {$this->prefix}quiz_attempts qa
                INNER JOIN {$this->prefix}quiz q ON qa.quiz = q.id
                WHERE qa.userid = :userid AND qa.quiz = :quizid
                ORDER BY qa.attempt DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['userid' => $userId, 'quizid' => $quizId]);

        return $stmt->fetchAll();
    }

    /**
     * Search questions by text
     * @param string $searchText
     * @param int $limit
     * @return array
     */
    public function searchQuestions($searchText, $limit = 50)
    {
        $sql = "SELECT q.*, qc.name as category_name
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.questiontext LIKE :search
                ORDER BY q.id DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':search', '%' . $searchText . '%', PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Check if question contains geometric content
     * @param array $question
     * @return bool
     */
    public function isGeometricQuestion(array $question)
    {
        $geometricKeywords = [
            '삼각형', '사각형', '원', '도형', '닮음', '합동',
            'triangle', 'rectangle', 'circle', 'shape', 'similar', 'congruent',
            '비율', '비', '대응', 'ratio', 'proportion'
        ];

        $text = $question['questiontext'] . ' ' . ($question['name'] ?? '');

        foreach ($geometricKeywords as $keyword) {
            if (mb_stripos($text, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }
}
