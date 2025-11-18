<?php
/**
 * Moodle Web Services API 클라이언트
 *
 * Moodle 3.7 REST API를 통한 데이터 접근
 *
 * @package    Alt42Standalone
 * @version    1.0
 * @author     KAIST Touch Math Academy
 */

namespace Alt42Standalone;

use Exception;

class MoodleApiClient
{
    /**
     * @var string Web Services URL
     */
    private $wsUrl;

    /**
     * @var string API 토큰
     */
    private $token;

    /**
     * @var array 설정 배열
     */
    private $config;

    /**
     * @var string 응답 형식
     */
    private $format = 'json';

    /**
     * MoodleApiClient 생성자
     *
     * @param string|null $token API 토큰 (null인 경우 설정에서 로드)
     * @param string|null $wsUrl Web Services URL (null인 경우 설정에서 로드)
     */
    public function __construct($token = null, $wsUrl = null)
    {
        $this->config = require dirname(__DIR__) . '/config/moodle_config.php';
        $this->token = $token ?: $this->config['webservice']['token'];
        $this->wsUrl = $wsUrl ?: $this->config['webservice']['url'];

        if (empty($this->token)) {
            throw new Exception('Moodle Web Services 토큰이 설정되지 않았습니다.');
        }
    }

    /**
     * API 호출
     *
     * @param string $function Moodle 함수 이름
     * @param array $params 파라미터 배열
     * @return mixed 응답 데이터
     * @throws Exception API 호출 실패 시
     */
    public function call($function, $params = [])
    {
        $url = $this->wsUrl . '?wstoken=' . $this->token .
               '&wsfunction=' . $function .
               '&moodlewsrestformat=' . $this->format;

        // 파라미터를 쿼리 스트링으로 변환
        $queryParams = $this->buildQueryParams($params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $queryParams);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // 개발 환경용 (프로덕션에서는 true로 설정)
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL 오류: $error");
        }

        if ($httpCode !== 200) {
            throw new Exception("HTTP 오류: $httpCode");
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSON 파싱 오류: " . json_last_error_msg());
        }

        // Moodle 에러 체크
        if (isset($data['exception'])) {
            throw new Exception("Moodle API 오류: {$data['message']} ({$data['exception']})");
        }

        $this->log("API 호출 성공: $function", 'INFO');
        return $data;
    }

    /**
     * 파라미터를 쿼리 스트링으로 변환
     *
     * @param array $params 파라미터 배열
     * @param string $prefix 접두사
     * @return string 쿼리 스트링
     */
    private function buildQueryParams($params, $prefix = '')
    {
        $query = [];

        foreach ($params as $key => $value) {
            $paramKey = $prefix ? "{$prefix}[{$key}]" : $key;

            if (is_array($value)) {
                $query[] = $this->buildQueryParams($value, $paramKey);
            } else {
                $query[] = urlencode($paramKey) . '=' . urlencode($value);
            }
        }

        return implode('&', $query);
    }

    /**
     * 사용자 정보 조회
     *
     * @param int $userId 사용자 ID
     * @return array 사용자 정보
     */
    public function getUser($userId)
    {
        $result = $this->call('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$userId]
        ]);

        return $result[0] ?? null;
    }

    /**
     * 사용자명으로 사용자 조회
     *
     * @param string $username 사용자명
     * @return array 사용자 정보
     */
    public function getUserByUsername($username)
    {
        $result = $this->call('core_user_get_users_by_field', [
            'field' => 'username',
            'values' => [$username]
        ]);

        return $result[0] ?? null;
    }

    /**
     * 코스 목록 조회
     *
     * @return array 코스 배열
     */
    public function getCourses()
    {
        return $this->call('core_course_get_courses');
    }

    /**
     * 특정 코스 조회
     *
     * @param int $courseId 코스 ID
     * @return array 코스 정보
     */
    public function getCourse($courseId)
    {
        $result = $this->call('core_course_get_courses', [
            'options' => [
                'ids' => [$courseId]
            ]
        ]);

        return $result[0] ?? null;
    }

    /**
     * 사용자의 코스 목록 조회
     *
     * @param int $userId 사용자 ID
     * @return array 코스 배열
     */
    public function getUserCourses($userId)
    {
        return $this->call('core_enrol_get_users_courses', [
            'userid' => $userId
        ]);
    }

    /**
     * 코스 내용 조회
     *
     * @param int $courseId 코스 ID
     * @return array 코스 내용
     */
    public function getCourseContents($courseId)
    {
        return $this->call('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * 코스에 사용자 등록
     *
     * @param int $userId 사용자 ID
     * @param int $courseId 코스 ID
     * @param int $roleId 역할 ID (기본값: 5 = 학생)
     * @return array 응답 데이터
     */
    public function enrollUser($userId, $courseId, $roleId = 5)
    {
        return $this->call('enrol_manual_enrol_users', [
            'enrolments' => [
                [
                    'userid' => $userId,
                    'courseid' => $courseId,
                    'roleid' => $roleId
                ]
            ]
        ]);
    }

    /**
     * 퀴즈 정보 조회
     *
     * @param int $courseId 코스 ID
     * @return array 퀴즈 배열
     */
    public function getQuizzesByCourse($courseId)
    {
        return $this->call('mod_quiz_get_quizzes_by_courses', [
            'courseids' => [$courseId]
        ]);
    }

    /**
     * 과제 목록 조회
     *
     * @param int $courseId 코스 ID
     * @return array 과제 배열
     */
    public function getAssignmentsByCourse($courseId)
    {
        return $this->call('mod_assign_get_assignments', [
            'courseids' => [$courseId]
        ]);
    }

    /**
     * 과제 제출
     *
     * @param int $assignId 과제 ID
     * @param int $userId 사용자 ID
     * @param string $text 제출 텍스트
     * @return array 응답 데이터
     */
    public function submitAssignment($assignId, $userId, $text)
    {
        return $this->call('mod_assign_save_submission', [
            'assignmentid' => $assignId,
            'plugindata' => [
                'onlinetext_editor' => [
                    'text' => $text,
                    'format' => 1
                ]
            ]
        ]);
    }

    /**
     * 성적 조회
     *
     * @param int $courseId 코스 ID
     * @param int $userId 사용자 ID (0이면 모든 사용자)
     * @return array 성적 배열
     */
    public function getGrades($courseId, $userId = 0)
    {
        return $this->call('gradereport_user_get_grade_items', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }

    /**
     * 사용자 생성
     *
     * @param array $userData 사용자 데이터
     * @return array 생성된 사용자 정보
     */
    public function createUser($userData)
    {
        $defaultData = [
            'auth' => 'manual',
            'password' => 'TempPass123!',
            'firstname' => '',
            'lastname' => '',
            'email' => ''
        ];

        $user = array_merge($defaultData, $userData);

        return $this->call('core_user_create_users', [
            'users' => [$user]
        ]);
    }

    /**
     * 사용자 업데이트
     *
     * @param int $userId 사용자 ID
     * @param array $userData 업데이트할 데이터
     * @return array 응답 데이터
     */
    public function updateUser($userId, $userData)
    {
        $userData['id'] = $userId;

        return $this->call('core_user_update_users', [
            'users' => [$userData]
        ]);
    }

    /**
     * 코스 생성
     *
     * @param array $courseData 코스 데이터
     * @return array 생성된 코스 정보
     */
    public function createCourse($courseData)
    {
        $defaultData = [
            'fullname' => '',
            'shortname' => '',
            'categoryid' => 1,
            'visible' => 1,
            'format' => 'topics'
        ];

        $course = array_merge($defaultData, $courseData);

        return $this->call('core_course_create_courses', [
            'courses' => [$course]
        ]);
    }

    /**
     * 카테고리 조회
     *
     * @return array 카테고리 배열
     */
    public function getCategories()
    {
        return $this->call('core_course_get_categories');
    }

    /**
     * 모듈 완료 상태 조회
     *
     * @param int $courseId 코스 ID
     * @param int $userId 사용자 ID
     * @return array 완료 상태
     */
    public function getCompletionStatus($courseId, $userId)
    {
        return $this->call('core_completion_get_activities_completion_status', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }

    /**
     * 코스 완료 상태 조회
     *
     * @param int $courseId 코스 ID
     * @param int $userId 사용자 ID
     * @return array 완료 상태
     */
    public function getCourseCompletionStatus($courseId, $userId)
    {
        return $this->call('core_completion_get_course_completion_status', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }

    /**
     * 포럼 토론 조회
     *
     * @param int $forumId 포럼 ID
     * @return array 토론 배열
     */
    public function getForumDiscussions($forumId)
    {
        return $this->call('mod_forum_get_forum_discussions', [
            'forumid' => $forumId
        ]);
    }

    /**
     * 파일 업로드
     *
     * @param string $filePath 파일 경로
     * @param string $fileName 파일 이름
     * @param int $contextId 컨텍스트 ID
     * @return array 업로드된 파일 정보
     */
    public function uploadFile($filePath, $fileName, $contextId)
    {
        $uploadUrl = str_replace('/webservice/rest/server.php', '/webservice/upload.php', $this->wsUrl);
        $uploadUrl .= '?token=' . $this->token;

        $cfile = new \CURLFile($filePath, mime_content_type($filePath), $fileName);

        $postData = [
            'file_1' => $cfile,
            'itemid' => 0,
            'contextid' => $contextId
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $uploadUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    /**
     * 사이트 정보 조회
     *
     * @return array 사이트 정보
     */
    public function getSiteInfo()
    {
        return $this->call('core_webservice_get_site_info');
    }

    /**
     * 로그 기록
     *
     * @param string $message 로그 메시지
     * @param string $level 로그 레벨
     */
    private function log($message, $level = 'INFO')
    {
        if (!$this->config['debug']['enabled']) {
            return;
        }

        $logLevels = ['DEBUG' => 0, 'INFO' => 1, 'WARNING' => 2, 'ERROR' => 3];
        $currentLevel = $logLevels[$this->config['debug']['log_level']] ?? 1;
        $messageLevel = $logLevels[$level] ?? 1;

        if ($messageLevel >= $currentLevel) {
            $timestamp = date('Y-m-d H:i:s');
            $logMessage = "[$timestamp] [MoodleApiClient] [$level] $message" . PHP_EOL;
            error_log($logMessage);
        }
    }
}
