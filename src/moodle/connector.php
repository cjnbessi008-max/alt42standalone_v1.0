<?php
/**
 * Moodle LMS Connector
 * Moodle 3.7 Web Service API 연동
 */

require_once __DIR__ . '/../../config/moodle.php';

class MoodleConnector {
    private $apiUrl;
    private $token;
    private $format;

    public function __construct() {
        $this->apiUrl = MOODLE_API_ENDPOINT;
        $this->token = MOODLE_TOKEN;
        $this->format = MOODLE_API_FORMAT;
    }

    /**
     * Call Moodle Web Service function
     *
     * @param string $function Moodle function name
     * @param array $params Function parameters
     * @return mixed Response data
     */
    public function call($function, $params = []) {
        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->format
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, MOODLE_API_TIMEOUT);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Production에서는 true로 설정

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API request failed: $error");
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get course information
     *
     * @param int $courseId Course ID
     * @return array Course data
     */
    public function getCourse($courseId) {
        $result = $this->call('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);

        return isset($result[0]) ? $result[0] : null;
    }

    /**
     * Get enrolled users in a course
     *
     * @param int $courseId Course ID
     * @return array List of users
     */
    public function getEnrolledUsers($courseId) {
        return $this->call('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get user information
     *
     * @param int $userId User ID
     * @return array User data
     */
    public function getUser($userId) {
        $result = $this->call('core_user_get_users', [
            'criteria[0][key]' => 'id',
            'criteria[0][value]' => $userId
        ]);

        return isset($result['users'][0]) ? $result['users'][0] : null;
    }

    /**
     * Get quizzes from courses
     *
     * @param array $courseIds Array of course IDs
     * @return array Quiz data
     */
    public function getQuizzes($courseIds) {
        $params = [];
        foreach ($courseIds as $index => $courseId) {
            $params["courseids[$index]"] = $courseId;
        }

        $result = $this->call('mod_quiz_get_quizzes_by_courses', $params);
        return isset($result['quizzes']) ? $result['quizzes'] : [];
    }

    /**
     * Update user grade
     *
     * @param int $courseId Course ID
     * @param int $userId User ID
     * @param string $itemName Grade item name
     * @param float $grade Grade value
     * @return mixed Response
     */
    public function updateGrade($courseId, $userId, $itemName, $grade) {
        return $this->call('core_grades_update_grades', [
            'source' => 'angle_light',
            'courseid' => $courseId,
            'component' => 'mod_quiz',
            'activityid' => 0,
            'itemnumber' => 0,
            'grades[0][studentid]' => $userId,
            'grades[0][grade]' => $grade
        ]);
    }

    /**
     * Validate session token
     *
     * @param string $sessionId Moodle session ID
     * @return bool True if valid
     */
    public function validateSession($sessionId) {
        try {
            // Moodle session validation logic
            // This is a simplified version - implement according to your needs
            return !empty($sessionId);
        } catch (Exception $e) {
            error_log("Session validation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Sync student progress to Moodle
     *
     * @param int $moodleUserId Moodle user ID
     * @param int $courseId Course ID
     * @param int $quizId Quiz ID
     * @param float $score Score (0-100)
     * @param int $timeSpent Time spent in seconds
     * @return bool Success status
     */
    public function syncProgress($moodleUserId, $courseId, $quizId, $score, $timeSpent) {
        try {
            // Update grade in Moodle
            $this->updateGrade($courseId, $moodleUserId, 'angle_light_quiz', $score);

            // Log activity (if needed)
            error_log("Synced progress for user $moodleUserId: score=$score, time=$timeSpent");

            return true;
        } catch (Exception $e) {
            error_log("Failed to sync progress: " . $e->getMessage());
            return false;
        }
    }
}
