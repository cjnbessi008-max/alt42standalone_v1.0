<?php
/**
 * Moodle Integration Layer for Twin Shape Glow
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 */

require_once __DIR__ . '/../config/database.php';

class MoodleIntegration {
    private $db;
    private $moodle_conn;
    private $tsg_conn;

    public function __construct() {
        $this->db = new Database();
        $this->moodle_conn = $this->db->getMoodleConnection();
        $this->tsg_conn = $this->db->getTSGConnection();
    }

    /**
     * Get question from Moodle by ID
     */
    public function getQuestion($question_id) {
        $prefix = MOODLE_DB_PREFIX;
        $stmt = $this->moodle_conn->prepare("
            SELECT
                q.id,
                q.category,
                q.name,
                q.questiontext,
                q.qtype,
                qc.name as category_name
            FROM {$prefix}question q
            LEFT JOIN {$prefix}question_categories qc ON q.category = qc.id
            WHERE q.id = ?
        ");

        $stmt->bind_param("i", $question_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $question = $result->fetch_assoc();
        $stmt->close();

        return $question;
    }

    /**
     * Get all questions from a specific quiz
     */
    public function getQuizQuestions($quiz_id) {
        $prefix = MOODLE_DB_PREFIX;
        $stmt = $this->moodle_conn->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.qtype,
                qs.slot,
                qs.maxmark
            FROM {$prefix}quiz_slots qs
            JOIN {$prefix}question q ON qs.questionid = q.id
            WHERE qs.quizid = ?
            ORDER BY qs.slot
        ");

        $stmt->bind_param("i", $quiz_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $questions = [];

        while ($row = $result->fetch_assoc()) {
            $questions[] = $row;
        }

        $stmt->close();
        return $questions;
    }

    /**
     * Get user info from Moodle
     */
    public function getUserInfo($user_id) {
        $prefix = MOODLE_DB_PREFIX;
        $stmt = $this->moodle_conn->prepare("
            SELECT
                id,
                username,
                firstname,
                lastname,
                email
            FROM {$prefix}user
            WHERE id = ?
        ");

        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        return $user;
    }

    /**
     * Create TSG problem from Moodle question
     */
    public function createProblemFromQuestion($question_id, $problem_type = 'shape_matching', $difficulty = 1) {
        $question = $this->getQuestion($question_id);

        if (!$question) {
            return ['error' => 'Question not found'];
        }

        // Generate shape configuration based on difficulty
        $shape_config = $this->generateShapeConfig($difficulty);
        $correct_answer = $this->generateCorrectAnswer($shape_config);

        $shape_config_json = json_encode($shape_config);
        $correct_answer_json = json_encode($correct_answer);

        $stmt = $this->tsg_conn->prepare("
            INSERT INTO tsg_problems
            (moodle_question_id, problem_type, difficulty, shape_config, correct_answer, time_limit)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $time_limit = 60 + ($difficulty * 30); // More time for harder problems
        $stmt->bind_param("isiss i",
            $question_id,
            $problem_type,
            $difficulty,
            $shape_config_json,
            $correct_answer_json,
            $time_limit
        );

        $success = $stmt->execute();
        $problem_id = $this->tsg_conn->insert_id;
        $stmt->close();

        if ($success) {
            return [
                'success' => true,
                'problem_id' => $problem_id,
                'question' => $question,
                'config' => $shape_config
            ];
        } else {
            return ['error' => 'Failed to create problem'];
        }
    }

    /**
     * Generate shape configuration for the game
     */
    private function generateShapeConfig($difficulty) {
        $num_pairs = 2 + $difficulty; // 3-6 pairs based on difficulty
        $shapes = [];

        $stmt = $this->tsg_conn->prepare("
            SELECT * FROM tsg_shapes
            ORDER BY RAND()
            LIMIT ?
        ");

        $limit = $num_pairs * 2;
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $shape_data = [];
        while ($row = $result->fetch_assoc()) {
            $shape_data[] = $row;
        }
        $stmt->close();

        // Create pairs
        for ($i = 0; $i < count($shape_data); $i += 2) {
            if (isset($shape_data[$i]) && isset($shape_data[$i + 1])) {
                $pair_id = floor($i / 2) + 1;

                $shapes[] = [
                    'id' => 'shape_' . ($i + 1),
                    'pair_id' => $pair_id,
                    'type' => $shape_data[$i]['shape_type'],
                    'svg_path' => $shape_data[$i]['svg_path'],
                    'position' => $this->randomPosition(),
                    'similarity_group' => $shape_data[$i]['similarity_group']
                ];

                $shapes[] = [
                    'id' => 'shape_' . ($i + 2),
                    'pair_id' => $pair_id,
                    'type' => $shape_data[$i + 1]['shape_type'],
                    'svg_path' => $shape_data[$i + 1]['svg_path'],
                    'position' => $this->randomPosition(),
                    'similarity_group' => $shape_data[$i + 1]['similarity_group']
                ];
            }
        }

        shuffle($shapes); // Randomize positions

        return [
            'shapes' => $shapes,
            'num_pairs' => $num_pairs,
            'difficulty' => $difficulty
        ];
    }

    /**
     * Generate correct answer pairs
     */
    private function generateCorrectAnswer($shape_config) {
        $pairs = [];

        foreach ($shape_config['shapes'] as $shape) {
            if (!isset($pairs[$shape['pair_id']])) {
                $pairs[$shape['pair_id']] = [];
            }
            $pairs[$shape['pair_id']][] = $shape['id'];
        }

        return array_values($pairs);
    }

    /**
     * Generate random position on screen
     */
    private function randomPosition() {
        return [
            'x' => rand(10, 90),
            'y' => rand(10, 90)
        ];
    }

    /**
     * Record user progress
     */
    public function recordProgress($user_id, $problem_id, $score, $time_spent, $completed = false) {
        $stmt = $this->tsg_conn->prepare("
            INSERT INTO tsg_user_progress
            (moodle_user_id, problem_id, attempts, completed, score, time_spent, last_attempt_at)
            VALUES (?, ?, 1, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                attempts = attempts + 1,
                completed = ?,
                score = GREATEST(score, ?),
                time_spent = time_spent + ?,
                last_attempt_at = NOW()
        ");

        $stmt->bind_param("iidididd",
            $user_id,
            $problem_id,
            $completed,
            $score,
            $time_spent,
            $completed,
            $score,
            $time_spent
        );

        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    /**
     * Get user progress for a problem
     */
    public function getUserProgress($user_id, $problem_id) {
        $stmt = $this->tsg_conn->prepare("
            SELECT * FROM tsg_user_progress
            WHERE moodle_user_id = ? AND problem_id = ?
        ");

        $stmt->bind_param("ii", $user_id, $problem_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $progress = $result->fetch_assoc();
        $stmt->close();

        return $progress;
    }

    public function __destruct() {
        $this->db->close();
    }
}
?>
