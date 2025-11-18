<?php
/**
 * Moodle LMS 연동 API
 *
 * 요구사항:
 * - PHP 7.1.9
 * - MySQL 5.7
 * - Moodle 3.7
 *
 * 사용법:
 * POST 요청으로 action과 필요한 파라미터를 전송
 */

// 에러 리포팅 설정
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Moodle Connector 클래스
 */
class MoodleConnector {
    private $moodle_url;
    private $ws_token;
    private $db_host = 'localhost';
    private $db_name = 'moodle';
    private $db_user = 'moodle_user';
    private $db_pass = 'moodle_pass';
    private $db_conn;

    /**
     * 생성자
     */
    public function __construct() {
        // 세션 시작
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    /**
     * 데이터베이스 연결
     */
    private function connectDB() {
        if ($this->db_conn) {
            return true;
        }

        try {
            $this->db_conn = new mysqli(
                $this->db_host,
                $this->db_user,
                $this->db_pass,
                $this->db_name
            );

            if ($this->db_conn->connect_error) {
                throw new Exception('DB 연결 실패: ' . $this->db_conn->connect_error);
            }

            $this->db_conn->set_charset('utf8mb4');
            return true;
        } catch (Exception $e) {
            $this->logError('DB 연결 오류: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Moodle 연결 설정
     */
    public function connect($moodle_url, $ws_token) {
        $this->moodle_url = rtrim($moodle_url, '/');
        $this->ws_token = $ws_token;

        // Moodle 연결 테스트
        $test_result = $this->callMoodleWebService('core_webservice_get_site_info', []);

        if ($test_result && isset($test_result->sitename)) {
            // 세션에 저장
            $_SESSION['moodle_url'] = $this->moodle_url;
            $_SESSION['ws_token'] = $this->ws_token;
            $_SESSION['session_token'] = $this->generateSessionToken();

            return [
                'success' => true,
                'session_token' => $_SESSION['session_token'],
                'site_name' => $test_result->sitename,
                'site_version' => $test_result->version ?? 'unknown'
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Moodle 연결 실패'
            ];
        }
    }

    /**
     * 문제 정보 가져오기
     */
    public function getProblem($problem_id) {
        if (!$this->validateSession()) {
            return ['success' => false, 'error' => '세션이 유효하지 않습니다.'];
        }

        // DB에서 문제 정보 조회
        if ($this->connectDB()) {
            $stmt = $this->db_conn->prepare(
                "SELECT * FROM mdl_question WHERE id = ? OR idnumber = ?"
            );
            $stmt->bind_param('ss', $problem_id, $problem_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) {
                // 문제 데이터 파싱
                $problem = $this->parseProblemData($row);

                return [
                    'success' => true,
                    'problem' => $problem
                ];
            }
        }

        // DB 조회 실패시 Moodle API로 시도
        $moodle_result = $this->callMoodleWebService('core_question_get_questions', [
            'questionids' => [$problem_id]
        ]);

        if ($moodle_result && isset($moodle_result->questions)) {
            return [
                'success' => true,
                'problem' => $this->parseMoodleProblem($moodle_result->questions[0])
            ];
        }

        return [
            'success' => false,
            'error' => '문제를 찾을 수 없습니다.'
        ];
    }

    /**
     * 답안 제출
     */
    public function submitAnswer($problem_id, $answer, $steps) {
        if (!$this->validateSession()) {
            return ['success' => false, 'error' => '세션이 유효하지 않습니다.'];
        }

        // 문제 정보 가져오기
        $problem_result = $this->getProblem($problem_id);
        if (!$problem_result['success']) {
            return $problem_result;
        }

        $problem = $problem_result['problem'];
        $correct_answer = $problem['correct_answer'];

        // 답안 검증
        $is_correct = (abs($answer - $correct_answer) < 0.01);
        $grade = $is_correct ? 100 : 0;

        // 피드백 생성
        $feedback = $this->generateFeedback($is_correct, $answer, $correct_answer, $steps);

        // DB에 답안 저장
        if ($this->connectDB()) {
            $this->saveAnswerToDB($problem_id, $answer, $steps, $is_correct, $grade);
        }

        return [
            'success' => true,
            'correct' => $is_correct,
            'feedback' => $feedback,
            'grade' => $grade,
            'correct_answer' => $correct_answer
        ];
    }

    /**
     * 학습 진행상황 저장
     */
    public function saveProgress($problem_id, $progress_data) {
        if (!$this->validateSession()) {
            return ['success' => false, 'error' => '세션이 유효하지 않습니다.'];
        }

        if ($this->connectDB()) {
            $user_id = $_SESSION['user_id'] ?? 0;
            $timestamp = time();

            $stmt = $this->db_conn->prepare(
                "INSERT INTO mdl_logflow_progress (user_id, problem_id, progress_data, timestamp)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE progress_data = ?, timestamp = ?"
            );

            $stmt->bind_param(
                'issisi',
                $user_id,
                $problem_id,
                $progress_data,
                $timestamp,
                $progress_data,
                $timestamp
            );

            if ($stmt->execute()) {
                return ['success' => true];
            }
        }

        return ['success' => false, 'error' => '진행상황 저장 실패'];
    }

    /**
     * 로그 계산 문제 목록 가져오기
     */
    public function getLogProblems() {
        if (!$this->validateSession()) {
            return ['success' => false, 'error' => '세션이 유효하지 않습니다.'];
        }

        $problems = [];

        if ($this->connectDB()) {
            $result = $this->db_conn->query(
                "SELECT * FROM mdl_question
                 WHERE qtype = 'numerical'
                 AND questiontext LIKE '%log%'
                 ORDER BY id DESC
                 LIMIT 50"
            );

            while ($row = $result->fetch_assoc()) {
                $problems[] = $this->parseProblemData($row);
            }
        }

        return [
            'success' => true,
            'problems' => $problems
        ];
    }

    /**
     * Moodle Web Service 호출
     */
    private function callMoodleWebService($function, $params) {
        if (!$this->moodle_url || !$this->ws_token) {
            $this->loadSessionCredentials();
        }

        $url = $this->moodle_url . '/webservice/rest/server.php';

        $data = array_merge($params, [
            'wstoken' => $this->ws_token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code === 200) {
            return json_decode($response);
        }

        return null;
    }

    /**
     * 문제 데이터 파싱
     */
    private function parseProblemData($row) {
        // 문제 텍스트에서 로그 정보 추출
        preg_match('/log[_\s]*(\d+)\s*\((\d+)\)/', $row['questiontext'], $matches);

        $base = isset($matches[1]) ? intval($matches[1]) : 2;
        $value = isset($matches[2]) ? intval($matches[2]) : 8;
        $correct_answer = log($value) / log($base);

        return [
            'id' => $row['id'] ?? $row['idnumber'],
            'title' => strip_tags($row['name'] ?? $row['questiontext']),
            'description' => strip_tags($row['questiontext']),
            'base' => $base,
            'value' => $value,
            'correct_answer' => $correct_answer,
            'difficulty' => $this->determineDifficulty($base, $value),
            'category' => 'logarithm'
        ];
    }

    /**
     * Moodle 문제 파싱
     */
    private function parseMoodleProblem($question) {
        return [
            'id' => $question->id,
            'title' => $question->name,
            'description' => strip_tags($question->questiontext),
            'base' => 2,
            'value' => 8,
            'correct_answer' => 3,
            'difficulty' => 'medium',
            'category' => 'logarithm'
        ];
    }

    /**
     * 난이도 결정
     */
    private function determineDifficulty($base, $value) {
        $result = log($value) / log($base);

        if (Number_isInteger($result) && $result <= 3) {
            return 'easy';
        } elseif (Number_isInteger($result) && $result <= 5) {
            return 'medium';
        } else {
            return 'hard';
        }
    }

    /**
     * 피드백 생성
     */
    private function generateFeedback($is_correct, $answer, $correct_answer, $steps) {
        if ($is_correct) {
            return [
                'title' => '정답입니다! 🎉',
                'message' => "훌륭합니다! 로그 계산을 정확하게 수행했습니다.",
                'steps_feedback' => '계산 과정이 완벽합니다.'
            ];
        } else {
            return [
                'title' => '다시 한번 시도해보세요',
                'message' => "아쉽습니다. 정답은 {$correct_answer}입니다.",
                'hint' => "밑을 몇 번 곱해야 진수가 되는지 다시 생각해보세요.",
                'steps_feedback' => '계산 과정을 다시 확인해보세요.'
            ];
        }
    }

    /**
     * 답안 DB 저장
     */
    private function saveAnswerToDB($problem_id, $answer, $steps, $is_correct, $grade) {
        $user_id = $_SESSION['user_id'] ?? 0;
        $timestamp = time();

        $stmt = $this->db_conn->prepare(
            "INSERT INTO mdl_logflow_answers
             (user_id, problem_id, answer, steps, is_correct, grade, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->bind_param(
            'isdsiii',
            $user_id,
            $problem_id,
            $answer,
            $steps,
            $is_correct,
            $grade,
            $timestamp
        );

        $stmt->execute();
    }

    /**
     * 세션 토큰 생성
     */
    private function generateSessionToken() {
        return bin2hex(random_bytes(32));
    }

    /**
     * 세션 검증
     */
    private function validateSession() {
        return isset($_SESSION['session_token']) && !empty($_SESSION['session_token']);
    }

    /**
     * 세션에서 인증 정보 로드
     */
    private function loadSessionCredentials() {
        $this->moodle_url = $_SESSION['moodle_url'] ?? '';
        $this->ws_token = $_SESSION['ws_token'] ?? '';
    }

    /**
     * 에러 로깅
     */
    private function logError($message) {
        error_log('[MoodleConnector] ' . $message);
    }
}

/**
 * API 요청 처리
 */
function handleRequest() {
    $connector = new MoodleConnector();

    $action = $_POST['action'] ?? $_GET['action'] ?? '';

    switch ($action) {
        case 'connect':
            $moodle_url = $_POST['moodle_url'] ?? '';
            $ws_token = $_POST['ws_token'] ?? '';
            return $connector->connect($moodle_url, $ws_token);

        case 'get_problem':
            $problem_id = $_POST['problem_id'] ?? '';
            return $connector->getProblem($problem_id);

        case 'submit_answer':
            $problem_id = $_POST['problem_id'] ?? '';
            $answer = floatval($_POST['answer'] ?? 0);
            $steps = $_POST['steps'] ?? '[]';
            return $connector->submitAnswer($problem_id, $answer, $steps);

        case 'save_progress':
            $problem_id = $_POST['problem_id'] ?? '';
            $progress_data = $_POST['progress_data'] ?? '{}';
            return $connector->saveProgress($problem_id, $progress_data);

        case 'get_log_problems':
            return $connector->getLogProblems();

        default:
            return [
                'success' => false,
                'error' => 'Invalid action'
            ];
    }
}

// 요청 처리 및 응답
try {
    $result = handleRequest();
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
