<?php
/**
 * Feature Spotlight - Moodle Integration Class
 *
 * Handles integration with Moodle 3.7 LMS
 * Retrieves problem information from Moodle database
 */

require_once 'config.php';

class MoodleIntegration {
    private $conn;
    private $prefix;

    public function __construct() {
        $this->conn = getDBConnection(DB_NAME);
        $this->prefix = MOODLE_PREFIX;
    }

    /**
     * Get problem/question by ID from Moodle
     *
     * @param int $questionId Moodle question ID
     * @return array|null Question data or null if not found
     */
    public function getQuestion($questionId) {
        $sql = "SELECT
                    q.id,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark,
                    qc.name as category_name
                FROM {$this->prefix}question q
                LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                WHERE q.id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $questionId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            // Extract mathematical function from question text
            $row['function'] = $this->extractFunction($row['questiontext']);
            return $row;
        }

        return null;
    }

    /**
     * Get all questions of a specific type (e.g., calculated, numerical)
     *
     * @param string $type Question type
     * @param int $limit Maximum number of results
     * @return array Array of questions
     */
    public function getQuestionsByType($type = 'calculated', $limit = 10) {
        $sql = "SELECT
                    q.id,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark
                FROM {$this->prefix}question q
                WHERE q.qtype = ?
                ORDER BY q.id DESC
                LIMIT ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("si", $type, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $questions = [];
        while ($row = $result->fetch_assoc()) {
            $row['function'] = $this->extractFunction($row['questiontext']);
            $questions[] = $row;
        }

        return $questions;
    }

    /**
     * Get student's attempts for a question
     *
     * @param int $userId Moodle user ID
     * @param int $questionId Question ID
     * @return array Array of attempts
     */
    public function getStudentAttempts($userId, $questionId) {
        $sql = "SELECT
                    qa.id,
                    qa.slot,
                    qa.questionid,
                    qa.maxmark,
                    qas.state,
                    qas.fraction,
                    qas.timecreated,
                    qas.userid
                FROM {$this->prefix}question_attempts qa
                JOIN {$this->prefix}question_attempt_steps qas ON qa.id = qas.questionattemptid
                WHERE qa.questionid = ? AND qas.userid = ?
                ORDER BY qas.timecreated DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $questionId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $attempts = [];
        while ($row = $result->fetch_assoc()) {
            $attempts[] = $row;
        }

        return $attempts;
    }

    /**
     * Extract mathematical function from question text
     * Looks for patterns like f(x) = ..., y = ..., etc.
     *
     * @param string $text Question text (may contain HTML)
     * @return string|null Extracted function or null
     */
    private function extractFunction($text) {
        // Remove HTML tags
        $text = strip_tags($text);

        // Patterns to match mathematical functions
        $patterns = [
            '/f\(x\)\s*=\s*([^,\.\n]+)/i',  // f(x) = ...
            '/y\s*=\s*([^,\.\n]+)/i',        // y = ...
            '/(?:function|함수):\s*([^,\.\n]+)/i',  // function: ... or 함수: ...
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * Get course information
     *
     * @param int $courseId Course ID
     * @return array|null Course data
     */
    public function getCourse($courseId) {
        $sql = "SELECT
                    id,
                    fullname,
                    shortname,
                    category,
                    startdate,
                    enddate
                FROM {$this->prefix}course
                WHERE id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $courseId);
        $stmt->execute();
        $result = $stmt->get_result();

        return $result->fetch_assoc();
    }

    /**
     * Get user information
     *
     * @param int $userId User ID
     * @return array|null User data
     */
    public function getUser($userId) {
        $sql = "SELECT
                    id,
                    username,
                    firstname,
                    lastname,
                    email
                FROM {$this->prefix}user
                WHERE id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        return $result->fetch_assoc();
    }

    /**
     * Save custom metadata for a question
     * This can be used to store Feature Spotlight analysis results
     *
     * @param int $questionId Question ID
     * @param string $key Metadata key
     * @param mixed $value Metadata value (will be JSON encoded)
     * @return bool Success status
     */
    public function saveQuestionMetadata($questionId, $key, $value) {
        // This requires a custom table - see schema.sql
        $conn_fs = getDBConnection(FS_DB_NAME);

        $jsonValue = json_encode($value, JSON_UNESCAPED_UNICODE);

        $sql = "INSERT INTO " . FS_TABLE_PREFIX . "question_metadata
                (question_id, meta_key, meta_value, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                meta_value = ?, updated_at = NOW()";

        $stmt = $conn_fs->prepare($sql);
        $stmt->bind_param("isss", $questionId, $key, $jsonValue, $jsonValue);

        return $stmt->execute();
    }

    /**
     * Get custom metadata for a question
     *
     * @param int $questionId Question ID
     * @param string $key Metadata key
     * @return mixed Metadata value or null
     */
    public function getQuestionMetadata($questionId, $key) {
        $conn_fs = getDBConnection(FS_DB_NAME);

        $sql = "SELECT meta_value FROM " . FS_TABLE_PREFIX . "question_metadata
                WHERE question_id = ? AND meta_key = ?";

        $stmt = $conn_fs->prepare($sql);
        $stmt->bind_param("is", $questionId, $key);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            return json_decode($row['meta_value'], true);
        }

        return null;
    }

    /**
     * Close database connection
     */
    public function __destruct() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}
