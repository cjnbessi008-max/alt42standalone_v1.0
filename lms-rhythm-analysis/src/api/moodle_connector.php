<?php
/**
 * Moodle Web Services Connector
 * PHP 7.1.9 Compatible
 * Connects to Moodle 3.7 via Web Services API
 */

require_once __DIR__ . '/../../config/database.php';

class MoodleConnector {
    private $moodle_url;
    private $ws_token;
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();

        $this->moodle_url = $database->getConfig('moodle_url') ?: getenv('MOODLE_URL');
        $this->ws_token = $database->getConfig('ws_token') ?: getenv('MOODLE_WS_TOKEN');

        if (empty($this->moodle_url) || empty($this->ws_token)) {
            error_log("Moodle configuration missing: URL or Token not set");
        }
    }

    /**
     * Call Moodle Web Service function
     * @param string $function Web service function name
     * @param array $params Parameters for the function
     * @return array|null Response data
     */
    private function callWebService($function, $params = []) {
        if (empty($this->moodle_url) || empty($this->ws_token)) {
            throw new Exception("Moodle configuration not set");
        }

        $server_url = rtrim($this->moodle_url, '/') . '/webservice/rest/server.php';

        $params['wstoken'] = $this->ws_token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($server_url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Curl error: " . $error);
        }

        curl_close($ch);

        if ($http_code !== 200) {
            throw new Exception("HTTP Error: " . $http_code);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API Error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get user information by user ID
     * @param int $user_id Moodle user ID
     * @return array|null User data
     */
    public function getUser($user_id) {
        try {
            $params = [
                'criteria' => [
                    ['key' => 'id', 'value' => $user_id]
                ]
            ];

            $result = $this->callWebService('core_user_get_users', $params);
            return !empty($result['users']) ? $result['users'][0] : null;
        } catch (Exception $e) {
            error_log("Get user error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get all users enrolled in courses
     * @param int $limit Maximum number of users to fetch
     * @return array Users data
     */
    public function getUsers($limit = 100) {
        try {
            $params = [
                'criteria' => [
                    ['key' => 'firstname', 'value' => '%']
                ]
            ];

            $result = $this->callWebService('core_user_get_users', $params);
            return array_slice($result['users'] ?? [], 0, $limit);
        } catch (Exception $e) {
            error_log("Get users error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user's enrolled courses
     * @param int $user_id Moodle user ID
     * @return array Courses data
     */
    public function getUserCourses($user_id) {
        try {
            $params = ['userid' => $user_id];
            $result = $this->callWebService('core_enrol_get_users_courses', $params);
            return $result ?? [];
        } catch (Exception $e) {
            error_log("Get user courses error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get quiz attempts for a user
     * @param int $quiz_id Quiz ID
     * @param int $user_id User ID (optional)
     * @return array Quiz attempts data
     */
    public function getQuizAttempts($quiz_id, $user_id = null) {
        try {
            $params = ['quizid' => $quiz_id];
            if ($user_id) {
                $params['userid'] = $user_id;
            }

            $result = $this->callWebService('mod_quiz_get_user_attempts', $params);
            return $result['attempts'] ?? [];
        } catch (Exception $e) {
            error_log("Get quiz attempts error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get attempt review data (questions and responses)
     * @param int $attempt_id Attempt ID
     * @return array Attempt review data
     */
    public function getAttemptReview($attempt_id) {
        try {
            $params = ['attemptid' => $attempt_id];
            $result = $this->callWebService('mod_quiz_get_attempt_review', $params);
            return $result ?? [];
        } catch (Exception $e) {
            error_log("Get attempt review error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get course activities and completion status
     * @param int $course_id Course ID
     * @return array Course contents
     */
    public function getCourseContents($course_id) {
        try {
            $params = ['courseid' => $course_id];
            $result = $this->callWebService('core_course_get_contents', $params);
            return $result ?? [];
        } catch (Exception $e) {
            error_log("Get course contents error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get recent activity for a course
     * @param int $course_id Course ID
     * @param int $since Unix timestamp (get activities since this time)
     * @return array Recent activities
     */
    public function getRecentActivity($course_id, $since = null) {
        try {
            if ($since === null) {
                $since = strtotime('-30 days');
            }

            $params = [
                'courseid' => $course_id,
                'since' => $since
            ];

            $result = $this->callWebService('core_course_get_recent_courses', $params);
            return $result ?? [];
        } catch (Exception $e) {
            error_log("Get recent activity error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get activity completion status for user
     * @param int $course_id Course ID
     * @param int $user_id User ID
     * @return array Completion data
     */
    public function getActivityCompletion($course_id, $user_id) {
        try {
            $params = [
                'courseid' => $course_id,
                'userid' => $user_id
            ];

            $result = $this->callWebService('core_completion_get_activities_completion_status', $params);
            return $result['statuses'] ?? [];
        } catch (Exception $e) {
            error_log("Get activity completion error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Sync user data from Moodle to local database
     * @param int $moodle_user_id Moodle user ID
     * @return bool Success status
     */
    public function syncUser($moodle_user_id) {
        try {
            $moodle_user = $this->getUser($moodle_user_id);

            if (!$moodle_user) {
                return false;
            }

            $query = "INSERT INTO users (moodle_user_id, username, email, fullname, first_synced_at, last_synced_at)
                     VALUES (:moodle_user_id, :username, :email, :fullname, NOW(), NOW())
                     ON DUPLICATE KEY UPDATE
                     username = :username,
                     email = :email,
                     fullname = :fullname,
                     last_synced_at = NOW()";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':moodle_user_id', $moodle_user['id']);
            $stmt->bindParam(':username', $moodle_user['username']);
            $stmt->bindParam(':email', $moodle_user['email']);

            $fullname = $moodle_user['firstname'] . ' ' . $moodle_user['lastname'];
            $stmt->bindParam(':fullname', $fullname);

            return $stmt->execute();
        } catch (Exception $e) {
            error_log("Sync user error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get local user ID from Moodle user ID
     * @param int $moodle_user_id
     * @return int|null Local user ID
     */
    public function getLocalUserId($moodle_user_id) {
        try {
            $query = "SELECT id FROM users WHERE moodle_user_id = :moodle_user_id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':moodle_user_id', $moodle_user_id);
            $stmt->execute();

            $result = $stmt->fetch();
            return $result ? (int)$result['id'] : null;
        } catch (Exception $e) {
            error_log("Get local user ID error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Test Moodle connection
     * @return array Connection test result
     */
    public function testConnection() {
        try {
            $result = $this->callWebService('core_webservice_get_site_info');

            return [
                'success' => true,
                'site_name' => $result['sitename'] ?? 'Unknown',
                'moodle_version' => $result['release'] ?? 'Unknown',
                'user' => $result['username'] ?? 'Unknown'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
