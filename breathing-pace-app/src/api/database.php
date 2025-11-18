<?php
/**
 * Database Connection and Helper Functions
 * Breathing Pace Learning Assistant
 */

require_once __DIR__ . '/../config/config.php';

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        $this->connect();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function connect() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                die("Database connection failed: " . $e->getMessage());
            } else {
                die("Database connection failed");
            }
        }
    }

    public function getConnection() {
        return $this->connection;
    }

    /**
     * 세션 생성
     */
    public function createSession($userId, $questionId, $difficulty, $inhaleDuration, $exhaleDuration, $totalCycles = 3) {
        $sql = "INSERT INTO breathing_sessions
                (user_id, question_id, difficulty, inhale_duration, exhale_duration, total_cycles, status)
                VALUES (:user_id, :question_id, :difficulty, :inhale_duration, :exhale_duration, :total_cycles, 'started')";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':question_id' => $questionId,
            ':difficulty' => $difficulty,
            ':inhale_duration' => $inhaleDuration,
            ':exhale_duration' => $exhaleDuration,
            ':total_cycles' => $totalCycles
        ]);

        return $this->connection->lastInsertId();
    }

    /**
     * 세션 완료 처리
     */
    public function completeSession($sessionId, $completedCycles, $durationSeconds) {
        $sql = "UPDATE breathing_sessions
                SET status = 'completed',
                    completed_cycles = :completed_cycles,
                    duration_seconds = :duration_seconds,
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = :session_id";

        $stmt = $this->connection->prepare($sql);
        return $stmt->execute([
            ':session_id' => $sessionId,
            ':completed_cycles' => $completedCycles,
            ':duration_seconds' => $durationSeconds
        ]);
    }

    /**
     * 사용자 통계 조회
     */
    public function getUserStats($userId) {
        $sql = "SELECT * FROM user_statistics WHERE user_id = :user_id";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([':user_id' => $userId]);

        $stats = $stmt->fetch();

        if (!$stats) {
            return [
                'total_sessions' => 0,
                'total_cycles' => 0,
                'total_duration_seconds' => 0,
                'easy_count' => 0,
                'medium_count' => 0,
                'hard_count' => 0,
                'very_hard_count' => 0
            ];
        }

        return $stats;
    }

    /**
     * 문제 저장 또는 업데이트
     */
    public function saveQuestion($moodleQuestionId, $quizId, $title, $difficulty, $questionType, $questionText = null) {
        $sql = "INSERT INTO questions
                (moodle_question_id, quiz_id, title, difficulty, question_type, question_text)
                VALUES (:moodle_question_id, :quiz_id, :title, :difficulty, :question_type, :question_text)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    difficulty = VALUES(difficulty),
                    question_type = VALUES(question_type),
                    question_text = VALUES(question_text),
                    updated_at = CURRENT_TIMESTAMP";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            ':moodle_question_id' => $moodleQuestionId,
            ':quiz_id' => $quizId,
            ':title' => $title,
            ':difficulty' => $difficulty,
            ':question_type' => $questionType,
            ':question_text' => $questionText
        ]);

        return $this->connection->lastInsertId() ?: $this->getQuestionId($moodleQuestionId, $quizId);
    }

    /**
     * 문제 ID 조회
     */
    public function getQuestionId($moodleQuestionId, $quizId) {
        $sql = "SELECT id FROM questions WHERE moodle_question_id = :moodle_question_id AND quiz_id = :quiz_id";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            ':moodle_question_id' => $moodleQuestionId,
            ':quiz_id' => $quizId
        ]);

        $result = $stmt->fetch();
        return $result ? $result['id'] : null;
    }

    /**
     * 로그 기록
     */
    public function log($userId, $action, $details = null, $ipAddress = null, $userAgent = null) {
        $sql = "INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
                VALUES (:user_id, :action, :details, :ip_address, :user_agent)";

        $stmt = $this->connection->prepare($sql);
        return $stmt->execute([
            ':user_id' => $userId,
            ':action' => $action,
            ':details' => $details,
            ':ip_address' => $ipAddress,
            ':user_agent' => $userAgent
        ]);
    }

    /**
     * 난이도별 통계 조회
     */
    public function getDifficultyStats() {
        $sql = "SELECT * FROM v_difficulty_stats";
        $stmt = $this->connection->query($sql);
        return $stmt->fetchAll();
    }
}
?>
