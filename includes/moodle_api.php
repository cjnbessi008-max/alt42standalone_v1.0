<?php
/**
 * Moodle LMS Integration API
 * Compatible with Moodle 3.7
 */

require_once __DIR__ . '/../config.php';

class MoodleAPI {
    private $moodleUrl;
    private $token;

    public function __construct() {
        $this->moodleUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Make API call to Moodle web service
     */
    private function callWebService($functionName, $params = []) {
        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $functionName;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            return ['error' => 'HTTP Error: ' . $httpCode];
        }

        return json_decode($response, true);
    }

    /**
     * Get course contents from Moodle
     */
    public function getCourseContents($courseId) {
        return $this->callWebService('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get quiz questions
     */
    public function getQuizQuestions($quizId) {
        return $this->callWebService('mod_quiz_get_quiz_feedback_for_grade', [
            'quizid' => $quizId
        ]);
    }

    /**
     * Get user info
     */
    public function getUserInfo($userId) {
        return $this->callWebService('core_user_get_users_by_field', [
            'field' => 'id',
            'values[0]' => $userId
        ]);
    }

    /**
     * Submit grade to Moodle
     */
    public function submitGrade($userId, $itemId, $grade) {
        return $this->callWebService('core_grades_update_grades', [
            'source' => 'mod/dot_product_heat',
            'courseid' => $itemId,
            'component' => 'mod_dot_product_heat',
            'activityid' => $itemId,
            'itemnumber' => 0,
            'grades' => [
                [
                    'studentid' => $userId,
                    'grade' => $grade
                ]
            ]
        ]);
    }

    /**
     * Mock function to get problem data
     * In production, this would fetch from actual Moodle quiz module
     */
    public function getProblemData($problemId) {
        // Mock data for demonstration
        return [
            'id' => $problemId,
            'title' => 'Vector Dot Product Problem',
            'description' => 'Calculate the dot product and visualize the result',
            'vector1' => [3, 4],
            'vector2' => [1, 2],
            'correct_answer' => 11, // 3*1 + 4*2 = 11
            'type' => 'dot_product',
            'difficulty' => 'medium'
        ];
    }
}
