<?php
/**
 * Moodle LMS Integration Configuration
 * Compatible with Moodle 3.7
 */

define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'derivative_focus_service');

// Moodle API endpoints
define('MOODLE_API_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');

// Moodle web service functions we'll use
define('MOODLE_FUNCTIONS', [
    'GET_QUESTIONS' => 'mod_quiz_get_quiz_questions',
    'GET_QUESTION_DATA' => 'core_question_get_question_data',
    'GET_USER_ATTEMPTS' => 'mod_quiz_get_user_attempts',
    'GET_COURSE_CONTENTS' => 'core_course_get_contents'
]);

class MoodleAPI {
    private $token;
    private $endpoint;

    public function __construct($token = null) {
        $this->token = $token ?: MOODLE_TOKEN;
        $this->endpoint = MOODLE_API_ENDPOINT;
    }

    /**
     * Make API call to Moodle
     */
    public function call($function, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->endpoint);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log('Moodle API error: ' . $error);
            return null;
        }

        return json_decode($response, true);
    }

    /**
     * Get quiz questions from Moodle
     */
    public function getQuizQuestions($quizId) {
        return $this->call(MOODLE_FUNCTIONS['GET_QUESTIONS'], [
            'quizid' => $quizId
        ]);
    }

    /**
     * Get detailed question data
     */
    public function getQuestionData($questionId) {
        return $this->call(MOODLE_FUNCTIONS['GET_QUESTION_DATA'], [
            'questionid' => $questionId
        ]);
    }
}
