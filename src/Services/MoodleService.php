<?php
/**
 * Moodle 3.7 Web Service Integration
 * Handles communication with Moodle LMS
 */

namespace ColorPattern\Services;

use ColorPattern\Utils\Database;

class MoodleService {
    private $config;
    private $db;
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->config = require __DIR__ . '/../../config/moodle.php';
        $this->db = Database::getInstance();
        $this->baseUrl = $this->config['base_url'] . $this->config['webservice_endpoint'];
        $this->token = $this->config['ws_token'];
    }

    /**
     * Make a web service call to Moodle
     */
    private function call($functionName, $params = []) {
        $startTime = microtime(true);

        $url = $this->baseUrl . '?' . http_build_query([
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => $this->config['response_format']
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['timeout']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->config['verify_ssl']);

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        $duration = round((microtime(true) - $startTime) * 1000); // milliseconds

        // Log the API call
        $this->logSync(
            'moodle_api_call',
            $functionName,
            $params,
            $response,
            $statusCode,
            empty($error) && $statusCode == 200,
            $error,
            $duration
        );

        if (!empty($error) || $statusCode != 200) {
            throw new \Exception("Moodle API Error: {$error} (Status: {$statusCode})");
        }

        $decoded = json_decode($response, true);

        if (isset($decoded['exception'])) {
            throw new \Exception("Moodle Exception: {$decoded['message']}");
        }

        return $decoded;
    }

    /**
     * Get user information by ID
     */
    public function getUserById($userId) {
        return $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);
    }

    /**
     * Get user information by username
     */
    public function getUserByUsername($username) {
        return $this->call('core_user_get_users_by_field', [
            'field' => 'username',
            'values[0]' => $username
        ]);
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
     * Get quiz information
     */
    public function getQuizzesByCourse($courseId) {
        return $this->call('mod_quiz_get_quizzes_by_courses', [
            'courseids[0]' => $courseId
        ]);
    }

    /**
     * Get quiz attempt data
     */
    public function getAttemptData($attemptId) {
        return $this->call('mod_quiz_get_attempt_data', [
            'attemptid' => $attemptId
        ]);
    }

    /**
     * Submit grade to Moodle
     */
    public function submitGrade($userId, $courseId, $itemName, $grade) {
        if (!$this->config['auto_sync_grades']) {
            return false;
        }

        try {
            $result = $this->call('core_grades_update_grades', [
                'source' => 'color_pattern_app',
                'courseid' => $courseId,
                'component' => 'mod_colorpattern',
                'activityid' => 0,
                'itemnumber' => 0,
                'grades[0][studentid]' => $userId,
                'grades[0][grade]' => $grade,
                'itemdetails[itemname]' => $itemName,
                'itemdetails[idnumber]' => 'colorpattern_' . time()
            ]);

            return $result;
        } catch (\Exception $e) {
            error_log("Failed to submit grade to Moodle: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Authenticate user with Moodle token
     */
    public function authenticateUser($username, $password) {
        // Note: This requires a custom Moodle web service function
        // or you can use Moodle's mobile app token generation endpoint
        $loginUrl = $this->config['base_url'] . '/login/token.php';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $loginUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'username' => $username,
            'password' => $password,
            'service' => 'moodle_mobile_app'
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->config['verify_ssl']);

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($statusCode != 200) {
            throw new \Exception("Authentication failed");
        }

        $decoded = json_decode($response, true);

        if (isset($decoded['error'])) {
            throw new \Exception("Authentication error: {$decoded['error']}");
        }

        return $decoded;
    }

    /**
     * Get question from Moodle
     */
    public function getQuestion($questionId) {
        // This would require a custom web service function in Moodle
        // For now, return a mock structure
        return $this->call('local_colorpattern_get_question', [
            'questionid' => $questionId
        ]);
    }

    /**
     * Fetch problems from Moodle and sync to local database
     */
    public function syncProblems($courseId) {
        try {
            $quizzes = $this->getQuizzesByCourse($courseId);
            $syncedCount = 0;

            foreach ($quizzes['quizzes'] as $quiz) {
                // This is a simplified example
                // In production, you'd need to fetch actual questions
                // and parse them into the color pattern format

                $syncedCount++;
            }

            return [
                'success' => true,
                'synced_count' => $syncedCount
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Log Moodle sync activity
     */
    private function logSync($syncType, $endpoint, $requestData, $responseData, $statusCode, $isSuccess, $errorMessage, $duration) {
        $sql = "INSERT INTO moodle_sync_log
                (sync_type, moodle_endpoint, request_data, response_data,
                 status_code, is_success, error_message, sync_duration_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $syncType,
            $endpoint,
            json_encode($requestData),
            is_string($responseData) ? $responseData : json_encode($responseData),
            $statusCode,
            $isSuccess ? 1 : 0,
            $errorMessage,
            $duration
        ];

        try {
            $this->db->insert($sql, $params);
        } catch (\Exception $e) {
            error_log("Failed to log Moodle sync: " . $e->getMessage());
        }
    }

    /**
     * Test Moodle connection
     */
    public function testConnection() {
        try {
            $result = $this->call('core_webservice_get_site_info');
            return [
                'success' => true,
                'sitename' => $result['sitename'] ?? 'Unknown',
                'version' => $result['version'] ?? 'Unknown',
                'functions' => $result['functions'] ?? []
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get sync logs
     */
    public function getSyncLogs($limit = 50) {
        $sql = "SELECT * FROM moodle_sync_log
                ORDER BY created_at DESC LIMIT ?";

        return $this->db->select($sql, [(int)$limit]);
    }
}
