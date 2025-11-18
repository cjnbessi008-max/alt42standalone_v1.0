<?php
/**
 * Get Concentration Data API
 * 집중도 데이터 조회 엔드포인트
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');

class ConcentrationDataAPI {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * 집중도 메트릭 조회
     */
    public function getConcentrationMetrics($userId, $courseId, $startTime, $endTime) {
        $sql = "SELECT
                    id,
                    user_id,
                    course_id,
                    time_window_start,
                    time_window_end,
                    activity_count,
                    concentration_score,
                    active_duration_seconds,
                    click_rate,
                    response_time_avg,
                    UNIX_TIMESTAMP(calculated_at) as calculated_timestamp
                FROM concentration_metrics
                WHERE user_id = :user_id
                AND course_id = :course_id
                AND time_window_start >= :start_time
                AND time_window_end <= :end_time
                ORDER BY time_window_start ASC";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'start_time' => $startTime,
            'end_time' => $endTime
        ];

        $stmt = $this->db->query($sql, $params);
        $results = $stmt->fetchAll();

        // 그래프용 데이터 포맷팅
        $formatted = [
            'labels' => [],
            'scores' => [],
            'activity_counts' => [],
            'click_rates' => []
        ];

        foreach ($results as $row) {
            $formatted['labels'][] = date('Y-m-d H:i', $row['time_window_start']);
            $formatted['scores'][] = (float)$row['concentration_score'];
            $formatted['activity_counts'][] = (int)$row['activity_count'];
            $formatted['click_rates'][] = (float)$row['click_rate'];
        }

        return [
            'success' => true,
            'data' => $results,
            'chart_data' => $formatted,
            'count' => count($results)
        ];
    }

    /**
     * 변동 구간 조회
     */
    public function getFluctuations($userId, $courseId, $startTime, $endTime, $severity = null) {
        $sql = "SELECT
                    id,
                    user_id,
                    course_id,
                    analysis_start,
                    analysis_end,
                    fluctuation_type,
                    severity,
                    start_time,
                    end_time,
                    baseline_score,
                    peak_score,
                    trough_score,
                    standard_deviation,
                    z_score,
                    description,
                    UNIX_TIMESTAMP(detected_at) as detected_timestamp
                FROM fluctuation_analysis
                WHERE user_id = :user_id
                AND course_id = :course_id
                AND start_time >= :start_time
                AND end_time <= :end_time";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'start_time' => $startTime,
            'end_time' => $endTime
        ];

        if ($severity !== null) {
            $sql .= " AND severity = :severity";
            $params['severity'] = $severity;
        }

        $sql .= " ORDER BY start_time ASC";

        $stmt = $this->db->query($sql, $params);
        $results = $stmt->fetchAll();

        // 통계 계산
        $stats = $this->calculateFluctuationStats($results);

        return [
            'success' => true,
            'fluctuations' => $results,
            'count' => count($results),
            'statistics' => $stats
        ];
    }

    /**
     * 변동 통계 계산
     */
    private function calculateFluctuationStats($fluctuations) {
        if (empty($fluctuations)) {
            return [
                'total' => 0,
                'by_type' => [],
                'by_severity' => []
            ];
        }

        $byType = [];
        $bySeverity = [];

        foreach ($fluctuations as $f) {
            // 유형별
            if (!isset($byType[$f['fluctuation_type']])) {
                $byType[$f['fluctuation_type']] = 0;
            }
            $byType[$f['fluctuation_type']]++;

            // 심각도별
            if (!isset($bySeverity[$f['severity']])) {
                $bySeverity[$f['severity']] = 0;
            }
            $bySeverity[$f['severity']]++;
        }

        return [
            'total' => count($fluctuations),
            'by_type' => $byType,
            'by_severity' => $bySeverity
        ];
    }

    /**
     * 요약 통계
     */
    public function getSummaryStats($userId, $courseId, $startTime, $endTime) {
        $sql = "SELECT
                    COUNT(*) as total_sessions,
                    AVG(concentration_score) as avg_score,
                    MAX(concentration_score) as max_score,
                    MIN(concentration_score) as min_score,
                    SUM(activity_count) as total_activities,
                    SUM(active_duration_seconds) as total_active_time,
                    AVG(click_rate) as avg_click_rate,
                    AVG(response_time_avg) as avg_response_time
                FROM concentration_metrics
                WHERE user_id = :user_id
                AND course_id = :course_id
                AND time_window_start >= :start_time
                AND time_window_end <= :end_time";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'start_time' => $startTime,
            'end_time' => $endTime
        ];

        $stmt = $this->db->query($sql, $params);
        $stats = $stmt->fetch();

        // 변동 통계 추가
        $fluctuationSql = "SELECT
                            COUNT(*) as total_fluctuations,
                            SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_severity_count,
                            SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_count,
                            SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_severity_count
                        FROM fluctuation_analysis
                        WHERE user_id = :user_id
                        AND course_id = :course_id
                        AND start_time >= :start_time
                        AND end_time <= :end_time";

        $stmt = $this->db->query($fluctuationSql, $params);
        $fluctuationStats = $stmt->fetch();

        return [
            'success' => true,
            'summary' => array_merge($stats, $fluctuationStats)
        ];
    }

    /**
     * 사용자 목록 조회
     */
    public function getUserList() {
        $sql = "SELECT DISTINCT user_id, course_id, COUNT(*) as session_count
                FROM user_activity_logs
                GROUP BY user_id, course_id
                ORDER BY user_id, course_id";

        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll();

        return [
            'success' => true,
            'users' => $results
        ];
    }
}

// API 엔드포인트 처리
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    $courseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;
    $startTime = isset($_GET['start_time']) ? (int)$_GET['start_time'] : strtotime('-7 days');
    $endTime = isset($_GET['end_time']) ? (int)$_GET['end_time'] : time();
    $severity = isset($_GET['severity']) ? $_GET['severity'] : null;

    $api = new ConcentrationDataAPI();

    switch ($action) {
        case 'metrics':
            if (!$userId || !$courseId) {
                jsonResponse(['success' => false, 'error' => 'user_id와 course_id가 필요합니다.'], 400);
            }
            $result = $api->getConcentrationMetrics($userId, $courseId, $startTime, $endTime);
            jsonResponse($result);
            break;

        case 'fluctuations':
            if (!$userId || !$courseId) {
                jsonResponse(['success' => false, 'error' => 'user_id와 course_id가 필요합니다.'], 400);
            }
            $result = $api->getFluctuations($userId, $courseId, $startTime, $endTime, $severity);
            jsonResponse($result);
            break;

        case 'summary':
            if (!$userId || !$courseId) {
                jsonResponse(['success' => false, 'error' => 'user_id와 course_id가 필요합니다.'], 400);
            }
            $result = $api->getSummaryStats($userId, $courseId, $startTime, $endTime);
            jsonResponse($result);
            break;

        case 'users':
            $result = $api->getUserList();
            jsonResponse($result);
            break;

        default:
            jsonResponse(['success' => false, 'error' => '올바른 action을 지정해주세요.'], 400);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'GET 메서드만 허용됩니다.'], 405);
}
