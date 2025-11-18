<?php
/**
 * Moodle Connector
 * Handles integration with Moodle 3.7 LMS
 */

require_once __DIR__ . '/../config/moodle_config.php';

class MoodleConnector {
    private $moodle_db;
    private $prefix;

    /**
     * Constructor
     */
    public function __construct() {
        $this->moodle_db = MoodleConfig::getMoodleDB();
        $this->prefix = MoodleConfig::MOODLE_DB_PREFIX;
    }

    /**
     * Get quiz information by quiz ID
     * @param int $quiz_id
     * @return array|null
     */
    public function getQuizInfo($quiz_id) {
        $query = "SELECT q.*, c.id as course_id, c.fullname as course_name
                  FROM {$this->prefix}quiz q
                  INNER JOIN {$this->prefix}course c ON q.course = c.id
                  WHERE q.id = :quiz_id";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get questions for a specific quiz
     * @param int $quiz_id
     * @return array
     */
    public function getQuizQuestions($quiz_id) {
        $query = "SELECT
                    q.id as question_id,
                    q.name as question_name,
                    q.questiontext,
                    q.qtype as question_type,
                    qa.slot,
                    qa.maxmark
                  FROM {$this->prefix}quiz_slots qa
                  INNER JOIN {$this->prefix}question q ON qa.questionid = q.id
                  WHERE qa.quizid = :quiz_id
                  ORDER BY qa.slot";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get student attempts for a quiz
     * @param int $quiz_id
     * @param int $student_id
     * @return array
     */
    public function getStudentQuizAttempts($quiz_id, $student_id) {
        $query = "SELECT
                    qa.id as attempt_id,
                    qa.attempt as attempt_number,
                    qa.state,
                    qa.timestart,
                    qa.timefinish,
                    qa.sumgrades,
                    u.firstname,
                    u.lastname,
                    u.email
                  FROM {$this->prefix}quiz_attempts qa
                  INNER JOIN {$this->prefix}user u ON qa.userid = u.id
                  WHERE qa.quiz = :quiz_id AND qa.userid = :student_id
                  ORDER BY qa.attempt DESC";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get question attempt data
     * @param int $attempt_id
     * @param int $question_id
     * @return array|null
     */
    public function getQuestionAttemptData($attempt_id, $question_id) {
        $query = "SELECT
                    qa.id as question_attempt_id,
                    qa.questionid,
                    qa.slot,
                    qa.behaviour,
                    qa.questionsummary,
                    qa.rightanswer,
                    qa.responsesummary,
                    qa.timemodified,
                    qas.state,
                    qas.fraction,
                    qas.timecreated
                  FROM {$this->prefix}question_attempts qa
                  INNER JOIN {$this->prefix}question_attempt_steps qas ON qa.id = qas.questionattemptid
                  WHERE qa.questionusageid = :attempt_id AND qa.questionid = :question_id
                  ORDER BY qas.sequencenumber DESC
                  LIMIT 1";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':attempt_id', $attempt_id, PDO::PARAM_INT);
        $stmt->bindParam(':question_id', $question_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get student information
     * @param int $student_id
     * @return array|null
     */
    public function getStudentInfo($student_id) {
        $query = "SELECT
                    id,
                    username,
                    firstname,
                    lastname,
                    email,
                    lastaccess
                  FROM {$this->prefix}user
                  WHERE id = :student_id";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get course information
     * @param int $course_id
     * @return array|null
     */
    public function getCourseInfo($course_id) {
        $query = "SELECT
                    id,
                    fullname,
                    shortname,
                    category,
                    visible,
                    startdate,
                    enddate
                  FROM {$this->prefix}course
                  WHERE id = :course_id";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':course_id', $course_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get enrolled students in a course
     * @param int $course_id
     * @return array
     */
    public function getCourseStudents($course_id) {
        $query = "SELECT DISTINCT
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    u.email
                  FROM {$this->prefix}user u
                  INNER JOIN {$this->prefix}user_enrolments ue ON u.id = ue.userid
                  INNER JOIN {$this->prefix}enrol e ON ue.enrolid = e.id
                  INNER JOIN {$this->prefix}role_assignments ra ON u.id = ra.userid
                  INNER JOIN {$this->prefix}context ctx ON ra.contextid = ctx.id
                  INNER JOIN {$this->prefix}role r ON ra.roleid = r.id
                  WHERE e.courseid = :course_id
                    AND ctx.contextlevel = 50
                    AND r.shortname = 'student'
                  ORDER BY u.lastname, u.firstname";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':course_id', $course_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Verify student session from Moodle
     * @param string $session_key
     * @return array|null
     */
    public function verifyMoodleSession($session_key) {
        $query = "SELECT
                    s.userid,
                    s.timecreated,
                    s.timemodified,
                    u.username,
                    u.firstname,
                    u.lastname
                  FROM {$this->prefix}sessions s
                  INNER JOIN {$this->prefix}user u ON s.userid = u.id
                  WHERE s.sid = :session_key
                    AND s.timemodified > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 HOUR))";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':session_key', $session_key);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Get quiz settings including duplicate prevention settings
     * @param int $quiz_id
     * @return array|null
     */
    public function getQuizSettings($quiz_id) {
        $query = "SELECT
                    q.id,
                    q.name,
                    q.timeclose,
                    q.timelimit,
                    q.attempts as max_attempts,
                    q.grademethod,
                    q.questionsperpage,
                    q.shuffleanswers,
                    q.preferredbehaviour
                  FROM {$this->prefix}quiz q
                  WHERE q.id = :quiz_id";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Check if student has active quiz attempt
     * @param int $quiz_id
     * @param int $student_id
     * @return array|null
     */
    public function hasActiveAttempt($quiz_id, $student_id) {
        $query = "SELECT *
                  FROM {$this->prefix}quiz_attempts
                  WHERE quiz = :quiz_id
                    AND userid = :student_id
                    AND state IN ('inprogress', 'overdue')
                  ORDER BY attempt DESC
                  LIMIT 1";

        $stmt = $this->moodle_db->prepare($query);
        $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }
}
