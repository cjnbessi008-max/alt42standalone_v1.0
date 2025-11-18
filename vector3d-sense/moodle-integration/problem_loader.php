<?php
/**
 * Vector 3D Sense - Problem Loader
 * Loads vector problems from Moodle questions
 *
 * @package    vector3d_sense
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/db_connector.php');

class Vector3DProblemLoader {
    private $db;

    public function __construct() {
        $this->db = Vector3DDatabase::getInstance();
    }

    /**
     * Load problem from Moodle question ID
     *
     * @param int $questionId Moodle question ID
     * @param int $userId Moodle user ID
     * @return array|null Problem data or null if not found
     */
    public function loadProblem($questionId, $userId) {
        $query = "SELECT * FROM vector_problems WHERE moodle_question_id = ? AND is_active = 1";
        $problem = $this->db->fetchOne($query, 'i', array($questionId));

        if ($problem) {
            // Decode JSON fields
            $problem['vectors_data'] = json_decode($problem['vectors_data'], true);
            $problem['expected_answer'] = json_decode($problem['expected_answer'], true);
            $problem['camera_position'] = json_decode($problem['camera_position'], true);

            // Create or retrieve session
            $problem['session'] = $this->createSession($problem['id'], $userId);
        }

        return $problem;
    }

    /**
     * Get problem by ID
     *
     * @param int $problemId Problem ID
     * @return array|null Problem data
     */
    public function getProblemById($problemId) {
        $query = "SELECT * FROM vector_problems WHERE id = ? AND is_active = 1";
        $problem = $this->db->fetchOne($query, 'i', array($problemId));

        if ($problem) {
            $problem['vectors_data'] = json_decode($problem['vectors_data'], true);
            $problem['expected_answer'] = json_decode($problem['expected_answer'], true);
            $problem['camera_position'] = json_decode($problem['camera_position'], true);
        }

        return $problem;
    }

    /**
     * Get problems by course ID
     *
     * @param int $courseId Moodle course ID
     * @return array Array of problems
     */
    public function getProblemsByCourse($courseId) {
        $query = "SELECT * FROM vector_problems WHERE moodle_course_id = ? AND is_active = 1 ORDER BY created_at DESC";
        $problems = $this->db->fetchAll($query, 'i', array($courseId));

        foreach ($problems as &$problem) {
            $problem['vectors_data'] = json_decode($problem['vectors_data'], true);
            $problem['expected_answer'] = json_decode($problem['expected_answer'], true);
            $problem['camera_position'] = json_decode($problem['camera_position'], true);
        }

        return $problems;
    }

    /**
     * Create visualization session
     *
     * @param int $problemId Problem ID
     * @param int $userId Moodle user ID
     * @return array Session data
     */
    private function createSession($problemId, $userId) {
        // Check for existing active session
        $query = "SELECT * FROM visualization_sessions
                  WHERE problem_id = ? AND moodle_user_id = ?
                  AND expires_at > NOW()
                  ORDER BY created_at DESC LIMIT 1";

        $existingSession = $this->db->fetchOne($query, 'ii', array($problemId, $userId));

        if ($existingSession) {
            // Update last activity
            $updateQuery = "UPDATE visualization_sessions SET last_activity_at = NOW() WHERE id = ?";
            $this->db->execute($updateQuery, 'i', array($existingSession['id']));
            return $existingSession;
        }

        // Create new session
        global $CFG;
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + $CFG->vector3d_session_timeout);

        $insertQuery = "INSERT INTO visualization_sessions
                        (problem_id, moodle_user_id, session_token, expires_at, device_type)
                        VALUES (?, ?, ?, ?, 'virtual_phone')";

        $this->db->execute($insertQuery, 'iiss', array($problemId, $userId, $sessionToken, $expiresAt));

        return array(
            'id' => $this->db->getLastInsertId(),
            'session_token' => $sessionToken,
            'expires_at' => $expiresAt
        );
    }

    /**
     * Record student attempt
     *
     * @param int $problemId Problem ID
     * @param int $userId Moodle user ID
     * @param array $answer Student answer
     * @param int $timeSpent Time spent in seconds
     * @return array Attempt result
     */
    public function recordAttempt($problemId, $userId, $answer, $timeSpent) {
        // Get problem to check expected answer
        $problem = $this->getProblemById($problemId);

        if (!$problem) {
            throw new Exception("Problem not found");
        }

        // Get attempt number
        $countQuery = "SELECT COUNT(*) as count FROM student_attempts
                       WHERE problem_id = ? AND moodle_user_id = ?";
        $countResult = $this->db->fetchOne($countQuery, 'ii', array($problemId, $userId));
        $attemptNumber = $countResult['count'] + 1;

        // Check if answer is correct
        $isCorrect = $this->checkAnswer($answer, $problem['expected_answer'], $problem['problem_type']);
        $score = $isCorrect ? 100.0 : 0.0;

        // Insert attempt
        $insertQuery = "INSERT INTO student_attempts
                        (problem_id, moodle_user_id, attempt_number, student_answer,
                         is_correct, score, time_spent_seconds, submitted_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

        $answerJson = json_encode($answer);
        $this->db->execute($insertQuery, 'iiisddi', array(
            $problemId, $userId, $attemptNumber, $answerJson,
            $isCorrect ? 1 : 0, $score, $timeSpent
        ));

        return array(
            'attempt_id' => $this->db->getLastInsertId(),
            'is_correct' => $isCorrect,
            'score' => $score,
            'attempt_number' => $attemptNumber,
            'expected_answer' => $problem['expected_answer']
        );
    }

    /**
     * Check if student answer is correct
     *
     * @param array $studentAnswer Student's answer
     * @param array $expectedAnswer Expected answer
     * @param string $problemType Type of problem
     * @return bool True if correct
     */
    private function checkAnswer($studentAnswer, $expectedAnswer, $problemType) {
        $tolerance = 0.01; // Tolerance for floating point comparison

        switch ($problemType) {
            case 'addition':
            case 'subtraction':
            case 'cross_product':
                // Vector result - check x, y, z components
                return abs($studentAnswer['x'] - $expectedAnswer['x']) < $tolerance &&
                       abs($studentAnswer['y'] - $expectedAnswer['y']) < $tolerance &&
                       abs($studentAnswer['z'] - $expectedAnswer['z']) < $tolerance;

            case 'dot_product':
            case 'magnitude':
                // Scalar result
                return abs($studentAnswer['value'] - $expectedAnswer['value']) < $tolerance;

            case 'visualization':
                // For visualization, any interaction counts as participation
                return true;

            default:
                return false;
        }
    }

    /**
     * Get student attempts for a problem
     *
     * @param int $problemId Problem ID
     * @param int $userId Moodle user ID
     * @return array Array of attempts
     */
    public function getStudentAttempts($problemId, $userId) {
        $query = "SELECT * FROM student_attempts
                  WHERE problem_id = ? AND moodle_user_id = ?
                  ORDER BY submitted_at DESC";

        $attempts = $this->db->fetchAll($query, 'ii', array($problemId, $userId));

        foreach ($attempts as &$attempt) {
            $attempt['student_answer'] = json_decode($attempt['student_answer'], true);
        }

        return $attempts;
    }
}
