<?php
/**
 * Moodle LMS 연동 클래스
 * Moodle 3.7 API와 통신
 */

require_once __DIR__ . '/config.php';

class MoodleConnector {
    private $conn;
    private $moodlePrefix;

    public function __construct() {
        $this->conn = getDBConnection();
        $this->moodlePrefix = MOODLE_PREFIX;
    }

    /**
     * Moodle 질문 정보 가져오기
     */
    public function getQuestion($questionId) {
        try {
            $sql = "SELECT
                        q.id,
                        q.name,
                        q.questiontext,
                        qc.name as category_name,
                        q.defaultmark as max_grade
                    FROM {$this->moodlePrefix}question q
                    LEFT JOIN {$this->moodlePrefix}question_categories qc ON q.category = qc.id
                    WHERE q.id = :question_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['question_id' => $questionId]);

            return $stmt->fetch();
        } catch (PDOException $e) {
            logError("Failed to get Moodle question: " . $e->getMessage(), [
                'question_id' => $questionId
            ]);
            return null;
        }
    }

    /**
     * 퀴즈 시도 정보 가져오기
     */
    public function getQuizAttempt($attemptId) {
        try {
            $sql = "SELECT
                        qa.id,
                        qa.quiz,
                        qa.userid,
                        qa.attempt,
                        qa.state,
                        qa.timestart,
                        qa.timefinish,
                        q.name as quiz_name,
                        q.timeclose,
                        q.grade as max_grade
                    FROM {$this->moodlePrefix}quiz_attempts qa
                    JOIN {$this->moodlePrefix}quiz q ON qa.quiz = q.id
                    WHERE qa.id = :attempt_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['attempt_id' => $attemptId]);

            return $stmt->fetch();
        } catch (PDOException $e) {
            logError("Failed to get quiz attempt: " . $e->getMessage(), [
                'attempt_id' => $attemptId
            ]);
            return null;
        }
    }

    /**
     * 사용자 정보 가져오기
     */
    public function getUser($userId) {
        try {
            $sql = "SELECT
                        u.id,
                        u.username,
                        u.firstname,
                        u.lastname,
                        u.email
                    FROM {$this->moodlePrefix}user u
                    WHERE u.id = :user_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['user_id' => $userId]);

            return $stmt->fetch();
        } catch (PDOException $e) {
            logError("Failed to get user: " . $e->getMessage(), [
                'user_id' => $userId
            ]);
            return null;
        }
    }

    /**
     * 질문 응답 저장 (Moodle에 연동)
     */
    public function saveQuestionAnswer($attemptId, $questionId, $answer, $fraction = null) {
        try {
            // 질문 사용 정보 가져오기
            $sql = "SELECT id
                    FROM {$this->moodlePrefix}question_usages
                    WHERE component = 'mod_quiz'
                    AND contextid IN (
                        SELECT ctx.id
                        FROM {$this->moodlePrefix}context ctx
                        JOIN {$this->moodlePrefix}quiz_attempts qa ON qa.quiz = ctx.instanceid
                        WHERE qa.id = :attempt_id
                        AND ctx.contextlevel = 70
                    )
                    LIMIT 1";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['attempt_id' => $attemptId]);
            $questionUsage = $stmt->fetch();

            if (!$questionUsage) {
                logError("Question usage not found", [
                    'attempt_id' => $attemptId
                ]);
                return false;
            }

            // 실제 Moodle API를 사용하여 응답을 저장해야 함
            // 여기서는 간단한 데이터베이스 저장만 구현
            logActivity('save_answer', $attemptId, [
                'question_id' => $questionId,
                'answer' => $answer,
                'fraction' => $fraction
            ]);

            return true;
        } catch (PDOException $e) {
            logError("Failed to save question answer: " . $e->getMessage(), [
                'attempt_id' => $attemptId,
                'question_id' => $questionId
            ]);
            return false;
        }
    }

    /**
     * 코스 정보 가져오기
     */
    public function getCourse($courseId) {
        try {
            $sql = "SELECT
                        c.id,
                        c.fullname,
                        c.shortname,
                        c.category,
                        c.startdate,
                        c.enddate
                    FROM {$this->moodlePrefix}course c
                    WHERE c.id = :course_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['course_id' => $courseId]);

            return $stmt->fetch();
        } catch (PDOException $e) {
            logError("Failed to get course: " . $e->getMessage(), [
                'course_id' => $courseId
            ]);
            return null;
        }
    }

    /**
     * 사용자의 코스 등록 확인
     */
    public function isUserEnrolled($userId, $courseId) {
        try {
            $sql = "SELECT COUNT(*) as count
                    FROM {$this->moodlePrefix}user_enrolments ue
                    JOIN {$this->moodlePrefix}enrol e ON ue.enrolid = e.id
                    WHERE ue.userid = :user_id
                    AND e.courseid = :course_id
                    AND ue.status = 0";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'course_id' => $courseId
            ]);

            $result = $stmt->fetch();
            return $result['count'] > 0;
        } catch (PDOException $e) {
            logError("Failed to check user enrollment: " . $e->getMessage(), [
                'user_id' => $userId,
                'course_id' => $courseId
            ]);
            return false;
        }
    }

    /**
     * Moodle 세션 검증
     */
    public function validateMoodleSession($sessionKey) {
        try {
            $sql = "SELECT
                        s.userid,
                        s.timecreated,
                        s.timemodified
                    FROM {$this->moodlePrefix}sessions s
                    WHERE s.sid = :session_key
                    AND s.timemodified > :timeout";

            $timeout = time() - SESSION_TIMEOUT;

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                'session_key' => $sessionKey,
                'timeout' => $timeout
            ]);

            $session = $stmt->fetch();

            if ($session) {
                return [
                    'valid' => true,
                    'user_id' => $session['userid']
                ];
            }

            return ['valid' => false];
        } catch (PDOException $e) {
            logError("Failed to validate Moodle session: " . $e->getMessage(), [
                'session_key' => $sessionKey
            ]);
            return ['valid' => false];
        }
    }

    /**
     * 성적 기록 저장
     */
    public function saveGrade($userId, $itemId, $grade, $feedback = '') {
        try {
            // Moodle grades 테이블에 성적 저장
            $sql = "INSERT INTO {$this->moodlePrefix}grade_grades
                    (itemid, userid, rawgrade, feedback, timemodified, timecreated)
                    VALUES (:item_id, :user_id, :grade, :feedback, :time, :time)
                    ON DUPLICATE KEY UPDATE
                    rawgrade = :grade,
                    feedback = :feedback,
                    timemodified = :time";

            $time = time();

            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([
                'item_id' => $itemId,
                'user_id' => $userId,
                'grade' => $grade,
                'feedback' => $feedback,
                'time' => $time
            ]);

            logActivity('save_grade', $userId, [
                'item_id' => $itemId,
                'grade' => $grade
            ]);

            return $result;
        } catch (PDOException $e) {
            logError("Failed to save grade: " . $e->getMessage(), [
                'user_id' => $userId,
                'item_id' => $itemId,
                'grade' => $grade
            ]);
            return false;
        }
    }

    /**
     * 연결 종료
     */
    public function __destruct() {
        $this->conn = null;
    }
}
