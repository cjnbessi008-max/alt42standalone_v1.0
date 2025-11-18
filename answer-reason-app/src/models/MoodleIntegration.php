<?php
/**
 * Moodle Integration Class
 * Handles communication with Moodle Web Services API
 */

require_once __DIR__ . '/../../config/Database.php';

class MoodleIntegration {
    private $moodleUrl;
    private $token;
    private $service;
    private $db;
    private $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../../config/config.php';
        $this->db = Database::getInstance();
        $this->loadMoodleConfig();
    }

    /**
     * Load Moodle configuration from database
     */
    private function loadMoodleConfig() {
        $configs = $this->db->select('moodle_config');

        foreach ($configs as $config) {
            switch ($config['config_key']) {
                case 'moodle_url':
                    $this->moodleUrl = rtrim($config['config_value'], '/');
                    break;
                case 'moodle_token':
                    $this->token = $config['config_value'];
                    break;
                case 'moodle_service':
                    $this->service = $config['config_value'];
                    break;
            }
        }
    }

    /**
     * Make API call to Moodle
     */
    private function callMoodleAPI($function, $params = []) {
        if (empty($this->moodleUrl) || empty($this->token)) {
            throw new Exception('Moodle configuration not set. Please configure Moodle URL and token.');
        }

        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception('Moodle API request failed: ' . $error);
        }

        curl_close($ch);

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception('Moodle API error: ' . $data['message']);
        }

        return $data;
    }

    /**
     * Get user info from Moodle
     */
    public function getUserInfo($username) {
        try {
            $result = $this->callMoodleAPI('core_user_get_users', [
                'criteria[0][key]' => 'username',
                'criteria[0][value]' => $username
            ]);

            if (!empty($result['users'])) {
                return $result['users'][0];
            }

            return null;
        } catch (Exception $e) {
            $this->logError('getUserInfo', $e->getMessage());
            return null;
        }
    }

    /**
     * Get quiz attempts for a user
     */
    public function getQuizAttempts($userId, $quizId = null) {
        try {
            $params = ['userid' => $userId];

            if ($quizId) {
                $params['quizid'] = $quizId;
            }

            $result = $this->callMoodleAPI('mod_quiz_get_user_attempts', $params);
            return $result['attempts'] ?? [];
        } catch (Exception $e) {
            $this->logError('getQuizAttempts', $e->getMessage());
            return [];
        }
    }

    /**
     * Get quiz attempt details including questions and answers
     */
    public function getAttemptDetails($attemptId) {
        try {
            $result = $this->callMoodleAPI('mod_quiz_get_attempt_review', [
                'attemptid' => $attemptId
            ]);

            return $result;
        } catch (Exception $e) {
            $this->logError('getAttemptDetails', $e->getMessage());
            return null;
        }
    }

    /**
     * Get quiz questions with correct answers and explanations
     */
    public function getQuizQuestions($quizId) {
        try {
            $result = $this->callMoodleAPI('mod_quiz_get_quiz_feedback_for_grade', [
                'quizid' => $quizId
            ]);

            return $result;
        } catch (Exception $e) {
            $this->logError('getQuizQuestions', $e->getMessage());
            return null;
        }
    }

    /**
     * Sync student from Moodle to local database
     */
    public function syncStudent($moodleUserId) {
        try {
            $moodleUser = $this->callMoodleAPI('core_user_get_users_by_field', [
                'field' => 'id',
                'values[0]' => $moodleUserId
            ]);

            if (empty($moodleUser)) {
                return null;
            }

            $user = $moodleUser[0];

            // Check if student exists
            $existing = $this->db->selectOne('students', 'moodle_user_id = ?', [$moodleUserId]);

            if ($existing) {
                // Update existing student
                $this->db->update('students', [
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'full_name' => $user['fullname']
                ], 'id = ?', [$existing['id']]);

                return $existing['id'];
            } else {
                // Insert new student
                return $this->db->insert('students', [
                    'moodle_user_id' => $moodleUserId,
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'full_name' => $user['fullname']
                ]);
            }
        } catch (Exception $e) {
            $this->logError('syncStudent', $e->getMessage());
            return null;
        }
    }

    /**
     * Sync quiz attempt from Moodle to local database
     */
    public function syncQuizAttempt($attemptId) {
        try {
            $attemptData = $this->getAttemptDetails($attemptId);

            if (!$attemptData) {
                return null;
            }

            // Sync student first
            $studentId = $this->syncStudent($attemptData['userid']);

            if (!$studentId) {
                throw new Exception('Failed to sync student');
            }

            // Process each question in the attempt
            $syncedAttempts = [];

            if (isset($attemptData['questions'])) {
                foreach ($attemptData['questions'] as $question) {
                    $attemptRecord = [
                        'student_id' => $studentId,
                        'moodle_attempt_id' => $attemptId,
                        'moodle_quiz_id' => $attemptData['quiz']['id'] ?? null,
                        'quiz_name' => $attemptData['quiz']['name'] ?? 'Unknown Quiz',
                        'question_id' => $question['slot'],
                        'question_text' => strip_tags($question['html'] ?? ''),
                        'student_answer' => $question['response'] ?? '',
                        'correct_answer' => $question['rightanswer'] ?? '',
                        'is_correct' => ($question['state'] == 'gradedright') ? 1 : 0,
                        'score' => $question['mark'] ?? 0,
                        'max_score' => $question['maxmark'] ?? 0,
                        'explanation_text' => strip_tags($question['feedback'] ?? '')
                    ];

                    // Check if attempt already exists
                    $existing = $this->db->selectOne(
                        'quiz_attempts',
                        'moodle_attempt_id = ? AND question_id = ?',
                        [$attemptId, $question['slot']]
                    );

                    if ($existing) {
                        $this->db->update(
                            'quiz_attempts',
                            $attemptRecord,
                            'id = ?',
                            [$existing['id']]
                        );
                        $syncedAttempts[] = $existing['id'];
                    } else {
                        $syncedAttempts[] = $this->db->insert('quiz_attempts', $attemptRecord);
                    }
                }
            }

            // Update last sync time
            $this->db->update(
                'moodle_config',
                ['config_value' => date('Y-m-d H:i:s')],
                'config_key = ?',
                ['last_sync']
            );

            return $syncedAttempts;
        } catch (Exception $e) {
            $this->logError('syncQuizAttempt', $e->getMessage());
            return null;
        }
    }

    /**
     * Test Moodle connection
     */
    public function testConnection() {
        try {
            $result = $this->callMoodleAPI('core_webservice_get_site_info');
            return [
                'success' => true,
                'site_name' => $result['sitename'] ?? 'Unknown',
                'moodle_version' => $result['release'] ?? 'Unknown',
                'functions' => $result['functions'] ?? []
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Log error to database
     */
    private function logError($function, $message) {
        $this->db->query(
            "INSERT INTO system_logs (log_type, message, details) VALUES (?, ?, ?)",
            ['error', "MoodleIntegration::$function failed", json_encode(['error' => $message])]
        );
    }
}
