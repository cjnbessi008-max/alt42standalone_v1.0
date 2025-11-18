<?php
/**
 * Moodle Integration Service
 * Handles communication with Moodle 3.7 LMS
 */

require_once __DIR__ . '/../../config/app.php';

class MoodleService {
    private $moodleUrl;
    private $token;
    private $syncEnabled;

    public function __construct() {
        $this->moodleUrl = rtrim(MOODLE_URL, '/');
        $this->token = MOODLE_TOKEN;
        $this->syncEnabled = MOODLE_SYNC_ENABLED;
    }

    /**
     * Send grade to Moodle gradebook
     */
    public function sendGrade($studentId, $activityId, $grade, $attemptData = []) {
        if (!$this->syncEnabled) {
            return ['status' => 'skipped', 'message' => 'Moodle sync disabled'];
        }

        $function = 'mod_assign_save_grade';
        $params = [
            'assignmentid' => $activityId,
            'userid' => $studentId,
            'grade' => $grade,
            'attemptnumber' => $attemptData['attempt_number'] ?? -1,
            'addattempt' => 0,
            'workflowstate' => '',
            'applytoall' => 0
        ];

        try {
            $response = $this->callMoodleAPI($function, $params);
            return ['status' => 'success', 'response' => $response];
        } catch (Exception $e) {
            error_log("Moodle grade sync failed: " . $e->getMessage());
            return ['status' => 'failed', 'error' => $e->getMessage()];
        }
    }

    /**
     * Get user info from Moodle
     */
    public function getUserInfo($userId) {
        $function = 'core_user_get_users_by_field';
        $params = [
            'field' => 'id',
            'values' => [$userId]
        ];

        return $this->callMoodleAPI($function, $params);
    }

    /**
     * Get course info
     */
    public function getCourseInfo($courseId) {
        $function = 'core_course_get_courses';
        $params = [
            'options' => [
                'ids' => [$courseId]
            ]
        ];

        return $this->callMoodleAPI($function, $params);
    }

    /**
     * Get enrolled students in a course
     */
    public function getEnrolledStudents($courseId) {
        $function = 'core_enrol_get_enrolled_users';
        $params = [
            'courseid' => $courseId
        ];

        return $this->callMoodleAPI($function, $params);
    }

    /**
     * Log activity to Moodle
     */
    public function logActivity($userId, $courseId, $activityType, $activityData) {
        if (!$this->syncEnabled) {
            return false;
        }

        // Use Moodle's event logging
        $function = 'core_completion_update_activity_completion_status_manually';
        $params = [
            'cmid' => $activityData['cmid'] ?? 0,
            'completed' => $activityData['completed'] ?? 1
        ];

        try {
            return $this->callMoodleAPI($function, $params);
        } catch (Exception $e) {
            error_log("Moodle activity log failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Call Moodle Web Services API
     */
    private function callMoodleAPI($function, $params) {
        if (empty($this->token)) {
            throw new Exception('Moodle token not configured');
        }

        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = [
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ];

        // Merge with function parameters
        $requestParams = array_merge($requestParams, $this->flattenParams($params));

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API request failed: {$error}");
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned error code {$httpCode}");
        }

        $decoded = json_decode($response, true);

        if (isset($decoded['exception'])) {
            throw new Exception("Moodle API error: {$decoded['message']}");
        }

        return $decoded;
    }

    /**
     * Flatten nested parameters for Moodle API
     */
    private function flattenParams($params, $prefix = '') {
        $flat = [];

        foreach ($params as $key => $value) {
            $newKey = $prefix ? "{$prefix}[{$key}]" : $key;

            if (is_array($value)) {
                $flat = array_merge($flat, $this->flattenParams($value, $newKey));
            } else {
                $flat[$newKey] = $value;
            }
        }

        return $flat;
    }

    /**
     * Verify Moodle connection
     */
    public function testConnection() {
        try {
            $function = 'core_webservice_get_site_info';
            $result = $this->callMoodleAPI($function, []);
            return ['connected' => true, 'site_info' => $result];
        } catch (Exception $e) {
            return ['connected' => false, 'error' => $e->getMessage()];
        }
    }
}
