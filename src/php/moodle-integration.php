<?php
/**
 * Moodle Integration Class
 * Moodle LMS와의 데이터베이스 연동
 *
 * Moodle 3.7 호환
 */

class MoodleIntegration {
    private $db;
    private $moodleDb;
    private $config;

    public function __construct() {
        // 설정 로드
        $this->config = require __DIR__ . '/../../config/database.php';

        // 데이터베이스 연결
        $this->connectDatabase();
        $this->connectMoodle();
    }

    /**
     * Root Wave 데이터베이스 연결
     */
    private function connectDatabase() {
        try {
            $dsn = "mysql:host={$this->config['host']};dbname={$this->config['database']};charset=utf8mb4";
            $this->db = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            throw new Exception('데이터베이스 연결 실패: ' . $e->getMessage());
        }
    }

    /**
     * Moodle 데이터베이스 연결
     */
    private function connectMoodle() {
        try {
            $moodleConfig = $this->config['moodle'];
            $dsn = "mysql:host={$moodleConfig['host']};dbname={$moodleConfig['database']};charset=utf8mb4";
            $this->moodleDb = new PDO(
                $dsn,
                $moodleConfig['username'],
                $moodleConfig['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            // Moodle DB 연결 실패 시 경고만 표시 (선택사항)
            error_log('Moodle 데이터베이스 연결 실패: ' . $e->getMessage());
            $this->moodleDb = null;
        }
    }

    /**
     * 현재 문제 가져오기
     */
    public function getCurrentProblem($userId = null, $courseId = null) {
        // Moodle에서 현재 활성화된 퀴즈 문제 가져오기
        if ($this->moodleDb && $userId && $courseId) {
            return $this->getProblemFromMoodle($userId, $courseId);
        }

        // 데모 데이터 반환 (Moodle 연결 없을 때)
        return $this->getDemoProblem();
    }

    /**
     * Moodle에서 문제 가져오기
     */
    private function getProblemFromMoodle($userId, $courseId) {
        try {
            // Moodle의 quiz_attempts와 question 테이블에서 정보 조회
            $sql = "
                SELECT
                    q.id,
                    q.questiontext,
                    q.qtype,
                    qa.state,
                    qa.timemodified
                FROM mdl_quiz_attempts qa
                JOIN mdl_question_attempts qua ON qa.id = qua.questionusageid
                JOIN mdl_question q ON qua.questionid = q.id
                WHERE qa.userid = :userid
                AND qa.state = 'inprogress'
                AND q.qtype IN ('calculated', 'numerical')
                ORDER BY qa.timemodified DESC
                LIMIT 1
            ";

            $stmt = $this->moodleDb->prepare($sql);
            $stmt->execute(['userid' => $userId]);
            $result = $stmt->fetch();

            if ($result) {
                // 방정식 텍스트 추출 및 정제
                $equation = $this->extractEquation($result['questiontext']);

                return [
                    'id' => $result['id'],
                    'equation' => $equation,
                    'type' => $result['qtype'],
                    'state' => $result['state'],
                    'timestamp' => $result['timemodified']
                ];
            }

            return null;
        } catch (PDOException $e) {
            error_log('Moodle 문제 조회 실패: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 방정식 텍스트 추출
     */
    private function extractEquation($questionText) {
        // HTML 태그 제거
        $text = strip_tags($questionText);

        // 방정식 패턴 매칭
        // 예: "다음 방정식을 풀어라: x^2 + 2x + 1 = 0"
        $patterns = [
            '/방정식[:\s]+(.+?=\s*0)/u',
            '/식[:\s]+(.+?=\s*0)/u',
            '/solve[:\s]+(.+?=\s*0)/i',
            '/equation[:\s]+(.+?=\s*0)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        // 패턴이 없으면 "= 0"로 끝나는 부분 찾기
        if (preg_match('/(.+?=\s*0)/', $text, $matches)) {
            return trim($matches[1]);
        }

        // 기본값
        return $text;
    }

    /**
     * 데모 문제 반환
     */
    private function getDemoProblem() {
        $equations = [
            'x^2 - 4 = 0',
            'x^2 + 1 = 0',
            'x^2 - 2x + 1 = 0',
            '2x - 6 = 0',
            'x^2 - 5x + 6 = 0',
        ];

        $randomEquation = $equations[array_rand($equations)];

        return [
            'id' => 'demo_' . time(),
            'equation' => $randomEquation,
            'type' => 'demo',
            'difficulty' => 'medium',
            'timestamp' => time()
        ];
    }

    /**
     * 응답 제출
     */
    public function submitAnswer($userId, $answer, $timestamp) {
        try {
            $sql = "
                INSERT INTO problem_answers
                (user_id, answer, submitted_at, created_at)
                VALUES (:user_id, :answer, :submitted_at, NOW())
            ";

            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([
                'user_id' => $userId,
                'answer' => $answer,
                'submitted_at' => date('Y-m-d H:i:s', $timestamp)
            ]);

            return [
                'id' => $this->db->lastInsertId(),
                'success' => $result
            ];
        } catch (PDOException $e) {
            error_log('응답 저장 실패: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 근 변화 기록 저장
     */
    public function saveRootChange($data) {
        try {
            $sql = "
                INSERT INTO root_changes
                (equation, old_count, new_count, roots, user_id, created_at)
                VALUES (:equation, :old_count, :new_count, :roots, :user_id, NOW())
            ";

            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([
                'equation' => $data['equation'],
                'old_count' => $data['old_count'],
                'new_count' => $data['new_count'],
                'roots' => $data['roots'],
                'user_id' => $data['user_id']
            ]);

            return [
                'id' => $this->db->lastInsertId(),
                'success' => $result
            ];
        } catch (PDOException $e) {
            error_log('근 변화 저장 실패: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 기록 조회
     */
    public function getHistory($userId = null, $limit = 20) {
        try {
            $sql = "
                SELECT *
                FROM root_changes
                WHERE 1=1
            ";

            $params = [];

            if ($userId) {
                $sql .= " AND user_id = :user_id";
                $params['user_id'] = $userId;
            }

            $sql .= " ORDER BY created_at DESC LIMIT :limit";

            $stmt = $this->db->prepare($sql);

            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('기록 조회 실패: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * 데이터베이스 연결 종료
     */
    public function __destruct() {
        $this->db = null;
        $this->moodleDb = null;
    }
}
