<?php
/**
 * Moodle Integration Module
 * Fetches quiz/problem data from Moodle 3.7 LMS
 */

require_once __DIR__ . '/../config/database.php';

class MoodleIntegration {
    private $db;
    private $prefix;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->prefix = MOODLE_PREFIX;
    }

    /**
     * Get quiz attempts data for a specific quiz
     * @param int $quizId Quiz ID
     * @return array Quiz attempts with scores
     */
    public function getQuizAttempts($quizId) {
        $sql = "SELECT
                    qa.id as attempt_id,
                    qa.userid,
                    u.firstname,
                    u.lastname,
                    qa.sumgrades as score,
                    qa.timefinish,
                    qa.timestart,
                    q.grade as max_grade
                FROM {$this->prefix}quiz_attempts qa
                JOIN {$this->prefix}user u ON qa.userid = u.id
                JOIN {$this->prefix}quiz q ON qa.quiz = q.id
                WHERE qa.quiz = :quiz_id
                AND qa.state = 'finished'
                ORDER BY qa.timefinish DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['quiz_id' => $quizId]);
        return $stmt->fetchAll();
    }

    /**
     * Get student performance data across all quizzes
     * @param int $courseId Course ID (optional)
     * @return array Student performance data
     */
    public function getStudentPerformance($courseId = null) {
        $whereClause = $courseId ? "AND q.course = :course_id" : "";

        $sql = "SELECT
                    qa.userid,
                    u.firstname,
                    u.lastname,
                    AVG(qa.sumgrades / q.grade * 100) as avg_score,
                    COUNT(qa.id) as attempt_count,
                    MIN(qa.sumgrades / q.grade * 100) as min_score,
                    MAX(qa.sumgrades / q.grade * 100) as max_score,
                    STDDEV(qa.sumgrades / q.grade * 100) as score_stddev
                FROM {$this->prefix}quiz_attempts qa
                JOIN {$this->prefix}user u ON qa.userid = u.id
                JOIN {$this->prefix}quiz q ON qa.quiz = q.id
                WHERE qa.state = 'finished'
                {$whereClause}
                GROUP BY qa.userid, u.firstname, u.lastname
                HAVING attempt_count >= 3
                ORDER BY avg_score DESC";

        $stmt = $this->db->prepare($sql);
        if ($courseId) {
            $stmt->execute(['course_id' => $courseId]);
        } else {
            $stmt->execute();
        }
        return $stmt->fetchAll();
    }

    /**
     * Get recent quiz attempts for real-time monitoring
     * @param int $limit Number of recent attempts to fetch
     * @return array Recent quiz attempts
     */
    public function getRecentAttempts($limit = 50) {
        $sql = "SELECT
                    qa.id as attempt_id,
                    qa.userid,
                    u.firstname,
                    u.lastname,
                    q.name as quiz_name,
                    qa.sumgrades as score,
                    q.grade as max_grade,
                    (qa.sumgrades / q.grade * 100) as percentage,
                    qa.timefinish,
                    c.fullname as course_name
                FROM {$this->prefix}quiz_attempts qa
                JOIN {$this->prefix}user u ON qa.userid = u.id
                JOIN {$this->prefix}quiz q ON qa.quiz = q.id
                JOIN {$this->prefix}course c ON q.course = c.id
                WHERE qa.state = 'finished'
                ORDER BY qa.timefinish DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Get question-level performance data
     * @param int $quizId Quiz ID
     * @return array Question performance statistics
     */
    public function getQuestionPerformance($quizId) {
        $sql = "SELECT
                    q.id as question_id,
                    q.name as question_name,
                    q.questiontext,
                    AVG(qas.fraction) as avg_score,
                    COUNT(qa.id) as attempt_count,
                    STDDEV(qas.fraction) as score_stddev
                FROM {$this->prefix}quiz_attempts qa
                JOIN {$this->prefix}question_attempts qat ON qat.questionusageid = qa.uniqueid
                JOIN {$this->prefix}question_attempt_steps qas ON qas.questionattemptid = qat.id
                JOIN {$this->prefix}question q ON q.id = qat.questionid
                WHERE qa.quiz = :quiz_id
                AND qa.state = 'finished'
                AND qas.sequencenumber = (
                    SELECT MAX(sequencenumber)
                    FROM {$this->prefix}question_attempt_steps
                    WHERE questionattemptid = qat.id
                )
                GROUP BY q.id, q.name, q.questiontext
                ORDER BY avg_score ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['quiz_id' => $quizId]);
        return $stmt->fetchAll();
    }

    /**
     * Get available quizzes for a course
     * @param int $courseId Course ID
     * @return array List of quizzes
     */
    public function getCourseQuizzes($courseId) {
        $sql = "SELECT
                    q.id,
                    q.name,
                    q.intro,
                    q.grade,
                    q.timeopen,
                    q.timeclose,
                    COUNT(DISTINCT qa.id) as attempt_count
                FROM {$this->prefix}quiz q
                LEFT JOIN {$this->prefix}quiz_attempts qa ON qa.quiz = q.id AND qa.state = 'finished'
                WHERE q.course = :course_id
                GROUP BY q.id, q.name, q.intro, q.grade, q.timeopen, q.timeclose
                ORDER BY q.timeopen DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['course_id' => $courseId]);
        return $stmt->fetchAll();
    }
}
