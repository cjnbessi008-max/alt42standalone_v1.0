<?php
/**
 * Moodle Data Synchronization API
 * Moodle 3.7 로그 테이블에서 사용자 활동 데이터 동기화
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');

class MoodleSync {
    private $db;
    private $moodlePrefix;

    public function __construct() {
        $this->db = new Database();
        $this->moodlePrefix = MOODLE_DB_PREFIX;
    }

    /**
     * Moodle 로그 데이터 동기화
     */
    public function syncActivityLogs($userId = null, $courseId = null, $fromTimestamp = null) {
        try {
            $this->db->beginTransaction();

            // 마지막 동기화 시간 확인
            if ($fromTimestamp === null) {
                $fromTimestamp = $this->getLastSyncTime();
            }

            // Moodle logstore_standard_log 테이블에서 데이터 가져오기
            $logs = $this->fetchMoodleLogs($userId, $courseId, $fromTimestamp);

            $syncedCount = 0;
            foreach ($logs as $log) {
                $this->insertActivityLog($log);
                $syncedCount++;
            }

            // 동기화 시간 업데이트
            $this->updateLastSyncTime(time());

            // 동기화 이력 기록
            $this->recordSyncHistory('activity_logs', $syncedCount, 'success');

            $this->db->commit();

            return [
                'success' => true,
                'synced_count' => $syncedCount,
                'from_timestamp' => $fromTimestamp,
                'to_timestamp' => time(),
                'message' => "{$syncedCount}개의 활동 로그가 동기화되었습니다."
            ];

        } catch (Exception $e) {
            $this->db->rollback();
            $this->recordSyncHistory('activity_logs', 0, 'failed', $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Moodle 로그 테이블에서 데이터 가져오기
     */
    private function fetchMoodleLogs($userId, $courseId, $fromTimestamp) {
        $sql = "SELECT
                    id,
                    userid,
                    courseid,
                    eventname as activity_type,
                    component,
                    action,
                    target,
                    objectid,
                    contextid,
                    ip,
                    timecreated
                FROM {$this->moodlePrefix}logstore_standard_log
                WHERE timecreated > :from_timestamp";

        $params = ['from_timestamp' => $fromTimestamp];

        if ($userId !== null) {
            $sql .= " AND userid = :user_id";
            $params['user_id'] = $userId;
        }

        if ($courseId !== null) {
            $sql .= " AND courseid = :course_id";
            $params['course_id'] = $courseId;
        }

        $sql .= " ORDER BY timecreated ASC LIMIT 10000"; // 한 번에 최대 10000개

        $stmt = $this->db->moodleQuery($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * 활동 로그 삽입
     */
    private function insertActivityLog($log) {
        $sql = "INSERT INTO user_activity_logs
                (user_id, course_id, activity_type, component, action, target,
                 object_id, context_id, ip_address, time_created)
                VALUES
                (:user_id, :course_id, :activity_type, :component, :action, :target,
                 :object_id, :context_id, :ip_address, :time_created)";

        $params = [
            'user_id' => $log['userid'],
            'course_id' => $log['courseid'],
            'activity_type' => $log['activity_type'],
            'component' => $log['component'],
            'action' => $log['action'],
            'target' => $log['target'],
            'object_id' => $log['objectid'],
            'context_id' => $log['contextid'],
            'ip_address' => $log['ip'],
            'time_created' => $log['timecreated']
        ];

        return $this->db->query($sql, $params);
    }

    /**
     * 마지막 동기화 시간 가져오기
     */
    private function getLastSyncTime() {
        $sql = "SELECT setting_value FROM system_settings WHERE setting_key = 'last_moodle_sync'";
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch();
        return $result ? (int)$result['setting_value'] : strtotime('-7 days');
    }

    /**
     * 마지막 동기화 시간 업데이트
     */
    private function updateLastSyncTime($timestamp) {
        $sql = "UPDATE system_settings SET setting_value = :timestamp WHERE setting_key = 'last_moodle_sync'";
        return $this->db->query($sql, ['timestamp' => $timestamp]);
    }

    /**
     * 동기화 이력 기록
     */
    private function recordSyncHistory($syncType, $recordsSynced, $status, $errorMessage = null) {
        $sql = "INSERT INTO sync_history
                (sync_type, records_synced, sync_start, sync_end, status, error_message)
                VALUES
                (:sync_type, :records_synced, NOW(), NOW(), :status, :error_message)";

        $params = [
            'sync_type' => $syncType,
            'records_synced' => $recordsSynced,
            'status' => $status,
            'error_message' => $errorMessage
        ];

        return $this->db->query($sql, $params);
    }

    /**
     * 특정 사용자의 집중도 분석을 위한 활동 데이터 가져오기
     */
    public function getUserActivityData($userId, $courseId, $startTime, $endTime) {
        $sql = "SELECT
                    user_id,
                    course_id,
                    activity_type,
                    time_created,
                    UNIX_TIMESTAMP(synced_at) as synced_timestamp
                FROM user_activity_logs
                WHERE user_id = :user_id
                AND course_id = :course_id
                AND time_created BETWEEN :start_time AND :end_time
                ORDER BY time_created ASC";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'start_time' => $startTime,
            'end_time' => $endTime
        ];

        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
}

// API 엔드포인트 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $action = isset($input['action']) ? $input['action'] : null;
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : null;
    $courseId = isset($input['course_id']) ? (int)$input['course_id'] : null;
    $fromTimestamp = isset($input['from_timestamp']) ? (int)$input['from_timestamp'] : null;

    $sync = new MoodleSync();

    switch ($action) {
        case 'sync':
            $result = $sync->syncActivityLogs($userId, $courseId, $fromTimestamp);
            jsonResponse($result);
            break;

        case 'get_user_activity':
            $startTime = isset($input['start_time']) ? (int)$input['start_time'] : strtotime('-1 day');
            $endTime = isset($input['end_time']) ? (int)$input['end_time'] : time();

            if (!$userId || !$courseId) {
                jsonResponse(['success' => false, 'error' => 'user_id와 course_id가 필요합니다.'], 400);
            }

            $data = $sync->getUserActivityData($userId, $courseId, $startTime, $endTime);
            jsonResponse(['success' => true, 'data' => $data]);
            break;

        default:
            jsonResponse(['success' => false, 'error' => '올바른 action을 지정해주세요.'], 400);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'POST 메서드만 허용됩니다.'], 405);
}
