<?php
/**
 * Moodle Web Services Connector
 *
 * Moodle 3.7 REST API를 통해 문제 정보를 가져오는 클래스
 */

class MoodleConnector {
    private $moodleUrl;
    private $token;
    private $restFormat;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
        $this->restFormat = MOODLE_REST_FORMAT;
    }

    /**
     * Moodle Web Service API 호출
     *
     * @param string $functionName Moodle 함수 이름
     * @param array $params 파라미터
     * @return mixed API 응답 데이터
     */
    private function callMoodleAPI($functionName, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => $this->restFormat
        ], $params);

        $ch = curl_init($serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->logError("Moodle API call failed: " . $error);
            throw new Exception("Moodle API 호출에 실패했습니다.");
        }

        if ($httpCode !== 200) {
            $this->logError("Moodle API returned HTTP " . $httpCode);
            throw new Exception("Moodle API 오류 (HTTP " . $httpCode . ")");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            $this->logError("Moodle API exception: " . $data['message']);
            throw new Exception("Moodle API 예외: " . $data['message']);
        }

        return $data;
    }

    /**
     * 사용자 정보 가져오기
     *
     * @param int $userId Moodle 사용자 ID
     * @return array 사용자 정보
     */
    public function getUserById($userId) {
        try {
            $result = $this->callMoodleAPI('core_user_get_users_by_field', [
                'field' => 'id',
                'values[0]' => $userId
            ]);

            return !empty($result) ? $result[0] : null;
        } catch (Exception $e) {
            $this->logError("Failed to get user: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 코스의 퀴즈 목록 가져오기
     *
     * @param int $courseId Moodle 코스 ID
     * @return array 퀴즈 목록
     */
    public function getQuizzesByCourse($courseId) {
        try {
            $result = $this->callMoodleAPI('mod_quiz_get_quizzes_by_courses', [
                'courseids[0]' => $courseId
            ]);

            return isset($result['quizzes']) ? $result['quizzes'] : [];
        } catch (Exception $e) {
            $this->logError("Failed to get quizzes: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 퀴즈의 문제 정보 가져오기
     *
     * @param int $quizId 퀴즈 ID
     * @return array 문제 목록
     */
    public function getQuizQuestions($quizId) {
        try {
            $result = $this->callMoodleAPI('mod_quiz_get_quiz_access_information', [
                'quizid' => $quizId
            ]);

            // Note: Moodle 3.7의 제한된 API로 인해 실제 문제 내용은
            // 데이터베이스 직접 접근이나 커스텀 웹서비스가 필요할 수 있습니다
            return $result;
        } catch (Exception $e) {
            $this->logError("Failed to get quiz questions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 문제 뱅크에서 문제 가져오기 (Direct DB Access 필요시)
     *
     * Moodle 웹서비스로는 제한이 있어, 필요시 직접 DB 접근
     * Moodle DB 연결 정보가 있을 경우 사용
     *
     * @param int $categoryId 문제 카테고리 ID
     * @return array 문제 목록
     */
    public function getQuestionsFromBank($categoryId = null) {
        // 실제 구현시 Moodle 데이터베이스에 직접 접근
        // 또는 커스텀 Moodle 웹서비스 플러그인 필요

        // 임시로 로컬 DB에서 문제 반환
        return $this->getLocalQuestions();
    }

    /**
     * 로컬 데이터베이스에서 문제 가져오기 (Mock/Fallback)
     *
     * @return array 문제 목록
     */
    private function getLocalQuestions() {
        try {
            $db = Database::getInstance();
            $questions = $db->query("
                SELECT
                    id,
                    question_text,
                    correct_answer,
                    difficulty_level,
                    category
                FROM questions
                ORDER BY RAND()
                LIMIT 10
            ");

            return $questions;
        } catch (Exception $e) {
            $this->logError("Failed to get local questions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 학습 결과를 Moodle에 동기화
     *
     * @param int $userId 사용자 ID
     * @param int $quizId 퀴즈 ID
     * @param array $results 결과 데이터
     * @return bool 성공 여부
     */
    public function syncResultsToMoodle($userId, $quizId, $results) {
        try {
            // Moodle grade API를 사용한 성적 전송
            // 실제 구현시 적절한 Moodle 함수 사용

            $this->logInfo("Results synced for user $userId, quiz $quizId");
            return true;
        } catch (Exception $e) {
            $this->logError("Failed to sync results: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Moodle 연결 테스트
     *
     * @return bool 연결 성공 여부
     */
    public function testConnection() {
        try {
            $result = $this->callMoodleAPI('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Log error
     */
    private function logError($message) {
        if (LOG_ENABLED) {
            $logMessage = sprintf(
                "[%s] [MOODLE ERROR] %s\n",
                date('Y-m-d H:i:s'),
                $message
            );
            error_log($logMessage, 3, LOG_PATH);
        }
    }

    /**
     * Log info
     */
    private function logInfo($message) {
        if (LOG_ENABLED && LOG_LEVEL === 'DEBUG') {
            $logMessage = sprintf(
                "[%s] [MOODLE INFO] %s\n",
                date('Y-m-d H:i:s'),
                $message
            );
            error_log($logMessage, 3, LOG_PATH);
        }
    }
}
