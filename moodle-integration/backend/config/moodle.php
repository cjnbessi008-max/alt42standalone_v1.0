<?php
/**
 * Moodle 3.7 LMS Integration Configuration
 * Web Service API Settings
 */

// Moodle installation details
define('MOODLE_URL', 'https://your-moodle-site.com'); // Update with actual Moodle URL
define('MOODLE_TOKEN', 'your_web_service_token_here'); // Web service token
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Service name

// Moodle Web Service Functions
define('MOODLE_WS_FUNCTION_GET_QUIZ', 'mod_quiz_get_quizzes_by_courses');
define('MOODLE_WS_FUNCTION_GET_QUESTIONS', 'mod_quiz_get_quiz_questions');
define('MOODLE_WS_FUNCTION_START_ATTEMPT', 'mod_quiz_start_attempt');
define('MOODLE_WS_FUNCTION_PROCESS_ATTEMPT', 'mod_quiz_process_attempt');
define('MOODLE_WS_FUNCTION_GET_USER_ATTEMPTS', 'mod_quiz_get_user_attempts');

class MoodleAPI {
    private $url;
    private $token;

    public function __construct() {
        $this->url = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Make Moodle Web Service API call
     */
    public function call($function, $params = []) {
        $endpoint = $this->url . '/webservice/rest/server.php';

        $requestParams = [
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        // Merge with function-specific parameters
        $requestParams = array_merge($requestParams, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            error_log("Moodle API Error: " . $error);
            throw new Exception("Moodle API call failed: " . $error);
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Moodle API HTTP Error: " . $httpCode);
            throw new Exception("Moodle API returned HTTP " . $httpCode);
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Moodle API JSON Error: " . json_last_error_msg());
            throw new Exception("Invalid JSON response from Moodle");
        }

        // Check for Moodle error response
        if (isset($data['exception'])) {
            error_log("Moodle Exception: " . $data['message']);
            throw new Exception("Moodle Error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get quizzes from specific courses
     */
    public function getQuizzes($courseIds = []) {
        $params = [];
        if (!empty($courseIds)) {
            $params['courseids'] = $courseIds;
        }
        return $this->call(MOODLE_WS_FUNCTION_GET_QUIZ, $params);
    }

    /**
     * Get questions for a specific quiz
     */
    public function getQuizQuestions($quizId) {
        $params = ['quizid' => $quizId];
        return $this->call(MOODLE_WS_FUNCTION_GET_QUESTIONS, $params);
    }

    /**
     * Start a new quiz attempt
     */
    public function startAttempt($quizId, $userId) {
        $params = [
            'quizid' => $quizId,
            'userid' => $userId
        ];
        return $this->call(MOODLE_WS_FUNCTION_START_ATTEMPT, $params);
    }

    /**
     * Process attempt (submit answer)
     */
    public function processAttempt($attemptId, $answers) {
        $params = [
            'attemptid' => $attemptId,
            'data' => json_encode($answers)
        ];
        return $this->call(MOODLE_WS_FUNCTION_PROCESS_ATTEMPT, $params);
    }

    /**
     * Get user attempts for a quiz
     */
    public function getUserAttempts($quizId, $userId) {
        $params = [
            'quizid' => $quizId,
            'userid' => $userId
        ];
        return $this->call(MOODLE_WS_FUNCTION_GET_USER_ATTEMPTS, $params);
    }
}
