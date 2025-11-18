<?php
/**
 * Moodle LMS Integration API
 * Compatible with Moodle 3.7
 */

define('SLOPE_SENSE', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

class MoodleIntegration {
    private $db;
    private $moodleConfig;

    public function __construct() {
        $this->db = Database::getInstance();

        // Include Moodle config if available
        if (file_exists(MOODLE_DIR . '/config.php')) {
            require_once MOODLE_DIR . '/config.php';
            global $CFG;
            $this->moodleConfig = $CFG;
        }
    }

    /**
     * Authenticate user via Moodle session
     */
    public function authenticateUser() {
        session_start();

        // Check if Moodle session exists
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']->id)) {
            return $_SESSION['USER'];
        }

        // Alternative: Verify via Moodle Web Services
        if (isset($_GET['token'])) {
            return $this->verifyMoodleToken($_GET['token']);
        }

        return null;
    }

    /**
     * Verify Moodle web service token
     */
    private function verifyMoodleToken($token) {
        // This would typically call Moodle's web service API
        // For now, return a mock user structure
        // In production, implement proper Moodle WS call
        return [
            'id' => 1,
            'username' => 'student',
            'firstname' => 'Test',
            'lastname' => 'User'
        ];
    }

    /**
     * Get problems for a specific Moodle activity
     */
    public function getProblemsForActivity($courseId, $activityId) {
        $sql = "SELECT * FROM slope_problems
                WHERE moodle_course_id = :course_id
                AND moodle_activity_id = :activity_id
                AND is_active = 1
                ORDER BY difficulty_level, RAND()";

        return $this->db->fetchAll($sql, [
            ':course_id' => $courseId,
            ':activity_id' => $activityId
        ]);
    }

    /**
     * Create a new session for a user
     */
    public function createSession($userId, $courseId) {
        $token = bin2hex(random_bytes(32));

        $sql = "INSERT INTO slope_sessions
                (moodle_user_id, moodle_course_id, session_token)
                VALUES (:user_id, :course_id, :token)";

        $this->db->query($sql, [
            ':user_id' => $userId,
            ':course_id' => $courseId,
            ':token' => $token
        ]);

        return [
            'session_id' => $this->db->lastInsertId(),
            'token' => $token
        ];
    }

    /**
     * Record a user attempt
     */
    public function recordAttempt($sessionId, $problemId, $userId, $userAnswer, $timeSpent, $hintsUsed = 0) {
        // Get correct answer
        $problem = $this->db->fetch(
            "SELECT correct_slope FROM slope_problems WHERE id = :id",
            [':id' => $problemId]
        );

        if (!$problem) {
            throw new Exception('Problem not found');
        }

        $correctSlope = floatval($problem['correct_slope']);
        $userAnswerFloat = floatval($userAnswer);
        $tolerance = 0.01; // Allow small rounding differences
        $isCorrect = abs($userAnswerFloat - $correctSlope) < $tolerance;

        $sql = "INSERT INTO slope_user_attempts
                (session_id, problem_id, moodle_user_id, user_answer, is_correct, time_spent_seconds, hints_used)
                VALUES (:session_id, :problem_id, :user_id, :answer, :correct, :time, :hints)";

        $this->db->query($sql, [
            ':session_id' => $sessionId,
            ':problem_id' => $problemId,
            ':user_id' => $userId,
            ':answer' => $userAnswer,
            ':correct' => $isCorrect ? 1 : 0,
            ':time' => $timeSpent,
            ':hints' => $hintsUsed
        ]);

        return [
            'attempt_id' => $this->db->lastInsertId(),
            'is_correct' => $isCorrect,
            'correct_answer' => $correctSlope
        ];
    }

    /**
     * Get user progress for a course
     */
    public function getUserProgress($userId, $courseId) {
        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(time_spent_seconds) as avg_time,
                    AVG(hints_used) as avg_hints
                FROM slope_user_attempts sua
                JOIN slope_sessions ss ON sua.session_id = ss.id
                WHERE sua.moodle_user_id = :user_id
                AND ss.moodle_course_id = :course_id";

        return $this->db->fetch($sql, [
            ':user_id' => $userId,
            ':course_id' => $courseId
        ]);
    }

    /**
     * Send grade back to Moodle gradebook
     */
    public function sendGradeToMoodle($userId, $courseId, $activityId, $grade) {
        // This would integrate with Moodle's grade API
        // Implementation depends on Moodle setup
        // For now, just log the grade

        $logEntry = sprintf(
            "Grade recorded: User %d, Course %d, Activity %d, Grade: %.2f\n",
            $userId, $courseId, $activityId, $grade
        );

        error_log($logEntry, 3, __DIR__ . '/../logs/grades.log');

        return true;
    }

    /**
     * Validate session token
     */
    public function validateSession($token) {
        $sql = "SELECT * FROM slope_sessions
                WHERE session_token = :token
                AND is_active = 1
                AND TIMESTAMPDIFF(SECOND, last_activity, NOW()) < :timeout";

        return $this->db->fetch($sql, [
            ':token' => $token,
            ':timeout' => SESSION_TIMEOUT
        ]);
    }
}
