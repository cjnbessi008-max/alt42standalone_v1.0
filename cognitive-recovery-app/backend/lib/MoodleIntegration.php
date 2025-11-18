<?php
/**
 * Moodle Integration Library
 * Connects with Moodle 3.7 LMS via REST API
 */

class MoodleIntegration {
    private $moodleUrl;
    private $token;
    private $restFormat = 'json';

    /**
     * Constructor
     * @param string $moodleUrl Base URL of Moodle installation
     * @param string $token Moodle web service token
     */
    public function __construct($moodleUrl = null, $token = null) {
        // Load from config if not provided
        if ($moodleUrl && $token) {
            $this->moodleUrl = rtrim($moodleUrl, '/');
            $this->token = $token;
        } else {
            $this->loadConfig();
        }
    }

    /**
     * Load configuration from database
     */
    private function loadConfig() {
        $db = new Database();
        $conn = $db->getConnection();

        $query = "SELECT config_value FROM system_config WHERE config_key = :key LIMIT 1";

        // Get Moodle URL
        $stmt = $conn->prepare($query);
        $stmt->bindValue(':key', 'moodle_api_url');
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->moodleUrl = rtrim($result['config_value'] ?? '', '/');

        // Get Moodle Token
        $stmt = $conn->prepare($query);
        $stmt->bindValue(':key', 'moodle_api_token');
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->token = $result['config_value'] ?? '';
    }

    /**
     * Make API call to Moodle
     * @param string $function Moodle web service function name
     * @param array $params Parameters for the function
     * @return array|false
     */
    private function callMoodleApi($function, $params = []) {
        if (empty($this->moodleUrl) || empty($this->token)) {
            error_log("Moodle Integration Error: URL or token not configured");
            return false;
        }

        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->restFormat
        ], $params);

        try {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                error_log("Moodle API Error: HTTP $httpCode");
                return false;
            }

            $data = json_decode($response, true);

            // Check for Moodle errors
            if (isset($data['exception'])) {
                error_log("Moodle API Exception: " . $data['message']);
                return false;
            }

            return $data;

        } catch (Exception $e) {
            error_log("Moodle API Call Failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user information by ID
     * @param int $userId Moodle user ID
     * @return array|false
     */
    public function getUserById($userId) {
        $response = $this->callMoodleApi('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);

        if ($response && !empty($response[0])) {
            return $response[0];
        }

        return false;
    }

    /**
     * Get user information by username
     * @param string $username
     * @return array|false
     */
    public function getUserByUsername($username) {
        $response = $this->callMoodleApi('core_user_get_users_by_field', [
            'field' => 'username',
            'values[0]' => $username
        ]);

        if ($response && !empty($response[0])) {
            return $response[0];
        }

        return false;
    }

    /**
     * Get course information
     * @param int $courseId Moodle course ID
     * @return array|false
     */
    public function getCourse($courseId) {
        $response = $this->callMoodleApi('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);

        if ($response && !empty($response[0])) {
            return $response[0];
        }

        return false;
    }

    /**
     * Get courses for a user
     * @param int $userId Moodle user ID
     * @return array|false
     */
    public function getUserCourses($userId) {
        $response = $this->callMoodleApi('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);

        return $response ?: [];
    }

    /**
     * Get course modules (activities)
     * @param int $courseId
     * @return array|false
     */
    public function getCourseModules($courseId) {
        $response = $this->callMoodleApi('core_course_get_contents', [
            'courseid' => $courseId
        ]);

        return $response ?: [];
    }

    /**
     * Sync user from Moodle to local database
     * @param int $moodleUserId
     * @return int|false Local user ID
     */
    public function syncUser($moodleUserId) {
        $moodleUser = $this->getUserById($moodleUserId);

        if (!$moodleUser) {
            return false;
        }

        $db = new Database();
        $conn = $db->getConnection();

        // Check if user already exists
        $query = "SELECT id FROM users WHERE moodle_user_id = :moodle_user_id LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':moodle_user_id', $moodleUserId);
        $stmt->execute();
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Update existing user
            $query = "UPDATE users SET
                        username = :username,
                        email = :email,
                        full_name = :full_name,
                        updated_at = NOW()
                      WHERE moodle_user_id = :moodle_user_id";

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':username', $moodleUser['username']);
            $stmt->bindParam(':email', $moodleUser['email']);
            $fullName = $moodleUser['firstname'] . ' ' . $moodleUser['lastname'];
            $stmt->bindParam(':full_name', $fullName);
            $stmt->bindParam(':moodle_user_id', $moodleUserId);
            $stmt->execute();

            return $existing['id'];

        } else {
            // Insert new user
            $query = "INSERT INTO users (moodle_user_id, username, email, full_name)
                      VALUES (:moodle_user_id, :username, :email, :full_name)";

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':moodle_user_id', $moodleUserId);
            $stmt->bindParam(':username', $moodleUser['username']);
            $stmt->bindParam(':email', $moodleUser['email']);
            $fullName = $moodleUser['firstname'] . ' ' . $moodleUser['lastname'];
            $stmt->bindParam(':full_name', $fullName);
            $stmt->execute();

            return $conn->lastInsertId();
        }
    }

    /**
     * Get or create local user from Moodle user ID
     * @param int $moodleUserId
     * @return int|false Local user ID
     */
    public function getOrCreateLocalUser($moodleUserId) {
        $db = new Database();
        $conn = $db->getConnection();

        // Check if user exists
        $query = "SELECT id FROM users WHERE moodle_user_id = :moodle_user_id LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':moodle_user_id', $moodleUserId);
        $stmt->execute();
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            return $existing['id'];
        }

        // User doesn't exist, sync from Moodle
        return $this->syncUser($moodleUserId);
    }

    /**
     * Authenticate user via Moodle session
     * @param string $moodleSessionId Moodle session ID (MoodleSession cookie)
     * @return array|false User data if authenticated
     */
    public function authenticateBySession($moodleSessionId) {
        // This would require custom Moodle web service function
        // For now, return false as it needs custom implementation

        // Example custom web service would be:
        // local_cognitiverecovery_get_session_user

        return false;
    }

    /**
     * Send cognitive recovery data back to Moodle
     * This can be used to integrate with Moodle gradebook or custom plugins
     *
     * @param int $moodleUserId
     * @param int $courseId
     * @param array $recoveryData
     * @return bool
     */
    public function sendRecoveryDataToMoodle($moodleUserId, $courseId, $recoveryData) {
        // This would require a custom Moodle web service function
        // Example: local_cognitiverecovery_submit_data

        $params = [
            'userid' => $moodleUserId,
            'courseid' => $courseId,
            'recoverycount' => $recoveryData['recovery_count'] ?? 0,
            'avgduration' => $recoveryData['avg_duration'] ?? 0,
            'sessionduration' => $recoveryData['session_duration'] ?? 0,
            'efficiency' => $recoveryData['efficiency'] ?? 0
        ];

        // Uncomment when custom web service is implemented
        // return $this->callMoodleApi('local_cognitiverecovery_submit_data', $params);

        return true; // Mock success for now
    }

    /**
     * Embed cognitive recovery tracker in Moodle course page
     * Returns JavaScript snippet to inject
     *
     * @param int $userId
     * @param int $courseId
     * @param int $moduleId
     * @return string JavaScript code
     */
    public function getEmbedCode($userId, $courseId = null, $moduleId = null) {
        $localUserId = $this->getOrCreateLocalUser($userId);

        if (!$localUserId) {
            return '';
        }

        $configJson = json_encode([
            'apiUrl' => '/cognitive-recovery-app/backend/api/track.php',
            'userId' => $localUserId,
            'courseId' => $courseId,
            'moduleId' => $moduleId,
            'enableConsoleLog' => false
        ]);

        return <<<JAVASCRIPT
<!-- Cognitive Recovery Tracker -->
<script src="/cognitive-recovery-app/frontend/js/activity-tracker.js"></script>
<script src="/cognitive-recovery-app/frontend/js/cognitive-detector.js"></script>
<link rel="stylesheet" href="/cognitive-recovery-app/frontend/css/dashboard.css">
<script>
(function() {
    const config = $configJson;
    const tracker = new ActivityTracker(config);
    const detector = new CognitiveDetector(tracker, {
        showNotifications: true,
        showVisualIndicator: true
    });

    // Auto-start tracking
    tracker.start().catch(err => console.error('Failed to start tracking:', err));

    // End session on page unload
    window.addEventListener('beforeunload', () => {
        tracker.stop().catch(err => console.error('Failed to stop tracking:', err));
    });
})();
</script>
JAVASCRIPT;
    }

    /**
     * Test Moodle connection
     * @return bool
     */
    public function testConnection() {
        $response = $this->callMoodleApi('core_webservice_get_site_info');

        if ($response && isset($response['sitename'])) {
            return true;
        }

        return false;
    }

    /**
     * Get Moodle site info
     * @return array|false
     */
    public function getSiteInfo() {
        return $this->callMoodleApi('core_webservice_get_site_info');
    }
}
