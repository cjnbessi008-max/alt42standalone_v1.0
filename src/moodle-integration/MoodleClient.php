<?php
/**
 * Moodle 3.7 LMS Integration Client
 * Compatible with PHP 7.1.9
 *
 * This class handles all communication with Moodle Web Services API
 * for collecting learning data and user activities
 */

class MoodleClient {
    private $moodleUrl;
    private $token;
    private $restFormat = 'json';

    /**
     * Constructor
     *
     * @param string $moodleUrl Moodle instance URL
     * @param string $token Web service token
     */
    public function __construct($moodleUrl, $token) {
        $this->moodleUrl = rtrim($moodleUrl, '/');
        $this->token = $token;
    }

    /**
     * Make API call to Moodle Web Service
     *
     * @param string $functionName Moodle web service function name
     * @param array $params Parameters for the function
     * @return mixed Response data
     * @throws Exception on API errors
     */
    private function callMoodleAPI($functionName, array $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge($params, [
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => $this->restFormat
        ]);

        $ch = curl_init($serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development; use true in production
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new Exception("Moodle API cURL error: " . $curlError);
        }

        if ($httpCode !== 200) {
            throw new Exception("Moodle API HTTP error: " . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API exception: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get user information
     *
     * @param int $userId Moodle user ID
     * @return array User data
     */
    public function getUser($userId) {
        return $this->callMoodleAPI('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$userId]
        ]);
    }

    /**
     * Get course information
     *
     * @param int $courseId Moodle course ID
     * @return array Course data
     */
    public function getCourse($courseId) {
        return $this->callMoodleAPI('core_course_get_courses', [
            'options' => [
                'ids' => [$courseId]
            ]
        ]);
    }

    /**
     * Get user's enrolled courses
     *
     * @param int $userId Moodle user ID
     * @return array List of courses
     */
    public function getUserCourses($userId) {
        return $this->callMoodleAPI('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);
    }

    /**
     * Get course activities
     *
     * @param int $courseId Moodle course ID
     * @return array List of activities
     */
    public function getCourseActivities($courseId) {
        return $this->callMoodleAPI('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get quiz attempts for a user
     *
     * @param int $quizId Quiz ID
     * @param int $userId User ID
     * @return array Quiz attempts
     */
    public function getQuizAttempts($quizId, $userId = null) {
        $params = ['quizid' => $quizId];
        if ($userId !== null) {
            $params['userid'] = $userId;
        }

        return $this->callMoodleAPI('mod_quiz_get_user_attempts', $params);
    }

    /**
     * Get assignment submissions
     *
     * @param int $assignmentId Assignment ID
     * @return array Submissions
     */
    public function getAssignmentSubmissions($assignmentId) {
        return $this->callMoodleAPI('mod_assign_get_submissions', [
            'assignmentids' => [$assignmentId]
        ]);
    }

    /**
     * Get user's recent activity logs
     *
     * @param int $userId User ID
     * @param int $courseId Course ID (optional)
     * @param int $limitFrom Starting record (for pagination)
     * @param int $limitNum Number of records to fetch
     * @return array Activity logs
     */
    public function getUserActivityLogs($userId, $courseId = null, $limitFrom = 0, $limitNum = 100) {
        $params = [
            'userid' => $userId,
            'limitfrom' => $limitFrom,
            'limitnum' => $limitNum
        ];

        if ($courseId !== null) {
            $params['courseid'] = $courseId;
        }

        // Note: This requires custom web service function in Moodle
        // You may need to implement this as a local plugin
        return $this->callMoodleAPI('local_thinking_patterns_get_user_logs', $params);
    }

    /**
     * Get gradebook data for a user in a course
     *
     * @param int $courseId Course ID
     * @param int $userId User ID
     * @return array Grade data
     */
    public function getUserGrades($courseId, $userId) {
        return $this->callMoodleAPI('gradereport_user_get_grade_items', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }

    /**
     * Check if web service connection is working
     *
     * @return bool True if connection is successful
     */
    public function testConnection() {
        try {
            $result = $this->callMoodleAPI('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            error_log("Moodle connection test failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get site information
     *
     * @return array Site info
     */
    public function getSiteInfo() {
        return $this->callMoodleAPI('core_webservice_get_site_info');
    }
}
