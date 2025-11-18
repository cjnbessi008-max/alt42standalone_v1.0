<?php
/**
 * Moodle Connector Class
 * Handles database operations and Moodle integration for Roll Along app
 */

class MoodleConnector {
    private $db;
    private $moodlePrefix = 'mdl_'; // Default Moodle table prefix

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get problem data by ID
     */
    public function getProblem($problemId) {
        try {
            // First, try to get from custom Roll Along problems table
            $stmt = $this->db->prepare("
                SELECT
                    id,
                    title,
                    instructions,
                    function_type,
                    custom_function,
                    x_min,
                    x_max,
                    y_min,
                    y_max,
                    difficulty_level,
                    created_at,
                    updated_at
                FROM roll_along_problems
                WHERE id = :problemId
            ");

            $stmt->execute(['problemId' => $problemId]);
            $problem = $stmt->fetch();

            if ($problem) {
                return [
                    'id' => $problem['id'],
                    'title' => $problem['title'],
                    'instructions' => $problem['instructions'],
                    'function' => $problem['function_type'],
                    'customFunction' => $problem['custom_function'],
                    'xRange' => [
                        'min' => (float)$problem['x_min'],
                        'max' => (float)$problem['x_max']
                    ],
                    'yRange' => [
                        'min' => (float)$problem['y_min'],
                        'max' => (float)$problem['y_max']
                    ],
                    'difficultyLevel' => $problem['difficulty_level'],
                    'createdAt' => $problem['created_at'],
                    'updatedAt' => $problem['updated_at']
                ];
            }

            // If not found, try to get from Moodle question bank
            return $this->getProblemFromMoodle($problemId);

        } catch (PDOException $e) {
            error_log("Error fetching problem: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get problem from Moodle question bank
     */
    private function getProblemFromMoodle($questionId) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    q.id,
                    q.name as title,
                    q.questiontext as instructions,
                    q.qtype
                FROM {$this->moodlePrefix}question q
                WHERE q.id = :questionId
            ");

            $stmt->execute(['questionId' => $questionId]);
            $question = $stmt->fetch();

            if ($question) {
                // Parse question data and convert to Roll Along format
                return [
                    'id' => $question['id'],
                    'title' => $question['title'],
                    'instructions' => strip_tags($question['instructions']),
                    'function' => 'linear', // Default
                    'customFunction' => null,
                    'xRange' => ['min' => -10, 'max' => 10],
                    'yRange' => ['min' => -10, 'max' => 10],
                    'source' => 'moodle'
                ];
            }

            return null;
        } catch (PDOException $e) {
            error_log("Error fetching from Moodle: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Save student progress
     */
    public function saveProgress($userId, $courseId, $problemId, $progress, $sessionId = null) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO roll_along_progress
                (user_id, course_id, problem_id, session_id, progress_data, created_at)
                VALUES
                (:userId, :courseId, :problemId, :sessionId, :progressData, NOW())
            ");

            $stmt->execute([
                'userId' => $userId,
                'courseId' => $courseId,
                'problemId' => $problemId,
                'sessionId' => $sessionId,
                'progressData' => json_encode($progress)
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error saving progress: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Submit student answer
     */
    public function submitAnswer($userId, $courseId, $problemId, $answer, $sessionId = null) {
        try {
            // Save the answer
            $stmt = $this->db->prepare("
                INSERT INTO roll_along_answers
                (user_id, course_id, problem_id, session_id, answer_data, submitted_at)
                VALUES
                (:userId, :courseId, :problemId, :sessionId, :answerData, NOW())
            ");

            $stmt->execute([
                'userId' => $userId,
                'courseId' => $courseId,
                'problemId' => $problemId,
                'sessionId' => $sessionId,
                'answerData' => json_encode($answer)
            ]);

            $answerId = $this->db->lastInsertId();

            // Grade the answer (simplified - implement actual grading logic)
            $grade = $this->gradeAnswer($problemId, $answer);

            // Update answer with grade
            $stmt = $this->db->prepare("
                UPDATE roll_along_answers
                SET grade = :grade, graded_at = NOW()
                WHERE id = :answerId
            ");

            $stmt->execute([
                'grade' => $grade['score'],
                'answerId' => $answerId
            ]);

            // Sync with Moodle gradebook if needed
            $this->syncGradeToMoodle($userId, $courseId, $problemId, $grade['score']);

            return [
                'success' => true,
                'grade' => $grade['score'],
                'feedback' => $grade['feedback']
            ];
        } catch (PDOException $e) {
            error_log("Error submitting answer: " . $e->getMessage());
            return ['success' => false];
        }
    }

    /**
     * Grade answer (simplified implementation)
     */
    private function gradeAnswer($problemId, $answer) {
        // TODO: Implement actual grading logic based on problem requirements
        // This is a placeholder that gives full credit

        return [
            'score' => 100,
            'feedback' => '잘하셨습니다!'
        ];
    }

    /**
     * Sync grade to Moodle gradebook
     */
    private function syncGradeToMoodle($userId, $courseId, $problemId, $grade) {
        try {
            // This would integrate with Moodle's grade_grades table
            // Simplified implementation
            $stmt = $this->db->prepare("
                INSERT INTO {$this->moodlePrefix}grade_grades
                (itemid, userid, rawgrade, finalgrade, timecreated, timemodified)
                SELECT
                    gi.id,
                    :userId,
                    :grade,
                    :grade,
                    UNIX_TIMESTAMP(),
                    UNIX_TIMESTAMP()
                FROM {$this->moodlePrefix}grade_items gi
                WHERE gi.courseid = :courseId
                AND gi.iteminstance = :problemId
                ON DUPLICATE KEY UPDATE
                    rawgrade = :grade,
                    finalgrade = :grade,
                    timemodified = UNIX_TIMESTAMP()
            ");

            $stmt->execute([
                'userId' => $userId,
                'courseId' => $courseId,
                'problemId' => $problemId,
                'grade' => $grade
            ]);

            return true;
        } catch (PDOException $e) {
            error_log("Error syncing grade to Moodle: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get student data
     */
    public function getStudentData($userId, $courseId) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    u.email
                FROM {$this->moodlePrefix}user u
                WHERE u.id = :userId
            ");

            $stmt->execute(['userId' => $userId]);
            $user = $stmt->fetch();

            if (!$user) {
                return null;
            }

            // Get student's progress in this course
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*) as total_attempts,
                    AVG(grade) as average_grade,
                    MAX(grade) as best_grade
                FROM roll_along_answers
                WHERE user_id = :userId
                AND course_id = :courseId
            ");

            $stmt->execute([
                'userId' => $userId,
                'courseId' => $courseId
            ]);
            $stats = $stmt->fetch();

            return [
                'id' => $user['id'],
                'username' => $user['username'],
                'fullName' => trim($user['firstname'] . ' ' . $user['lastname']),
                'email' => $user['email'],
                'stats' => [
                    'totalAttempts' => (int)$stats['total_attempts'],
                    'averageGrade' => (float)$stats['average_grade'],
                    'bestGrade' => (float)$stats['best_grade']
                ]
            ];
        } catch (PDOException $e) {
            error_log("Error fetching student data: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create Roll Along custom tables
     */
    public function createTables() {
        try {
            // Problems table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS roll_along_problems (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    instructions TEXT,
                    function_type VARCHAR(50) DEFAULT 'linear',
                    custom_function TEXT,
                    x_min DECIMAL(10, 2) DEFAULT -10.00,
                    x_max DECIMAL(10, 2) DEFAULT 10.00,
                    y_min DECIMAL(10, 2) DEFAULT -10.00,
                    y_max DECIMAL(10, 2) DEFAULT 10.00,
                    difficulty_level INT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_difficulty (difficulty_level)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");

            // Progress table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS roll_along_progress (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    course_id INT NOT NULL,
                    problem_id INT NOT NULL,
                    session_id VARCHAR(255),
                    progress_data JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_course (user_id, course_id),
                    INDEX idx_problem (problem_id),
                    INDEX idx_session (session_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");

            // Answers table
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS roll_along_answers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    course_id INT NOT NULL,
                    problem_id INT NOT NULL,
                    session_id VARCHAR(255),
                    answer_data JSON,
                    grade DECIMAL(5, 2),
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    graded_at TIMESTAMP NULL,
                    INDEX idx_user_course (user_id, course_id),
                    INDEX idx_problem (problem_id),
                    INDEX idx_grade (grade)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");

            return true;
        } catch (PDOException $e) {
            error_log("Error creating tables: " . $e->getMessage());
            return false;
        }
    }
}
