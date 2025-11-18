<?php
/**
 * Moodle Web Services API Connector
 * Compatible with Moodle 3.7
 *
 * Requires Moodle Web Services to be enabled with a valid token
 */

require_once __DIR__ . '/../config/config.php';

class MoodleConnector {
    private $moodleUrl;
    private $token;
    private $service;
    private $restFormat = 'json';

    public function __construct() {
        $config = Config::getMoodleConfig();
        $this->moodleUrl = rtrim($config['url'], '/');
        $this->token = $config['token'];
        $this->service = $config['service'];

        if (empty($this->token)) {
            throw new Exception('Moodle Web Services token not configured');
        }
    }

    /**
     * Call Moodle Web Service function
     */
    private function call($functionName, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $requestParams = [
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => $this->restFormat
        ];

        // Merge with function parameters
        $requestParams = array_merge($requestParams, $params);

        // Build query string
        $queryString = http_build_query($requestParams);
        $url = $serverUrl . '?' . $queryString;

        // Make request
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local development
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Moodle API request failed: {$error}");
        }

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned HTTP {$httpCode}");
        }

        $result = json_decode($response, true);

        // Check for Moodle errors
        if (isset($result['exception'])) {
            throw new Exception("Moodle API error: " . $result['message']);
        }

        return $result;
    }

    /**
     * Get user by ID
     */
    public function getUserById($userId) {
        $result = $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);

        return !empty($result) ? $result[0] : null;
    }

    /**
     * Get quiz by ID
     */
    public function getQuizById($quizId) {
        $result = $this->call('mod_quiz_get_quizzes_by_courses', [
            'courseids[0]' => 0 // 0 means all courses
        ]);

        if (!empty($result['quizzes'])) {
            foreach ($result['quizzes'] as $quiz) {
                if ($quiz['id'] == $quizId) {
                    return $quiz;
                }
            }
        }

        return null;
    }

    /**
     * Get quiz attempt data
     */
    public function getQuizAttempt($attemptId) {
        $result = $this->call('mod_quiz_get_attempt_data', [
            'attemptid' => $attemptId
        ]);

        return $result;
    }

    /**
     * Get user's quiz attempts
     */
    public function getUserAttempts($quizId, $userId) {
        $result = $this->call('mod_quiz_get_user_attempts', [
            'quizid' => $quizId,
            'userid' => $userId
        ]);

        return $result['attempts'] ?? [];
    }

    /**
     * Get quiz questions
     */
    public function getQuizQuestions($quizId) {
        // First, get a user attempt to access questions
        // This is a workaround since Moodle 3.7 doesn't have direct quiz questions API
        $result = $this->call('mod_quiz_get_quiz_access_information', [
            'quizid' => $quizId
        ]);

        return $result;
    }

    /**
     * Get attempt review data (includes questions and answers)
     */
    public function getAttemptReview($attemptId) {
        $result = $this->call('mod_quiz_get_attempt_review', [
            'attemptid' => $attemptId
        ]);

        return $result;
    }

    /**
     * Get attempt summary
     */
    public function getAttemptSummary($attemptId) {
        $result = $this->call('mod_quiz_get_attempt_summary', [
            'attemptid' => $attemptId
        ]);

        return $result;
    }

    /**
     * Parse question data from attempt
     * Extracts questions, answers, and correctness
     */
    public function parseAttemptQuestions($attemptData) {
        $questions = [];

        if (!isset($attemptData['questions'])) {
            return $questions;
        }

        foreach ($attemptData['questions'] as $question) {
            $parsed = [
                'id' => $question['slot'] ?? 0,
                'moodle_question_id' => $question['questionid'] ?? 0,
                'type' => $question['type'] ?? 'unknown',
                'name' => $question['name'] ?? '',
                'text' => strip_tags($question['html'] ?? ''),
                'max_mark' => $question['maxmark'] ?? 0,
                'mark' => $question['mark'] ?? 0,
                'status' => $question['status'] ?? '',
                'is_correct' => false,
                'student_answer' => '',
                'correct_answer' => ''
            ];

            // Determine if correct
            if (isset($question['mark']) && isset($question['maxmark'])) {
                $parsed['is_correct'] = ($question['mark'] >= $question['maxmark']);
            }

            // Extract student answer (varies by question type)
            if (isset($question['state'])) {
                $parsed['student_answer'] = $this->extractAnswer($question);
            }

            $questions[] = $parsed;
        }

        return $questions;
    }

    /**
     * Extract student answer from question data
     */
    private function extractAnswer($question) {
        $answer = '';

        // Try to extract from responsefileareas or other fields
        if (isset($question['responsefileareas'])) {
            $answer = json_encode($question['responsefileareas']);
        } elseif (isset($question['html'])) {
            // Parse HTML to extract answer
            // This is a simplified version
            $answer = strip_tags($question['html']);
        }

        return $answer;
    }

    /**
     * Get course by ID
     */
    public function getCourseById($courseId) {
        $result = $this->call('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);

        return !empty($result) ? $result[0] : null;
    }

    /**
     * Get enrolled courses for user
     */
    public function getUserCourses($userId) {
        $result = $this->call('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);

        return $result ?? [];
    }

    /**
     * Test connection to Moodle
     */
    public function testConnection() {
        try {
            $result = $this->call('core_webservice_get_site_info');
            return [
                'success' => true,
                'sitename' => $result['sitename'] ?? 'Unknown',
                'version' => $result['version'] ?? 'Unknown',
                'userid' => $result['userid'] ?? 0
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get comprehensive attempt data for learning summary
     */
    public function getAttemptDataForSummary($attemptId) {
        try {
            // Get attempt details
            $attempt = $this->getQuizAttempt($attemptId);

            if (!$attempt) {
                throw new Exception("Attempt not found: {$attemptId}");
            }

            // Get review data (includes detailed question/answer info)
            $review = $this->getAttemptReview($attemptId);

            // Get user info
            $user = $this->getUserById($attempt['userid']);

            // Get quiz info
            $quiz = $this->getQuizById($attempt['quiz']);

            // Parse questions
            $questions = $this->parseAttemptQuestions($attempt);

            return [
                'attempt' => $attempt,
                'review' => $review,
                'user' => $user,
                'quiz' => $quiz,
                'questions' => $questions,
                'summary' => [
                    'total_questions' => count($questions),
                    'correct_answers' => count(array_filter($questions, function($q) {
                        return $q['is_correct'];
                    })),
                    'score' => $attempt['sumgrades'] ?? 0,
                    'max_score' => $quiz['sumgrades'] ?? 0,
                    'percentage' => $quiz['sumgrades'] > 0
                        ? round(($attempt['sumgrades'] / $quiz['sumgrades']) * 100, 2)
                        : 0
                ]
            ];

        } catch (Exception $e) {
            throw new Exception("Failed to get attempt data: " . $e->getMessage());
        }
    }
}
