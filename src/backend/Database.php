<?php
/**
 * Database Connection Class
 * MySQL 5.7 / PHP 7.1.9 Compatible
 */

class Database {
    private $conn;

    public function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }

    public function getConnection() {
        return $this->conn;
    }

    /**
     * Get function digest by problem ID
     */
    public function getDigestByProblemId($problemId) {
        $stmt = $this->conn->prepare("
            SELECT
                fd.*,
                p.question_text,
                p.moodle_question_id
            FROM function_digests fd
            JOIN problems p ON fd.problem_id = p.id
            WHERE fd.problem_id = :problem_id
            ORDER BY fd.created_at DESC
        ");

        $stmt->execute(['problem_id' => $problemId]);
        return $stmt->fetchAll();
    }

    /**
     * Get function digest by Moodle question ID
     */
    public function getDigestByMoodleQuestionId($moodleQuestionId) {
        $stmt = $this->conn->prepare("
            SELECT
                fd.*,
                p.question_text,
                p.moodle_question_id
            FROM function_digests fd
            JOIN problems p ON fd.problem_id = p.id
            WHERE p.moodle_question_id = :moodle_question_id
            ORDER BY fd.created_at DESC
        ");

        $stmt->execute(['moodle_question_id' => $moodleQuestionId]);
        return $stmt->fetchAll();
    }

    /**
     * Create a new function digest
     */
    public function createDigest($problemId, $functionName, $functionCode, $line1, $line2, $line3, $language = 'python') {
        $stmt = $this->conn->prepare("
            INSERT INTO function_digests
            (problem_id, function_name, function_code, summary_line1, summary_line2, summary_line3, language)
            VALUES
            (:problem_id, :function_name, :function_code, :line1, :line2, :line3, :language)
        ");

        return $stmt->execute([
            'problem_id' => $problemId,
            'function_name' => $functionName,
            'function_code' => $functionCode,
            'line1' => $line1,
            'line2' => $line2,
            'line3' => $line3,
            'language' => $language
        ]);
    }

    /**
     * Log user digest view
     */
    public function logDigestView($moodleUserId, $digestId) {
        $stmt = $this->conn->prepare("
            INSERT INTO user_digest_views (moodle_user_id, digest_id)
            VALUES (:user_id, :digest_id)
        ");

        return $stmt->execute([
            'user_id' => $moodleUserId,
            'digest_id' => $digestId
        ]);
    }
}
