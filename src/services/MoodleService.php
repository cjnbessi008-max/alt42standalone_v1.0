<?php
/**
 * Moodle Web Services Integration
 * Handles communication with Moodle 3.7 REST API
 */

class MoodleService {
    private $config;
    private $baseUrl;
    private $token;
    private $timeout;

    public function __construct() {
        $config = require __DIR__ . '/../../config/config.php';
        $this->config = $config['moodle'];
        $this->baseUrl = rtrim($this->config['url'], '/') . '/webservice/rest/server.php';
        $this->token = $this->config['token'];
        $this->timeout = $this->config['timeout'];
    }

    /**
     * Make API request to Moodle
     * @param string $function Moodle web service function name
     * @param array $params Parameters for the function
     * @return mixed Response data
     */
    private function request($function, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($this->baseUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Set true in production with proper SSL

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->logError("cURL Error: $error");
            throw new Exception("Moodle API request failed: $error");
        }

        if ($httpCode !== 200) {
            $this->logError("HTTP Error: $httpCode - Response: $response");
            throw new Exception("Moodle API returned HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            $this->logError("Moodle Exception: " . $data['message']);
            throw new Exception("Moodle Error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get all courses
     * @return array
     */
    public function getCourses() {
        return $this->request('core_course_get_courses');
    }

    /**
     * Get course by ID
     * @param int $courseId
     * @return array
     */
    public function getCourse($courseId) {
        $result = $this->request('core_course_get_courses', [
            'options' => ['ids' => [$courseId]]
        ]);
        return $result[0] ?? null;
    }

    /**
     * Get course contents (modules/activities)
     * @param int $courseId
     * @return array
     */
    public function getCourseContents($courseId) {
        return $this->request('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get enrolled users in a course
     * @param int $courseId
     * @return array
     */
    public function getEnrolledUsers($courseId) {
        return $this->request('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get user by ID
     * @param int $userId
     * @return array
     */
    public function getUser($userId) {
        $result = $this->request('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$userId]
        ]);
        return $result[0] ?? null;
    }

    /**
     * Get quiz attempts for a user
     * @param int $quizId
     * @param int $userId
     * @return array
     */
    public function getQuizAttempts($quizId, $userId = null) {
        $params = ['quizid' => $quizId];
        if ($userId) {
            $params['userid'] = $userId;
        }
        return $this->request('mod_quiz_get_user_attempts', $params);
    }

    /**
     * Get assignment submissions
     * @param int $assignmentId
     * @return array
     */
    public function getAssignmentSubmissions($assignmentId) {
        return $this->request('mod_assign_get_submissions', [
            'assignmentids' => [$assignmentId]
        ]);
    }

    /**
     * Get assignment grades
     * @param int $assignmentId
     * @return array
     */
    public function getAssignmentGrades($assignmentId) {
        return $this->request('mod_assign_get_grades', [
            'assignmentids' => [$assignmentId]
        ]);
    }

    /**
     * Get grade items for a course
     * @param int $courseId
     * @return array
     */
    public function getGradeItems($courseId) {
        return $this->request('core_grades_get_grade_items', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get grades for a user in a course
     * @param int $courseId
     * @param int $userId
     * @return array
     */
    public function getUserGrades($courseId, $userId) {
        return $this->request('core_grades_get_grades', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }

    /**
     * Get all grades for all users in a course
     * @param int $courseId
     * @return array User grades indexed by user ID
     */
    public function getCourseGrades($courseId) {
        $users = $this->getEnrolledUsers($courseId);
        $grades = [];

        foreach ($users as $user) {
            try {
                $userGrades = $this->getUserGrades($courseId, $user['id']);
                $grades[$user['id']] = [
                    'user' => $user,
                    'grades' => $userGrades
                ];
            } catch (Exception $e) {
                $this->logError("Failed to get grades for user {$user['id']}: " . $e->getMessage());
            }
        }

        return $grades;
    }

    /**
     * Get quiz data
     * @param int $courseId
     * @return array
     */
    public function getQuizzesByCourse($courseId) {
        return $this->request('mod_quiz_get_quizzes_by_courses', [
            'courseids' => [$courseId]
        ]);
    }

    /**
     * Get assignment data
     * @param int $courseId
     * @return array
     */
    public function getAssignments($courseId) {
        return $this->request('mod_assign_get_assignments', [
            'courseids' => [$courseId]
        ]);
    }

    /**
     * Test API connection
     * @return bool
     */
    public function testConnection() {
        try {
            $result = $this->request('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            $this->logError("Connection test failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get site info
     * @return array
     */
    public function getSiteInfo() {
        return $this->request('core_webservice_get_site_info');
    }

    /**
     * Log error message
     * @param string $message
     */
    private function logError($message) {
        $config = require __DIR__ . '/../../config/config.php';
        $logFile = $config['paths']['logs'] . '/moodle_api.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }
}
