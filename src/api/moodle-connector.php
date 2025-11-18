<?php
/**
 * Moodle Web Services Connector
 * Moodle 3.7 호환
 */

require_once '../config/database.php';

// CORS 설정 (필요시)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class MoodleConnector {
    private $db;
    private $moodleUrl;
    private $moodleToken;
    private $serviceName;

    public function __construct() {
        $this->db = Database::getInstance();

        // Moodle 설정 로드
        $config = $this->db->getMoodleConfig();
        $this->moodleUrl = $config['moodle_url'] ?? 'http://localhost/moodle';
        $this->moodleToken = $config['moodle_token'] ?? '';
        $this->serviceName = $config['moodle_service'] ?? 'moodle_mobile_app';
    }

    /**
     * Moodle Web Service API 호출
     */
    private function callMoodleAPI($function, $params = []) {
        if (empty($this->moodleToken)) {
            return [
                'success' => false,
                'error' => 'Moodle token not configured'
            ];
        }

        $serverUrl = $this->moodleUrl . '/webservice/rest/server.php';

        $params['wstoken'] = $this->moodleToken;
        $params['wsfunction'] = $function;
        $params['moodlewsrestformat'] = 'json';

        $ch = curl_init($serverUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Moodle API Error: HTTP $httpCode");
            return [
                'success' => false,
                'error' => 'Moodle API request failed',
                'http_code' => $httpCode
            ];
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            error_log("Moodle API Exception: " . $data['message']);
            return [
                'success' => false,
                'error' => $data['message'],
                'exception' => $data['exception']
            ];
        }

        return [
            'success' => true,
            'data' => $data
        ];
    }

    /**
     * 코스 정보 가져오기
     */
    public function getCourseInfo($courseId) {
        return $this->callMoodleAPI('core_course_get_courses', [
            'options' => [
                'ids' => [$courseId]
            ]
        ]);
    }

    /**
     * 코스의 활동 모듈 가져오기
     */
    public function getCourseModules($courseId) {
        return $this->callMoodleAPI('core_course_get_contents', [
            'courseid' => $courseId
        ]);
    }

    /**
     * 퀴즈 정보 가져오기
     */
    public function getQuizInfo($quizId) {
        return $this->callMoodleAPI('mod_quiz_get_quizzes_by_courses', [
            'courseids' => [$quizId]
        ]);
    }

    /**
     * 사용자 정보 가져오기
     */
    public function getUserInfo($userId) {
        return $this->callMoodleAPI('core_user_get_users_by_field', [
            'field' => 'id',
            'values' => [$userId]
        ]);
    }

    /**
     * 활동 로그 가져오기
     */
    public function getActivityLogs($courseId = null, $userId = null, $limit = 50) {
        // Moodle의 로그를 가져오는 함수 (Moodle 3.7+)
        $params = [
            'limitfrom' => 0,
            'limitnum' => $limit
        ];

        if ($courseId) {
            $params['courseid'] = $courseId;
        }

        if ($userId) {
            $params['userid'] = $userId;
        }

        return $this->callMoodleAPI('core_report_get_events', $params);
    }

    /**
     * Moodle 로그를 Alt42 형식으로 변환
     */
    public function processMoodleLogs($moodleLogs) {
        $processedLogs = [];

        foreach ($moodleLogs as $log) {
            $activityType = $this->mapEventToActivityType($log['eventname'] ?? '');

            $processedLog = [
                'moodle_user_id' => $log['userid'] ?? null,
                'moodle_course_id' => $log['courseid'] ?? null,
                'moodle_module_id' => $log['contextinstanceid'] ?? null,
                'student_name' => $log['username'] ?? 'Unknown',
                'activity_type' => $activityType,
                'content' => $this->formatEventDescription($log),
                'created_at' => date('Y-m-d H:i:s', $log['timecreated'] ?? time())
            ];

            $processedLogs[] = $processedLog;
        }

        return $processedLogs;
    }

    /**
     * Moodle 이벤트를 Alt42 활동 타입으로 매핑
     */
    private function mapEventToActivityType($eventName) {
        $typeMap = [
            '\mod_quiz\event\attempt_started' => 'start',
            '\mod_quiz\event\attempt_submitted' => 'complete',
            '\mod_quiz\event\attempt_viewed' => 'view',
            '\core\event\question_answered' => 'answer',
            '\mod_quiz\event\attempt_reviewed' => 'view',
            'quiz_attempt_started' => 'start',
            'quiz_attempt_submitted' => 'complete',
            'question_answered' => 'answer'
        ];

        return $typeMap[$eventName] ?? 'view';
    }

    /**
     * 이벤트 설명 포맷팅
     */
    private function formatEventDescription($log) {
        $icons = [
            'start' => '🎯',
            'complete' => '✅',
            'answer' => '✏️',
            'view' => '👀',
            'hint' => '💡'
        ];

        $activityType = $this->mapEventToActivityType($log['eventname'] ?? '');
        $icon = $icons[$activityType] ?? '📝';

        $description = $log['description'] ?? $log['eventname'] ?? 'Activity';

        return "$icon $description";
    }

    /**
     * Alt42 로그를 데이터베이스에 저장
     */
    public function saveLogsToDatabase($logs) {
        $savedCount = 0;

        foreach ($logs as $log) {
            $result = $this->db->insertActivityLog($log);
            if ($result) {
                $savedCount++;
            }
        }

        return $savedCount;
    }

    /**
     * 실시간 로그 동기화
     */
    public function syncLogs($courseId = null, $lastSyncTime = null) {
        // Moodle에서 최신 로그 가져오기
        $result = $this->getActivityLogs($courseId);

        if (!$result['success']) {
            return [
                'success' => false,
                'error' => $result['error'],
                'synced' => 0
            ];
        }

        // Moodle 로그를 Alt42 형식으로 변환
        $processedLogs = $this->processMoodleLogs($result['data'] ?? []);

        // 데이터베이스에 저장
        $savedCount = $this->saveLogsToDatabase($processedLogs);

        return [
            'success' => true,
            'synced' => $savedCount,
            'logs' => $processedLogs
        ];
    }
}

// API 엔드포인트 처리
try {
    $action = $_POST['action'] ?? $_GET['action'] ?? '';
    $connector = new MoodleConnector();

    switch ($action) {
        case 'get_activity_logs':
            $db = Database::getInstance();
            $limit = $_GET['limit'] ?? 50;
            $activityType = $_GET['type'] ?? null;

            $logs = $db->getRecentLogs($limit, $activityType);

            echo json_encode([
                'success' => true,
                'logs' => $logs,
                'count' => count($logs)
            ]);
            break;

        case 'sync_moodle':
            $courseId = $_POST['course_id'] ?? $_GET['course_id'] ?? null;
            $result = $connector->syncLogs($courseId);
            echo json_encode($result);
            break;

        case 'add_log':
            // 수동으로 로그 추가 (테스트용)
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                $data = $_POST;
            }

            $db = Database::getInstance();
            $logId = $db->insertActivityLog($data);

            echo json_encode([
                'success' => $logId !== false,
                'log_id' => $logId
            ]);
            break;

        case 'get_statistics':
            $db = Database::getInstance();
            $stats = $db->getStudentStatistics();

            echo json_encode([
                'success' => true,
                'statistics' => $stats
            ]);
            break;

        case 'get_course_info':
            $courseId = $_GET['course_id'] ?? null;

            if (!$courseId) {
                throw new Exception('Course ID is required');
            }

            $result = $connector->getCourseInfo($courseId);
            echo json_encode($result);
            break;

        case 'test_connection':
            // Moodle 연결 테스트
            $db = Database::getInstance();
            $config = $db->getMoodleConfig();

            echo json_encode([
                'success' => true,
                'message' => 'API is working',
                'moodle_configured' => !empty($config['moodle_token']),
                'database_connected' => true
            ]);
            break;

        default:
            echo json_encode([
                'success' => false,
                'error' => 'Invalid action',
                'available_actions' => [
                    'get_activity_logs',
                    'sync_moodle',
                    'add_log',
                    'get_statistics',
                    'get_course_info',
                    'test_connection'
                ]
            ]);
            break;
    }

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
