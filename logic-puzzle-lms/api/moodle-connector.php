<?php
/**
 * Moodle Web Services Connector
 *
 * Moodle 3.7 LMS와 통신하는 클래스
 */

class MoodleConnector {
    private $config;
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->config = require __DIR__ . '/config.php';
        $this->baseUrl = rtrim($this->config['moodle']['site_url'], '/') . '/webservice/rest/server.php';
        $this->token = $this->config['moodle']['ws_token'];
    }

    /**
     * Moodle 웹 서비스 호출
     *
     * @param string $function Moodle function name
     * @param array $params Function parameters
     * @return array Response data
     */
    private function call($function, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = $this->config['moodle']['ws_format'];

        $ch = curl_init($this->baseUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->config['moodle']['timeout'],
            CURLOPT_POSTFIELDS => http_build_query($params),
            CURLOPT_SSL_VERIFYPEER => false, // 개발 환경용 - 운영 환경에서는 true로 설정
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Moodle API Error: $error");
        }

        if ($httpCode !== 200) {
            throw new Exception("Moodle API HTTP Error: $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle Exception: {$data['message']}");
        }

        return $data;
    }

    /**
     * 사용자 정보 가져오기
     *
     * @param int $userId Moodle user ID
     * @return array User data
     */
    public function getUserInfo($userId) {
        try {
            $result = $this->call('core_user_get_users_by_field', [
                'field' => 'id',
                'values[0]' => $userId
            ]);

            return $result[0] ?? null;
        } catch (Exception $e) {
            error_log("Failed to get user info: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 코스의 사용자 목록 가져오기
     *
     * @param int $courseId Moodle course ID
     * @return array Users array
     */
    public function getCourseUsers($courseId) {
        try {
            return $this->call('core_enrol_get_enrolled_users', [
                'courseid' => $courseId
            ]);
        } catch (Exception $e) {
            error_log("Failed to get course users: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 문제 정보 가져오기 (커스텀 웹 서비스 필요)
     *
     * Note: Moodle에 커스텀 웹 서비스를 구현해야 함
     * 또는 Question Bank API 사용
     *
     * @param int $questionId Question ID
     * @return array Question data
     */
    public function getQuestion($questionId) {
        try {
            // Moodle 3.7에는 기본 Question API가 제한적이므로
            // 커스텀 로컬 플러그인 필요
            // 예: local_logicpuzzle_get_question

            return $this->call('local_logicpuzzle_get_question', [
                'questionid' => $questionId
            ]);
        } catch (Exception $e) {
            error_log("Failed to get question: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 카테고리의 문제 목록 가져오기
     *
     * @param int $categoryId Question category ID
     * @return array Questions array
     */
    public function getQuestionsByCategory($categoryId) {
        try {
            return $this->call('local_logicpuzzle_get_questions_by_category', [
                'categoryid' => $categoryId
            ]);
        } catch (Exception $e) {
            error_log("Failed to get questions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 학생 답안 제출 (성적 기록)
     *
     * @param int $userId Moodle user ID
     * @param int $questionId Question ID
     * @param float $grade Grade (0-100)
     * @param string $feedback Feedback text
     * @return bool Success status
     */
    public function submitGrade($userId, $questionId, $grade, $feedback = '') {
        try {
            // Moodle Gradebook API 사용
            $result = $this->call('core_grades_update_grades', [
                'source' => 'logic_puzzle',
                'courseid' => $this->config['moodle']['course_id'],
                'component' => 'local_logicpuzzle',
                'activityid' => $questionId,
                'itemnumber' => 0,
                'grades' => [[
                    'studentid' => $userId,
                    'grade' => $grade,
                    'feedback' => $feedback,
                    'feedbackformat' => 1 // FORMAT_HTML
                ]]
            ]);

            return !isset($result['exception']);
        } catch (Exception $e) {
            error_log("Failed to submit grade: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 학습 활동 로그 기록
     *
     * @param int $userId User ID
     * @param int $courseId Course ID
     * @param string $action Action name
     * @param array $data Additional data
     * @return bool Success status
     */
    public function logActivity($userId, $courseId, $action, $data = []) {
        try {
            return $this->call('core_create_userfeedback_action_record', [
                'userid' => $userId,
                'courseid' => $courseId,
                'action' => $action,
                'value' => json_encode($data)
            ]);
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Moodle 연결 테스트
     *
     * @return bool Connection status
     */
    public function testConnection() {
        try {
            $result = $this->call('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            error_log("Moodle connection test failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 사이트 정보 가져오기
     *
     * @return array Site info
     */
    public function getSiteInfo() {
        try {
            return $this->call('core_webservice_get_site_info');
        } catch (Exception $e) {
            error_log("Failed to get site info: " . $e->getMessage());
            return [];
        }
    }
}

/**
 * Helper function to get Moodle connector instance
 */
function moodle() {
    static $instance = null;
    if ($instance === null) {
        $instance = new MoodleConnector();
    }
    return $instance;
}
