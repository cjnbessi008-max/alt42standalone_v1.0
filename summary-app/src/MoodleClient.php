<?php
/**
 * Moodle Web Services API 클라이언트
 * Moodle 3.7과 통신하기 위한 클래스
 */

class MoodleClient {
    private $moodleUrl;
    private $token;

    public function __construct($moodleUrl = null, $token = null) {
        $db = Database::getInstance();

        if ($moodleUrl === null) {
            $setting = $db->queryOne("SELECT setting_value FROM settings WHERE setting_key = 'moodle_url'");
            $this->moodleUrl = $setting ? rtrim($setting['setting_value'], '/') : '';
        } else {
            $this->moodleUrl = rtrim($moodleUrl, '/');
        }

        if ($token === null) {
            $setting = $db->queryOne("SELECT setting_value FROM settings WHERE setting_key = 'moodle_token'");
            $this->token = $setting ? $setting['setting_value'] : '';
        } else {
            $this->token = $token;
        }
    }

    /**
     * Moodle Web Services API 호출
     *
     * @param string $function Moodle 함수명
     * @param array $params 파라미터
     * @return mixed 응답 데이터
     */
    public function call($function, $params = []) {
        if (empty($this->moodleUrl) || empty($this->token)) {
            throw new Exception("Moodle URL 또는 토큰이 설정되지 않았습니다.");
        }

        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $queryParams = [
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        // 파라미터 병합
        $queryParams = array_merge($queryParams, $params);

        // cURL 요청
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($queryParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 개발 환경용 (운영에서는 true로 변경)

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API 호출 실패: " . $error);
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API 응답 오류: HTTP " . $httpCode);
        }

        $data = json_decode($response, true);

        // Moodle 에러 체크
        if (isset($data['exception'])) {
            throw new Exception("Moodle 오류: " . $data['message']);
        }

        return $data;
    }

    /**
     * 사용자 정보 조회
     *
     * @param int $userId Moodle 사용자 ID
     * @return array 사용자 정보
     */
    public function getUser($userId) {
        return $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);
    }

    /**
     * 코스 정보 조회
     *
     * @param int $courseId Moodle 코스 ID
     * @return array 코스 정보
     */
    public function getCourse($courseId) {
        return $this->call('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);
    }

    /**
     * 퀴즈 정보 조회
     *
     * @param int $quizId 퀴즈 ID
     * @return array 퀴즈 정보
     */
    public function getQuiz($quizId) {
        return $this->call('mod_quiz_get_quizzes_by_courses', [
            'courseids[0]' => $quizId
        ]);
    }

    /**
     * 사용자의 코스 목록 조회
     *
     * @param int $userId 사용자 ID
     * @return array 코스 목록
     */
    public function getUserCourses($userId) {
        return $this->call('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);
    }

    /**
     * 활동 완료 정보 조회
     *
     * @param int $courseId 코스 ID
     * @param int $userId 사용자 ID
     * @return array 완료 정보
     */
    public function getActivityCompletion($courseId, $userId) {
        return $this->call('core_completion_get_activities_completion_status', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }

    /**
     * 토큰 테스트
     *
     * @return bool 토큰 유효성
     */
    public function testConnection() {
        try {
            $result = $this->call('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            return false;
        }
    }
}
