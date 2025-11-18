<?php
/**
 * Number Melody - Moodle Integration API
 * Handles communication with Moodle LMS
 */

require_once 'config.php';

class MoodleIntegration {
    private $moodle_url;
    private $token;

    public function __construct() {
        $this->moodle_url = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Get quiz/question data from Moodle
     */
    public function get_question($question_id) {
        $endpoint = $this->moodle_url . '/webservice/rest/server.php';

        $params = array(
            'wstoken' => $this->token,
            'wsfunction' => 'mod_quiz_get_quiz_by_courses',
            'moodlewsrestformat' => 'json',
            'questionid' => $question_id
        );

        $response = $this->call_moodle_api($endpoint, $params);
        return $response;
    }

    /**
     * Submit answer to Moodle
     */
    public function submit_answer($question_id, $user_id, $answer, $is_correct) {
        global $pdo;

        // Store locally first
        $stmt = $pdo->prepare("
            INSERT INTO student_attempts
            (question_id, user_id, answer, is_correct, attempted_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$question_id, $user_id, $answer, $is_correct ? 1 : 0]);

        // Send to Moodle if token is configured
        if (!empty($this->token)) {
            $endpoint = $this->moodle_url . '/webservice/rest/server.php';

            $params = array(
                'wstoken' => $this->token,
                'wsfunction' => 'mod_quiz_process_attempt',
                'moodlewsrestformat' => 'json',
                'questionid' => $question_id,
                'userid' => $user_id,
                'answer' => $answer,
                'iscorrect' => $is_correct ? 1 : 0
            );

            return $this->call_moodle_api($endpoint, $params);
        }

        return array('success' => true, 'local_only' => true);
    }

    /**
     * Get user information from Moodle
     */
    public function get_user_info($user_id) {
        $endpoint = $this->moodle_url . '/webservice/rest/server.php';

        $params = array(
            'wstoken' => $this->token,
            'wsfunction' => 'core_user_get_users_by_field',
            'moodlewsrestformat' => 'json',
            'field' => 'id',
            'values[0]' => $user_id
        );

        $response = $this->call_moodle_api($endpoint, $params);
        return !empty($response) ? $response[0] : null;
    }

    /**
     * Call Moodle Web Service API
     */
    private function call_moodle_api($endpoint, $params) {
        if (empty($this->token)) {
            return array('error' => 'Moodle token not configured');
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint . '?' . http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200) {
            return array('error' => 'Moodle API request failed', 'http_code' => $http_code);
        }

        return json_decode($response, true);
    }
}
