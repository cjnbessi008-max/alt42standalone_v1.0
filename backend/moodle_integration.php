<?php
/**
 * Inequality Arrow App - Moodle Integration
 * Handles communication with Moodle LMS via web services
 */

require_once 'config.php';

class MoodleIntegration {
    private $moodleUrl;
    private $token;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Call Moodle web service
     * @param string $function
     * @param array $params
     * @return mixed
     */
    private function callMoodleService($function, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            logError("Moodle API error", ['error' => curl_error($ch), 'function' => $function]);
            curl_close($ch);
            return false;
        }

        curl_close($ch);

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            logError("Moodle service exception", ['exception' => $data['exception'], 'message' => $data['message'] ?? '']);
            return false;
        }

        return $data;
    }

    /**
     * Get user information from Moodle
     * @param int $moodleUserId
     * @return array|false
     */
    public function getUserInfo($moodleUserId) {
        return $this->callMoodleService('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $moodleUserId
        ]);
    }

    /**
     * Get course information
     * @param int $courseId
     * @return array|false
     */
    public function getCourseInfo($courseId) {
        return $this->callMoodleService('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);
    }

    /**
     * Sync user from Moodle to local database
     * @param int $moodleUserId
     * @return array|false
     */
    public function syncUser($moodleUserId) {
        $userInfo = $this->getUserInfo($moodleUserId);

        if (!$userInfo || empty($userInfo)) {
            return false;
        }

        $user = $userInfo[0];
        $pdo = getDatabaseConnection();

        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE moodle_user_id = ?");
        $stmt->execute([$moodleUserId]);
        $existingUser = $stmt->fetch();

        if ($existingUser) {
            // Update existing user
            $stmt = $pdo->prepare("
                UPDATE users
                SET username = ?, email = ?, updated_at = NOW()
                WHERE moodle_user_id = ?
            ");
            $stmt->execute([
                $user['username'],
                $user['email'],
                $moodleUserId
            ]);

            return ['id' => $existingUser['id'], 'updated' => true];
        } else {
            // Create new user
            $stmt = $pdo->prepare("
                INSERT INTO users (moodle_user_id, username, email, role)
                VALUES (?, ?, ?, 'student')
            ");
            $stmt->execute([
                $moodleUserId,
                $user['username'],
                $user['email']
            ]);

            return ['id' => $pdo->lastInsertId(), 'created' => true];
        }
    }

    /**
     * Send grade to Moodle gradebook
     * @param int $courseId
     * @param int $userId
     * @param float $grade
     * @param int $itemId
     * @return bool
     */
    public function sendGrade($courseId, $userId, $grade, $itemId = 0) {
        $pdo = getDatabaseConnection();

        // Get moodle_user_id
        $stmt = $pdo->prepare("SELECT moodle_user_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            return false;
        }

        $moodleUserId = $user['moodle_user_id'];

        // Call Moodle grade update service
        $result = $this->callMoodleService('core_grades_update_grades', [
            'source' => APP_NAME,
            'courseid' => $courseId,
            'component' => 'mod_assign',
            'activityid' => $itemId,
            'itemnumber' => 0,
            'grades[0][studentid]' => $moodleUserId,
            'grades[0][grade]' => $grade
        ]);

        // Log sync
        $stmt = $pdo->prepare("
            INSERT INTO moodle_sync_log (moodle_course_id, moodle_user_id, sync_type, sync_status, grade_value)
            VALUES (?, ?, 'grade_sync', ?, ?)
        ");
        $stmt->execute([
            $courseId,
            $moodleUserId,
            $result ? 'success' : 'failed',
            $grade
        ]);

        return $result !== false;
    }

    /**
     * Update activity completion in Moodle
     * @param int $courseId
     * @param int $userId
     * @param int $cmId
     * @param int $completed
     * @return bool
     */
    public function updateCompletion($courseId, $userId, $cmId, $completed = 1) {
        $pdo = getDatabaseConnection();

        $stmt = $pdo->prepare("SELECT moodle_user_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            return false;
        }

        $result = $this->callMoodleService('core_completion_update_activity_completion_status_manually', [
            'cmid' => $cmId,
            'completed' => $completed
        ]);

        // Log sync
        $stmt = $pdo->prepare("
            INSERT INTO moodle_sync_log (moodle_course_id, moodle_user_id, sync_type, sync_status)
            VALUES (?, ?, 'completion_sync', ?)
        ");
        $stmt->execute([
            $courseId,
            $user['moodle_user_id'],
            $result ? 'success' : 'failed'
        ]);

        return $result !== false;
    }

    /**
     * Get enrolled users in a course
     * @param int $courseId
     * @return array|false
     */
    public function getEnrolledUsers($courseId) {
        return $this->callMoodleService('core_enrol_get_enrolled_users', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Create activity completion event in Moodle
     * @param int $userId
     * @param int $courseId
     * @param string $sessionId
     * @param array $progressData
     * @return bool
     */
    public function reportProgress($userId, $courseId, $sessionId, $progressData) {
        $pdo = getDatabaseConnection();

        $stmt = $pdo->prepare("SELECT moodle_user_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            return false;
        }

        // Calculate grade (0-100 scale)
        $grade = isset($progressData['accuracy']) ? $progressData['accuracy'] : 0;

        // Log sync
        $stmt = $pdo->prepare("
            INSERT INTO moodle_sync_log
            (moodle_course_id, moodle_user_id, session_id, sync_type, sync_status, grade_value)
            VALUES (?, ?, ?, 'progress_sync', 'success', ?)
        ");
        $stmt->execute([
            $courseId,
            $user['moodle_user_id'],
            $sessionId,
            $grade
        ]);

        return true;
    }
}

// API endpoint handling
if (basename($_SERVER['PHP_SELF']) === 'moodle_integration.php') {
    $method = $_SERVER['REQUEST_METHOD'];
    $requestData = getRequestData();

    $moodle = new MoodleIntegration();

    switch ($method) {
        case 'POST':
            $action = $requestData['action'] ?? '';

            switch ($action) {
                case 'sync_user':
                    $moodleUserId = $requestData['moodle_user_id'] ?? null;
                    if (!$moodleUserId) {
                        sendJsonResponse(['error' => 'Missing moodle_user_id'], 400);
                    }

                    $result = $moodle->syncUser($moodleUserId);
                    if ($result) {
                        sendJsonResponse(['success' => true, 'user' => $result]);
                    } else {
                        sendJsonResponse(['error' => 'Failed to sync user'], 500);
                    }
                    break;

                case 'send_grade':
                    $courseId = $requestData['course_id'] ?? null;
                    $userId = $requestData['user_id'] ?? null;
                    $grade = $requestData['grade'] ?? null;

                    if (!$courseId || !$userId || $grade === null) {
                        sendJsonResponse(['error' => 'Missing required parameters'], 400);
                    }

                    $result = $moodle->sendGrade($courseId, $userId, $grade);
                    sendJsonResponse(['success' => $result]);
                    break;

                case 'report_progress':
                    $userId = $requestData['user_id'] ?? null;
                    $courseId = $requestData['course_id'] ?? null;
                    $sessionId = $requestData['session_id'] ?? null;
                    $progressData = $requestData['progress'] ?? [];

                    if (!$userId || !$courseId || !$sessionId) {
                        sendJsonResponse(['error' => 'Missing required parameters'], 400);
                    }

                    $result = $moodle->reportProgress($userId, $courseId, $sessionId, $progressData);
                    sendJsonResponse(['success' => $result]);
                    break;

                default:
                    sendJsonResponse(['error' => 'Unknown action'], 400);
            }
            break;

        default:
            sendJsonResponse(['error' => 'Method not allowed'], 405);
    }
}
