<?php
/**
 * Moodle Integration Configuration
 * Moodle 3.7 연동 설정
 */

// Moodle 설정
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');
define('MOODLE_SERVICE', 'moodle_mobile_app'); // Web Service 이름

// Moodle Web Service API 엔드포인트
define('MOODLE_API_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');

/**
 * Moodle API 호출
 * @param string $function Moodle 함수명
 * @param array $params 파라미터
 * @return array|null 결과 또는 null
 */
function callMoodleAPI($function, $params = []) {
    if (empty(MOODLE_TOKEN)) {
        error_log("Moodle API Error: Token not configured");
        return null;
    }

    $params['wstoken'] = MOODLE_TOKEN;
    $params['wsfunction'] = $function;
    $params['moodlewsrestformat'] = 'json';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, MOODLE_API_ENDPOINT);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Moodle API Error: HTTP {$httpCode}");
        return null;
    }

    $data = json_decode($response, true);

    if (isset($data['exception']) || isset($data['errorcode'])) {
        error_log("Moodle API Error: " . json_encode($data));
        return null;
    }

    return $data;
}

/**
 * 학생 정보 가져오기
 * @param int $userId Moodle 사용자 ID
 * @return array|null 학생 정보
 */
function getMoodleUser($userId) {
    $result = callMoodleAPI('core_user_get_users_by_field', [
        'field' => 'id',
        'values' => [$userId]
    ]);

    return isset($result[0]) ? $result[0] : null;
}

/**
 * 코스 정보 가져오기
 * @param int $courseId Moodle 코스 ID
 * @return array|null 코스 정보
 */
function getMoodleCourse($courseId) {
    $result = callMoodleAPI('core_course_get_courses', [
        'options' => ['ids' => [$courseId]]
    ]);

    return isset($result[0]) ? $result[0] : null;
}

/**
 * 코스에 등록된 학생 목록 가져오기
 * @param int $courseId Moodle 코스 ID
 * @return array 학생 목록
 */
function getCourseStudents($courseId) {
    $result = callMoodleAPI('core_enrol_get_enrolled_users', [
        'courseid' => $courseId
    ]);

    return $result ?: [];
}

/**
 * 퀴즈 정보 가져오기
 * @param int $quizId Moodle 퀴즈 ID
 * @return array|null 퀴즈 정보
 */
function getMoodleQuiz($quizId) {
    $result = callMoodleAPI('mod_quiz_get_quizzes_by_courses', [
        'courseids' => []
    ]);

    if (is_array($result) && isset($result['quizzes'])) {
        foreach ($result['quizzes'] as $quiz) {
            if ($quiz['id'] == $quizId) {
                return $quiz;
            }
        }
    }

    return null;
}

/**
 * 학생의 퀴즈 시도 결과 가져오기
 * @param int $quizId Moodle 퀴즈 ID
 * @param int $userId Moodle 사용자 ID
 * @return array 시도 결과 배열
 */
function getQuizAttempts($quizId, $userId = null) {
    $params = ['quizid' => $quizId];
    if ($userId) {
        $params['userid'] = $userId;
    }

    $result = callMoodleAPI('mod_quiz_get_user_attempts', $params);

    return isset($result['attempts']) ? $result['attempts'] : [];
}

/**
 * Moodle 성적부에 점수 기록
 * @param int $courseId 코스 ID
 * @param int $userId 사용자 ID
 * @param string $itemname 항목 이름
 * @param float $grade 점수
 * @return bool 성공 여부
 */
function submitGradeToMoodle($courseId, $userId, $itemname, $grade) {
    $result = callMoodleAPI('core_grades_update_grades', [
        'source' => 'stat_story_mode',
        'courseid' => $courseId,
        'component' => 'mod_assign',
        'activityid' => 0,
        'itemnumber' => 0,
        'grades' => [
            [
                'studentid' => $userId,
                'grade' => $grade
            ]
        ]
    ]);

    return $result !== null;
}

/**
 * Moodle 사용자 인증 확인
 * @param string $username 사용자명
 * @param string $password 비밀번호
 * @return array|null 인증 정보
 */
function authenticateMoodleUser($username, $password) {
    // Moodle 토큰 발급 API 사용
    $params = [
        'username' => $username,
        'password' => $password,
        'service' => MOODLE_SERVICE
    ];

    $url = MOODLE_URL . '/login/token.php';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);

    if (isset($data['token'])) {
        return $data;
    }

    return null;
}

/**
 * Moodle 활동 완료 상태 업데이트
 * @param int $courseId 코스 ID
 * @param int $cmId 코스 모듈 ID
 * @param int $userId 사용자 ID
 * @param bool $completed 완료 여부
 * @return bool 성공 여부
 */
function updateActivityCompletion($courseId, $cmId, $userId, $completed = true) {
    $result = callMoodleAPI('core_completion_update_activity_completion_status_manually', [
        'cmid' => $cmId,
        'completed' => $completed ? 1 : 0
    ]);

    return $result !== null;
}

/**
 * Moodle에 로그 기록
 * @param int $courseId 코스 ID
 * @param int $userId 사용자 ID
 * @param string $action 액션
 * @param string $info 추가 정보
 * @return bool 성공 여부
 */
function logToMoodle($courseId, $userId, $action, $info = '') {
    // Moodle 로그 API 사용 (있는 경우)
    // 현재는 간단히 로컬 로그로 처리
    $logMessage = sprintf(
        "[Moodle Log] Course: %d, User: %d, Action: %s, Info: %s",
        $courseId,
        $userId,
        $action,
        $info
    );
    error_log($logMessage);
    return true;
}

/**
 * Moodle 데이터베이스 직접 연결 (선택적)
 * Web Service API로 불가능한 작업시 사용
 * @return PDO|null
 */
function getMoodleDBConnection() {
    static $pdo = null;

    $moodleDbHost = getenv('MOODLE_DB_HOST') ?: 'localhost';
    $moodleDbName = getenv('MOODLE_DB_NAME') ?: 'moodle';
    $moodleDbUser = getenv('MOODLE_DB_USER') ?: 'root';
    $moodleDbPass = getenv('MOODLE_DB_PASS') ?: '';
    $moodleDbPrefix = getenv('MOODLE_DB_PREFIX') ?: 'mdl_';

    if ($pdo === null && !empty($moodleDbName)) {
        try {
            $dsn = sprintf("mysql:host=%s;dbname=%s;charset=utf8mb4", $moodleDbHost, $moodleDbName);
            $pdo = new PDO($dsn, $moodleDbUser, $moodleDbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        } catch (PDOException $e) {
            error_log("Moodle DB Connection Error: " . $e->getMessage());
            return null;
        }
    }

    return $pdo;
}
