<?php
/**
 * Moodle LMS Integration Service
 * Moodle 3.7 Web Services API
 */

require_once __DIR__ . '/../config/config.php';

class MoodleService {
    private $moodleUrl;
    private $token;
    private $restFormat = 'json';

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Call Moodle Web Service
     */
    private function callMoodleAPI($function, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->restFormat
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->logError("Moodle API cURL error: " . $error);
            return ['error' => $error];
        }

        if ($httpCode !== 200) {
            $this->logError("Moodle API HTTP error: " . $httpCode);
            return ['error' => 'HTTP ' . $httpCode];
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            $this->logError("Moodle API exception: " . $data['message']);
            return ['error' => $data['message']];
        }

        return $data;
    }

    /**
     * Get user information
     */
    public function getUser($userId) {
        return $this->callMoodleAPI('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);
    }

    /**
     * Get course information
     */
    public function getCourse($courseId) {
        return $this->callMoodleAPI('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);
    }

    /**
     * Get quiz questions
     */
    public function getQuizQuestions($quizId) {
        return $this->callMoodleAPI('mod_quiz_get_quiz_access_information', [
            'quizid' => $quizId
        ]);
    }

    /**
     * Get enrolled users in a course
     */
    public function getEnrolledUsers($courseId) {
        return $this->callMoodleAPI('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Submit quiz attempt (for progress tracking)
     */
    public function submitQuizAttempt($attemptId, $data) {
        return $this->callMoodleAPI('mod_quiz_save_attempt', [
            'attemptid' => $attemptId,
            'data' => json_encode($data)
        ]);
    }

    /**
     * Sync students from Moodle
     */
    public function syncStudents($courseId) {
        $db = Database::getInstance();
        $users = $this->getEnrolledUsers($courseId);

        if (isset($users['error'])) {
            return ['success' => false, 'error' => $users['error']];
        }

        $syncedCount = 0;
        $db->beginTransaction();

        try {
            foreach ($users as $user) {
                $sql = "INSERT INTO students (moodle_user_id, username, email, full_name)
                        VALUES (:moodle_user_id, :username, :email, :full_name)
                        ON DUPLICATE KEY UPDATE
                        username = :username, email = :email, full_name = :full_name, updated_at = NOW()";

                $params = [
                    ':moodle_user_id' => $user['id'],
                    ':username' => $user['username'],
                    ':email' => $user['email'] ?? '',
                    ':full_name' => $user['fullname'] ?? ''
                ];

                $db->query($sql, $params);
                $syncedCount++;
            }

            $db->commit();
            $this->logSync('students', 'success', $syncedCount);

            return ['success' => true, 'synced' => $syncedCount];

        } catch (Exception $e) {
            $db->rollback();
            $this->logSync('students', 'failed', 0, $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Sync problems/questions from Moodle
     */
    public function syncProblems($quizId, $courseId) {
        $db = Database::getInstance();
        $quiz = $this->getQuizQuestions($quizId);

        if (isset($quiz['error'])) {
            return ['success' => false, 'error' => $quiz['error']];
        }

        // This is a simplified version - actual implementation would need
        // to use mod_quiz_get_attempt_data or similar to get question details

        $syncedCount = 0;
        $this->logSync('problems', 'success', $syncedCount);

        return ['success' => true, 'synced' => $syncedCount];
    }

    /**
     * Log synchronization
     */
    private function logSync($type, $status, $count, $error = null) {
        $db = Database::getInstance();
        $sql = "INSERT INTO moodle_sync_log (sync_type, status, records_synced, error_message, sync_completed_at)
                VALUES (:type, :status, :count, :error, NOW())";

        $db->query($sql, [
            ':type' => $type,
            ':status' => $status,
            ':count' => $count,
            ':error' => $error
        ]);
    }

    /**
     * Log errors
     */
    private function logError($message) {
        error_log("[MoodleService] " . $message);
    }
}
