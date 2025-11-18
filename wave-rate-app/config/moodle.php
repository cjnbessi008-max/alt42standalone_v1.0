<?php
/**
 * Moodle LMS Integration Configuration
 * Compatible with Moodle 3.7
 */

define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app');

class MoodleAPI {
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->baseUrl = MOODLE_URL . '/webservice/rest/server.php';
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Moodle Web Service API 호출
     */
    private function callAPI($function, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $url = $this->baseUrl . '?' . http_build_query($params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Moodle API Error: HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            throw new Exception("Moodle Error: " . $data['message']);
        }

        return $data;
    }

    /**
     * 퀴즈 문제 정보 가져오기
     */
    public function getQuizQuestion($questionId) {
        return $this->callAPI('core_question_get_random_question_summaries', [
            'questionid' => $questionId
        ]);
    }

    /**
     * 코스 정보 가져오기
     */
    public function getCourseContents($courseId) {
        return $this->callAPI('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * 학생 응답 제출
     */
    public function submitQuizAnswer($attemptId, $questionId, $answer) {
        return $this->callAPI('mod_quiz_save_attempt', [
            'attemptid' => $attemptId,
            'data' => [
                [
                    'name' => "q{$questionId}:sequencecheck",
                    'value' => 1
                ],
                [
                    'name' => "q{$questionId}:answer",
                    'value' => $answer
                ]
            ]
        ]);
    }

    /**
     * 학생 성적 조회
     */
    public function getStudentGrades($courseId, $studentId) {
        return $this->callAPI('gradereport_user_get_grade_items', [
            'courseid' => $courseId,
            'userid' => $studentId
        ]);
    }
}
