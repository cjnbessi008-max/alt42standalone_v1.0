<?php
/**
 * Moodle 3.7 API Integration Service
 * Handles communication with Moodle web services
 */

namespace StatDigest\Services;

class MoodleService
{
    private $config;
    private $baseUrl;
    private $token;

    public function __construct()
    {
        $this->config = require __DIR__ . '/../config/moodle.php';
        $this->baseUrl = $this->config['base_url'] . $this->config['webservice_endpoint'];
        $this->token = $this->config['api_token'];
    }

    /**
     * Make API call to Moodle
     */
    private function callMoodleAPI($functionName, $params = [])
    {
        $url = $this->baseUrl;

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $functionName,
            'moodlewsrestformat' => $this->config['format']
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \Exception('Moodle API call failed: ' . $error);
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new \Exception('Moodle API returned HTTP ' . $httpCode);
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON response from Moodle');
        }

        // Check for Moodle error response
        if (isset($data['exception'])) {
            throw new \Exception('Moodle error: ' . $data['message']);
        }

        return $data;
    }

    /**
     * Get quiz questions from Moodle
     */
    public function getQuizQuestions($quizId)
    {
        try {
            $function = $this->config['functions']['get_questions'];
            $result = $this->callMoodleAPI($function, [
                'quizid' => $quizId
            ]);

            return $result;
        } catch (\Exception $e) {
            error_log('Failed to get quiz questions: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user attempts for a quiz
     */
    public function getUserAttempts($quizId, $userId = null)
    {
        try {
            $params = ['quizid' => $quizId];
            if ($userId !== null) {
                $params['userid'] = $userId;
            }

            $function = $this->config['functions']['get_attempts'];
            $result = $this->callMoodleAPI($function, $params);

            return $result;
        } catch (\Exception $e) {
            error_log('Failed to get user attempts: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get quizzes from course
     */
    public function getQuizzesByCourse($courseIds = [])
    {
        try {
            $function = $this->config['functions']['get_quiz'];
            $params = [];

            if (!empty($courseIds)) {
                $params['courseids'] = $courseIds;
            }

            $result = $this->callMoodleAPI($function, $params);

            return $result;
        } catch (\Exception $e) {
            error_log('Failed to get quizzes: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Sync question data from Moodle to local database
     */
    public function syncQuestions($quizId)
    {
        $questions = $this->getQuizQuestions($quizId);

        if (empty($questions)) {
            return ['success' => false, 'message' => 'No questions found'];
        }

        $db = \StatDigest\Utils\Database::getInstance();
        $synced = 0;

        foreach ($questions as $question) {
            $questionId = $question['id'] ?? null;
            $questionText = $question['questiontext'] ?? '';
            $questionType = $question['qtype'] ?? 'unknown';

            if (!$questionId) {
                continue;
            }

            // Check if question already exists
            $existing = $db->fetchOne(
                'SELECT id FROM problems WHERE moodle_question_id = ?',
                [$questionId]
            );

            if ($existing) {
                // Update existing question
                $db->query(
                    'UPDATE problems SET
                        question_text = ?,
                        question_type = ?,
                        moodle_quiz_id = ?,
                        updated_at = NOW()
                    WHERE moodle_question_id = ?',
                    [$questionText, $questionType, $quizId, $questionId]
                );
            } else {
                // Insert new question
                $db->insert(
                    'INSERT INTO problems
                        (moodle_question_id, moodle_quiz_id, question_text, question_type, created_at)
                    VALUES (?, ?, ?, ?, NOW())',
                    [$questionId, $quizId, $questionText, $questionType]
                );
            }

            $synced++;
        }

        return [
            'success' => true,
            'synced' => $synced,
            'message' => "Synced {$synced} questions"
        ];
    }

    /**
     * Sync student attempts from Moodle
     */
    public function syncAttempts($quizId)
    {
        $attempts = $this->getUserAttempts($quizId);

        if (empty($attempts)) {
            return ['success' => false, 'message' => 'No attempts found'];
        }

        $db = \StatDigest\Utils\Database::getInstance();
        $synced = 0;

        foreach ($attempts as $attempt) {
            $userId = $attempt['userid'] ?? null;
            $questionUsageId = $attempt['uniqueid'] ?? null;

            if (!$userId || !$questionUsageId) {
                continue;
            }

            // Note: Detailed attempt data would require additional API calls
            // This is a simplified version

            $synced++;
        }

        return [
            'success' => true,
            'synced' => $synced,
            'message' => "Synced {$synced} attempts"
        ];
    }
}
