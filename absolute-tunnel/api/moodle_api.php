<?php
/**
 * Moodle Web Service API Integration
 * Moodle 3.7 호환
 */

require_once __DIR__ . '/../config/config.php';

class MoodleAPI {
    private $token;
    private $baseUrl;

    public function __construct() {
        $this->token = MOODLE_TOKEN;
        $this->baseUrl = MOODLE_URL . '/webservice/rest/server.php';
    }

    /**
     * Moodle Web Service 호출
     */
    private function callMoodleAPI($function, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($this->baseUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API Error: HTTP $httpCode");
        }

        $result = json_decode($response, true);

        if (isset($result['exception'])) {
            throw new Exception("Moodle API Exception: " . $result['message']);
        }

        return $result;
    }

    /**
     * 사용자 정보 가져오기
     */
    public function getUserInfo($userId) {
        try {
            return $this->callMoodleAPI('core_user_get_users_by_field', [
                'field' => 'id',
                'values[0]' => $userId
            ]);
        } catch (Exception $e) {
            $this->logError('getUserInfo failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 퀴즈 정보 가져오기
     */
    public function getQuizInfo($quizId) {
        try {
            return $this->callMoodleAPI('mod_quiz_get_quizzes_by_courses', [
                'courseids[0]' => 0 // 모든 코스
            ]);
        } catch (Exception $e) {
            $this->logError('getQuizInfo failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 문제 정보 가져오기
     */
    public function getQuestionInfo($questionId) {
        try {
            return $this->callMoodleAPI('core_question_get_random_question_summaries', [
                'categoryid' => 0,
                'includesubcategories' => 1
            ]);
        } catch (Exception $e) {
            $this->logError('getQuestionInfo failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 퀴즈 시도 시작
     */
    public function startQuizAttempt($quizId, $userId) {
        try {
            return $this->callMoodleAPI('mod_quiz_start_attempt', [
                'quizid' => $quizId
            ]);
        } catch (Exception $e) {
            $this->logError('startQuizAttempt failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 답안 제출
     */
    public function submitAnswer($attemptId, $questionId, $answer) {
        try {
            return $this->callMoodleAPI('mod_quiz_process_attempt', [
                'attemptid' => $attemptId,
                'data' => [
                    [
                        'name' => "q{$questionId}:answer",
                        'value' => $answer
                    ]
                ]
            ]);
        } catch (Exception $e) {
            $this->logError('submitAnswer failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 성적 기록
     */
    public function recordGrade($userId, $quizId, $grade) {
        try {
            return $this->callMoodleAPI('core_grades_update_grades', [
                'source' => 'mod/absolute_tunnel',
                'courseid' => 0, // 코스 ID 필요
                'component' => 'mod_absolute_tunnel',
                'activityid' => $quizId,
                'itemnumber' => 0,
                'grades' => [
                    [
                        'studentid' => $userId,
                        'grade' => $grade
                    ]
                ]
            ]);
        } catch (Exception $e) {
            $this->logError('recordGrade failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * 사용자 인증 확인
     */
    public function validateUser($token) {
        try {
            $result = $this->callMoodleAPI('core_webservice_get_site_info', [
                'wstoken' => $token
            ]);
            return isset($result['userid']) ? $result : null;
        } catch (Exception $e) {
            $this->logError('validateUser failed: ' . $e->getMessage());
            return null;
        }
    }

    private function logError($message) {
        error_log(date('[Y-m-d H:i:s] ') . $message . PHP_EOL, 3, __DIR__ . '/../logs/moodle_api.log');
    }
}
