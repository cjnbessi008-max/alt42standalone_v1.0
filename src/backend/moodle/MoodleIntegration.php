<?php
/**
 * Moodle LMS Integration Layer
 *
 * Provides interface to interact with Moodle 3.7 database
 * for partial sum flow problems and student attempts.
 *
 * Compatible with MySQL 5.7, PHP 7.1.9, Moodle 3.7
 */

require_once __DIR__ . '/../config/database.php';

class MoodleIntegration {
    private $db;
    private $conn;
    private $prefix;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->prefix = $this->db->getTablePrefix();
    }

    /**
     * Get problem by ID from custom partial sum table
     *
     * @param int $problemId Problem ID
     * @return array|null Problem data
     */
    public function getProblemById($problemId) {
        $query = "SELECT
                    p.id,
                    p.question_id,
                    p.title,
                    p.description,
                    p.data_array,
                    p.expected_answer,
                    p.created_at,
                    p.updated_at
                FROM {$this->prefix}partialsum_problems p
                WHERE p.id = :id AND p.deleted = 0
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $problemId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch();

        if ($row) {
            return $this->formatProblem($row);
        }

        return null;
    }

    /**
     * Get all active problems
     *
     * @param int $limit Maximum number of problems to return
     * @return array Array of problems
     */
    public function getAllProblems($limit = 100) {
        $query = "SELECT
                    p.id,
                    p.question_id,
                    p.title,
                    p.description,
                    p.data_array,
                    p.expected_answer,
                    p.created_at,
                    p.updated_at
                FROM {$this->prefix}partialsum_problems p
                WHERE p.deleted = 0
                ORDER BY p.created_at DESC
                LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $problems = [];
        while ($row = $stmt->fetch()) {
            $problems[] = $this->formatProblem($row);
        }

        return $problems;
    }

    /**
     * Submit student attempt
     *
     * @param int $studentId Student ID from Moodle user table
     * @param int $problemId Problem ID
     * @param int $answer Student's answer
     * @return array Attempt data with result
     */
    public function submitAttempt($studentId, $problemId, $answer) {
        // Get problem to check answer
        $problem = $this->getProblemById($problemId);

        if (!$problem) {
            throw new Exception("Problem not found");
        }

        $isCorrect = ($answer == $problem['expectedAnswer']) ? 1 : 0;

        $query = "INSERT INTO {$this->prefix}partialsum_attempts
                    (student_id, problem_id, answer, is_correct, submitted_at)
                VALUES (:student_id, :problem_id, :answer, :is_correct, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':problem_id', $problemId, PDO::PARAM_INT);
        $stmt->bindParam(':answer', $answer, PDO::PARAM_INT);
        $stmt->bindParam(':is_correct', $isCorrect, PDO::PARAM_INT);

        $stmt->execute();

        $attemptId = $this->conn->lastInsertId();

        return [
            'attemptId' => $attemptId,
            'studentId' => $studentId,
            'problemId' => $problemId,
            'answer' => $answer,
            'isCorrect' => (bool)$isCorrect,
            'submittedAt' => date('c')
        ];
    }

    /**
     * Get attempt history for a student and problem
     *
     * @param int $studentId Student ID
     * @param int $problemId Problem ID
     * @return array Array of attempts
     */
    public function getAttemptHistory($studentId, $problemId) {
        $query = "SELECT
                    a.id as attempt_id,
                    a.student_id,
                    a.problem_id,
                    a.answer,
                    a.is_correct,
                    a.submitted_at
                FROM {$this->prefix}partialsum_attempts a
                WHERE a.student_id = :student_id AND a.problem_id = :problem_id
                ORDER BY a.submitted_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':problem_id', $problemId, PDO::PARAM_INT);
        $stmt->execute();

        $attempts = [];
        while ($row = $stmt->fetch()) {
            $attempts[] = [
                'attemptId' => (int)$row['attempt_id'],
                'studentId' => (int)$row['student_id'],
                'problemId' => (int)$row['problem_id'],
                'answer' => (int)$row['answer'],
                'isCorrect' => (bool)$row['is_correct'],
                'submittedAt' => date('c', strtotime($row['submitted_at']))
            ];
        }

        return $attempts;
    }

    /**
     * Authenticate user against Moodle user table
     *
     * @param string $username Moodle username
     * @param string $password Moodle password
     * @return array|null User data if authenticated
     */
    public function authenticateUser($username, $password) {
        $query = "SELECT
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    u.email
                FROM {$this->prefix}user u
                WHERE u.username = :username
                AND u.deleted = 0
                AND u.suspended = 0
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();

        $user = $stmt->fetch();

        if ($user && $this->verifyPassword($password, $user['id'])) {
            return [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'email' => $user['email']
            ];
        }

        return null;
    }

    /**
     * Verify password against Moodle password hash
     *
     * Note: Moodle uses bcrypt for password hashing
     *
     * @param string $password Plain text password
     * @param int $userId User ID
     * @return bool True if password is correct
     */
    private function verifyPassword($password, $userId) {
        $query = "SELECT password FROM {$this->prefix}user WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch();

        if ($row && password_verify($password, $row['password'])) {
            return true;
        }

        return false;
    }

    /**
     * Format problem data for API response
     *
     * @param array $row Database row
     * @return array Formatted problem
     */
    private function formatProblem($row) {
        return [
            'id' => (int)$row['id'],
            'questionId' => (int)$row['question_id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'dataArray' => json_decode($row['data_array']),
            'expectedAnswer' => (int)$row['expected_answer'],
            'createdAt' => date('c', strtotime($row['created_at'])),
            'updatedAt' => date('c', strtotime($row['updated_at']))
        ];
    }

    /**
     * Get student progress statistics
     *
     * @param int $studentId Student ID
     * @return array Progress statistics
     */
    public function getStudentProgress($studentId) {
        $query = "SELECT
                    COUNT(DISTINCT problem_id) as total_attempted,
                    SUM(is_correct) as total_correct,
                    COUNT(*) as total_attempts
                FROM {$this->prefix}partialsum_attempts
                WHERE student_id = :student_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }
}
