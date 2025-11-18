<?php
/**
 * Moodle Service
 * Handles integration with Moodle 3.7 Web Services
 */

require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../utils/Logger.php';

class MoodleService {
    private $moodleUrl;
    private $token;
    private $logger;

    public function __construct($token = null) {
        $this->moodleUrl = MOODLE_WS_URL;
        $this->token = $token ?? MOODLE_TOKEN;
        $this->logger = new Logger();

        if (empty($this->token)) {
            throw new Exception("Moodle token not configured");
        }
    }

    /**
     * Call Moodle Web Service function
     */
    private function callMoodleWS($function, $params = []) {
        $url = $this->moodleUrl . '?' . http_build_query([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => MOODLE_WS_FORMAT
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Set to true in production

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->logger->error("Moodle API Error: " . $error);
            throw new Exception("Failed to connect to Moodle: " . $error);
        }

        if ($httpCode !== 200) {
            $this->logger->error("Moodle HTTP Error: " . $httpCode);
            throw new Exception("Moodle returned HTTP " . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            $this->logger->error("Moodle Exception: " . $data['message']);
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get site information
     */
    public function getSiteInfo() {
        try {
            return $this->callMoodleWS('core_webservice_get_site_info');
        } catch (Exception $e) {
            $this->logger->error("Failed to get site info: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Validate token and get user info
     */
    public function validateToken() {
        $siteInfo = $this->getSiteInfo();
        return $siteInfo !== null;
    }

    /**
     * Get user by ID
     */
    public function getUserById($userId) {
        try {
            $result = $this->callMoodleWS('core_user_get_users_by_field', [
                'field' => 'id',
                'values' => [$userId]
            ]);

            return isset($result[0]) ? $result[0] : null;
        } catch (Exception $e) {
            $this->logger->error("Failed to get user: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get quiz by course ID
     */
    public function getQuizzesByCourse($courseId) {
        try {
            return $this->callMoodleWS('mod_quiz_get_quizzes_by_courses', [
                'courseids' => [$courseId]
            ]);
        } catch (Exception $e) {
            $this->logger->error("Failed to get quizzes: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get quiz attempt data
     */
    public function getAttemptData($attemptId) {
        try {
            return $this->callMoodleWS('mod_quiz_get_attempt_data', [
                'attemptid' => $attemptId
            ]);
        } catch (Exception $e) {
            $this->logger->error("Failed to get attempt data: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get question by ID (custom implementation)
     */
    public function getQuestion($questionId) {
        // Note: Moodle core doesn't have a direct function to get question by ID
        // This would need to be implemented as a custom web service or
        // retrieved through quiz/attempt context

        try {
            // Custom implementation - requires custom Moodle web service
            return $this->callMoodleWS('local_integration_arms_get_question', [
                'questionid' => $questionId
            ]);
        } catch (Exception $e) {
            $this->logger->warning("Custom question fetch failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Submit quiz attempt (save answer)
     */
    public function saveAttempt($attemptId, $questionId, $answer) {
        try {
            $result = $this->callMoodleWS('mod_quiz_save_attempt', [
                'attemptid' => $attemptId,
                'data' => [
                    [
                        'name' => "q{$questionId}:answer",
                        'value' => $answer
                    ]
                ]
            ]);

            return $result;
        } catch (Exception $e) {
            $this->logger->error("Failed to save attempt: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Process quiz attempt (submit for grading)
     */
    public function processAttempt($attemptId) {
        try {
            return $this->callMoodleWS('mod_quiz_process_attempt', [
                'attemptid' => $attemptId,
                'finishattempt' => true
            ]);
        } catch (Exception $e) {
            $this->logger->error("Failed to process attempt: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get user's quiz attempts
     */
    public function getUserAttempts($quizId, $userId) {
        try {
            return $this->callMoodleWS('mod_quiz_get_user_attempts', [
                'quizid' => $quizId,
                'userid' => $userId
            ]);
        } catch (Exception $e) {
            $this->logger->error("Failed to get user attempts: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user's best grade for quiz
     */
    public function getUserBestGrade($quizId, $userId) {
        try {
            $result = $this->callMoodleWS('mod_quiz_get_user_best_grade', [
                'quizid' => $quizId,
                'userid' => $userId
            ]);

            return $result;
        } catch (Exception $e) {
            $this->logger->error("Failed to get best grade: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Grade question (for Integration Arms custom grading)
     */
    public function gradeQuestion($attemptId, $questionId, $grade, $feedback = '') {
        try {
            // Custom grading function - requires custom Moodle plugin
            return $this->callMoodleWS('local_integration_arms_grade_question', [
                'attemptid' => $attemptId,
                'questionid' => $questionId,
                'grade' => $grade,
                'feedback' => $feedback
            ]);
        } catch (Exception $e) {
            $this->logger->error("Failed to grade question: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Log activity in Moodle
     */
    public function logActivity($userId, $action, $data = []) {
        try {
            // Custom logging function
            return $this->callMoodleWS('local_integration_arms_log_activity', [
                'userid' => $userId,
                'action' => $action,
                'data' => json_encode($data),
                'timestamp' => time()
            ]);
        } catch (Exception $e) {
            $this->logger->warning("Failed to log activity: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Sync progress to Moodle gradebook
     */
    public function syncProgressToGradebook($userId, $quizId, $grade) {
        try {
            // Update grade in Moodle
            return $this->callMoodleWS('core_grades_update_grades', [
                'source' => 'mod/quiz',
                'courseid' => 0, // Will be determined by quiz
                'component' => 'mod_quiz',
                'activityid' => $quizId,
                'itemnumber' => 0,
                'grades' => [
                    [
                        'studentid' => $userId,
                        'grade' => $grade
                    ]
                ]
            ]);
        } catch (Exception $e) {
            $this->logger->error("Failed to sync grade: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check user capabilities
     */
    public function hasCapability($userId, $capability, $contextId) {
        try {
            $result = $this->callMoodleWS('core_role_check_capability', [
                'userid' => $userId,
                'capability' => $capability,
                'contextid' => $contextId
            ]);

            return isset($result['cancapability']) ? $result['cancapability'] : false;
        } catch (Exception $e) {
            $this->logger->error("Failed to check capability: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate Moodle login URL with auto-login token
     */
    public function generateLoginUrl($redirectUrl = '') {
        $params = [
            'token' => $this->token
        ];

        if ($redirectUrl) {
            $params['redirect'] = $redirectUrl;
        }

        return MOODLE_URL . '/login/token.php?' . http_build_query($params);
    }

    /**
     * Create Moodle session from token
     */
    public function createSession($token = null) {
        $tokenToUse = $token ?? $this->token;

        try {
            $siteInfo = $this->getSiteInfo();

            if ($siteInfo && isset($siteInfo['userid'])) {
                return [
                    'success' => true,
                    'user_id' => $siteInfo['userid'],
                    'username' => $siteInfo['username'] ?? '',
                    'fullname' => $siteInfo['fullname'] ?? '',
                    'token' => $tokenToUse
                ];
            }

            return ['success' => false, 'error' => 'Invalid token'];

        } catch (Exception $e) {
            $this->logger->error("Session creation failed: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
