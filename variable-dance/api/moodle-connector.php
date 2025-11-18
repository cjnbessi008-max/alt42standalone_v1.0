<?php
/**
 * Moodle 3.7 Connector
 * Moodle Web Services를 통해 문제 정보를 가져오는 API
 */

require_once __DIR__ . '/../config/config.php';

class MoodleConnector {
    private $moodleUrl;
    private $token;
    private $wsUrl;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
        $this->wsUrl = MOODLE_WEBSERVICE_URL;
    }

    /**
     * Moodle Web Service 호출
     */
    private function callMoodleWS($functionName, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $functionName;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($this->wsUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 개발 환경용

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            logEvent("Moodle API error: HTTP $httpCode", 'ERROR');
            return null;
        }

        $result = json_decode($response, true);

        if (isset($result['exception'])) {
            logEvent("Moodle exception: " . $result['message'], 'ERROR');
            return null;
        }

        return $result;
    }

    /**
     * 특정 문제 정보 가져오기
     */
    public function getProblem($problemId) {
        // Moodle의 quiz question 정보 가져오기
        // 실제 Moodle 설치에 맞게 function name 조정 필요
        $result = $this->callMoodleWS('mod_quiz_get_quiz_questions', [
            'quizid' => $problemId
        ]);

        if ($result) {
            logEvent("Fetched problem $problemId from Moodle", 'INFO');
        }

        return $result;
    }

    /**
     * 사용자의 문제 목록 가져오기
     */
    public function getUserProblems($userId, $courseId = null) {
        $params = ['userid' => $userId];

        if ($courseId) {
            $params['courseid'] = $courseId;
        }

        $result = $this->callMoodleWS('mod_quiz_get_quizzes_by_courses', $params);

        if ($result) {
            logEvent("Fetched problems for user $userId", 'INFO');
        }

        return $result;
    }

    /**
     * 문제 결과 제출
     */
    public function submitResult($userId, $problemId, $score, $attempts) {
        $params = [
            'userid' => $userId,
            'quizid' => $problemId,
            'score' => $score,
            'attempts' => json_encode($attempts)
        ];

        // 커스텀 Moodle 함수 또는 grade API 사용
        $result = $this->callMoodleWS('mod_quiz_submit_attempt', $params);

        if ($result) {
            logEvent("Submitted result for user $userId, problem $problemId, score $score", 'INFO');
        }

        return $result;
    }

    /**
     * Moodle 연결 테스트
     */
    public function testConnection() {
        $result = $this->callMoodleWS('core_webservice_get_site_info');

        if ($result && isset($result['sitename'])) {
            return [
                'success' => true,
                'sitename' => $result['sitename'],
                'version' => $result['version'] ?? 'Unknown'
            ];
        }

        return [
            'success' => false,
            'error' => 'Connection failed'
        ];
    }
}

// API 엔드포인트 처리
setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$connector = new MoodleConnector();

try {
    switch ($action) {
        case 'test':
            // Moodle 연결 테스트
            $result = $connector->testConnection();
            successResponse($result, 'Moodle connection test completed');
            break;

        case 'get_problem':
            // 특정 문제 가져오기
            $problemId = $_GET['problem_id'] ?? null;

            if (!$problemId) {
                errorResponse('Problem ID is required', 400);
            }

            $problem = $connector->getProblem($problemId);

            if ($problem) {
                successResponse($problem, 'Problem fetched successfully');
            } else {
                errorResponse('Failed to fetch problem', 500);
            }
            break;

        case 'get_user_problems':
            // 사용자 문제 목록
            $userId = $_GET['user_id'] ?? null;
            $courseId = $_GET['course_id'] ?? null;

            if (!$userId) {
                errorResponse('User ID is required', 400);
            }

            $problems = $connector->getUserProblems($userId, $courseId);

            if ($problems) {
                successResponse($problems, 'User problems fetched successfully');
            } else {
                errorResponse('Failed to fetch user problems', 500);
            }
            break;

        case 'submit_result':
            // 결과 제출
            if ($method !== 'POST') {
                errorResponse('POST method required', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            $userId = $data['user_id'] ?? null;
            $problemId = $data['problem_id'] ?? null;
            $score = $data['score'] ?? null;
            $attempts = $data['attempts'] ?? [];

            if (!$userId || !$problemId || $score === null) {
                errorResponse('Missing required fields', 400);
            }

            $result = $connector->submitResult($userId, $problemId, $score, $attempts);

            if ($result) {
                successResponse($result, 'Result submitted successfully');
            } else {
                errorResponse('Failed to submit result', 500);
            }
            break;

        default:
            errorResponse('Invalid action', 400);
    }
} catch (Exception $e) {
    logEvent("Exception: " . $e->getMessage(), 'ERROR');
    errorResponse('Internal server error: ' . $e->getMessage(), 500);
}
