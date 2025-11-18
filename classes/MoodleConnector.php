<?php
/**
 * Moodle LMS Connector Class
 * Handles communication with Moodle 3.7 Web Services
 */

require_once __DIR__ . '/../config/moodle_config.php';

class MoodleConnector {
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->baseUrl = MoodleConfig::getWebServiceUrl();
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Make a request to Moodle Web Service
     * @param string $function Moodle web service function name
     * @param array $params Parameters to send
     * @return array Response data
     */
    public function request($function, $params = []) {
        $requestParams = MoodleConfig::getRequestParams($function, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            throw new Exception('Curl error: ' . curl_error($ch));
        }

        curl_close($ch);

        $data = json_decode($response, true);

        if ($httpCode !== 200) {
            throw new Exception('Moodle API error: HTTP ' . $httpCode);
        }

        if (isset($data['exception'])) {
            throw new Exception('Moodle error: ' . $data['message']);
        }

        return $data;
    }

    /**
     * Get quiz questions from Moodle
     * @param int $quizId Quiz ID
     * @return array Quiz questions
     */
    public function getQuizQuestions($quizId) {
        return $this->request('mod_quiz_get_quiz_by_courses', [
            'courseids' => [$quizId]
        ]);
    }

    /**
     * Get course contents
     * @param int $courseId Course ID
     * @return array Course contents
     */
    public function getCourseContents($courseId) {
        return $this->request('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get user enrolled courses
     * @param int $userId User ID
     * @return array Enrolled courses
     */
    public function getUserCourses($userId) {
        return $this->request('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);
    }

    /**
     * Get quiz attempt data
     * @param int $attemptId Attempt ID
     * @return array Attempt data
     */
    public function getQuizAttempt($attemptId) {
        return $this->request('mod_quiz_get_attempt_data', [
            'attemptid' => $attemptId
        ]);
    }
}
