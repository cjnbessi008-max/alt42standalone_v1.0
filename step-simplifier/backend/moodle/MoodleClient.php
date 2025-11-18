<?php
/**
 * Moodle Web Services Client
 * Handles communication with Moodle 3.7 API
 */

require_once __DIR__ . '/../config/moodle.php';

class MoodleClient {
    private $apiUrl;
    private $token;

    public function __construct() {
        $this->apiUrl = MoodleConfig::getApiEndpoint();
        $this->token = MoodleConfig::getToken();
    }

    /**
     * Make a request to Moodle Web Services
     */
    private function makeRequest($function, $params = []) {
        $params = array_merge(MoodleConfig::getDefaultParams(), [
            'wsfunction' => $function
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API Request Failed: " . $error);
        }

        curl_close($ch);

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API Error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get question from Moodle by ID
     */
    public function getQuestion($questionId) {
        // In Moodle 3.7, we'll use custom web service or mod_quiz functions
        // This is a simplified example
        $params = [
            'questionid' => $questionId
        ];

        return $this->makeRequest('local_step_simplifier_get_question', $params);
    }

    /**
     * Get user information from Moodle
     */
    public function getUser($userId) {
        $params = [
            'field' => 'id',
            'values' => [$userId]
        ];

        return $this->makeRequest(MOODLE_WS_GET_USER, $params);
    }

    /**
     * Update user grade in Moodle
     */
    public function updateGrade($userId, $itemId, $grade) {
        $params = [
            'source' => 'step_simplifier',
            'courseid' => 1, // This should be dynamic
            'component' => 'mod_quiz',
            'activityid' => $itemId,
            'itemnumber' => 0,
            'grades' => [
                [
                    'studentid' => $userId,
                    'grade' => $grade
                ]
            ]
        ];

        return $this->makeRequest(MOODLE_WS_UPDATE_GRADES, $params);
    }

    /**
     * Sync question from Moodle to local database
     */
    public function syncQuestion($questionId) {
        try {
            $questionData = $this->getQuestion($questionId);

            // Log the sync
            $this->logSync('problem', $questionId, 'success');

            return $questionData;
        } catch (Exception $e) {
            $this->logSync('problem', $questionId, 'failed', $e->getMessage());
            throw $e;
        }
    }

    /**
     * Log sync operation
     */
    private function logSync($type, $moodleId, $status, $error = null) {
        require_once __DIR__ . '/../config/database.php';

        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                INSERT INTO moodle_sync_log (sync_type, moodle_id, status, error_message)
                VALUES (:type, :moodle_id, :status, :error)
            ");

            $stmt->execute([
                'type' => $type,
                'moodle_id' => $moodleId,
                'status' => $status,
                'error' => $error
            ]);
        } catch (Exception $e) {
            error_log("Failed to log sync: " . $e->getMessage());
        }
    }
}
