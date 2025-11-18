<?php
/**
 * Factor Lego - Moodle Connector
 * Moodle 3.7과 연동하여 문제 정보를 가져오는 클래스
 */

require_once 'config.php';

class MoodleConnector {
    private $moodle_conn;
    private $factor_conn;

    public function __construct() {
        $this->connect_moodle();
        $this->connect_factor_db();
    }

    /**
     * Moodle 데이터베이스 연결
     */
    private function connect_moodle() {
        try {
            $this->moodle_conn = new PDO(
                "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=utf8mb4",
                MOODLE_DB_USER,
                MOODLE_DB_PASS,
                array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
            );
        } catch (PDOException $e) {
            $this->log_error("Moodle DB connection failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Factor Lego 데이터베이스 연결
     */
    private function connect_factor_db() {
        try {
            $this->factor_conn = new PDO(
                "mysql:host=" . FACTOR_DB_HOST . ";dbname=" . FACTOR_DB_NAME . ";charset=utf8mb4",
                FACTOR_DB_USER,
                FACTOR_DB_PASS,
                array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
            );
        } catch (PDOException $e) {
            $this->log_error("Factor DB connection failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Moodle에서 문제 정보 가져오기
     * @param int $question_id Moodle 문제 ID
     * @return array 문제 정보
     */
    public function get_question_from_moodle($question_id) {
        $query = "
            SELECT
                q.id,
                q.name,
                q.questiontext,
                qa.rightanswer,
                qa.feedback
            FROM " . MOODLE_DB_PREFIX . "question q
            LEFT JOIN " . MOODLE_DB_PREFIX . "question_answers qa ON q.id = qa.question
            WHERE q.id = :question_id
            LIMIT 1
        ";

        $stmt = $this->moodle_conn->prepare($query);
        $stmt->execute(['question_id' => $question_id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * 학생의 Moodle 세션 확인
     * @param string $session_key Moodle 세션 키
     * @return array|false 학생 정보
     */
    public function verify_student_session($session_key) {
        $query = "
            SELECT
                u.id,
                u.username,
                u.firstname,
                u.lastname,
                u.email
            FROM " . MOODLE_DB_PREFIX . "sessions s
            JOIN " . MOODLE_DB_PREFIX . "user u ON s.userid = u.id
            WHERE s.sid = :session_key
            AND s.timemodified > UNIX_TIMESTAMP(NOW() - INTERVAL 1 HOUR)
        ";

        $stmt = $this->moodle_conn->prepare($query);
        $stmt->execute(['session_key' => $session_key]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Factor Lego에 문제 정보 저장/업데이트
     * @param array $question_data 문제 데이터
     * @return int 저장된 문제 ID
     */
    public function sync_question_to_factor($question_data) {
        // 기존 문제가 있는지 확인
        $check_query = "SELECT id FROM factor_problems WHERE moodle_question_id = :moodle_id";
        $check_stmt = $this->factor_conn->prepare($check_query);
        $check_stmt->execute(['moodle_id' => $question_data['moodle_question_id']]);
        $existing = $check_stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // 업데이트
            $update_query = "
                UPDATE factor_problems
                SET expression = :expression,
                    difficulty_level = :difficulty,
                    problem_type = :type,
                    correct_factors = :factors,
                    hints = :hints,
                    updated_at = CURRENT_TIMESTAMP
                WHERE moodle_question_id = :moodle_id
            ";
            $stmt = $this->factor_conn->prepare($update_query);
            $stmt->execute([
                'expression' => $question_data['expression'],
                'difficulty' => $question_data['difficulty_level'],
                'type' => $question_data['problem_type'],
                'factors' => $question_data['correct_factors'],
                'hints' => $question_data['hints'],
                'moodle_id' => $question_data['moodle_question_id']
            ]);
            return $existing['id'];
        } else {
            // 새로 삽입
            $insert_query = "
                INSERT INTO factor_problems
                (moodle_question_id, expression, difficulty_level, problem_type, correct_factors, hints)
                VALUES (:moodle_id, :expression, :difficulty, :type, :factors, :hints)
            ";
            $stmt = $this->factor_conn->prepare($insert_query);
            $stmt->execute([
                'moodle_id' => $question_data['moodle_question_id'],
                'expression' => $question_data['expression'],
                'difficulty' => $question_data['difficulty_level'],
                'type' => $question_data['problem_type'],
                'factors' => $question_data['correct_factors'],
                'hints' => $question_data['hints']
            ]);
            return $this->factor_conn->lastInsertId();
        }
    }

    /**
     * 학생 답안을 Moodle로 전송
     * @param int $student_id 학생 ID
     * @param int $attempt_id 시도 ID
     * @param array $result 결과 데이터
     * @return bool 성공 여부
     */
    public function submit_result_to_moodle($student_id, $attempt_id, $result) {
        try {
            $query = "
                UPDATE " . MOODLE_DB_PREFIX . "question_attempts
                SET
                    responsesummary = :summary,
                    rightanswer = :correct_answer,
                    state = :state,
                    timemodified = UNIX_TIMESTAMP()
                WHERE id = :attempt_id AND userid = :student_id
            ";

            $stmt = $this->moodle_conn->prepare($query);
            $stmt->execute([
                'summary' => $result['student_answer'],
                'correct_answer' => $result['correct_factors'],
                'state' => $result['is_correct'] ? 'gradedright' : 'gradedwrong',
                'attempt_id' => $attempt_id,
                'student_id' => $student_id
            ]);

            return true;
        } catch (PDOException $e) {
            $this->log_error("Failed to submit result to Moodle: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 에러 로그 기록
     * @param string $message 에러 메시지
     */
    private function log_error($message) {
        if (DEBUG_MODE) {
            error_log("[Factor Lego Error] " . date('Y-m-d H:i:s') . " - " . $message);
        }
    }

    /**
     * 연결 종료
     */
    public function close() {
        $this->moodle_conn = null;
        $this->factor_conn = null;
    }
}
