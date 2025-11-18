<?php
/**
 * Moodle API Connector
 * Connects to Moodle 3.7 Web Services
 */

class MoodleConnector {
    private $moodle_url;
    private $token;
    private $service;

    public function __construct() {
        $this->moodle_url = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
        $this->service = MOODLE_SERVICE;
    }

    /**
     * Call Moodle Web Service function
     */
    private function callMoodleService($function, $params = array()) {
        $url = $this->moodle_url . '/webservice/rest/server.php';

        $request_params = array(
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => 'json'
        );

        // Merge additional parameters
        $request_params = array_merge($request_params, $params);

        // Initialize cURL
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($request_params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200) {
            throw new Exception("Moodle API Error: HTTP {$http_code}");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle Exception: " . $data['message']);
        }

        return $data;
    }

    /**
     * Get questions from Moodle question bank
     */
    public function getQuestions($categoryId = null) {
        try {
            $params = array();
            if ($categoryId !== null) {
                $params['categoryid'] = $categoryId;
            }

            // Note: Moodle 3.7 may not have direct question bank API
            // This is a placeholder for custom web service function
            // You may need to create a custom Moodle plugin for this

            return $this->callMoodleService('local_setminimap_get_questions', $params);
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }

    /**
     * Get question by ID
     */
    public function getQuestion($questionId) {
        try {
            $params = array('questionid' => $questionId);
            return $this->callMoodleService('local_setminimap_get_question', $params);
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }

    /**
     * Get quiz questions
     */
    public function getQuizQuestions($quizId) {
        try {
            $params = array('quizid' => $quizId);
            return $this->callMoodleService('mod_quiz_get_quiz_questions', $params);
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }

    /**
     * Get course modules
     */
    public function getCourseModules($courseId) {
        try {
            $params = array('courseid' => $courseId);
            return $this->callMoodleService('core_course_get_contents', $params);
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }

    /**
     * Mock data for development (when Moodle is not available)
     */
    public function getMockQuestions() {
        return array(
            array(
                'id' => 1,
                'name' => '자연수 덧셈 문제 1',
                'questiontext' => '3 + 5 = ?',
                'qtype' => 'numerical',
                'category' => '자연수',
                'difficulty' => 1
            ),
            array(
                'id' => 2,
                'name' => '정수 뺄셈 문제 1',
                'questiontext' => '-5 - 3 = ?',
                'qtype' => 'numerical',
                'category' => '정수',
                'difficulty' => 2
            ),
            array(
                'id' => 3,
                'name' => '유리수 곱셈 문제 1',
                'questiontext' => '1/2 × 2/3 = ?',
                'qtype' => 'numerical',
                'category' => '유리수',
                'difficulty' => 3
            ),
            array(
                'id' => 4,
                'name' => '짝수 판별 문제',
                'questiontext' => '다음 중 짝수인 것은?',
                'qtype' => 'multichoice',
                'category' => '짝수',
                'difficulty' => 1
            ),
            array(
                'id' => 5,
                'name' => '실수 나눗셈 문제',
                'questiontext' => '√2 ÷ 2 = ?',
                'qtype' => 'numerical',
                'category' => '실수',
                'difficulty' => 4
            )
        );
    }

    /**
     * Sync questions from Moodle to local database
     */
    public function syncQuestions($db) {
        try {
            // Use mock data for development
            $questions = $this->getMockQuestions();

            $synced = 0;
            foreach ($questions as $q) {
                $sql = "INSERT INTO problems
                        (moodle_question_id, question_text, question_type, difficulty_level, tags)
                        VALUES (:moodle_id, :text, :type, :difficulty, :tags)
                        ON DUPLICATE KEY UPDATE
                        question_text = :text,
                        question_type = :type,
                        difficulty_level = :difficulty,
                        tags = :tags";

                $params = array(
                    ':moodle_id' => $q['id'],
                    ':text' => $q['questiontext'],
                    ':type' => $q['qtype'],
                    ':difficulty' => $q['difficulty'],
                    ':tags' => $q['category']
                );

                $db->execute($sql, $params);
                $synced++;
            }

            return array(
                'success' => true,
                'synced' => $synced,
                'message' => "{$synced}개의 문제가 동기화되었습니다."
            );
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }
}
