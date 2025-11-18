<?php
/**
 * Moodle Integration API
 *
 * Handles communication with Moodle 3.7 LMS
 * Uses Moodle Web Services (REST protocol)
 */

require_once __DIR__ . '/../config/config.php';

class MoodleIntegration {
    private $moodleUrl;
    private $token;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Make REST API call to Moodle
     */
    private function callMoodleAPI($functionName, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $functionName;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Moodle API call failed: $error");
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API returned HTTP code: $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle API error: " . $data['message']);
        }

        return $data;
    }

    /**
     * Sync problems from Moodle course
     */
    public function syncProblems($courseId) {
        try {
            // Get quiz activities from course
            $activities = $this->callMoodleAPI('mod_quiz_get_quizzes_by_courses', [
                'courseids[0]' => $courseId
            ]);

            $db = Database::getInstance()->getConnection();
            $syncedCount = 0;

            foreach ($activities['quizzes'] as $quiz) {
                // Get quiz questions
                $quizData = $this->callMoodleAPI('mod_quiz_get_quiz_data', [
                    'quizid' => $quiz['id']
                ]);

                // Parse and insert problems
                foreach ($quizData['questions'] as $question) {
                    $problemData = $this->parseQuestionToProblem($question, $courseId);

                    if ($problemData) {
                        $stmt = $db->prepare("
                            INSERT INTO problems
                            (moodle_problem_id, moodle_course_id, title, description, difficulty_level,
                             number_sequence, rhythm_pattern, correct_order, time_limit, points)
                            VALUES
                            (:moodle_problem_id, :moodle_course_id, :title, :description, :difficulty_level,
                             :number_sequence, :rhythm_pattern, :correct_order, :time_limit, :points)
                            ON DUPLICATE KEY UPDATE
                            title = VALUES(title),
                            description = VALUES(description),
                            difficulty_level = VALUES(difficulty_level),
                            number_sequence = VALUES(number_sequence),
                            rhythm_pattern = VALUES(rhythm_pattern),
                            correct_order = VALUES(correct_order),
                            updated_at = CURRENT_TIMESTAMP
                        ");

                        $stmt->execute($problemData);
                        $syncedCount++;
                    }
                }
            }

            // Log sync
            $this->logSync('problems', $courseId, $syncedCount, 'success');

            return ['synced' => $syncedCount];

        } catch (Exception $e) {
            $this->logSync('problems', $courseId, 0, 'failed', $e->getMessage());
            throw $e;
        }
    }

    /**
     * Parse Moodle question to Number Beat problem format
     */
    private function parseQuestionToProblem($question, $courseId) {
        // Extract number sequence from question text or custom fields
        // This is a simplified parser - adjust based on actual Moodle question format

        if (!isset($question['questiontext'])) {
            return null;
        }

        $problemData = [
            'moodle_problem_id' => $question['id'],
            'moodle_course_id' => $courseId,
            'title' => $question['name'] ?? 'Untitled Problem',
            'description' => strip_tags($question['questiontext']),
            'difficulty_level' => $this->detectDifficulty($question),
            'number_sequence' => '',
            'rhythm_pattern' => '',
            'correct_order' => '',
            'time_limit' => DEFAULT_TIME_LIMIT,
            'points' => $question['defaultmark'] ?? 100
        ];

        // Parse custom JSON data from question if available
        if (isset($question['customdata'])) {
            $customData = json_decode($question['customdata'], true);

            if (isset($customData['number_sequence'])) {
                $problemData['number_sequence'] = $customData['number_sequence'];
            }
            if (isset($customData['rhythm_pattern'])) {
                $problemData['rhythm_pattern'] = $customData['rhythm_pattern'];
            }
            if (isset($customData['correct_order'])) {
                $problemData['correct_order'] = $customData['correct_order'];
            }
        }

        // Validate required fields
        if (empty($problemData['number_sequence']) || empty($problemData['correct_order'])) {
            return null; // Skip invalid problems
        }

        return $problemData;
    }

    /**
     * Detect difficulty level from question
     */
    private function detectDifficulty($question) {
        $mark = $question['defaultmark'] ?? 0;

        if ($mark <= 100) {
            return 'easy';
        } elseif ($mark <= 150) {
            return 'medium';
        } else {
            return 'hard';
        }
    }

    /**
     * Sync student data from Moodle
     */
    public function syncStudents($courseId) {
        try {
            $users = $this->callMoodleAPI('core_enrol_get_enrolled_users', [
                'courseid' => $courseId
            ]);

            $db = Database::getInstance()->getConnection();
            $syncedCount = 0;

            foreach ($users as $user) {
                $stmt = $db->prepare("
                    INSERT INTO students
                    (moodle_user_id, username, fullname, email)
                    VALUES
                    (:moodle_user_id, :username, :fullname, :email)
                    ON DUPLICATE KEY UPDATE
                    fullname = VALUES(fullname),
                    email = VALUES(email),
                    updated_at = CURRENT_TIMESTAMP
                ");

                $stmt->execute([
                    'moodle_user_id' => $user['id'],
                    'username' => $user['username'],
                    'fullname' => $user['fullname'],
                    'email' => $user['email']
                ]);

                $syncedCount++;
            }

            $this->logSync('students', $courseId, $syncedCount, 'success');

            return ['synced' => $syncedCount];

        } catch (Exception $e) {
            $this->logSync('students', $courseId, 0, 'failed', $e->getMessage());
            throw $e;
        }
    }

    /**
     * Send grade back to Moodle
     */
    public function sendGrade($moodleUserId, $moodleProblemId, $grade, $maxGrade = 100) {
        try {
            $result = $this->callMoodleAPI('mod_quiz_save_attempt', [
                'attemptid' => $moodleProblemId,
                'userid' => $moodleUserId,
                'grade' => $grade,
                'maxgrade' => $maxGrade
            ]);

            $this->logSync('grades', null, 1, 'success');

            return $result;

        } catch (Exception $e) {
            $this->logSync('grades', null, 0, 'failed', $e->getMessage());
            throw $e;
        }
    }

    /**
     * Log synchronization activity
     */
    private function logSync($syncType, $courseId, $recordsSynced, $status, $errorMessage = null) {
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("
            INSERT INTO moodle_sync_log
            (sync_type, moodle_course_id, records_synced, status, error_message)
            VALUES
            (:sync_type, :moodle_course_id, :records_synced, :status, :error_message)
        ");

        $stmt->execute([
            'sync_type' => $syncType,
            'moodle_course_id' => $courseId,
            'records_synced' => $recordsSynced,
            'status' => $status,
            'error_message' => $errorMessage
        ]);
    }
}
