<?php
/**
 * Moodle Integration Configuration
 * Moodle 3.7 API Settings
 */

define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'balance_scale_service');

class MoodleAPI {
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->baseUrl = MOODLE_URL . '/webservice/rest/server.php';
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Moodle Web Service API 호출
     */
    public function call($function, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("Moodle API Error: " . $error);
            return ['error' => $error];
        }

        return json_decode($response, true);
    }

    /**
     * 문제 정보 가져오기
     */
    public function getQuestion($questionId) {
        return $this->call('core_question_get_question_info', [
            'questionid' => $questionId
        ]);
    }

    /**
     * 학생 정보 가져오기
     */
    public function getStudent($studentId) {
        return $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$studentId]
        ]);
    }

    /**
     * 답안 제출
     */
    public function submitAnswer($attemptId, $answer) {
        return $this->call('mod_quiz_process_attempt', [
            'attemptid' => $attemptId,
            'data' => $answer
        ]);
    }
}
