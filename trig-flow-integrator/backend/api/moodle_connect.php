<?php
/**
 * Moodle LMS 연동 API
 * Moodle 3.7 Web Services를 사용하여 문제 정보를 가져옵니다
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

class MoodleConnector {
    private $moodle_url;
    private $ws_token;
    private $db;

    public function __construct() {
        $this->moodle_url = MOODLE_URL;
        $this->ws_token = MOODLE_WS_TOKEN;
        $this->db = Database::getInstance()->getMoodleConnection();
    }

    /**
     * Moodle Web Service REST API 호출
     */
    private function callMoodleWS($function, $params = []) {
        $url = $this->moodle_url . '/webservice/rest/server.php';
        $params['wstoken'] = $this->ws_token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 개발 환경용

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200) {
            throw new Exception("Moodle API call failed with HTTP code: $http_code");
        }

        $data = json_decode($response, true);
        if (isset($data['exception'])) {
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * 퀴즈 정보 가져오기
     */
    public function getQuizInfo($quiz_id) {
        try {
            // Moodle DB에서 직접 쿼리 (Web Service를 사용할 수도 있음)
            $stmt = $this->db->prepare("
                SELECT
                    q.id,
                    q.name,
                    q.intro,
                    q.timeopen,
                    q.timeclose,
                    q.timelimit,
                    q.grade
                FROM " . MOODLE_DB_PREFIX . "quiz q
                WHERE q.id = :quiz_id
            ");
            $stmt->execute(['quiz_id' => $quiz_id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to get quiz info', 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 퀴즈의 문제들 가져오기
     */
    public function getQuizQuestions($quiz_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    q.id,
                    q.name,
                    q.questiontext,
                    q.qtype,
                    q.defaultmark
                FROM " . MOODLE_DB_PREFIX . "quiz_slots qs
                JOIN " . MOODLE_DB_PREFIX . "question q ON qs.questionid = q.id
                WHERE qs.quizid = :quiz_id
                ORDER BY qs.slot
            ");
            $stmt->execute(['quiz_id' => $quiz_id]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to get quiz questions', 'error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * 사용자 정보 가져오기
     */
    public function getUserInfo($user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    u.email
                FROM " . MOODLE_DB_PREFIX . "user u
                WHERE u.id = :user_id
            ");
            $stmt->execute(['user_id' => $user_id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to get user info', 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 사용자의 퀴즈 시도 정보 가져오기
     */
    public function getUserQuizAttempt($quiz_id, $user_id) {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    qa.id,
                    qa.quiz,
                    qa.userid,
                    qa.attempt,
                    qa.state,
                    qa.timestart,
                    qa.timefinish,
                    qa.sumgrades
                FROM " . MOODLE_DB_PREFIX . "quiz_attempts qa
                WHERE qa.quiz = :quiz_id
                AND qa.userid = :user_id
                ORDER BY qa.attempt DESC
                LIMIT 1
            ");
            $stmt->execute([
                'quiz_id' => $quiz_id,
                'user_id' => $user_id
            ]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            logActivity('error', ['message' => 'Failed to get quiz attempt', 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 퀴즈 결과 제출
     */
    public function submitQuizAnswer($quiz_id, $user_id, $question_id, $answer, $is_correct) {
        // Moodle의 quiz attempt API를 사용하여 결과 제출
        // 실제 구현은 Moodle의 정확한 버전과 설정에 따라 달라질 수 있음
        logActivity('quiz_submit', [
            'quiz_id' => $quiz_id,
            'user_id' => $user_id,
            'question_id' => $question_id,
            'is_correct' => $is_correct
        ]);

        return true;
    }
}

// API 엔드포인트 처리
if (php_sapi_name() !== 'cli') {
    $method = $_SERVER['REQUEST_METHOD'];
    $moodle = new MoodleConnector();

    if ($method === 'GET') {
        $action = $_GET['action'] ?? '';

        switch ($action) {
            case 'quiz':
                $quiz_id = $_GET['quiz_id'] ?? 0;
                $quiz_info = $moodle->getQuizInfo($quiz_id);
                respondSuccess($quiz_info);
                break;

            case 'questions':
                $quiz_id = $_GET['quiz_id'] ?? 0;
                $questions = $moodle->getQuizQuestions($quiz_id);
                respondSuccess($questions);
                break;

            case 'user':
                $user_id = $_GET['user_id'] ?? 0;
                $user_info = $moodle->getUserInfo($user_id);
                respondSuccess($user_info);
                break;

            case 'attempt':
                $quiz_id = $_GET['quiz_id'] ?? 0;
                $user_id = $_GET['user_id'] ?? 0;
                $attempt = $moodle->getUserQuizAttempt($quiz_id, $user_id);
                respondSuccess($attempt);
                break;

            default:
                respondError('Invalid action', 400);
        }
    } else {
        respondError('Method not allowed', 405);
    }
}
