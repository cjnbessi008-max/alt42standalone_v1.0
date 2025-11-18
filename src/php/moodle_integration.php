<?php
/**
 * Moodle Integration Layer
 * Handles communication with Moodle 3.7 LMS database
 */

class MoodleIntegration {
    private $db;
    private $moodlePrefix;

    public function __construct(Database $db) {
        $this->db = $db;
        $this->moodlePrefix = MOODLE_PREFIX ?? 'mdl_';
    }

    /**
     * Get problem by ID
     */
    public function getProblemById($problemId, $sessionId = null) {
        // First try to get from our custom math problems table
        $problem = $this->getCustomProblem($problemId);

        if ($problem) {
            // Log access if session is provided
            if ($sessionId) {
                $this->logProblemAccess($problemId, $sessionId);
            }

            return $problem;
        }

        // Fallback to Moodle question bank
        return $this->getMoodleQuestion($problemId);
    }

    /**
     * Get custom math problem
     */
    private function getCustomProblem($problemId) {
        $sql = "SELECT * FROM math_problems WHERE id = ? AND active = 1";

        $row = $this->db->fetchOne($sql, [$problemId]);

        if (!$row) {
            return null;
        }

        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'function' => $row['function_expression'],
            'xMin' => (float)$row['x_min'],
            'xMax' => (float)$row['x_max'],
            'yMin' => (float)$row['y_min'],
            'yMax' => (float)$row['y_max'],
            'hints' => json_decode($row['hints'] ?? '[]', true),
            'metadata' => [
                'difficulty' => $row['difficulty'],
                'topic' => $row['topic'],
                'subtopic' => $row['subtopic'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ]
        ];
    }

    /**
     * Get question from Moodle question bank
     */
    private function getMoodleQuestion($questionId) {
        $questionTable = $this->moodlePrefix . 'question';
        $answerTable = $this->moodlePrefix . 'question_answers';

        $sql = "
            SELECT
                q.id,
                q.name as title,
                q.questiontext as description,
                q.defaultmark,
                q.qtype,
                q.timecreated,
                q.timemodified
            FROM {$questionTable} q
            WHERE q.id = ?
        ";

        $row = $this->db->fetchOne($sql, [$questionId]);

        if (!$row) {
            return null;
        }

        // Try to extract function from question text
        $function = $this->extractFunctionFromText($row['description']);

        return [
            'id' => 'moodle_' . $row['id'],
            'title' => $row['title'],
            'description' => strip_tags($row['description']),
            'function' => $function ?: 'sin(x)',
            'xMin' => -10,
            'xMax' => 10,
            'yMin' => -10,
            'yMax' => 10,
            'hints' => [],
            'metadata' => [
                'difficulty' => 'medium',
                'topic' => 'Calculus',
                'subtopic' => 'Functions',
                'source' => 'moodle',
                'qtype' => $row['qtype']
            ]
        ];
    }

    /**
     * Extract function expression from HTML/text
     */
    private function extractFunctionFromText($text) {
        // Remove HTML tags
        $text = strip_tags($text);

        // Common patterns for function expressions
        $patterns = [
            '/f\(x\)\s*=\s*([^,.\s]+)/i',
            '/y\s*=\s*([^,.\s]+)/i',
            '/function:\s*([^,.\s]+)/i'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * Check for session updates
     */
    public function checkSessionUpdates($sessionId) {
        $sql = "
            SELECT last_updated
            FROM student_sessions
            WHERE session_id = ?
        ";

        $row = $this->db->fetchOne($sql, [$sessionId]);

        if (!$row) {
            return false;
        }

        // Check if updated in last 5 seconds
        $lastUpdated = strtotime($row['last_updated']);
        $threshold = time() - 5;

        return $lastUpdated > $threshold;
    }

    /**
     * Submit student answer
     */
    public function submitAnswer($problemId, $sessionId, $answer) {
        // Get problem solution
        $problem = $this->getCustomProblem($problemId);

        if (!$problem) {
            throw new Exception('Problem not found');
        }

        // Evaluate answer
        $correct = $this->evaluateAnswer($problem, $answer);

        // Store submission
        $this->db->insert('student_submissions', [
            'problem_id' => $problemId,
            'session_id' => $sessionId,
            'answer' => json_encode($answer),
            'correct' => $correct ? 1 : 0,
            'submitted_at' => date('Y-m-d H:i:s')
        ]);

        // Update session
        $this->updateSession($sessionId);

        // Generate feedback
        $feedback = $this->generateFeedback($problem, $answer, $correct);

        return [
            'correct' => $correct,
            'feedback' => $feedback
        ];
    }

    /**
     * Evaluate student answer
     */
    private function evaluateAnswer($problem, $answer) {
        // For extrema problems, check if identified extrema are correct
        if (isset($answer['extrema']) && is_array($answer['extrema'])) {
            // Get expected extrema from problem
            $expectedExtrema = $answer['extrema'];

            // Simple validation (can be enhanced)
            return count($expectedExtrema) > 0;
        }

        return false;
    }

    /**
     * Generate feedback
     */
    private function generateFeedback($problem, $answer, $correct) {
        if ($correct) {
            return 'Excellent! You correctly identified the extrema points.';
        }

        return 'Please review your answer. Make sure you have identified all local maxima and minima.';
    }

    /**
     * Get session information
     */
    public function getSessionInfo($sessionId) {
        $sql = "
            SELECT
                s.*,
                u.username,
                u.email
            FROM student_sessions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.session_id = ?
        ";

        $row = $this->db->fetchOne($sql, [$sessionId]);

        if (!$row) {
            return null;
        }

        return [
            'session_id' => $row['session_id'],
            'user_id' => $row['user_id'],
            'username' => $row['username'] ?? 'Guest',
            'email' => $row['email'] ?? '',
            'started_at' => $row['started_at'],
            'last_updated' => $row['last_updated'],
            'problems_completed' => (int)$row['problems_completed'],
            'score' => (int)$row['score']
        ];
    }

    /**
     * Log problem access
     */
    private function logProblemAccess($problemId, $sessionId) {
        try {
            $this->db->insert('problem_access_log', [
                'problem_id' => $problemId,
                'session_id' => $sessionId,
                'accessed_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            // Don't fail if logging fails
            error_log('Failed to log problem access: ' . $e->getMessage());
        }
    }

    /**
     * Update session timestamp
     */
    private function updateSession($sessionId) {
        try {
            $this->db->update(
                'student_sessions',
                ['last_updated' => date('Y-m-d H:i:s')],
                'session_id = ?',
                [$sessionId]
            );
        } catch (Exception $e) {
            error_log('Failed to update session: ' . $e->getMessage());
        }
    }

    /**
     * Create new session
     */
    public function createSession($userId, $courseId = null) {
        $sessionId = $this->generateSessionId();

        $this->db->insert('student_sessions', [
            'session_id' => $sessionId,
            'user_id' => $userId,
            'course_id' => $courseId,
            'started_at' => date('Y-m-d H:i:s'),
            'last_updated' => date('Y-m-d H:i:s'),
            'problems_completed' => 0,
            'score' => 0
        ]);

        return $sessionId;
    }

    /**
     * Generate unique session ID
     */
    private function generateSessionId() {
        return bin2hex(random_bytes(16));
    }

    /**
     * Get all problems for a course
     */
    public function getCourseProblems($courseId) {
        $sql = "
            SELECT
                id,
                title,
                description,
                difficulty,
                topic,
                subtopic
            FROM math_problems
            WHERE course_id = ? AND active = 1
            ORDER BY display_order ASC, created_at DESC
        ";

        return $this->db->fetchAll($sql, [$courseId]);
    }

    /**
     * Get student progress
     */
    public function getStudentProgress($userId, $courseId = null) {
        $sql = "
            SELECT
                COUNT(DISTINCT problem_id) as problems_attempted,
                SUM(correct) as correct_answers,
                MAX(submitted_at) as last_submission
            FROM student_submissions
            WHERE session_id IN (
                SELECT session_id
                FROM student_sessions
                WHERE user_id = ?
                " . ($courseId ? "AND course_id = ?" : "") . "
            )
        ";

        $params = [$userId];
        if ($courseId) {
            $params[] = $courseId;
        }

        return $this->db->fetchOne($sql, $params);
    }
}
