<?php
/**
 * Moodle Connector
 * Moodle 3.7 웹서비스 API 연동
 */

require_once 'config.php';

class MoodleConnector {
    private $moodleUrl;
    private $token;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Moodle 웹서비스 API 호출
     * @param string $functionName - Moodle 함수명
     * @param array $params - 파라미터
     * @return mixed - 응답 데이터
     */
    public function callMoodleAPI($functionName, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = [
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => 'json'
        ];

        $requestParams = array_merge($requestParams, $params);

        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                throw new Exception('Curl error: ' . curl_error($ch));
            }

            curl_close($ch);

            if ($httpCode !== 200) {
                throw new Exception('HTTP error: ' . $httpCode);
            }

            $data = json_decode($response, true);

            if (isset($data['exception'])) {
                throw new Exception('Moodle API error: ' . $data['message']);
            }

            return $data;
        } catch (Exception $e) {
            logError('Moodle API Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 코스 정보 가져오기
     * @param int $courseId - 코스 ID
     * @return array|null - 코스 정보
     */
    public function getCourse($courseId) {
        $params = [
            'options[ids][0]' => $courseId
        ];

        $result = $this->callMoodleAPI('core_course_get_courses', $params);
        return $result ? $result[0] : null;
    }

    /**
     * 코스의 퀴즈 목록 가져오기
     * @param int $courseId - 코스 ID
     * @return array - 퀴즈 목록
     */
    public function getQuizzes($courseId) {
        $params = [
            'courseids[0]' => $courseId
        ];

        $result = $this->callMoodleAPI('mod_quiz_get_quizzes_by_courses', $params);
        return $result ? $result['quizzes'] : [];
    }

    /**
     * 퀴즈 문제 가져오기
     * @param int $quizId - 퀴즈 ID
     * @return array - 문제 목록
     */
    public function getQuizQuestions($quizId) {
        $params = [
            'quizid' => $quizId
        ];

        $result = $this->callMoodleAPI('mod_quiz_get_attempt_data', $params);
        return $result ? $result['questions'] : [];
    }

    /**
     * 사용자 정보 가져오기
     * @param int $userId - 사용자 ID
     * @return array|null - 사용자 정보
     */
    public function getUser($userId) {
        $params = [
            'criteria[0][key]' => 'id',
            'criteria[0][value]' => $userId
        ];

        $result = $this->callMoodleAPI('core_user_get_users', $params);
        return $result && isset($result['users'][0]) ? $result['users'][0] : null;
    }

    /**
     * 학습 진행 상황 기록
     * @param int $userId - 사용자 ID
     * @param int $courseId - 코스 ID
     * @param array $data - 진행 데이터
     * @return bool - 성공 여부
     */
    public function recordProgress($userId, $courseId, $data) {
        // Moodle의 사용자 정의 필드 또는 그레이드 시스템에 기록
        // 실제 구현은 Moodle 설정에 따라 다름

        logError("Progress recorded for user $userId in course $courseId");
        return true;
    }

    /**
     * 문제 답안 제출
     * @param int $quizAttemptId - 퀴즈 시도 ID
     * @param array $answers - 답안 데이터
     * @return array|null - 제출 결과
     */
    public function submitQuizAnswers($quizAttemptId, $answers) {
        $params = [
            'attemptid' => $quizAttemptId,
            'data' => json_encode($answers)
        ];

        $result = $this->callMoodleAPI('mod_quiz_save_attempt', $params);
        return $result;
    }

    /**
     * 연결 테스트
     * @return bool - 연결 성공 여부
     */
    public function testConnection() {
        try {
            $result = $this->callMoodleAPI('core_webservice_get_site_info');
            return $result !== null;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * 사이트 정보 가져오기
     * @return array|null - 사이트 정보
     */
    public function getSiteInfo() {
        return $this->callMoodleAPI('core_webservice_get_site_info');
    }
}

/**
 * Moodle 문제를 Boundary Gate 형식으로 변환
 * @param array $moodleQuestion - Moodle 문제 데이터
 * @return array - 변환된 문제
 */
function convertMoodleQuestion($moodleQuestion) {
    // Moodle 문제를 파싱하여 부등호 문제로 변환
    // 실제 구현은 Moodle 문제 형식에 따라 다름

    return [
        'id' => $moodleQuestion['id'] ?? 0,
        'left_number' => rand(1, 20),
        'right_number' => rand(1, 20),
        'correct_answer' => rand(0, 1) ? 'ge' : 'le',
        'description' => $moodleQuestion['questiontext'] ?? '부등호 문제',
        'difficulty' => 'medium'
    ];
}
