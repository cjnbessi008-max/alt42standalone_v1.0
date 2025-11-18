<?php
/**
 * Moodle API Integration Class
 * Moodle 3.7 Web Services 연동
 */

require_once __DIR__ . '/../config/config.php';

class MoodleAPI {
    private $apiUrl;
    private $token;

    public function __construct() {
        $this->apiUrl = MOODLE_API_ENDPOINT;
        $this->token = MOODLE_API_TOKEN;
    }

    /**
     * Moodle API 호출
     */
    private function call($function, $params = []) {
        $params['wstoken'] = $this->token;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Moodle API call failed: HTTP $httpCode");
            return null;
        }

        return json_decode($response, true);
    }

    /**
     * 문제 정보 가져오기
     */
    public function getQuestion($questionId) {
        return $this->call('core_question_get_question_data', [
            'questionid' => $questionId
        ]);
    }

    /**
     * 코스 정보 가져오기
     */
    public function getCourse($courseId) {
        return $this->call('core_course_get_courses', [
            'options' => ['ids' => [$courseId]]
        ]);
    }

    /**
     * 사용자 정보 가져오기
     */
    public function getUser($userId) {
        return $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$userId]
        ]);
    }

    /**
     * 답안 제출
     */
    public function submitAnswer($userId, $questionId, $answer) {
        return $this->call('mod_quiz_save_attempt', [
            'attemptid' => $questionId,
            'data' => [
                ['name' => 'answer', 'value' => $answer]
            ]
        ]);
    }

    /**
     * 진행 상황 업데이트
     */
    public function updateProgress($userId, $courseId, $completionPercentage) {
        return $this->call('core_completion_update_activity_completion_status_manually', [
            'cmid' => $courseId,
            'completed' => ($completionPercentage >= 100) ? 1 : 0
        ]);
    }

    /**
     * 퀴즈 문제 목록 가져오기
     */
    public function getQuizQuestions($quizId) {
        return $this->call('mod_quiz_get_quiz_data', [
            'quizid' => $quizId
        ]);
    }

    /**
     * 학생 성적 기록
     */
    public function recordGrade($userId, $itemId, $grade) {
        return $this->call('core_grades_update_grades', [
            'source' => 'alt42_app',
            'courseid' => $itemId,
            'component' => 'mod_quiz',
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
}
