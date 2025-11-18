<?php
/**
 * Moodle LMS API Integration
 * Connects to Moodle 3.7 Web Services to fetch quiz data
 */

require_once 'config.php';

class MoodleAPI {
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->baseUrl = MOODLE_URL . '/webservice/rest/server.php';
        $this->token = MOODLE_TOKEN;

        if (empty($this->token)) {
            throw new Exception('Moodle web service token not configured');
        }
    }

    /**
     * Call Moodle web service function
     */
    private function callFunction($functionName, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $functionName;
        $params['moodlewsrestformat'] = 'json';

        $url = $this->baseUrl . '?' . http_build_query($params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API request failed: $error");
        }

        curl_close($ch);

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get quiz questions by quiz ID
     */
    public function getQuizQuestions($quizId) {
        try {
            // Get quiz structure
            $quiz = $this->callFunction('mod_quiz_get_quizzes_by_courses', [
                'courseids[0]' => 0 // 0 for all courses user has access to
            ]);

            // Find the specific quiz
            $targetQuiz = null;
            foreach ($quiz['quizzes'] as $q) {
                if ($q['id'] == $quizId) {
                    $targetQuiz = $q;
                    break;
                }
            }

            if (!$targetQuiz) {
                throw new Exception("Quiz not found: $quizId");
            }

            // Get quiz questions
            $questions = $this->callFunction('mod_quiz_get_attempt_data', [
                'attemptid' => 0,
                'page' => 0
            ]);

            return $questions;
        } catch (Exception $e) {
            error_log("Error fetching quiz questions: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user attempts for a quiz
     */
    public function getUserAttempts($quizId, $userId = null) {
        try {
            $params = ['quizid' => $quizId];
            if ($userId) {
                $params['userid'] = $userId;
            }

            $attempts = $this->callFunction('mod_quiz_get_user_attempts', $params);
            return $attempts['attempts'] ?? [];
        } catch (Exception $e) {
            error_log("Error fetching user attempts: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get quiz list for a course
     */
    public function getCourseQuizzes($courseId = 0) {
        try {
            $params = [];
            if ($courseId > 0) {
                $params['courseids[0]'] = $courseId;
            }

            $result = $this->callFunction('mod_quiz_get_quizzes_by_courses', $params);
            return $result['quizzes'] ?? [];
        } catch (Exception $e) {
            error_log("Error fetching course quizzes: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get attempt details with answers
     */
    public function getAttemptDetails($attemptId) {
        try {
            $attempt = $this->callFunction('mod_quiz_get_attempt_review', [
                'attemptid' => $attemptId
            ]);
            return $attempt;
        } catch (Exception $e) {
            error_log("Error fetching attempt details: " . $e->getMessage());
            return null;
        }
    }
}

/**
 * Sync quiz questions from Moodle to local database
 */
function syncQuizQuestions($quizId) {
    $moodle = new MoodleAPI();
    $pdo = getDBConnection();

    try {
        $pdo->beginTransaction();

        // Log sync start
        $stmt = $pdo->prepare("INSERT INTO sync_log (sync_type, status) VALUES ('questions', 'started')");
        $stmt->execute();
        $syncLogId = $pdo->lastInsertId();

        $questions = $moodle->getQuizQuestions($quizId);
        $count = 0;

        if ($questions && isset($questions['questions'])) {
            foreach ($questions['questions'] as $question) {
                $stmt = $pdo->prepare("
                    INSERT INTO quiz_questions
                    (moodle_question_id, quiz_id, question_text, question_type, difficulty_level, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    question_text = VALUES(question_text),
                    question_type = VALUES(question_type),
                    updated_at = CURRENT_TIMESTAMP
                ");

                $stmt->execute([
                    $question['id'],
                    $quizId,
                    $question['text'] ?? '',
                    $question['type'] ?? 'unknown',
                    'medium', // default difficulty
                    $question['category'] ?? null
                ]);
                $count++;
            }
        }

        // Update sync log
        $stmt = $pdo->prepare("
            UPDATE sync_log
            SET status = 'completed', records_processed = ?, completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$count, $syncLogId]);

        $pdo->commit();

        return ['success' => true, 'records' => $count];
    } catch (Exception $e) {
        $pdo->rollBack();

        // Log error
        $stmt = $pdo->prepare("
            UPDATE sync_log
            SET status = 'failed', error_message = ?
            WHERE id = ?
        ");
        $stmt->execute([$e->getMessage(), $syncLogId]);

        return ['success' => false, 'error' => $e->getMessage()];
    }
}
