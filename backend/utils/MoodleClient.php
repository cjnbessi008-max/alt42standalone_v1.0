<?php
/**
 * Moodle API Client
 * Handles communication with Moodle 3.7 Web Services
 */

class MoodleClient {
    private $moodleUrl;
    private $token;
    private $service;

    public function __construct($config) {
        $this->moodleUrl = rtrim($config['moodle']['url'], '/');
        $this->token = $config['moodle']['token'];
        $this->service = $config['moodle']['service'];
    }

    /**
     * Call Moodle Web Service API
     *
     * @param string $function The Moodle function to call
     * @param array $params Function parameters
     * @return mixed API response
     */
    private function callApi($function, $params = []) {
        $url = $this->moodleUrl . '/webservice/rest/server.php';

        $postData = [
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json',
        ];

        // Merge function parameters
        $postData = array_merge($postData, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception('Moodle API request failed: ' . $error);
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('Moodle API returned HTTP ' . $httpCode);
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception('Moodle API error: ' . $data['message']);
        }

        return $data;
    }

    /**
     * Get quiz information
     *
     * @param int $quizId Quiz ID
     * @return array Quiz data
     */
    public function getQuiz($quizId) {
        return $this->callApi('mod_quiz_get_quizzes_by_courses', [
            'courseids[0]' => 0, // Will get all courses, then filter
        ]);
    }

    /**
     * Get quiz attempt for a user
     *
     * @param int $quizId Quiz ID
     * @param int $userId Moodle user ID
     * @return array Attempt data
     */
    public function getUserAttempt($quizId, $userId) {
        return $this->callApi('mod_quiz_get_user_attempts', [
            'quizid' => $quizId,
            'userid' => $userId,
        ]);
    }

    /**
     * Get quiz questions
     *
     * @param int $attemptId Attempt ID
     * @return array Questions data
     */
    public function getQuizQuestions($attemptId) {
        return $this->callApi('mod_quiz_get_attempt_data', [
            'attemptid' => $attemptId,
        ]);
    }

    /**
     * Submit quiz answer
     *
     * @param int $attemptId Attempt ID
     * @param int $questionId Question ID
     * @param string $answer Answer text
     * @return array Submit result
     */
    public function submitAnswer($attemptId, $questionId, $answer) {
        return $this->callApi('mod_quiz_process_attempt', [
            'attemptid' => $attemptId,
            'data[' . $questionId . '_answer]' => $answer,
        ]);
    }

    /**
     * Finish quiz attempt
     *
     * @param int $attemptId Attempt ID
     * @return array Finish result
     */
    public function finishAttempt($attemptId) {
        return $this->callApi('mod_quiz_process_attempt', [
            'attemptid' => $attemptId,
            'finishattempt' => 1,
        ]);
    }

    /**
     * Get user info
     *
     * @param int $userId Moodle user ID
     * @return array User data
     */
    public function getUser($userId) {
        $result = $this->callApi('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId,
        ]);

        return isset($result[0]) ? $result[0] : null;
    }

    /**
     * Get course info
     *
     * @param int $courseId Course ID
     * @return array Course data
     */
    public function getCourse($courseId) {
        $result = $this->callApi('core_course_get_courses', [
            'options[ids][0]' => $courseId,
        ]);

        return isset($result[0]) ? $result[0] : null;
    }

    /**
     * Send grade to Moodle gradebook
     *
     * @param int $userId User ID
     * @param int $itemId Grade item ID
     * @param float $grade Grade value
     * @return array Result
     */
    public function updateGrade($userId, $itemId, $grade) {
        return $this->callApi('core_grades_update_grades', [
            'source' => 'power_candle',
            'courseid' => 0, // Will be determined by item
            'component' => 'mod_quiz',
            'activityid' => $itemId,
            'itemnumber' => 0,
            'grades[0][studentid]' => $userId,
            'grades[0][grade]' => $grade,
        ]);
    }

    /**
     * Parse Moodle question to Power Candle format
     *
     * @param array $moodleQuestion Moodle question data
     * @return array|null Power Candle problem data or null if not parseable
     */
    public function parseProblemFromMoodle($moodleQuestion) {
        // Expected Moodle question format:
        // Question text: "Calculate: log_2 8 = ?"
        // or custom question field for Power Candle

        $questionText = $moodleQuestion['questiontext'] ?? '';

        // Try to parse logarithm from question text
        // Pattern: log_(\d+)\s+(\d+)
        if (preg_match('/log[_₍]?(\d+)[₎]?\s+(\d+)/', $questionText, $matches)) {
            $base = (int)$matches[1];
            $result = (int)$matches[2];

            // Calculate correct answer
            $calculator = new LogarithmCalculator();
            try {
                $correctAnswer = $calculator->calculate($base, $result);

                return [
                    'moodle_question_id' => $moodleQuestion['id'] ?? 0,
                    'moodle_quiz_id' => $moodleQuestion['quizid'] ?? null,
                    'problem_type' => 'calculate',
                    'base' => $base,
                    'result' => $result,
                    'correct_answer' => $correctAnswer,
                    'question_text' => $questionText,
                    'difficulty' => $this->estimateDifficulty($base, $correctAnswer),
                ];
            } catch (Exception $e) {
                error_log('Failed to parse Moodle question: ' . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * Estimate difficulty based on base and power
     *
     * @param int $base The base
     * @param int $power The power
     * @return int Difficulty level (1-5)
     */
    private function estimateDifficulty($base, $power) {
        // Difficulty increases with higher powers and larger bases
        $score = $power + ($base > 3 ? 1 : 0);

        if ($score <= 2) return 1; // Easy
        if ($score <= 3) return 2; // Medium-Easy
        if ($score <= 4) return 3; // Medium
        if ($score <= 5) return 4; // Medium-Hard
        return 5; // Hard
    }

    /**
     * Sync problems from Moodle quiz
     *
     * @param int $quizId Moodle quiz ID
     * @param Database $db Database instance
     * @return array Sync result
     */
    public function syncProblemsFromQuiz($quizId, $db) {
        try {
            // Get quiz data
            $quiz = $this->getQuiz($quizId);

            // Note: This is a simplified version
            // In production, you would need to get a specific attempt or create one
            // to access the questions

            $synced = 0;
            $skipped = 0;
            $errors = [];

            // For each question in the quiz
            // (Implementation depends on Moodle's quiz structure)

            return [
                'success' => true,
                'synced' => $synced,
                'skipped' => $skipped,
                'errors' => $errors,
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Test connection to Moodle
     *
     * @return bool True if connection successful
     */
    public function testConnection() {
        try {
            $result = $this->callApi('core_webservice_get_site_info');
            return isset($result['sitename']);
        } catch (Exception $e) {
            error_log('Moodle connection test failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get Moodle site info
     *
     * @return array Site information
     */
    public function getSiteInfo() {
        return $this->callApi('core_webservice_get_site_info');
    }
}
