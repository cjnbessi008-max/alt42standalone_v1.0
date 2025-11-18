<?php
/**
 * Calm Growth App - Moodle LMS Integration
 * Connects to Moodle 3.7 database to fetch question/problem data
 */

require_once 'config.php';

class MoodleAPI {
    private $db;
    private $prefix;

    public function __construct() {
        $this->db = getDBConnection(true); // Connect to Moodle DB
        $this->prefix = MOODLE_DB_PREFIX;
    }

    /**
     * Get questions from Moodle quiz
     * @param int $quizId - Moodle quiz ID
     * @return array
     */
    public function getQuizQuestions($quizId) {
        try {
            $sql = "
                SELECT
                    q.id,
                    q.name as title,
                    q.questiontext as description,
                    q.qtype as question_type,
                    qc.name as category,
                    q.defaultmark as max_grade,
                    q.timecreated,
                    q.timemodified
                FROM {$this->prefix}question q
                INNER JOIN {$this->prefix}quiz_slots qs ON q.id = qs.questionid
                INNER JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE qs.quizid = :quiz_id
                ORDER BY qs.slot
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute(['quiz_id' => $quizId]);

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Failed to fetch quiz questions: " . $e->getMessage());
        }
    }

    /**
     * Get all available quizzes
     * @return array
     */
    public function getQuizzes() {
        try {
            $sql = "
                SELECT
                    q.id,
                    q.name,
                    q.intro as description,
                    q.timeopen,
                    q.timeclose,
                    c.fullname as course_name,
                    COUNT(qs.id) as question_count
                FROM {$this->prefix}quiz q
                INNER JOIN {$this->prefix}course c ON q.course = c.id
                LEFT JOIN {$this->prefix}quiz_slots qs ON q.id = qs.quizid
                GROUP BY q.id
                ORDER BY q.timemodified DESC
                LIMIT 50
            ";

            $stmt = $this->db->query($sql);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Failed to fetch quizzes: " . $e->getMessage());
        }
    }

    /**
     * Get question by ID
     * @param int $questionId
     * @return array|null
     */
    public function getQuestion($questionId) {
        try {
            $sql = "
                SELECT
                    q.id,
                    q.name as title,
                    q.questiontext as description,
                    q.qtype as question_type,
                    qc.name as category,
                    q.defaultmark as max_grade,
                    q.timecreated,
                    q.timemodified
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.id = :question_id
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute(['question_id' => $questionId]);

            return $stmt->fetch();
        } catch (PDOException $e) {
            throw new Exception("Failed to fetch question: " . $e->getMessage());
        }
    }

    /**
     * Get user attempt data for Calm Growth calculation
     * @param int $userId
     * @param int $quizId
     * @return array
     */
    public function getUserAttempts($userId, $quizId) {
        try {
            $sql = "
                SELECT
                    qa.id as attempt_id,
                    qa.attempt as attempt_number,
                    qa.sumgrades as score,
                    qa.timefinish,
                    qa.timestart,
                    q.sumgrades as max_score
                FROM {$this->prefix}quiz_attempts qa
                INNER JOIN {$this->prefix}quiz q ON qa.quiz = q.id
                WHERE qa.userid = :user_id
                AND qa.quiz = :quiz_id
                AND qa.state = 'finished'
                ORDER BY qa.timefinish DESC
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'quiz_id' => $quizId
            ]);

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Failed to fetch user attempts: " . $e->getMessage());
        }
    }

    /**
     * Sync Moodle question to local database
     * @param int $questionId
     * @return bool
     */
    public function syncQuestionToLocal($questionId) {
        try {
            $question = $this->getQuestion($questionId);
            if (!$question) {
                return false;
            }

            $localDb = getDBConnection(false);

            // Determine difficulty based on question type and max grade
            $difficulty = 'medium';
            if ($question['max_grade'] <= 1) {
                $difficulty = 'easy';
            } elseif ($question['max_grade'] >= 5) {
                $difficulty = 'hard';
            }

            // Clean HTML from description
            $description = strip_tags($question['description']);

            $sql = "
                INSERT INTO problems
                    (moodle_question_id, title, description, difficulty_level, category)
                VALUES
                    (:moodle_id, :title, :description, :difficulty, :category)
                ON DUPLICATE KEY UPDATE
                    title = :title,
                    description = :description,
                    difficulty_level = :difficulty,
                    category = :category,
                    updated_at = CURRENT_TIMESTAMP
            ";

            $stmt = $localDb->prepare($sql);
            $stmt->execute([
                'moodle_id' => $question['id'],
                'title' => $question['title'],
                'description' => $description,
                'difficulty' => $difficulty,
                'category' => $question['category'] ?? 'general'
            ]);

            return true;
        } catch (Exception $e) {
            error_log("Sync failed: " . $e->getMessage());
            return false;
        }
    }
}
