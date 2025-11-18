<?php
/**
 * Student Attempt Model
 * Handles student answer submissions and tracking
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/LogarithmCalculator.php';

class StudentAttempt {
    private $db;
    private $calculator;

    public function __construct(Database $db, LogarithmCalculator $calculator) {
        $this->db = $db;
        $this->calculator = $calculator;
    }

    /**
     * Record a new attempt
     *
     * @param array $data Attempt data
     * @return array Result with feedback
     */
    public function record($data) {
        $requiredFields = ['student_id', 'problem_id', 'answer'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new InvalidArgumentException("Missing required field: $field");
            }
        }

        // Get the problem
        $problem = $this->db->fetchOne(
            'SELECT * FROM problems WHERE id = :id',
            ['id' => $data['problem_id']]
        );

        if (!$problem) {
            throw new InvalidArgumentException('Problem not found');
        }

        // Check if answer is correct
        $isCorrect = ($data['answer'] == $problem['correct_answer']);

        // Get attempt number for this student/problem combination
        $attemptNumber = $this->getAttemptNumber($data['student_id'], $data['problem_id']);

        // Generate feedback
        $feedback = $this->calculator->getFeedback(
            $isCorrect,
            $problem['base'],
            $problem['result'],
            $problem['correct_answer'],
            $data['answer']
        );

        // Insert attempt record
        $attemptData = [
            'student_id' => $data['student_id'],
            'problem_id' => $data['problem_id'],
            'session_id' => $data['session_id'] ?? null,
            'answer' => $data['answer'],
            'is_correct' => $isCorrect ? 1 : 0,
            'time_spent' => $data['time_spent'] ?? null,
            'hint_used' => isset($data['hint_used']) && $data['hint_used'] ? 1 : 0,
            'attempt_number' => $attemptNumber,
            'feedback_text' => $feedback,
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
        ];

        $attemptId = $this->db->insert('student_attempts', $attemptData);

        // Update session if provided
        if (isset($data['session_id'])) {
            $this->updateSession($data['session_id'], $isCorrect, $data['time_spent'] ?? 0);
        }

        // Generate step-by-step visualization
        $steps = $this->calculator->generateSteps($problem['base'], $problem['correct_answer']);

        return [
            'attempt_id' => $attemptId,
            'is_correct' => $isCorrect,
            'correct_answer' => $problem['correct_answer'],
            'candle_count' => $problem['correct_answer'],
            'feedback' => $feedback,
            'steps' => $steps,
            'attempt_number' => $attemptNumber,
            'max_attempts' => $problem['max_attempts'],
            'explanation' => $isCorrect ? $problem['explanation'] : null,
        ];
    }

    /**
     * Get attempt number for student/problem
     *
     * @param int $studentId Student ID
     * @param int $problemId Problem ID
     * @return int Next attempt number
     */
    private function getAttemptNumber($studentId, $problemId) {
        $sql = 'SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
                FROM student_attempts
                WHERE student_id = :student_id AND problem_id = :problem_id';

        $result = $this->db->fetchOne($sql, [
            'student_id' => $studentId,
            'problem_id' => $problemId
        ]);

        return $result['next_attempt'];
    }

    /**
     * Update session statistics
     *
     * @param string $sessionId Session ID
     * @param bool $isCorrect Whether answer was correct
     * @param int $timeSpent Time spent in seconds
     */
    private function updateSession($sessionId, $isCorrect, $timeSpent) {
        $sql = 'UPDATE sessions
                SET problems_attempted = problems_attempted + 1,
                    problems_correct = problems_correct + :is_correct,
                    total_time_spent = total_time_spent + :time_spent,
                    last_activity = NOW()
                WHERE id = :session_id';

        $this->db->query($sql, [
            'is_correct' => $isCorrect ? 1 : 0,
            'time_spent' => $timeSpent,
            'session_id' => $sessionId
        ]);
    }

    /**
     * Get student's attempts for a problem
     *
     * @param int $studentId Student ID
     * @param int $problemId Problem ID
     * @return array Array of attempts
     */
    public function getByStudentAndProblem($studentId, $problemId) {
        $sql = 'SELECT * FROM student_attempts
                WHERE student_id = :student_id AND problem_id = :problem_id
                ORDER BY attempted_at DESC';

        return $this->db->fetchAll($sql, [
            'student_id' => $studentId,
            'problem_id' => $problemId
        ]);
    }

    /**
     * Get student's recent attempts
     *
     * @param int $studentId Student ID
     * @param int $limit Number of attempts to retrieve
     * @return array Array of attempts with problem details
     */
    public function getRecentByStudent($studentId, $limit = 10) {
        $sql = 'SELECT sa.*, p.question_text, p.base, p.result, p.difficulty
                FROM student_attempts sa
                JOIN problems p ON sa.problem_id = p.id
                WHERE sa.student_id = :student_id
                ORDER BY sa.attempted_at DESC
                LIMIT :limit';

        return $this->db->fetchAll($sql, [
            'student_id' => $studentId,
            'limit' => $limit
        ]);
    }

    /**
     * Get student performance summary
     *
     * @param int $studentId Student ID
     * @return array Performance statistics
     */
    public function getStudentPerformance($studentId) {
        $sql = 'SELECT
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
                    COUNT(DISTINCT problem_id) as unique_problems,
                    AVG(time_spent) as avg_time_spent,
                    SUM(CASE WHEN hint_used THEN 1 ELSE 0 END) as hints_used,
                    MAX(attempted_at) as last_attempt
                FROM student_attempts
                WHERE student_id = :student_id';

        $stats = $this->db->fetchOne($sql, ['student_id' => $studentId]);

        if ($stats && $stats['total_attempts'] > 0) {
            $stats['accuracy'] = round(
                ($stats['correct_attempts'] / $stats['total_attempts']) * 100,
                2
            );
        } else {
            $stats['accuracy'] = 0;
        }

        // Get performance by difficulty
        $sql = 'SELECT
                    p.difficulty,
                    COUNT(*) as attempts,
                    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
                    AVG(sa.time_spent) as avg_time
                FROM student_attempts sa
                JOIN problems p ON sa.problem_id = p.id
                WHERE sa.student_id = :student_id
                GROUP BY p.difficulty
                ORDER BY p.difficulty';

        $stats['by_difficulty'] = $this->db->fetchAll($sql, ['student_id' => $studentId]);

        return $stats;
    }

    /**
     * Check if student has solved a problem correctly
     *
     * @param int $studentId Student ID
     * @param int $problemId Problem ID
     * @return bool True if solved correctly
     */
    public function hasSolvedCorrectly($studentId, $problemId) {
        $sql = 'SELECT COUNT(*) as count
                FROM student_attempts
                WHERE student_id = :student_id
                AND problem_id = :problem_id
                AND is_correct = 1';

        $result = $this->db->fetchOne($sql, [
            'student_id' => $studentId,
            'problem_id' => $problemId
        ]);

        return $result['count'] > 0;
    }

    /**
     * Get leaderboard data
     *
     * @param int $limit Number of students to retrieve
     * @param string $timeframe Timeframe ('all', 'today', 'week', 'month')
     * @return array Leaderboard data
     */
    public function getLeaderboard($limit = 10, $timeframe = 'all') {
        $whereClause = '';

        switch ($timeframe) {
            case 'today':
                $whereClause = 'WHERE sa.attempted_at >= CURDATE()';
                break;
            case 'week':
                $whereClause = 'WHERE sa.attempted_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                break;
            case 'month':
                $whereClause = 'WHERE sa.attempted_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                break;
        }

        $sql = "SELECT
                    s.id,
                    s.username,
                    s.full_name,
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers,
                    ROUND(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy,
                    COUNT(DISTINCT sa.problem_id) as problems_attempted
                FROM students s
                JOIN student_attempts sa ON s.id = sa.student_id
                $whereClause
                GROUP BY s.id, s.username, s.full_name
                ORDER BY correct_answers DESC, accuracy DESC
                LIMIT :limit";

        return $this->db->fetchAll($sql, ['limit' => $limit]);
    }
}
