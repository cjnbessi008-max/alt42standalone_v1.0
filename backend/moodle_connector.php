<?php
/**
 * Moodle LMS Connector
 *
 * Handles integration with Moodle 3.7
 * Retrieves problem/quiz information from Moodle database
 */

require_once __DIR__ . '/database.php';

class MoodleConnector {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get quiz/problem information by ID
     *
     * @param int $quizId
     * @return array|null
     */
    public function getQuizById($quizId) {
        $sql = "SELECT
                    q.id,
                    q.course,
                    q.name,
                    q.intro,
                    q.timeopen,
                    q.timeclose,
                    c.fullname as course_name
                FROM mdl_quiz q
                LEFT JOIN mdl_course c ON q.course = c.id
                WHERE q.id = :quiz_id";

        return $this->db->fetchOne($sql, ['quiz_id' => $quizId]);
    }

    /**
     * Get questions for a specific quiz
     *
     * @param int $quizId
     * @return array
     */
    public function getQuizQuestions($quizId) {
        $sql = "SELECT
                    q.id,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark,
                    qs.slot,
                    qs.maxmark
                FROM mdl_question q
                INNER JOIN mdl_quiz_slots qs ON q.id = qs.questionid
                WHERE qs.quizid = :quiz_id
                ORDER BY qs.slot";

        return $this->db->fetchAll($sql, ['quiz_id' => $quizId]);
    }

    /**
     * Get mathematical function problems
     * Custom table for function-based problems
     *
     * @param int $problemId
     * @return array|null
     */
    public function getFunctionProblem($problemId) {
        // This assumes a custom table for function problems
        // Adjust based on your Moodle customization
        $sql = "SELECT
                    id,
                    title,
                    description,
                    function_type,
                    function_expression,
                    min_value,
                    max_value,
                    correct_answer
                FROM mdl_custom_function_problems
                WHERE id = :problem_id";

        return $this->db->fetchOne($sql, ['problem_id' => $problemId]);
    }

    /**
     * Get all function problems for a course
     *
     * @param int $courseId
     * @return array
     */
    public function getCourseFunctionProblems($courseId) {
        $sql = "SELECT
                    cfp.id,
                    cfp.title,
                    cfp.description,
                    cfp.function_type,
                    cfp.function_expression,
                    c.fullname as course_name
                FROM mdl_custom_function_problems cfp
                LEFT JOIN mdl_course c ON cfp.course_id = c.id
                WHERE cfp.course_id = :course_id
                ORDER BY cfp.id DESC";

        return $this->db->fetchAll($sql, ['course_id' => $courseId]);
    }

    /**
     * Save user's answer/interaction
     *
     * @param int $userId
     * @param int $problemId
     * @param mixed $answer
     * @param float $timeTaken
     * @return bool
     */
    public function saveUserAnswer($userId, $problemId, $answer, $timeTaken = 0) {
        $sql = "INSERT INTO mdl_custom_function_answers
                (user_id, problem_id, answer, time_taken, submitted_at)
                VALUES (:user_id, :problem_id, :answer, :time_taken, :submitted_at)";

        try {
            $this->db->query($sql, [
                'user_id' => $userId,
                'problem_id' => $problemId,
                'answer' => json_encode($answer),
                'time_taken' => $timeTaken,
                'submitted_at' => date('Y-m-d H:i:s')
            ]);
            return true;
        } catch (Exception $e) {
            error_log("Failed to save user answer: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user's progress on function problems
     *
     * @param int $userId
     * @param int $courseId
     * @return array
     */
    public function getUserProgress($userId, $courseId) {
        $sql = "SELECT
                    cfp.id as problem_id,
                    cfp.title,
                    cfa.answer,
                    cfa.time_taken,
                    cfa.submitted_at,
                    CASE
                        WHEN cfa.id IS NOT NULL THEN 1
                        ELSE 0
                    END as completed
                FROM mdl_custom_function_problems cfp
                LEFT JOIN mdl_custom_function_answers cfa
                    ON cfp.id = cfa.problem_id AND cfa.user_id = :user_id
                WHERE cfp.course_id = :course_id
                ORDER BY cfp.id";

        return $this->db->fetchAll($sql, [
            'user_id' => $userId,
            'course_id' => $courseId
        ]);
    }

    /**
     * Authenticate user (simplified version)
     * In production, use Moodle's authentication system
     *
     * @param string $username
     * @param string $password
     * @return array|null
     */
    public function authenticateUser($username, $password) {
        $sql = "SELECT
                    id,
                    username,
                    firstname,
                    lastname,
                    email
                FROM mdl_user
                WHERE username = :username AND deleted = 0";

        $user = $this->db->fetchOne($sql, ['username' => $username]);

        if ($user) {
            // In production, verify password hash properly
            // This is simplified for demonstration
            return $user;
        }

        return null;
    }
}

?>
