<?php
/**
 * Generate Report API
 * 집중도 분석 리포트 생성
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');

class ReportGenerator {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * 리포트 생성
     */
    public function generateReport($userId, $courseId, $startTime, $endTime, $reportType = 'custom') {
        try {
            // 집중도 메트릭 수집
            $metrics = $this->getMetrics($userId, $courseId, $startTime, $endTime);

            // 변동 분석 수집
            $fluctuations = $this->getFluctuations($userId, $courseId, $startTime, $endTime);

            // 통계 계산
            $stats = $this->calculateStatistics($metrics, $fluctuations);

            // 추천 사항 생성
            $recommendations = $this->generateRecommendations($stats, $fluctuations);

            // 요약 텍스트 생성
            $summary = $this->generateSummary($stats, $fluctuations);

            // 리포트 저장
            $reportId = $this->saveReport($userId, $courseId, $startTime, $endTime, $reportType, $stats, $summary, $recommendations);

            return [
                'success' => true,
                'report_id' => $reportId,
                'report' => [
                    'user_id' => $userId,
                    'course_id' => $courseId,
                    'period' => [
                        'start' => date('Y-m-d H:i:s', $startTime),
                        'end' => date('Y-m-d H:i:s', $endTime)
                    ],
                    'statistics' => $stats,
                    'summary' => $summary,
                    'recommendations' => $recommendations,
                    'fluctuations' => $fluctuations
                ],
                'message' => '리포트가 성공적으로 생성되었습니다.'
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 메트릭 데이터 수집
     */
    private function getMetrics($userId, $courseId, $startTime, $endTime) {
        $sql = "SELECT * FROM concentration_metrics
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
        return $stmt->fetchAll();
    }

    /**
     * 변동 데이터 수집
     */
    private function getFluctuations($userId, $courseId, $startTime, $endTime) {
        $sql = "SELECT * FROM fluctuation_analysis
                WHERE user_id = :user_id
                AND course_id = :course_id
                AND start_time >= :start_time
                AND end_time <= :end_time
                ORDER BY severity DESC, start_time ASC";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'start_time' => $startTime,
            'end_time' => $endTime
        ];

        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * 통계 계산
     */
    private function calculateStatistics($metrics, $fluctuations) {
        if (empty($metrics)) {
            return [
                'total_sessions' => 0,
                'avg_concentration' => 0,
                'max_concentration' => 0,
                'min_concentration' => 0,
                'total_active_time' => 0,
                'fluctuation_count' => 0,
                'high_severity_count' => 0
            ];
        }

        $scores = array_column($metrics, 'concentration_score');
        $activeTimes = array_column($metrics, 'active_duration_seconds');

        $highSeverityCount = 0;
        foreach ($fluctuations as $f) {
            if ($f['severity'] === 'high') {
                $highSeverityCount++;
            }
        }

        return [
            'total_sessions' => count($metrics),
            'avg_concentration' => round(array_sum($scores) / count($scores), 2),
            'max_concentration' => round(max($scores), 2),
            'min_concentration' => round(min($scores), 2),
            'std_deviation' => round($this->standardDeviation($scores), 2),
            'total_active_time' => array_sum($activeTimes),
            'avg_active_time' => round(array_sum($activeTimes) / count($activeTimes), 2),
            'fluctuation_count' => count($fluctuations),
            'high_severity_count' => $highSeverityCount,
            'medium_severity_count' => count(array_filter($fluctuations, fn($f) => $f['severity'] === 'medium')),
            'low_severity_count' => count(array_filter($fluctuations, fn($f) => $f['severity'] === 'low'))
        ];
    }

    /**
     * 표준편차 계산
     */
    private function standardDeviation($data) {
        if (count($data) == 0) return 0;

        $mean = array_sum($data) / count($data);
        $variance = 0;

        foreach ($data as $value) {
            $variance += pow($value - $mean, 2);
        }

        return sqrt($variance / count($data));
    }

    /**
     * 요약 생성
     */
    private function generateSummary($stats, $fluctuations) {
        $summary = [];

        // 전반적인 집중도 평가
        $avgScore = $stats['avg_concentration'];
        if ($avgScore >= 70) {
            $summary[] = "✅ 전반적으로 우수한 집중도를 유지하고 있습니다. (평균: {$avgScore}점)";
        } elseif ($avgScore >= 50) {
            $summary[] = "⚠️ 보통 수준의 집중도를 보이고 있습니다. (평균: {$avgScore}점) 개선의 여지가 있습니다.";
        } else {
            $summary[] = "❌ 집중도가 낮은 편입니다. (평균: {$avgScore}점) 학습 환경 및 방법 개선이 필요합니다.";
        }

        // 변동성 평가
        if ($stats['std_deviation'] > 20) {
            $summary[] = "📊 집중도 변동성이 높습니다. (표준편차: {$stats['std_deviation']}) 일관된 학습 패턴을 유지하기 어려운 상태입니다.";
        } elseif ($stats['std_deviation'] > 10) {
            $summary[] = "📊 집중도 변동성이 다소 있습니다. (표준편차: {$stats['std_deviation']})";
        } else {
            $summary[] = "📊 안정적이고 일관된 집중도를 유지하고 있습니다. (표준편차: {$stats['std_deviation']})";
        }

        // 변동 구간 평가
        if ($stats['high_severity_count'] > 5) {
            $summary[] = "⚠️ 심각한 집중도 변동이 {$stats['high_severity_count']}회 발생했습니다. 주의가 필요합니다.";
        } elseif ($stats['high_severity_count'] > 0) {
            $summary[] = "⚠️ 주의가 필요한 집중도 변동이 {$stats['high_severity_count']}회 발생했습니다.";
        } else {
            $summary[] = "✅ 심각한 집중도 변동이 발견되지 않았습니다.";
        }

        // 총 학습 시간
        $totalHours = round($stats['total_active_time'] / 3600, 1);
        $summary[] = "⏱️ 총 활동 시간: {$totalHours}시간 ({$stats['total_sessions']}개 세션)";

        return implode("\n", $summary);
    }

    /**
     * 추천 사항 생성
     */
    private function generateRecommendations($stats, $fluctuations) {
        $recommendations = [];

        // 집중도 기반 추천
        if ($stats['avg_concentration'] < 50) {
            $recommendations[] = [
                'category' => 'concentration',
                'priority' => 'high',
                'title' => '집중도 향상 필요',
                'description' => '학습 환경을 개선하고, 짧은 세션으로 나누어 학습하는 것을 권장합니다.',
                'actions' => [
                    '조용하고 방해받지 않는 학습 공간 확보',
                    '25분 학습 + 5분 휴식 (포모도로 기법) 적용',
                    '학습 시작 전 명확한 목표 설정'
                ]
            ];
        }

        // 변동성 기반 추천
        if ($stats['std_deviation'] > 20) {
            $recommendations[] = [
                'category' => 'consistency',
                'priority' => 'high',
                'title' => '일관된 학습 패턴 필요',
                'description' => '집중도가 불안정합니다. 규칙적인 학습 루틴을 만드세요.',
                'actions' => [
                    '매일 같은 시간에 학습하기',
                    '학습 전 준비 루틴 만들기 (예: 책상 정리, 물 준비)',
                    '피로도가 낮은 시간대에 중요한 학습 배치'
                ]
            ];
        }

        // 급하락 구간 분석
        $drops = array_filter($fluctuations, fn($f) => $f['fluctuation_type'] === 'drop' && $f['severity'] === 'high');
        if (count($drops) > 3) {
            $recommendations[] = [
                'category' => 'fatigue',
                'priority' => 'medium',
                'title' => '집중도 급하락 방지',
                'description' => '학습 중 집중도가 급격히 떨어지는 구간이 많습니다.',
                'actions' => [
                    '50분마다 10분 휴식 취하기',
                    '적절한 수분 및 간식 섭취',
                    '스트레칭 또는 가벼운 운동으로 활력 회복'
                ]
            ];
        }

        // 급상승 구간 분석 (긍정적)
        $spikes = array_filter($fluctuations, fn($f) => $f['fluctuation_type'] === 'spike' && $f['severity'] === 'high');
        if (count($spikes) > 2) {
            $recommendations[] = [
                'category' => 'optimization',
                'priority' => 'low',
                'title' => '최적 학습 시간대 활용',
                'description' => '특정 시간대에 집중도가 높아지는 패턴이 있습니다.',
                'actions' => [
                    '집중도가 높은 시간대를 파악하고 중요한 학습 배치',
                    '그 시간대의 환경 및 조건 분석 (조용함, 온도, 컨디션 등)',
                    '유사한 환경을 다른 시간에도 재현'
                ]
            ];
        }

        // 기본 추천
        if (empty($recommendations)) {
            $recommendations[] = [
                'category' => 'general',
                'priority' => 'low',
                'title' => '현재 학습 패턴 유지',
                'description' => '양호한 학습 패턴을 보이고 있습니다. 현재의 방식을 유지하세요.',
                'actions' => [
                    '정기적인 자기 점검 계속하기',
                    '새로운 학습 방법 실험해보기',
                    '장기적인 목표 설정 및 추적'
                ]
            ];
        }

        return $recommendations;
    }

    /**
     * 리포트 저장
     */
    private function saveReport($userId, $courseId, $startTime, $endTime, $reportType, $stats, $summary, $recommendations) {
        $sql = "INSERT INTO analysis_reports
                (user_id, course_id, report_type, period_start, period_end,
                 total_sessions, avg_concentration_score, max_concentration_score,
                 min_concentration_score, fluctuation_count, high_severity_count,
                 total_active_time, summary_text, recommendations)
                VALUES
                (:user_id, :course_id, :report_type, :period_start, :period_end,
                 :total_sessions, :avg_score, :max_score, :min_score,
                 :fluctuation_count, :high_severity_count, :total_active_time,
                 :summary, :recommendations)";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'report_type' => $reportType,
            'period_start' => $startTime,
            'period_end' => $endTime,
            'total_sessions' => $stats['total_sessions'],
            'avg_score' => $stats['avg_concentration'],
            'max_score' => $stats['max_concentration'],
            'min_score' => $stats['min_concentration'],
            'fluctuation_count' => $stats['fluctuation_count'],
            'high_severity_count' => $stats['high_severity_count'],
            'total_active_time' => $stats['total_active_time'],
            'summary' => $summary,
            'recommendations' => json_encode($recommendations, JSON_UNESCAPED_UNICODE)
        ];

        $this->db->query($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * 저장된 리포트 조회
     */
    public function getReport($reportId) {
        $sql = "SELECT * FROM analysis_reports WHERE id = :report_id";
        $stmt = $this->db->query($sql, ['report_id' => $reportId]);
        $report = $stmt->fetch();

        if ($report) {
            $report['recommendations'] = json_decode($report['recommendations'], true);
        }

        return $report;
    }

    /**
     * 사용자의 리포트 목록
     */
    public function getUserReports($userId, $courseId = null) {
        $sql = "SELECT id, report_type, period_start, period_end,
                       avg_concentration_score, fluctuation_count,
                       UNIX_TIMESTAMP(created_at) as created_timestamp
                FROM analysis_reports
                WHERE user_id = :user_id";

        $params = ['user_id' => $userId];

        if ($courseId !== null) {
            $sql .= " AND course_id = :course_id";
            $params['course_id'] = $courseId;
        }

        $sql .= " ORDER BY created_at DESC LIMIT 50";

        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
}

// API 엔드포인트 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $action = isset($input['action']) ? $input['action'] : null;
    $reportGenerator = new ReportGenerator();

    switch ($action) {
        case 'generate':
            $userId = isset($input['user_id']) ? (int)$input['user_id'] : null;
            $courseId = isset($input['course_id']) ? (int)$input['course_id'] : null;
            $startTime = isset($input['start_time']) ? (int)$input['start_time'] : null;
            $endTime = isset($input['end_time']) ? (int)$input['end_time'] : null;
            $reportType = isset($input['report_type']) ? $input['report_type'] : 'custom';

            if (!$userId || !$courseId || !$startTime || !$endTime) {
                jsonResponse(['success' => false, 'error' => '필수 파라미터가 누락되었습니다.'], 400);
            }

            $result = $reportGenerator->generateReport($userId, $courseId, $startTime, $endTime, $reportType);
            jsonResponse($result);
            break;

        default:
            jsonResponse(['success' => false, 'error' => '올바른 action을 지정해주세요.'], 400);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    $reportGenerator = new ReportGenerator();

    switch ($action) {
        case 'get':
            $reportId = isset($_GET['report_id']) ? (int)$_GET['report_id'] : null;

            if (!$reportId) {
                jsonResponse(['success' => false, 'error' => 'report_id가 필요합니다.'], 400);
            }

            $report = $reportGenerator->getReport($reportId);

            if ($report) {
                jsonResponse(['success' => true, 'report' => $report]);
            } else {
                jsonResponse(['success' => false, 'error' => '리포트를 찾을 수 없습니다.'], 404);
            }
            break;

        case 'list':
            $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
            $courseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;

            if (!$userId) {
                jsonResponse(['success' => false, 'error' => 'user_id가 필요합니다.'], 400);
            }

            $reports = $reportGenerator->getUserReports($userId, $courseId);
            jsonResponse(['success' => true, 'reports' => $reports, 'count' => count($reports)]);
            break;

        default:
            jsonResponse(['success' => false, 'error' => '올바른 action을 지정해주세요.'], 400);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'POST 또는 GET 메서드만 허용됩니다.'], 405);
}
