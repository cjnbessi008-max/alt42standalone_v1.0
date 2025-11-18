<?php
/**
 * Moodle LMS Integration Service
 * Connects to Moodle 3.7 Web Services API
 */

class MoodleService {
    private $moodleUrl;
    private $token;

    public function __construct() {
        $this->moodleUrl = rtrim(MOODLE_URL, '/');
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Call Moodle Web Service API
     */
    private function callMoodleAPI($functionName, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $queryParams = [
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => 'json'
        ];

        // Merge with function parameters
        $queryParams = array_merge($queryParams, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl . '?' . http_build_query($queryParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            error_log("Moodle API Error: " . curl_error($ch));
            curl_close($ch);
            throw new Exception("Moodle API 호출 중 오류가 발생했습니다.");
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned HTTP {$httpCode}");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            error_log("Moodle API Exception: " . $data['message']);
            throw new Exception("Moodle API 오류: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get question details from Moodle
     */
    public function getQuestion($questionId) {
        try {
            $result = $this->callMoodleAPI('core_question_get_question', [
                'questionid' => $questionId
            ]);

            return $result;
        } catch (Exception $e) {
            error_log("Failed to get question: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get course details
     */
    public function getCourse($courseId) {
        try {
            $result = $this->callMoodleAPI('core_course_get_courses', [
                'options[ids][0]' => $courseId
            ]);

            return isset($result[0]) ? $result[0] : null;
        } catch (Exception $e) {
            error_log("Failed to get course: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user information
     */
    public function getUser($userId) {
        try {
            $result = $this->callMoodleAPI('core_user_get_users_by_field', [
                'field' => 'id',
                'values[0]' => $userId
            ]);

            return isset($result[0]) ? $result[0] : null;
        } catch (Exception $e) {
            error_log("Failed to get user: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Submit grade to Moodle gradebook
     */
    public function submitGrade($userId, $itemId, $grade) {
        try {
            $result = $this->callMoodleAPI('core_grades_update_grades', [
                'source' => 'shape_explainer',
                'courseid' => 0, // Will be set dynamically
                'component' => 'mod_quiz',
                'activityid' => $itemId,
                'itemnumber' => 0,
                'grades[0][studentid]' => $userId,
                'grades[0][grade]' => $grade
            ]);

            return $result;
        } catch (Exception $e) {
            error_log("Failed to submit grade: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Log activity in Moodle
     */
    public function logActivity($userId, $courseId, $action, $info = '') {
        try {
            // Custom logging - may need to implement custom Moodle plugin
            $result = $this->callMoodleAPI('core_log_store_standard_write_log', [
                'userid' => $userId,
                'courseid' => $courseId,
                'action' => $action,
                'info' => $info,
                'component' => 'shape_explainer'
            ]);

            return $result;
        } catch (Exception $e) {
            // Logging failure should not break the application
            error_log("Failed to log activity: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Validate Moodle token
     */
    public function validateToken() {
        try {
            $result = $this->callMoodleAPI('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get quiz attempts for a user
     */
    public function getQuizAttempts($quizId, $userId) {
        try {
            $result = $this->callMoodleAPI('mod_quiz_get_user_attempts', [
                'quizid' => $quizId,
                'userid' => $userId
            ]);

            return $result['attempts'] ?? [];
        } catch (Exception $e) {
            error_log("Failed to get quiz attempts: " . $e->getMessage());
            return [];
        }
    }
}
