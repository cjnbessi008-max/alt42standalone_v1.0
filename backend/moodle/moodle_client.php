<?php
/**
 * Moodle Web Service Client
 * Connects to Moodle 3.7 via REST API
 */

require_once __DIR__ . '/../config/config.php';

class MoodleClient {
    private $token;
    private $endpoint;

    public function __construct() {
        $this->token = MOODLE_TOKEN;
        $this->endpoint = MOODLE_WS_ENDPOINT;
    }

    /**
     * Call Moodle Web Service function
     */
    private function call($functionName, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $functionName;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($this->endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API request failed with code: $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get quiz/assignment data for graph display
     */
    public function getQuizData($quizId) {
        return $this->call('mod_quiz_get_quiz_by_courses', [
            'courseids' => [$quizId]
        ]);
    }

    /**
     * Get student attempts/progress data
     */
    public function getStudentProgress($userId, $quizId) {
        return $this->call('mod_quiz_get_user_attempts', [
            'quizid' => $quizId,
            'userid' => $userId
        ]);
    }

    /**
     * Get quiz statistics for graph visualization
     */
    public function getQuizStatistics($quizId) {
        // Get all attempts
        $attempts = $this->call('mod_quiz_get_quiz_attempts', [
            'quizid' => $quizId
        ]);

        // Calculate statistics
        $stats = [
            'total_attempts' => count($attempts),
            'average_score' => 0,
            'completion_rate' => 0,
            'time_data' => []
        ];

        if (!empty($attempts)) {
            $totalScore = 0;
            $completed = 0;

            foreach ($attempts as $attempt) {
                if (isset($attempt['sumgrades'])) {
                    $totalScore += $attempt['sumgrades'];
                }
                if ($attempt['state'] === 'finished') {
                    $completed++;
                }

                // Collect time-series data for graph animation
                $stats['time_data'][] = [
                    'timestamp' => $attempt['timemodified'],
                    'score' => $attempt['sumgrades'] ?? 0
                ];
            }

            $stats['average_score'] = $totalScore / count($attempts);
            $stats['completion_rate'] = ($completed / count($attempts)) * 100;
        }

        return $stats;
    }

    /**
     * Get problem/question data
     */
    public function getQuestionData($questionId) {
        return $this->call('core_question_get_question_data', [
            'questionid' => $questionId
        ]);
    }
}
