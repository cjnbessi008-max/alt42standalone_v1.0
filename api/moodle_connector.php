<?php
/**
 * Moodle LMS API Connector
 * Compatible with Moodle 3.7 Web Services
 */

require_once __DIR__ . '/../config/config.php';

class MoodleConnector {
    private $baseUrl;
    private $token;
    private $format = 'json';

    public function __construct($baseUrl = MOODLE_URL, $token = MOODLE_WS_TOKEN) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->token = $token;
    }

    /**
     * Make a REST call to Moodle Web Service
     */
    private function call($function, $params = []) {
        if (empty($this->token)) {
            return [
                'success' => false,
                'error' => 'Moodle Web Service token not configured'
            ];
        }

        $serverUrl = $this->baseUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $function,
            'moodlewsrestformat' => $this->format
        ], $params);

        $ch = curl_init($serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, API_TIMEOUT);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("Moodle API Error: " . $error);
            return [
                'success' => false,
                'error' => 'Connection to Moodle failed: ' . $error
            ];
        }

        if ($httpCode !== 200) {
            return [
                'success' => false,
                'error' => "HTTP Error: {$httpCode}"
            ];
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            return [
                'success' => false,
                'error' => $data['message'] ?? 'Unknown Moodle error',
                'exception' => $data['exception']
            ];
        }

        return [
            'success' => true,
            'data' => $data
        ];
    }

    /**
     * Get course contents (problems/modules)
     */
    public function getCourseContents($courseId) {
        return $this->call('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * Get quiz questions for a specific quiz
     */
    public function getQuizQuestions($quizId) {
        return $this->call('mod_quiz_get_quiz_access_information', [
            'quizid' => $quizId
        ]);
    }

    /**
     * Get user's course enrollment
     */
    public function getUserCourses($userId) {
        return $this->call('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);
    }

    /**
     * Get course grades for a user
     */
    public function getUserGrades($courseId, $userId) {
        return $this->call('core_grades_get_grades', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }

    /**
     * Mock data for development when Moodle is not available
     */
    public function getMockProblems($courseId = 101) {
        return [
            'success' => true,
            'data' => [
                [
                    'id' => 1001,
                    'name' => '분수의 기본 개념',
                    'summary' => '분수란 무엇인가? 분자와 분모의 이해',
                    'type' => 'concept',
                    'difficulty' => 1,
                    'category' => 'mathematics'
                ],
                [
                    'id' => 1002,
                    'name' => '분수의 시각화',
                    'summary' => '피자와 케이크로 분수 이해하기',
                    'type' => 'exercise',
                    'difficulty' => 1,
                    'category' => 'mathematics'
                ],
                [
                    'id' => 1003,
                    'name' => '분수의 덧셈',
                    'summary' => '같은 분모를 가진 분수 더하기',
                    'type' => 'exercise',
                    'difficulty' => 2,
                    'category' => 'mathematics'
                ],
                [
                    'id' => 1004,
                    'name' => '분수의 뺄셈',
                    'summary' => '같은 분모를 가진 분수 빼기',
                    'type' => 'exercise',
                    'difficulty' => 2,
                    'category' => 'mathematics'
                ],
                [
                    'id' => 1005,
                    'name' => '분수의 곱셈',
                    'summary' => '분수 곱하기 분수',
                    'type' => 'exercise',
                    'difficulty' => 3,
                    'category' => 'mathematics'
                ],
                [
                    'id' => 1006,
                    'name' => '분수의 나눗셈',
                    'summary' => '분수 나누기 분수',
                    'type' => 'exercise',
                    'difficulty' => 3,
                    'category' => 'mathematics'
                ],
                [
                    'id' => 1007,
                    'name' => '통분하기',
                    'summary' => '서로 다른 분모를 같게 만들기',
                    'type' => 'concept',
                    'difficulty' => 2,
                    'category' => 'mathematics'
                ],
                [
                    'id' => 1008,
                    'name' => '약분하기',
                    'summary' => '분자와 분모를 간단하게 만들기',
                    'type' => 'concept',
                    'difficulty' => 2,
                    'category' => 'mathematics'
                ]
            ]
        ];
    }
}
?>
