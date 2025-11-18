<?php
/**
 * Moodle Web Services Client
 * Compatible with Moodle 3.7 and PHP 7.1.9
 */

class MoodleClient {
    private $baseUrl;
    private $token;
    private $format = 'json';

    /**
     * Constructor
     * @param string $baseUrl Moodle base URL
     * @param string $token Web service token
     */
    public function __construct($baseUrl = null, $token = null) {
        $this->baseUrl = $baseUrl ?: MOODLE_URL;
        $this->token = $token ?: MOODLE_TOKEN;

        if (empty($this->token)) {
            throw new Exception("Moodle token is required");
        }
    }

    /**
     * Make API call to Moodle
     * @param string $function Moodle web service function name
     * @param array $params Parameters
     * @return array|null Response data
     */
    private function call($function, $params = []) {
        $url = $this->baseUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->format
        ], $params);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($requestParams),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false, // Set to true in production with proper SSL
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL Error: " . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: " . $httpCode);
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSON decode error: " . json_last_error_msg());
        }

        // Check for Moodle error response
        if (isset($data['exception'])) {
            throw new Exception("Moodle Error: " . ($data['message'] ?? 'Unknown error'));
        }

        return $data;
    }

    /**
     * Get quiz questions
     * @param int $quizId Quiz ID
     * @return array Questions
     */
    public function getQuizQuestions($quizId) {
        try {
            return $this->call('mod_quiz_get_quiz_questions', [
                'quizid' => $quizId
            ]);
        } catch (Exception $e) {
            $this->logError("Failed to get quiz questions", $e);
            return [];
        }
    }

    /**
     * Get question details
     * @param int $questionId Question ID
     * @return array|null Question data
     */
    public function getQuestion($questionId) {
        try {
            $result = $this->call('core_question_get_questions', [
                'questionids' => [$questionId]
            ]);
            return $result[0] ?? null;
        } catch (Exception $e) {
            $this->logError("Failed to get question", $e);
            return null;
        }
    }

    /**
     * Get user information
     * @param int $userId User ID
     * @return array|null User data
     */
    public function getUser($userId) {
        try {
            $result = $this->call('core_user_get_users_by_field', [
                'field' => 'id',
                'values' => [$userId]
            ]);
            return $result[0] ?? null;
        } catch (Exception $e) {
            $this->logError("Failed to get user", $e);
            return null;
        }
    }

    /**
     * Get course quizzes
     * @param int $courseId Course ID
     * @return array Quizzes
     */
    public function getCourseQuizzes($courseId) {
        try {
            return $this->call('mod_quiz_get_quizzes_by_courses', [
                'courseids' => [$courseId]
            ]);
        } catch (Exception $e) {
            $this->logError("Failed to get course quizzes", $e);
            return [];
        }
    }

    /**
     * Submit quiz attempt
     * @param int $attemptId Attempt ID
     * @param array $answers Answers array
     * @return array|null Response
     */
    public function submitQuizAttempt($attemptId, $answers) {
        try {
            return $this->call('mod_quiz_process_attempt', [
                'attemptid' => $attemptId,
                'data' => $answers,
                'finishattempt' => true
            ]);
        } catch (Exception $e) {
            $this->logError("Failed to submit quiz attempt", $e);
            return null;
        }
    }

    /**
     * Get user's course information
     * @param int $userId User ID
     * @return array Enrolled courses
     */
    public function getUserCourses($userId) {
        try {
            return $this->call('core_enrol_get_users_courses', [
                'userid' => $userId
            ]);
        } catch (Exception $e) {
            $this->logError("Failed to get user courses", $e);
            return [];
        }
    }

    /**
     * Get quiz attempts for a user
     * @param int $quizId Quiz ID
     * @param int $userId User ID
     * @return array Attempts
     */
    public function getUserQuizAttempts($quizId, $userId) {
        try {
            return $this->call('mod_quiz_get_user_attempts', [
                'quizid' => $quizId,
                'userid' => $userId
            ]);
        } catch (Exception $e) {
            $this->logError("Failed to get user attempts", $e);
            return [];
        }
    }

    /**
     * Test connection to Moodle
     * @return bool Connection status
     */
    public function testConnection() {
        try {
            $result = $this->call('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            $this->logError("Connection test failed", $e);
            return false;
        }
    }

    /**
     * Get site information
     * @return array|null Site info
     */
    public function getSiteInfo() {
        try {
            return $this->call('core_webservice_get_site_info');
        } catch (Exception $e) {
            $this->logError("Failed to get site info", $e);
            return null;
        }
    }

    /**
     * Log error
     * @param string $message
     * @param Exception $e
     */
    private function logError($message, Exception $e) {
        $errorMessage = sprintf(
            "[MoodleClient] %s: %s",
            $message,
            $e->getMessage()
        );
        error_log($errorMessage);

        if (APP_DEBUG) {
            echo $errorMessage . "\n";
        }
    }
}
