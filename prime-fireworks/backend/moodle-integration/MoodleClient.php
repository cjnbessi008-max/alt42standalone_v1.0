<?php
/**
 * Moodle Web Services Client
 * Moodle 3.7 LMS와의 연동을 위한 클라이언트 클래스
 *
 * @author Prime Fireworks Team
 * @version 1.0.0
 */

class MoodleClient {

    private $moodleUrl;
    private $token;
    private $serviceName;
    private $timeout;
    private $restFormat = 'json';

    /**
     * 생성자
     *
     * @param string $moodleUrl Moodle 서버 URL
     * @param string $token Web Services 토큰
     * @param int $timeout 타임아웃 (초)
     */
    public function __construct($moodleUrl, $token, $timeout = 30) {
        $this->moodleUrl = rtrim($moodleUrl, '/');
        $this->token = $token;
        $this->timeout = $timeout;
    }

    /**
     * Moodle Web Services API 호출
     *
     * @param string $functionName 호출할 함수명
     * @param array $params 파라미터 배열
     * @return array|false 응답 데이터 또는 실패 시 false
     */
    private function callMoodleFunction($functionName, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        // 기본 파라미터 설정
        $requestParams = [
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => $this->restFormat
        ];

        // 사용자 파라미터 병합
        $requestParams = array_merge($requestParams, $params);

        // URL 생성
        $url = $serverUrl . '?' . http_build_query($requestParams);

        try {
            // cURL로 요청
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 개발 환경용

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                error_log("Moodle API Error: " . $error);
                return false;
            }

            curl_close($ch);

            if ($httpCode !== 200) {
                error_log("Moodle API HTTP Error: " . $httpCode);
                return false;
            }

            $data = json_decode($response, true);

            // Moodle 에러 체크
            if (isset($data['exception'])) {
                error_log("Moodle Exception: " . $data['message']);
                return false;
            }

            return $data;

        } catch (Exception $e) {
            error_log("Moodle API Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 사용자 정보 조회
     *
     * @param int $userId Moodle 사용자 ID
     * @return array|false 사용자 정보 또는 실패 시 false
     */
    public function getUser($userId) {
        $params = [
            'field' => 'id',
            'values[0]' => $userId
        ];

        $result = $this->callMoodleFunction('core_user_get_users_by_field', $params);

        if ($result && is_array($result) && count($result) > 0) {
            return $result[0];
        }

        return false;
    }

    /**
     * 여러 사용자 정보 조회
     *
     * @param array $userIds 사용자 ID 배열
     * @return array|false 사용자 정보 배열 또는 실패 시 false
     */
    public function getUsers($userIds) {
        $params = ['field' => 'id'];

        foreach ($userIds as $index => $userId) {
            $params["values[$index]"] = $userId;
        }

        return $this->callMoodleFunction('core_user_get_users_by_field', $params);
    }

    /**
     * 코스 정보 조회
     *
     * @param int $courseId 코스 ID
     * @return array|false 코스 정보 또는 실패 시 false
     */
    public function getCourse($courseId) {
        $params = [
            'options[ids][0]' => $courseId
        ];

        $result = $this->callMoodleFunction('core_course_get_courses', $params);

        if ($result && is_array($result) && count($result) > 0) {
            return $result[0];
        }

        return false;
    }

    /**
     * 퀴즈 정보 조회
     *
     * @param int $courseId 코스 ID
     * @return array|false 퀴즈 목록 또는 실패 시 false
     */
    public function getQuizzes($courseId) {
        $params = [
            'courseids[0]' => $courseId
        ];

        $result = $this->callMoodleFunction('mod_quiz_get_quizzes_by_courses', $params);

        if ($result && isset($result['quizzes'])) {
            return $result['quizzes'];
        }

        return false;
    }

    /**
     * 퀴즈 문제 조회
     *
     * @param int $quizId 퀴즈 ID
     * @return array|false 문제 목록 또는 실패 시 false
     */
    public function getQuizQuestions($quizId) {
        $params = [
            'quizid' => $quizId
        ];

        return $this->callMoodleFunction('mod_quiz_get_quiz_access_information', $params);
    }

    /**
     * 학생의 퀴즈 시도 정보 조회
     *
     * @param int $attemptId 시도 ID
     * @return array|false 시도 정보 또는 실패 시 false
     */
    public function getAttemptData($attemptId) {
        $params = [
            'attemptid' => $attemptId
        ];

        return $this->callMoodleFunction('mod_quiz_get_attempt_data', $params);
    }

    /**
     * 답안 제출
     *
     * @param int $attemptId 시도 ID
     * @param array $answers 답안 데이터
     * @return array|false 제출 결과 또는 실패 시 false
     */
    public function submitAnswers($attemptId, $answers) {
        $params = [
            'attemptid' => $attemptId,
            'data' => json_encode($answers)
        ];

        return $this->callMoodleFunction('mod_quiz_process_attempt', $params);
    }

    /**
     * 사용자 성적 조회
     *
     * @param int $courseId 코스 ID
     * @param int $userId 사용자 ID
     * @return array|false 성적 정보 또는 실패 시 false
     */
    public function getUserGrades($courseId, $userId) {
        $params = [
            'courseid' => $courseId,
            'userid' => $userId
        ];

        return $this->callMoodleFunction('gradereport_user_get_grade_items', $params);
    }

    /**
     * 코스에 등록된 사용자 목록 조회
     *
     * @param int $courseId 코스 ID
     * @return array|false 사용자 목록 또는 실패 시 false
     */
    public function getEnrolledUsers($courseId) {
        $params = [
            'courseid' => $courseId
        ];

        return $this->callMoodleFunction('core_enrol_get_enrolled_users', $params);
    }

    /**
     * 사용자 활동 로그 기록
     *
     * @param int $userId 사용자 ID
     * @param string $action 활동 내용
     * @param array $data 추가 데이터
     * @return bool 성공 여부
     */
    public function logUserActivity($userId, $action, $data = []) {
        // Moodle의 로그 시스템에 기록
        // 실제 구현은 Moodle 플러그인 개발 필요
        error_log("User $userId performed action: $action");
        return true;
    }

    /**
     * Prime Fireworks 전용: 문제 정보와 사용자 정보를 함께 조회
     *
     * @param int $userId 사용자 ID
     * @param int $quizId 퀴즈 ID (선택사항)
     * @return array|false 종합 정보 또는 실패 시 false
     */
    public function getPrimeFireworksContext($userId, $quizId = null) {
        $user = $this->getUser($userId);

        if (!$user) {
            return false;
        }

        $context = [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'email' => $user['email'] ?? ''
            ],
            'timestamp' => time()
        ];

        if ($quizId) {
            // 퀴즈 정보도 함께 조회
            $context['quiz'] = $this->getQuizQuestions($quizId);
        }

        return $context;
    }

    /**
     * 연결 테스트
     *
     * @return bool 연결 성공 여부
     */
    public function testConnection() {
        $result = $this->callMoodleFunction('core_webservice_get_site_info', []);
        return $result !== false;
    }

    /**
     * Moodle 사이트 정보 조회
     *
     * @return array|false 사이트 정보 또는 실패 시 false
     */
    public function getSiteInfo() {
        return $this->callMoodleFunction('core_webservice_get_site_info', []);
    }
}

/**
 * Moodle 연동 헬퍼 함수
 */
class MoodleHelper {

    /**
     * 데이터베이스에서 Moodle 설정 로드
     *
     * @param mysqli $db 데이터베이스 연결
     * @return array 설정 배열
     */
    public static function loadMoodleConfig($db) {
        $config = [];

        $query = "SELECT config_key, config_value FROM moodle_config";
        $result = $db->query($query);

        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $config[$row['config_key']] = $row['config_value'];
            }
        }

        return $config;
    }

    /**
     * MoodleClient 인스턴스 생성 (설정 자동 로드)
     *
     * @param mysqli $db 데이터베이스 연결
     * @return MoodleClient|false 클라이언트 또는 실패 시 false
     */
    public static function createClient($db) {
        $config = self::loadMoodleConfig($db);

        if (!isset($config['moodle_url']) || !isset($config['moodle_token'])) {
            error_log("Moodle configuration not found");
            return false;
        }

        $timeout = isset($config['api_timeout']) ? intval($config['api_timeout']) : 30;

        return new MoodleClient(
            $config['moodle_url'],
            $config['moodle_token'],
            $timeout
        );
    }

    /**
     * Moodle 사용자 ID를 세션에서 가져오기
     *
     * @return int|false 사용자 ID 또는 실패 시 false
     */
    public static function getUserIdFromSession() {
        session_start();

        if (isset($_SESSION['moodle_user_id'])) {
            return intval($_SESSION['moodle_user_id']);
        }

        return false;
    }

    /**
     * Moodle 세션 검증
     *
     * @param MoodleClient $client Moodle 클라이언트
     * @param int $userId 사용자 ID
     * @return bool 유효성 여부
     */
    public static function validateSession($client, $userId) {
        $user = $client->getUser($userId);
        return $user !== false;
    }
}
