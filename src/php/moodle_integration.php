<?php
/**
 * Moodle 3.7 Integration Module
 * Handles communication with Moodle LMS
 */

require_once __DIR__ . '/../../config/config.php';

class MoodleIntegration {
    private $moodleDir;
    private $moodleDB;

    public function __construct() {
        if (!MOODLE_INTEGRATION_ENABLED) {
            return;
        }

        $this->moodleDir = MOODLE_DIR;

        // Moodle config 로드
        if (file_exists($this->moodleDir . '/config.php')) {
            require_once($this->moodleDir . '/config.php');
            global $CFG, $DB;
            $this->moodleDB = $DB;
        }
    }

    /**
     * Moodle 사용자 정보 가져오기
     */
    public function getUser($userId) {
        if (!MOODLE_INTEGRATION_ENABLED || !$this->moodleDB) {
            return null;
        }

        try {
            $user = $this->moodleDB->get_record('user', ['id' => $userId]);
            return $user;
        } catch (Exception $e) {
            error_log("Moodle user fetch error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Moodle 문제(question) 정보 가져오기
     */
    public function getQuestion($questionId) {
        if (!MOODLE_INTEGRATION_ENABLED || !$this->moodleDB) {
            return null;
        }

        try {
            $question = $this->moodleDB->get_record('question', ['id' => $questionId]);
            return $question;
        } catch (Exception $e) {
            error_log("Moodle question fetch error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Moodle 퀴즈 시도 기록 저장
     */
    public function saveAttempt($userId, $questionId, $response, $score) {
        if (!MOODLE_INTEGRATION_ENABLED || !$this->moodleDB) {
            return false;
        }

        try {
            $attempt = new stdClass();
            $attempt->userid = $userId;
            $attempt->questionid = $questionId;
            $attempt->response = $response;
            $attempt->score = $score;
            $attempt->timemodified = time();

            // Moodle의 question_attempts 테이블에 저장
            // (실제 Moodle API 사용 시 더 복잡한 로직 필요)
            return true;
        } catch (Exception $e) {
            error_log("Moodle attempt save error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Moodle 세션 검증
     */
    public function validateSession($sessionKey) {
        if (!MOODLE_INTEGRATION_ENABLED) {
            return null;
        }

        // Moodle 세션 검증 로직
        // 실제 구현 시 Moodle의 세션 관리 API 사용
        return null;
    }

    /**
     * Moodle 코스 정보 가져오기
     */
    public function getCourse($courseId) {
        if (!MOODLE_INTEGRATION_ENABLED || !$this->moodleDB) {
            return null;
        }

        try {
            $course = $this->moodleDB->get_record('course', ['id' => $courseId]);
            return $course;
        } catch (Exception $e) {
            error_log("Moodle course fetch error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Moodle 활동 로그 기록
     */
    public function logActivity($userId, $action, $info = '') {
        if (!MOODLE_INTEGRATION_ENABLED || !$this->moodleDB) {
            return false;
        }

        try {
            $log = new stdClass();
            $log->userid = $userId;
            $log->action = $action;
            $log->info = $info;
            $log->time = time();

            // Moodle 로그 API 사용
            // $this->moodleDB->insert_record('log', $log);

            return true;
        } catch (Exception $e) {
            error_log("Moodle log error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Standalone 모드에서 사용할 더미 사용자 생성
     */
    public static function getDummyUser() {
        return [
            'id' => 1,
            'username' => 'demo_user',
            'firstname' => 'Demo',
            'lastname' => 'User',
            'email' => 'demo@example.com'
        ];
    }

    /**
     * Standalone 모드에서 사용할 더미 문제 생성
     */
    public static function getDummyQuestion($questionId) {
        $questions = [
            1 => [
                'id' => 1,
                'name' => '조합 문제',
                'questiontext' => '피자 토핑을 선택하세요',
                'qtype' => 'multichoice'
            ],
            2 => [
                'id' => 2,
                'name' => '순열 문제',
                'questiontext' => '사람들을 배치하세요',
                'qtype' => 'ordering'
            ],
            3 => [
                'id' => 3,
                'name' => '확률 문제',
                'questiontext' => '주사위를 던지세요',
                'qtype' => 'calculated'
            ]
        ];

        return $questions[$questionId] ?? null;
    }
}

?>
