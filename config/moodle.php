<?php
/**
 * Moodle 3.7 Integration Configuration
 */

define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'alt42_service');

class MoodleAPI {
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->baseUrl = MOODLE_URL . '/webservice/rest/server.php';
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Call Moodle Web Service
     */
    private function callService($function, $params = array()) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($this->baseUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('Moodle API Error: HTTP ' . $httpCode);
        }

        $result = json_decode($response, true);

        if (isset($result['exception'])) {
            throw new Exception('Moodle Error: ' . $result['message']);
        }

        return $result;
    }

    /**
     * Get problem from Moodle quiz
     */
    public function getProblem($quizId, $questionId) {
        return $this->callService('mod_quiz_get_quiz_question', array(
            'quizid' => $quizId,
            'questionid' => $questionId
        ));
    }

    /**
     * Submit answer to Moodle
     */
    public function submitAnswer($attemptId, $questionId, $answer) {
        return $this->callService('mod_quiz_save_attempt', array(
            'attemptid' => $attemptId,
            'questionid' => $questionId,
            'answer' => $answer
        ));
    }

    /**
     * Validate user session with Moodle
     */
    public function validateUser($userId, $sessionKey) {
        return $this->callService('core_user_get_users_by_field', array(
            'field' => 'id',
            'values' => array($userId)
        ));
    }
}
