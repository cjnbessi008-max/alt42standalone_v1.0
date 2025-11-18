<?php
/**
 * Question Service - Moodle Question Retrieval
 *
 * Efficiently retrieves and displays questions from Moodle 3.7 database
 * Optimized queries to avoid "과한 계산" (excessive computation)
 */

namespace MoodleIntegration\Services;

use MoodleIntegration\Database\Connection;

class QuestionService
{
    private $db;
    private $cache;
    private $config;
    private $prefix;

    public function __construct(Connection $db, CacheService $cache, array $config)
    {
        $this->db = $db;
        $this->cache = $cache;
        $this->config = $config;
        $this->prefix = $db->getPrefix();
    }

    /**
     * Get questions with efficient caching
     *
     * @param array $options Query options (category, limit, offset, etc.)
     * @return array Questions list
     */
    public function getQuestions(array $options = [])
    {
        $cacheKey = 'questions_' . md5(json_encode($options));

        return $this->cache->remember($cacheKey, function() use ($options) {
            return $this->fetchQuestionsFromDatabase($options);
        });
    }

    /**
     * Fetch questions from database with optimized query
     */
    private function fetchQuestionsFromDatabase(array $options = [])
    {
        $limit = $options['limit'] ?? $this->config['display']['per_page'];
        $offset = $options['offset'] ?? 0;
        $categoryId = $options['category'] ?? $this->config['display']['default_category'];
        $orderBy = $options['order_by'] ?? $this->config['display']['order_by'];
        $orderDir = $options['order_direction'] ?? $this->config['display']['order_direction'];

        // Build optimized query - only select necessary fields
        $query = "
            SELECT
                q.id,
                q.category AS category_id,
                q.name,
                q.questiontext,
                q.questiontextformat,
                q.qtype,
                q.defaultmark,
                q.timecreated,
                q.timemodified,
                qc.name AS category_name,
                qc.info AS category_info
            FROM {$this->prefix}question q
            LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
            WHERE q.parent = 0
        ";

        $params = [];

        // Filter by category if specified
        if ($categoryId !== null) {
            $query .= " AND q.category = :category_id";
            $params['category_id'] = $categoryId;
        }

        // Filter hidden questions if configured
        if (!$this->config['display']['show_hidden']) {
            $query .= " AND q.hidden = 0";
        }

        // Add ordering
        $allowedOrderFields = ['name', 'timecreated', 'timemodified', 'qtype'];
        $orderByField = in_array($orderBy, $allowedOrderFields) ? $orderBy : 'name';
        $orderDirection = strtoupper($orderDir) === 'DESC' ? 'DESC' : 'ASC';

        $query .= " ORDER BY q.{$orderByField} {$orderDirection}";

        // Add limit and offset for pagination
        $query .= " LIMIT :limit OFFSET :offset";
        $params['limit'] = (int) $limit;
        $params['offset'] = (int) $offset;

        return $this->db->fetchAll($query, $params);
    }

    /**
     * Get single question by ID
     */
    public function getQuestionById($questionId)
    {
        $cacheKey = 'question_' . $questionId;

        return $this->cache->remember($cacheKey, function() use ($questionId) {
            $query = "
                SELECT
                    q.*,
                    qc.name AS category_name,
                    qc.info AS category_info
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.id = :question_id
                LIMIT 1
            ";

            return $this->db->fetchOne($query, ['question_id' => $questionId]);
        });
    }

    /**
     * Get total question count
     */
    public function getTotalCount(array $options = [])
    {
        $cacheKey = 'question_count_' . md5(json_encode($options));

        return $this->cache->remember($cacheKey, function() use ($options) {
            $categoryId = $options['category'] ?? $this->config['display']['default_category'];

            $query = "
                SELECT COUNT(*)
                FROM {$this->prefix}question q
                WHERE q.parent = 0
            ";

            $params = [];

            if ($categoryId !== null) {
                $query .= " AND q.category = :category_id";
                $params['category_id'] = $categoryId;
            }

            if (!$this->config['display']['show_hidden']) {
                $query .= " AND q.hidden = 0";
            }

            return $this->db->count($query, $params);
        });
    }

    /**
     * Get all question categories
     */
    public function getCategories()
    {
        $cacheKey = 'question_categories';

        return $this->cache->remember($cacheKey, function() {
            $query = "
                SELECT
                    id,
                    name,
                    info,
                    parent,
                    (SELECT COUNT(*) FROM {$this->prefix}question WHERE category = qc.id AND parent = 0) AS question_count
                FROM {$this->prefix}question_categories qc
                ORDER BY name ASC
            ";

            return $this->db->fetchAll($query);
        });
    }

    /**
     * Get questions by quiz ID
     */
    public function getQuestionsByQuiz($quizId)
    {
        $cacheKey = 'quiz_questions_' . $quizId;

        return $this->cache->remember($cacheKey, function() use ($quizId) {
            $query = "
                SELECT
                    q.id,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark,
                    qs.slot,
                    qs.page,
                    qs.maxmark
                FROM {$this->prefix}quiz_slots qs
                JOIN {$this->prefix}question q ON qs.questionid = q.id
                WHERE qs.quizid = :quiz_id
                ORDER BY qs.slot ASC
            ";

            return $this->db->fetchAll($query, ['quiz_id' => $quizId]);
        });
    }

    /**
     * Format question text (handle different formats)
     */
    public function formatQuestionText($questionText, $format = 1)
    {
        // Format types in Moodle:
        // 0 = MOODLE, 1 = HTML, 2 = PLAIN, 4 = MARKDOWN

        switch ($format) {
            case 2: // PLAIN
                return nl2br(htmlspecialchars($questionText));
            case 1: // HTML
            default:
                // Basic sanitization for security
                return strip_tags($questionText, '<p><br><b><i><u><ul><ol><li><strong><em>');
        }
    }
}
