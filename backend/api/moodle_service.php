<?php
/**
 * Moodle Integration Service
 * Handles communication with Moodle 3.7 Web Services
 */

class MoodleService {
    private $moodle_url;
    private $token;
    private $service;

    public function __construct() {
        $this->moodle_url = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
        $this->service = MOODLE_SERVICE;
    }

    /**
     * Make API call to Moodle
     */
    private function call($function, $params = []) {
        $url = $this->moodle_url . '/webservice/rest/server.php';

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
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            logMessage("Moodle API Error: $error", 'ERROR');
            throw new Exception("Moodle API request failed: $error");
        }

        if ($httpCode !== 200) {
            logMessage("Moodle API HTTP Error: $httpCode", 'ERROR');
            throw new Exception("Moodle API returned HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            logMessage("Moodle Exception: " . $data['message'], 'ERROR');
            throw new Exception("Moodle error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get user information
     */
    public function getUserInfo($user_id) {
        try {
            $result = $this->call('core_user_get_users_by_field', [
                'field' => 'id',
                'values[0]' => $user_id
            ]);

            return !empty($result) ? $result[0] : null;
        } catch (Exception $e) {
            logMessage("Failed to get user info: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Get course questions
     */
    public function getCourseQuestions($course_id) {
        try {
            // Get quiz modules in course
            $modules = $this->call('mod_quiz_get_quizzes_by_courses', [
                'courseids[0]' => $course_id
            ]);

            if (empty($modules['quizzes'])) {
                return [];
            }

            $questions = [];
            foreach ($modules['quizzes'] as $quiz) {
                $quizData = $this->getQuizQuestions($quiz['id']);
                if ($quizData) {
                    $questions = array_merge($questions, $quizData);
                }
            }

            return $questions;
        } catch (Exception $e) {
            logMessage("Failed to get course questions: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get quiz questions
     */
    public function getQuizQuestions($quiz_id) {
        try {
            $result = $this->call('mod_quiz_get_quiz_questions', [
                'quizid' => $quiz_id
            ]);

            return $result;
        } catch (Exception $e) {
            logMessage("Failed to get quiz questions: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Get question details
     */
    public function getQuestionById($question_id) {
        try {
            $result = $this->call('core_question_get_questions', [
                'questionids[0]' => $question_id
            ]);

            return !empty($result['questions']) ? $result['questions'][0] : null;
        } catch (Exception $e) {
            logMessage("Failed to get question: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Submit grade to Moodle
     */
    public function submitGrade($user_id, $quiz_id, $grade, $attempt_id = null) {
        try {
            $params = [
                'quizid' => $quiz_id,
                'userid' => $user_id,
                'grade' => $grade
            ];

            if ($attempt_id) {
                $params['attemptid'] = $attempt_id;
            }

            $result = $this->call('mod_quiz_save_attempt', $params);

            return $result;
        } catch (Exception $e) {
            logMessage("Failed to submit grade: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Get enrolled users in course
     */
    public function getCourseUsers($course_id) {
        try {
            $result = $this->call('core_enrol_get_enrolled_users', [
                'courseid' => $course_id
            ]);

            return $result;
        } catch (Exception $e) {
            logMessage("Failed to get course users: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Sync question from Moodle to local database
     */
    public function syncQuestion($moodle_question_id, $db) {
        try {
            $questionData = $this->getQuestionById($moodle_question_id);

            if (!$questionData) {
                return false;
            }

            require_once MODELS_PATH . '/Question.php';
            $questionModel = new Question($db);

            // Check if question already exists
            $existing = $questionModel->getByMoodleId($moodle_question_id);

            $data = [
                'moodle_question_id' => $moodle_question_id,
                'title' => $questionData['name'] ?? 'Untitled Question',
                'description' => strip_tags($questionData['questiontext'] ?? ''),
                'question_type' => $this->detectQuestionType($questionData),
                'difficulty_level' => 3 // Default medium difficulty
            ];

            if ($existing) {
                return $questionModel->update($existing['id'], $data);
            } else {
                return $questionModel->create($data);
            }
        } catch (Exception $e) {
            logMessage("Failed to sync question: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Detect logical operator type from question content
     */
    private function detectQuestionType($questionData) {
        $text = strtolower($questionData['questiontext'] ?? '');

        $hasAnd = (strpos($text, '그리고') !== false || strpos($text, 'and') !== false);
        $hasOr = (strpos($text, '또는') !== false || strpos($text, 'or') !== false);
        $hasIfThen = (strpos($text, '이면') !== false || strpos($text, 'if') !== false);

        $count = ($hasAnd ? 1 : 0) + ($hasOr ? 1 : 0) + ($hasIfThen ? 1 : 0);

        if ($count > 1) {
            return 'mixed';
        } elseif ($hasAnd) {
            return 'and';
        } elseif ($hasOr) {
            return 'or';
        } elseif ($hasIfThen) {
            return 'if_then';
        }

        return 'mixed';
    }

    /**
     * Log sync activity
     */
    private function logSync($db, $type, $moodle_id, $action, $status, $data = null, $error = null) {
        try {
            $query = "INSERT INTO moodle_sync_logs
                      (sync_type, moodle_id, action, status, request_data, response_data, error_message)
                      VALUES
                      (:sync_type, :moodle_id, :action, :status, :request_data, :response_data, :error_message)";

            $stmt = $db->prepare($query);

            $request_json = $data ? json_encode($data, JSON_UNESCAPED_UNICODE) : null;
            $response_json = $data ? json_encode($data, JSON_UNESCAPED_UNICODE) : null;

            $stmt->bindParam(':sync_type', $type);
            $stmt->bindParam(':moodle_id', $moodle_id);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':request_data', $request_json);
            $stmt->bindParam(':response_data', $response_json);
            $stmt->bindParam(':error_message', $error);

            $stmt->execute();
        } catch (Exception $e) {
            logMessage("Failed to log sync: " . $e->getMessage(), 'ERROR');
        }
    }

    /**
     * Test connection to Moodle
     */
    public function testConnection() {
        try {
            $result = $this->call('core_webservice_get_site_info');
            return [
                'success' => true,
                'site_name' => $result['sitename'] ?? 'Unknown',
                'version' => $result['version'] ?? 'Unknown',
                'user' => $result['username'] ?? 'Unknown'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
