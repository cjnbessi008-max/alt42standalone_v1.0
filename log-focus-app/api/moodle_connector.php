<?php
/**
 * Moodle API Connector
 * Handles communication with Moodle 3.7 Web Services
 */

require_once __DIR__ . '/../config/moodle.php';

class MoodleConnector {
    private $token;
    private $apiUrl;
    private $cache = [];

    public function __construct() {
        $this->token = MOODLE_TOKEN;
        $this->apiUrl = MOODLE_API_ENDPOINT;
    }

    /**
     * Make API call to Moodle
     */
    private function callMoodleAPI($functionName, $params = []) {
        $cacheKey = md5($functionName . serialize($params));

        // Check cache
        if (CACHE_ENABLED && isset($this->cache[$cacheKey])) {
            $cached = $this->cache[$cacheKey];
            if (time() - $cached['time'] < CACHE_DURATION) {
                return $cached['data'];
            }
        }

        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $functionName;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Curl error: " . $error);
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: " . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API Error: " . $data['message']);
        }

        // Cache the result
        if (CACHE_ENABLED) {
            $this->cache[$cacheKey] = [
                'data' => $data,
                'time' => time()
            ];
        }

        return $data;
    }

    /**
     * Get quiz attempts for a user
     */
    public function getQuizAttempts($quizId, $userId = 0) {
        $function = MOODLE_FUNCTIONS['GET_QUIZ_ATTEMPTS'];
        $params = [
            'quizid' => $quizId,
            'userid' => $userId,
            'status' => 'all',
            'includepreviews' => true
        ];

        return $this->callMoodleAPI($function, $params);
    }

    /**
     * Get quizzes from courses
     */
    public function getQuizzes($courseIds = []) {
        $function = MOODLE_FUNCTIONS['GET_QUIZ_DATA'];
        $params = [];

        if (!empty($courseIds)) {
            $params['courseids'] = $courseIds;
        }

        return $this->callMoodleAPI($function, $params);
    }

    /**
     * Get user information
     */
    public function getUserInfo($field, $values) {
        $function = MOODLE_FUNCTIONS['GET_USER_INFO'];
        $params = [
            'field' => $field,
            'values' => is_array($values) ? $values : [$values]
        ];

        return $this->callMoodleAPI($function, $params);
    }

    /**
     * Get assignment submissions
     */
    public function getAssignmentSubmissions($assignIds = []) {
        $function = MOODLE_FUNCTIONS['GET_ASSIGNMENT_SUBMISSIONS'];
        $params = [
            'assignmentids' => $assignIds
        ];

        return $this->callMoodleAPI($function, $params);
    }

    /**
     * Parse Moodle log data to standardized format
     */
    public function parseLogData($rawData, $type = 'quiz') {
        $logs = [];

        switch ($type) {
            case 'quiz':
                if (isset($rawData['attempts'])) {
                    foreach ($rawData['attempts'] as $attempt) {
                        $logs[] = [
                            'user_id' => $attempt['userid'] ?? 0,
                            'user_name' => $attempt['userfullname'] ?? 'Unknown',
                            'activity_type' => 'QUIZ',
                            'problem_id' => $attempt['quiz'] ?? 0,
                            'problem_name' => $attempt['quizname'] ?? 'Unknown Quiz',
                            'action' => $this->getAttemptAction($attempt),
                            'result' => $this->getAttemptResult($attempt),
                            'score' => $attempt['sumgrades'] ?? null,
                            'log_message' => $this->formatLogMessage($attempt),
                            'raw_data' => json_encode($attempt),
                            'timestamp' => $attempt['timemodified'] ?? time()
                        ];
                    }
                }
                break;
        }

        return $logs;
    }

    /**
     * Get attempt action based on state
     */
    private function getAttemptAction($attempt) {
        $state = $attempt['state'] ?? 'unknown';

        switch ($state) {
            case 'inprogress':
                return 'STARTED';
            case 'finished':
                return 'SUBMITTED';
            case 'abandoned':
                return 'TIMEOUT';
            default:
                return 'VIEWED';
        }
    }

    /**
     * Get attempt result
     */
    private function getAttemptResult($attempt) {
        if (!isset($attempt['sumgrades']) || !isset($attempt['grade'])) {
            return null;
        }

        $percentage = ($attempt['sumgrades'] / $attempt['grade']) * 100;

        if ($percentage >= 60) {
            return 'PASS';
        } else {
            return 'FAIL';
        }
    }

    /**
     * Format log message
     */
    private function formatLogMessage($attempt) {
        $userName = $attempt['userfullname'] ?? 'User';
        $quizName = $attempt['quizname'] ?? 'Quiz';
        $state = $attempt['state'] ?? 'unknown';
        $score = $attempt['sumgrades'] ?? 'N/A';

        return "[QUIZ] {$userName} {$state} '{$quizName}' - SCORE: {$score}";
    }
}
