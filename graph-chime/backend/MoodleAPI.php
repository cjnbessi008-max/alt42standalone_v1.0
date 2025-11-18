<?php
/**
 * Moodle API Integration Class
 * Compatible with Moodle 3.7
 */

class MoodleAPI {
    private $moodleUrl;
    private $wsToken;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->wsToken = MOODLE_WS_TOKEN;
    }

    /**
     * Moodle Web Service 호출
     */
    private function callWebService($functionName, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $data = [
            'wstoken' => $this->wsToken,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => 'json'
        ];

        $data = array_merge($data, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            error_log("Moodle API Error: " . curl_error($ch));
            curl_close($ch);
            return false;
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Moodle API HTTP Error: " . $httpCode);
            return false;
        }

        return json_decode($response, true);
    }

    /**
     * 문제 정보 가져오기
     */
    public function getQuestion($questionId) {
        // Moodle의 question API를 사용하여 문제 정보 가져오기
        $result = $this->callWebService('core_question_get_questions', [
            'questionids' => [$questionId]
        ]);

        if ($result && !isset($result['exception'])) {
            return $result;
        }

        return false;
    }

    /**
     * 학생 정보 가져오기
     */
    public function getStudent($studentId) {
        $result = $this->callWebService('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$studentId]
        ]);

        if ($result && !isset($result['exception']) && !empty($result)) {
            return $result[0];
        }

        return false;
    }

    /**
     * 학생 응답 제출
     */
    public function submitResponse($quizAttemptId, $questionId, $answer) {
        // Moodle quiz API를 통해 응답 제출
        $result = $this->callWebService('mod_quiz_save_attempt', [
            'attemptid' => $quizAttemptId,
            'data' => [
                [
                    'name' => 'q' . $questionId,
                    'value' => $answer
                ]
            ]
        ]);

        return $result && !isset($result['exception']);
    }
}
