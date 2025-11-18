<?php
/**
 * Concentration Analysis Engine
 * 집중도 계산 및 패턴 분석 핵심 엔진
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

class ConcentrationAnalyzer {
    private $db;
    private $windowMinutes;
    private $fluctuationThreshold;
    private $minActivityThreshold;

    public function __construct() {
        $this->db = new Database();
        $this->windowMinutes = CONCENTRATION_WINDOW_MINUTES;
        $this->fluctuationThreshold = FLUCTUATION_THRESHOLD;
        $this->minActivityThreshold = MIN_ACTIVITY_THRESHOLD;
    }

    /**
     * 집중도 점수 계산 (0-100)
     * 시간 윈도우 내 활동 빈도, 일관성, 반응 시간을 기반으로 계산
     */
    public function calculateConcentrationScore($userId, $courseId, $windowStart, $windowEnd) {
        // 시간 윈도우 내 활동 데이터 가져오기
        $activities = $this->getActivitiesInWindow($userId, $courseId, $windowStart, $windowEnd);

        if (count($activities) < $this->minActivityThreshold) {
            return [
                'score' => 0,
                'activity_count' => count($activities),
                'active_duration' => 0,
                'click_rate' => 0,
                'response_time_avg' => 0
            ];
        }

        // 활동 메트릭 계산
        $activityCount = count($activities);
        $activeDuration = $this->calculateActiveDuration($activities);
        $clickRate = $this->calculateClickRate($activities, $windowEnd - $windowStart);
        $responseTimeAvg = $this->calculateAverageResponseTime($activities);
        $consistency = $this->calculateConsistency($activities);

        // 집중도 점수 계산 (가중 평균)
        $score = $this->computeWeightedScore([
            'activity_count' => $activityCount,
            'active_duration' => $activeDuration,
            'click_rate' => $clickRate,
            'consistency' => $consistency,
            'response_time' => $responseTimeAvg
        ]);

        return [
            'score' => round($score, 2),
            'activity_count' => $activityCount,
            'active_duration' => $activeDuration,
            'click_rate' => round($clickRate, 4),
            'response_time_avg' => round($responseTimeAvg, 4),
            'consistency' => round($consistency, 4)
        ];
    }

    /**
     * 시간 윈도우별 집중도 계산 및 저장
     */
    public function analyzeConcentrationByWindows($userId, $courseId, $startTime, $endTime) {
        $windowSeconds = $this->windowMinutes * 60;
        $results = [];

        for ($windowStart = $startTime; $windowStart < $endTime; $windowStart += $windowSeconds) {
            $windowEnd = min($windowStart + $windowSeconds, $endTime);

            $metrics = $this->calculateConcentrationScore($userId, $courseId, $windowStart, $windowEnd);

            // 데이터베이스에 저장
            $this->saveConcentrationMetrics($userId, $courseId, $windowStart, $windowEnd, $metrics);

            $results[] = [
                'window_start' => $windowStart,
                'window_end' => $windowEnd,
                'timestamp' => date('Y-m-d H:i:s', $windowStart),
                'metrics' => $metrics
            ];
        }

        return $results;
    }

    /**
     * 들쭉날쭉한 구간 탐지 (Fluctuation Detection)
     */
    public function detectFluctuations($userId, $courseId, $startTime, $endTime) {
        // 집중도 메트릭 가져오기
        $metrics = $this->getConcentrationMetrics($userId, $courseId, $startTime, $endTime);

        if (count($metrics) < 3) {
            return [];
        }

        $scores = array_column($metrics, 'concentration_score');
        $timestamps = array_column($metrics, 'time_window_start');

        // 통계 계산
        $mean = array_sum($scores) / count($scores);
        $stdDev = $this->standardDeviation($scores, $mean);

        // 이동 평균 계산
        $movingAvg = $this->movingAverage($scores, MOVING_AVERAGE_PERIOD);

        $fluctuations = [];

        // 이상 구간 탐지
        for ($i = 0; $i < count($scores); $i++) {
            $zScore = ($stdDev > 0) ? ($scores[$i] - $mean) / $stdDev : 0;

            // Z-점수가 임계값을 초과하면 이상 구간으로 판단
            if (abs($zScore) > $this->fluctuationThreshold) {
                $fluctuationType = $this->classifyFluctuation($zScore, $scores[$i], $movingAvg[$i] ?? $mean);
                $severity = $this->determineSeverity(abs($zScore));

                $fluctuation = [
                    'user_id' => $userId,
                    'course_id' => $courseId,
                    'analysis_start' => $startTime,
                    'analysis_end' => $endTime,
                    'fluctuation_type' => $fluctuationType,
                    'severity' => $severity,
                    'start_time' => $timestamps[$i],
                    'end_time' => isset($timestamps[$i + 1]) ? $timestamps[$i + 1] : $endTime,
                    'baseline_score' => round($mean, 2),
                    'peak_score' => round(max($scores), 2),
                    'trough_score' => round(min($scores), 2),
                    'standard_deviation' => round($stdDev, 4),
                    'z_score' => round($zScore, 4),
                    'actual_score' => round($scores[$i], 2),
                    'description' => $this->generateFluctuationDescription($fluctuationType, $severity, $scores[$i], $mean)
                ];

                $fluctuations[] = $fluctuation;

                // 데이터베이스에 저장
                $this->saveFluctuationAnalysis($fluctuation);
            }
        }

        return $fluctuations;
    }

    /**
     * 변동 유형 분류
     */
    private function classifyFluctuation($zScore, $actualScore, $movingAvg) {
        if ($zScore > $this->fluctuationThreshold) {
            return 'spike';  // 급격한 상승
        } elseif ($zScore < -$this->fluctuationThreshold) {
            return 'drop';   // 급격한 하락
        } else {
            return 'irregular'; // 불규칙적 변동
        }
    }

    /**
     * 심각도 판단
     */
    private function determineSeverity($absZScore) {
        if ($absZScore > 3.0) {
            return 'high';
        } elseif ($absZScore > 2.0) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * 변동 설명 생성
     */
    private function generateFluctuationDescription($type, $severity, $score, $baseline) {
        $diff = abs($score - $baseline);
        $percentage = ($baseline > 0) ? round(($diff / $baseline) * 100, 1) : 0;

        $descriptions = [
            'spike' => "집중도가 평균 대비 {$percentage}% 급격히 상승했습니다. (점수: {$score})",
            'drop' => "집중도가 평균 대비 {$percentage}% 급격히 하락했습니다. (점수: {$score})",
            'irregular' => "집중도가 불규칙하게 변동했습니다. (점수: {$score}, 기준: {$baseline})"
        ];

        return $descriptions[$type] ?? "집중도 변동이 감지되었습니다.";
    }

    /**
     * 시간 윈도우 내 활동 가져오기
     */
    private function getActivitiesInWindow($userId, $courseId, $windowStart, $windowEnd) {
        $sql = "SELECT * FROM user_activity_logs
                WHERE user_id = :user_id
                AND course_id = :course_id
                AND time_created >= :window_start
                AND time_created < :window_end
                ORDER BY time_created ASC";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'window_start' => $windowStart,
            'window_end' => $windowEnd
        ];

        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * 활동 지속 시간 계산 (초)
     */
    private function calculateActiveDuration($activities) {
        if (count($activities) < 2) {
            return 0;
        }

        $firstActivity = reset($activities);
        $lastActivity = end($activities);

        return $lastActivity['time_created'] - $firstActivity['time_created'];
    }

    /**
     * 클릭률 계산 (분당 클릭 수)
     */
    private function calculateClickRate($activities, $windowDuration) {
        if ($windowDuration <= 0) {
            return 0;
        }

        $activityCount = count($activities);
        $durationMinutes = $windowDuration / 60;

        return $durationMinutes > 0 ? $activityCount / $durationMinutes : 0;
    }

    /**
     * 평균 응답 시간 계산 (초)
     */
    private function calculateAverageResponseTime($activities) {
        if (count($activities) < 2) {
            return 0;
        }

        $responseTimes = [];
        for ($i = 1; $i < count($activities); $i++) {
            $responseTimes[] = $activities[$i]['time_created'] - $activities[$i - 1]['time_created'];
        }

        return count($responseTimes) > 0 ? array_sum($responseTimes) / count($responseTimes) : 0;
    }

    /**
     * 일관성 계산 (활동 간 시간 간격의 균일성)
     */
    private function calculateConsistency($activities) {
        if (count($activities) < 2) {
            return 0;
        }

        $intervals = [];
        for ($i = 1; $i < count($activities); $i++) {
            $intervals[] = $activities[$i]['time_created'] - $activities[$i - 1]['time_created'];
        }

        $mean = array_sum($intervals) / count($intervals);
        $stdDev = $this->standardDeviation($intervals, $mean);

        // 표준편차가 작을수록 일관성이 높음 (0-1 정규화)
        return $mean > 0 ? max(0, 1 - ($stdDev / $mean)) : 0;
    }

    /**
     * 가중 점수 계산
     */
    private function computeWeightedScore($metrics) {
        // 활동 빈도 점수 (0-30점)
        $activityScore = min(30, $metrics['activity_count'] * 2);

        // 클릭률 점수 (0-25점) - 분당 3-10회가 이상적
        $optimalClickRate = 6;
        $clickRateDiff = abs($metrics['click_rate'] - $optimalClickRate);
        $clickRateScore = max(0, 25 - ($clickRateDiff * 3));

        // 일관성 점수 (0-25점)
        $consistencyScore = $metrics['consistency'] * 25;

        // 응답 시간 점수 (0-20점) - 빠를수록 좋음 (10-60초가 이상적)
        $responseTimeScore = 20;
        if ($metrics['response_time'] > 60) {
            $responseTimeScore = max(0, 20 - (($metrics['response_time'] - 60) / 10));
        }

        $totalScore = $activityScore + $clickRateScore + $consistencyScore + $responseTimeScore;

        return min(100, $totalScore);
    }

    /**
     * 표준편차 계산
     */
    private function standardDeviation($data, $mean = null) {
        if (count($data) == 0) {
            return 0;
        }

        if ($mean === null) {
            $mean = array_sum($data) / count($data);
        }

        $variance = 0;
        foreach ($data as $value) {
            $variance += pow($value - $mean, 2);
        }

        return sqrt($variance / count($data));
    }

    /**
     * 이동 평균 계산
     */
    private function movingAverage($data, $period) {
        $result = [];
        for ($i = 0; $i < count($data); $i++) {
            $start = max(0, $i - $period + 1);
            $slice = array_slice($data, $start, $period);
            $result[] = array_sum($slice) / count($slice);
        }
        return $result;
    }

    /**
     * 집중도 메트릭 저장
     */
    private function saveConcentrationMetrics($userId, $courseId, $windowStart, $windowEnd, $metrics) {
        $sql = "INSERT INTO concentration_metrics
                (user_id, course_id, time_window_start, time_window_end,
                 activity_count, concentration_score, active_duration_seconds,
                 click_rate, response_time_avg)
                VALUES
                (:user_id, :course_id, :window_start, :window_end,
                 :activity_count, :score, :active_duration,
                 :click_rate, :response_time_avg)
                ON DUPLICATE KEY UPDATE
                activity_count = :activity_count,
                concentration_score = :score,
                active_duration_seconds = :active_duration,
                click_rate = :click_rate,
                response_time_avg = :response_time_avg,
                calculated_at = CURRENT_TIMESTAMP";

        $params = [
            'user_id' => $userId,
            'course_id' => $courseId,
            'window_start' => $windowStart,
            'window_end' => $windowEnd,
            'activity_count' => $metrics['activity_count'],
            'score' => $metrics['score'],
            'active_duration' => $metrics['active_duration'],
            'click_rate' => $metrics['click_rate'],
            'response_time_avg' => $metrics['response_time_avg']
        ];

        return $this->db->query($sql, $params);
    }

    /**
     * 집중도 메트릭 가져오기
     */
    private function getConcentrationMetrics($userId, $courseId, $startTime, $endTime) {
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
     * 변동 분석 결과 저장
     */
    private function saveFluctuationAnalysis($fluctuation) {
        $sql = "INSERT INTO fluctuation_analysis
                (user_id, course_id, analysis_start, analysis_end,
                 fluctuation_type, severity, start_time, end_time,
                 baseline_score, peak_score, trough_score,
                 standard_deviation, z_score, description)
                VALUES
                (:user_id, :course_id, :analysis_start, :analysis_end,
                 :fluctuation_type, :severity, :start_time, :end_time,
                 :baseline_score, :peak_score, :trough_score,
                 :standard_deviation, :z_score, :description)";

        return $this->db->query($sql, $fluctuation);
    }
}
