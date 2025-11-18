<?php
/**
 * Moodle LMS Integration API
 * Moodle 3.7 Web Services 연동
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

class MoodleAPI {
    private $moodleUrl;
    private $token;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Moodle Web Service 호출
     */
    private function callWebService($functionName, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $queryParams = [
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => 'json'
        ];

        $queryParams = array_merge($queryParams, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($queryParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API 호출 실패: HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API 에러: " . $data['message']);
        }

        return $data;
    }

    /**
     * 사용자 정보 조회
     */
    public function getUserInfo($userId) {
        return $this->callWebService('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);
    }

    /**
     * 퀴즈 정보 조회
     */
    public function getQuizInfo($quizId) {
        return $this->callWebService('mod_quiz_get_quizzes_by_courses', [
            'courseids[0]' => 0  // 모든 코스
        ]);
    }

    /**
     * 문제 정보 조회
     */
    public function getQuestionInfo($questionId) {
        // Moodle 3.7의 question bank API 사용
        return $this->callWebService('core_question_get_random_question_summaries', [
            'categoryid' => 0,
            'includesubcategories' => true
        ]);
    }

    /**
     * 세션 토큰 생성
     */
    public function createSession($userId, $quizId) {
        $db = Database::getInstance();

        // 기존 세션 삭제 (만료된 것 포함)
        $db->delete('moodle_sessions', 'moodle_user_id = ? OR expires_at < NOW()', [$userId]);

        // 새 세션 생성
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + SESSION_TIMEOUT);

        $sessionId = $db->insert('moodle_sessions', [
            'session_token' => $token,
            'moodle_user_id' => $userId,
            'moodle_quiz_id' => $quizId,
            'expires_at' => $expiresAt
        ]);

        return [
            'session_id' => $sessionId,
            'token' => $token,
            'expires_at' => $expiresAt
        ];
    }

    /**
     * 세션 검증
     */
    public function validateSession($token) {
        $db = Database::getInstance();

        $session = $db->fetchOne(
            'SELECT * FROM moodle_sessions WHERE session_token = ? AND expires_at > NOW()',
            [$token]
        );

        if (!$session) {
            throw new Exception("유효하지 않거나 만료된 세션입니다");
        }

        return $session;
    }

    /**
     * 학생 응답 제출 (Moodle에 기록)
     */
    public function submitAnswer($userId, $quizId, $questionId, $answer, $isCorrect) {
        // Moodle의 quiz attempt API를 통해 응답 제출
        // 실제 구현은 Moodle 설정에 따라 달라질 수 있음

        try {
            $result = $this->callWebService('mod_quiz_process_attempt', [
                'attemptid' => 0,  // attempt ID는 실제 값으로 대체 필요
                'data' => json_encode([
                    'question' => $questionId,
                    'answer' => $answer,
                    'timeup' => false
                ])
            ]);

            return $result;
        } catch (Exception $e) {
            error_log("Moodle 답안 제출 실패: " . $e->getMessage());
            // Moodle 제출이 실패해도 로컬 DB에는 저장
            return null;
        }
    }
}
