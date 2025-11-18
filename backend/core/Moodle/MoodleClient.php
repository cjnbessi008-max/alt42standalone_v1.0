<?php
/**
 * Moodle Web Services API Client
 * Compatible with Moodle 3.7
 */

class MoodleClient {
    private $moodleUrl;
    private $token;
    private $restFormat = 'json';

    public function __construct($moodleUrl = null, $token = null) {
        $this->moodleUrl = $moodleUrl ?: getenv('MOODLE_URL');
        $this->token = $token ?: getenv('MOODLE_TOKEN');

        if (!$this->moodleUrl || !$this->token) {
            throw new Exception("Moodle URL and token are required");
        }
    }

    /**
     * Make API call to Moodle
     */
    private function call($function, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->restFormat
        ], $params);

        $ch = curl_init($serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API call failed with HTTP code: $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get questions from question bank
     */
    public function getQuestions($categoryId = null) {
        // Moodle 3.7에서는 core_question_get_questions 함수 사용
        $params = [];

        if ($categoryId !== null) {
            $params['categoryid'] = $categoryId;
        }

        return $this->call('core_question_get_questions', $params);
    }

    /**
     * Get question categories
     */
    public function getQuestionCategories($contextId = null) {
        $params = [];

        if ($contextId !== null) {
            $params['contextid'] = $contextId;
        }

        return $this->call('core_question_get_categories', $params);
    }

    /**
     * Get courses
     */
    public function getCourses() {
        return $this->call('core_course_get_courses');
    }

    /**
     * Get course contents
     */
    public function getCourseContents($courseId) {
        return $this->call('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get enrolled users
     */
    public function getEnrolledUsers($courseId) {
        return $this->call('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get user information
     */
    public function getUsers($criteria = []) {
        $params = [];

        if (!empty($criteria)) {
            $i = 0;
            foreach ($criteria as $key => $value) {
                $params["criteria[$i][key]"] = $key;
                $params["criteria[$i][value]"] = $value;
                $i++;
            }
        }

        return $this->call('core_user_get_users', $params);
    }

    /**
     * Get quiz attempts
     */
    public function getQuizAttempts($quizId) {
        return $this->call('mod_quiz_get_user_attempts', [
            'quizid' => $quizId
        ]);
    }

    /**
     * Get quiz questions
     */
    public function getQuizQuestions($quizId) {
        return $this->call('mod_quiz_get_quiz_feedback_for_grade', [
            'quizid' => $quizId
        ]);
    }

    /**
     * Test connection to Moodle
     */
    public function testConnection() {
        try {
            $siteInfo = $this->call('core_webservice_get_site_info');
            return [
                'success' => true,
                'sitename' => $siteInfo['sitename'] ?? 'Unknown',
                'version' => $siteInfo['version'] ?? 'Unknown',
                'username' => $siteInfo['username'] ?? 'Unknown'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get custom SQL results (requires local plugin)
     * This is a helper for custom queries if available
     */
    public function customQuery($sql) {
        // Note: This requires a custom web service function in Moodle
        // You would need to implement this in your Moodle installation
        return $this->call('local_alt42_execute_query', [
            'sql' => $sql
        ]);
    }
}
