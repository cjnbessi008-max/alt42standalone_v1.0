<?php
/**
 * Moodle REST API Integration Class
 * For Moodle 3.7 Web Services
 */

class MoodleAPI {
    private $config;
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/moodle.php';
        $this->baseUrl = rtrim($this->config['url'], '/') . $this->config['rest_endpoint'];
        $this->token = $this->config['token'];
    }

    /**
     * Make API request to Moodle
     */
    private function request($function, $params = []) {
        if (empty($this->token)) {
            throw new Exception('Moodle web service token is not configured.');
        }

        $url = $this->baseUrl . '?' . http_build_query([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->config['response_format']
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['timeout']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->logSync($function, $params, null, 'failed', 'cURL Error: ' . $error);
            throw new Exception('Moodle API request failed: ' . $error);
        }

        if ($httpCode !== 200) {
            $this->logSync($function, $params, null, 'failed', 'HTTP ' . $httpCode);
            throw new Exception('Moodle API returned HTTP ' . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            $errorMsg = $data['message'] ?? 'Unknown error';
            $this->logSync($function, $params, null, 'failed', $errorMsg);
            throw new Exception('Moodle API error: ' . $errorMsg);
        }

        $this->logSync($function, $params, $data, 'success');
        return $data;
    }

    /**
     * Get user by username or email
     */
    public function getUserByField($field, $value) {
        try {
            $function = $this->config['functions']['get_user_by_field'];
            $params = [
                'field' => $field,
                'values[0]' => $value
            ];

            $result = $this->request($function, $params);
            return !empty($result) ? $result[0] : null;
        } catch (Exception $e) {
            logError('Failed to get Moodle user: ' . $e->getMessage(), ['field' => $field, 'value' => $value]);
            return null;
        }
    }

    /**
     * Get users by IDs
     */
    public function getUsersByIds($userIds) {
        try {
            $function = $this->config['functions']['get_users'];
            $params = ['criteria[0][key]' => 'id'];

            foreach ($userIds as $index => $userId) {
                $params["criteria[0][value][$index]"] = $userId;
            }

            $result = $this->request($function, $params);
            return $result['users'] ?? [];
        } catch (Exception $e) {
            logError('Failed to get Moodle users: ' . $e->getMessage(), ['userIds' => $userIds]);
            return [];
        }
    }

    /**
     * Sync user from Moodle to local database
     */
    public function syncUser($moodleUserId) {
        try {
            $moodleUser = $this->getUsersByIds([$moodleUserId]);

            if (empty($moodleUser)) {
                throw new Exception('User not found in Moodle');
            }

            $moodleUser = $moodleUser[0];

            $db = Database::getInstance();

            // Check if user already exists
            $existingUser = $db->queryOne(
                'SELECT id FROM users WHERE moodle_user_id = ?',
                [$moodleUserId]
            );

            $userData = [
                'moodle_user_id' => $moodleUserId,
                'username' => $moodleUser['username'],
                'email' => $moodleUser['email'],
                'full_name' => trim($moodleUser['firstname'] . ' ' . $moodleUser['lastname']),
                'last_sync_at' => date('Y-m-d H:i:s')
            ];

            if ($existingUser) {
                // Update existing user
                $db->execute(
                    'UPDATE users SET username = ?, email = ?, full_name = ?, last_sync_at = ? WHERE moodle_user_id = ?',
                    [
                        $userData['username'],
                        $userData['email'],
                        $userData['full_name'],
                        $userData['last_sync_at'],
                        $moodleUserId
                    ]
                );
                return $existingUser['id'];
            } else {
                // Insert new user
                $result = $db->execute(
                    'INSERT INTO users (moodle_user_id, username, email, full_name, last_sync_at) VALUES (?, ?, ?, ?, ?)',
                    [
                        $userData['moodle_user_id'],
                        $userData['username'],
                        $userData['email'],
                        $userData['full_name'],
                        $userData['last_sync_at']
                    ]
                );
                return $result['last_insert_id'];
            }
        } catch (Exception $e) {
            logError('Failed to sync user from Moodle: ' . $e->getMessage(), ['moodleUserId' => $moodleUserId]);
            throw $e;
        }
    }

    /**
     * Get quizzes from Moodle course
     */
    public function getQuizzesByCourse($courseId) {
        try {
            $function = $this->config['functions']['get_quizzes'];
            $params = ['courseids[0]' => $courseId];

            $result = $this->request($function, $params);
            return $result['quizzes'] ?? [];
        } catch (Exception $e) {
            logError('Failed to get Moodle quizzes: ' . $e->getMessage(), ['courseId' => $courseId]);
            return [];
        }
    }

    /**
     * Sync grade to Moodle gradebook
     */
    public function syncGrade($moodleUserId, $courseId, $itemName, $grade, $maxGrade = 100) {
        try {
            $function = $this->config['functions']['update_grades'];

            $params = [
                'source' => 'quiz_explanation_app',
                'courseid' => $courseId,
                'component' => 'mod_quiz',
                'activityid' => 0, // Set to actual activity ID if needed
                'itemnumber' => 0,
                'grades[0][studentid]' => $moodleUserId,
                'grades[0][grade]' => $grade,
                'itemdetails[itemname]' => $itemName,
                'itemdetails[grademax]' => $maxGrade
            ];

            $result = $this->request($function, $params);

            // Update sync status in database
            $db = Database::getInstance();
            $db->execute(
                'UPDATE quiz_attempts SET synced_to_moodle = 1, synced_at = ? WHERE student_id IN (SELECT id FROM users WHERE moodle_user_id = ?)',
                [date('Y-m-d H:i:s'), $moodleUserId]
            );

            return $result;
        } catch (Exception $e) {
            logError('Failed to sync grade to Moodle: ' . $e->getMessage(), [
                'moodleUserId' => $moodleUserId,
                'courseId' => $courseId,
                'grade' => $grade
            ]);
            throw $e;
        }
    }

    /**
     * Authenticate user via Moodle token
     */
    public function authenticateUser($username, $password) {
        // Note: This requires a custom Moodle web service function
        // or you can use Moodle's built-in authentication
        try {
            $user = $this->getUserByField('username', $username);

            if (!$user) {
                return false;
            }

            // Sync user to local database
            $localUserId = $this->syncUser($user['id']);

            return [
                'id' => $localUserId,
                'moodle_user_id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'full_name' => trim($user['firstname'] . ' ' . $user['lastname'])
            ];
        } catch (Exception $e) {
            logError('Failed to authenticate user: ' . $e->getMessage(), ['username' => $username]);
            return false;
        }
    }

    /**
     * Log sync operation to database
     */
    private function logSync($function, $requestData, $responseData, $status, $errorMessage = null) {
        try {
            $db = Database::getInstance();
            $db->execute(
                'INSERT INTO moodle_sync_log (sync_type, entity_id, status, error_message, request_data, response_data) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    'quiz', // Default type
                    0, // Entity ID
                    $status,
                    $errorMessage,
                    json_encode($requestData),
                    json_encode($responseData)
                ]
            );
        } catch (Exception $e) {
            error_log('Failed to log sync operation: ' . $e->getMessage());
        }
    }

    /**
     * Test Moodle connection
     */
    public function testConnection() {
        try {
            // Try to get site info
            $result = $this->request('core_webservice_get_site_info', []);
            return [
                'success' => true,
                'site_name' => $result['sitename'] ?? 'Unknown',
                'moodle_version' => $result['release'] ?? 'Unknown'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
