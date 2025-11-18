<?php
/**
 * Moodle Web Services Connector
 *
 * Connects to Moodle 3.7 via REST API to retrieve quiz and attempt data
 *
 * @package WeakLinkDetector
 */

class MoodleConnector {
    private $moodleUrl;
    private $token;
    private $service;

    /**
     * Constructor
     */
    public function __construct() {
        $this->moodleUrl = rtrim(MOODLE_URL, '/');
        $this->token = MOODLE_TOKEN;
        $this->service = MOODLE_SERVICE;

        if (empty($this->token)) {
            throw new Exception("Moodle token not configured. Please set MOODLE_TOKEN in config.php");
        }
    }

    /**
     * Make API call to Moodle web service
     *
     * @param string $function Web service function name
     * @param array $params Parameters for the function
     * @return mixed Response data
     */
    private function call($function, $params = []) {
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
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL error: " . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception("HTTP error: " . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get quizzes from specific courses
     *
     * @param array $courseIds Course IDs (empty array = all courses)
     * @return array Quiz data
     */
    public function getQuizzes($courseIds = []) {
        $params = [];
        if (!empty($courseIds)) {
            $params['courseids'] = $courseIds;
        }

        return $this->call(MOODLE_WS_GET_QUIZZES, $params);
    }

    /**
     * Get quiz attempts by user
     *
     * @param int $quizId Quiz ID
     * @param int $userId User ID (0 = all users)
     * @return array Attempt data
     */
    public function getQuizAttempts($quizId, $userId = 0) {
        $params = [
            'quizid' => $quizId
        ];

        if ($userId > 0) {
            $params['userid'] = $userId;
        }

        return $this->call(MOODLE_WS_GET_QUIZ_ATTEMPTS, $params);
    }

    /**
     * Get detailed attempt data including answers
     *
     * @param int $attemptId Attempt ID
     * @return array Detailed attempt data with questions and answers
     */
    public function getAttemptData($attemptId) {
        $params = [
            'attemptid' => $attemptId,
            'page' => -1  // Get all pages
        ];

        return $this->call(MOODLE_WS_GET_ATTEMPT_DATA, $params);
    }

    /**
     * Sync quiz data from Moodle to local database
     *
     * @param array $courseIds Course IDs to sync
     * @return array Sync statistics
     */
    public function syncQuizData($courseIds = []) {
        $db = Database::getInstance();
        $stats = [
            'quizzes_processed' => 0,
            'attempts_processed' => 0,
            'questions_processed' => 0,
            'errors' => []
        ];

        try {
            // Start sync log
            $syncLogId = $db->execute(
                "INSERT INTO moodle_sync_log (sync_type, moodle_course_id, status)
                 VALUES (?, ?, ?)",
                ['quiz', implode(',', $courseIds), 'running']
            );

            // Get quizzes
            $quizzes = $this->getQuizzes($courseIds);

            if (isset($quizzes['quizzes'])) {
                foreach ($quizzes['quizzes'] as $quiz) {
                    $stats['quizzes_processed']++;

                    // Get attempts for this quiz
                    try {
                        $attempts = $this->getQuizAttempts($quiz['id']);

                        if (isset($attempts['attempts'])) {
                            foreach ($attempts['attempts'] as $attempt) {
                                $this->processAttempt($attempt);
                                $stats['attempts_processed']++;
                            }
                        }
                    } catch (Exception $e) {
                        $stats['errors'][] = "Quiz {$quiz['id']}: " . $e->getMessage();
                    }
                }
            }

            // Update sync log
            $db->execute(
                "UPDATE moodle_sync_log
                 SET status = ?, records_processed = ?, records_success = ?,
                     records_failed = ?, completed_at = NOW()
                 WHERE id = ?",
                [
                    'completed',
                    $stats['quizzes_processed'],
                    $stats['attempts_processed'],
                    count($stats['errors']),
                    $syncLogId
                ]
            );

        } catch (Exception $e) {
            $stats['errors'][] = $e->getMessage();

            if (isset($syncLogId)) {
                $db->execute(
                    "UPDATE moodle_sync_log
                     SET status = ?, error_log = ?, completed_at = NOW()
                     WHERE id = ?",
                    ['failed', json_encode($stats['errors']), $syncLogId]
                );
            }
        }

        return $stats;
    }

    /**
     * Process a single attempt and extract question/answer data
     *
     * @param array $attempt Attempt data
     * @return void
     */
    private function processAttempt($attempt) {
        $db = Database::getInstance();

        try {
            // Get detailed attempt data
            $attemptData = $this->getAttemptData($attempt['id']);

            if (!isset($attemptData['questions'])) {
                return;
            }

            foreach ($attemptData['questions'] as $question) {
                $isCorrect = $this->isQuestionCorrect($question);

                // Update quiz analysis
                $this->updateQuizAnalysis(
                    $attempt['quiz'],
                    $question['slot'],
                    $isCorrect,
                    $question['maxmark'] ?? 0
                );
            }

        } catch (Exception $e) {
            error_log("Failed to process attempt {$attempt['id']}: " . $e->getMessage());
        }
    }

    /**
     * Check if a question was answered correctly
     *
     * @param array $question Question data
     * @return bool
     */
    private function isQuestionCorrect($question) {
        if (!isset($question['state'])) {
            return false;
        }

        // Moodle question states
        $correctStates = ['gradedright', 'mangrright'];
        return in_array($question['state'], $correctStates);
    }

    /**
     * Update quiz analysis statistics
     *
     * @param int $quizId Quiz ID
     * @param int $questionId Question ID
     * @param bool $isCorrect Whether answer was correct
     * @param float $maxMark Maximum mark for question
     * @return void
     */
    private function updateQuizAnalysis($quizId, $questionId, $isCorrect, $maxMark) {
        $db = Database::getInstance();

        // Check if record exists
        $existing = $db->queryOne(
            "SELECT id, total_attempts, correct_attempts, incorrect_attempts
             FROM quiz_analysis
             WHERE moodle_quiz_id = ? AND moodle_question_id = ?",
            [$quizId, $questionId]
        );

        if ($existing) {
            // Update existing record
            $totalAttempts = $existing['total_attempts'] + 1;
            $correctAttempts = $existing['correct_attempts'] + ($isCorrect ? 1 : 0);
            $incorrectAttempts = $existing['incorrect_attempts'] + ($isCorrect ? 0 : 1);
            $accuracyRate = ($totalAttempts > 0) ? ($correctAttempts / $totalAttempts * 100) : 0;

            $db->execute(
                "UPDATE quiz_analysis
                 SET total_attempts = ?, correct_attempts = ?,
                     incorrect_attempts = ?, accuracy_rate = ?,
                     difficulty_score = ?, analyzed_at = NOW()
                 WHERE id = ?",
                [
                    $totalAttempts,
                    $correctAttempts,
                    $incorrectAttempts,
                    $accuracyRate,
                    1 - ($accuracyRate / 100),  // Difficulty = 1 - accuracy
                    $existing['id']
                ]
            );
        } else {
            // Insert new record
            $db->execute(
                "INSERT INTO quiz_analysis
                 (moodle_quiz_id, moodle_question_id, total_attempts,
                  correct_attempts, incorrect_attempts, accuracy_rate, difficulty_score)
                 VALUES (?, ?, 1, ?, ?, ?, ?)",
                [
                    $quizId,
                    $questionId,
                    $isCorrect ? 1 : 0,
                    $isCorrect ? 0 : 1,
                    $isCorrect ? 100 : 0,
                    $isCorrect ? 0 : 1
                ]
            );
        }
    }

    /**
     * Test Moodle connection
     *
     * @return bool
     */
    public function testConnection() {
        try {
            $this->call('core_webservice_get_site_info');
            return true;
        } catch (Exception $e) {
            error_log("Moodle connection test failed: " . $e->getMessage());
            return false;
        }
    }
}
