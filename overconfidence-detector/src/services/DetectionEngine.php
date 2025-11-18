<?php
/**
 * Overconfidence Detection Engine
 * 과신 오류 탐지 엔진
 */

namespace OverconfidenceDetector\Services;

use OverconfidenceDetector\Utils\Database;
use OverconfidenceDetector\Utils\Logger;

class DetectionEngine
{
    private $db;
    private $config;
    private $thresholds;

    public function __construct()
    {
        $this->db = Database::getInstance('main');

        $appConfig = require __DIR__ . '/../../config/app.php';
        $this->config = $appConfig['detection'];
        $this->thresholds = $this->config['thresholds'];
    }

    /**
     * 전체 시도 기록 분석 및 과신 오류 탐지
     *
     * @return int 탐지된 플래그 수
     */
    public function analyzeAll()
    {
        Logger::info("Starting overconfidence detection analysis");

        // 먼저 문제별 통계 계산
        $this->calculateQuestionStatistics();

        // 아직 분석되지 않은 시도 가져오기
        $attempts = $this->getUnanalyzedAttempts();

        $flagCount = 0;
        foreach ($attempts as $attempt) {
            if ($this->analyzeAttempt($attempt)) {
                $flagCount++;
            }
        }

        Logger::info("Detection completed", ['flags_created' => $flagCount]);

        return $flagCount;
    }

    /**
     * 특정 시도 분석
     *
     * @param array $attempt 시도 기록
     * @return bool 플래그 생성 여부
     */
    public function analyzeAttempt($attempt)
    {
        // 이미 플래그가 있는지 확인
        $existingFlag = $this->db->selectOne(
            "SELECT id FROM overconfidence_flags WHERE attempt_id = ?",
            [$attempt['id']]
        );

        if ($existingFlag) {
            return false; // 이미 분석됨
        }

        // 문제 통계 가져오기
        $questionStats = $this->db->selectOne(
            "SELECT avg_time_seconds, std_dev_time, sample_count, difficulty_level
             FROM questions
             WHERE id = ?",
            [$attempt['question_id']]
        );

        if (!$questionStats) {
            Logger::warning("Question stats not found", ['question_id' => $attempt['question_id']]);
            return false;
        }

        // 샘플 수가 충분하지 않으면 건너뛰기
        if ($questionStats['sample_count'] < $this->config['min_sample_size']) {
            Logger::debug("Insufficient sample size", [
                'question_id' => $attempt['question_id'],
                'sample_count' => $questionStats['sample_count']
            ]);
            return false;
        }

        // Z-score 계산
        $avgTime = $questionStats['avg_time_seconds'];
        $stdDev = $questionStats['std_dev_time'];

        if ($stdDev == 0) {
            return false; // 표준편차가 0이면 계산 불가
        }

        $zScore = ($attempt['time_spent_seconds'] - $avgTime) / $stdDev;

        // 난이도 가중치 적용
        $difficultyWeight = $this->config['difficulty_weights'][$questionStats['difficulty_level']] ?? 1.0;
        $adjustedZScore = $zScore * $difficultyWeight;

        // 플래그 레벨 결정
        $flagLevel = $this->determineFlagLevel($adjustedZScore);

        if ($flagLevel === null) {
            return false; // 정상 범위
        }

        // 절대 최소 시간 체크
        if ($attempt['time_spent_seconds'] < $this->config['absolute_min_time']) {
            $flagLevel = 'danger'; // 무조건 위험
        }

        // 연속 빠른 풀이 패턴 감지
        $consecutiveCount = $this->detectConsecutiveFastPattern($attempt['student_id'], $attempt['quiz_id']);
        $pattern = $this->detectPattern($attempt, $consecutiveCount);

        // 플래그 생성
        $flagId = $this->createFlag(
            $attempt,
            $avgTime,
            $stdDev,
            $adjustedZScore,
            $flagLevel,
            $consecutiveCount,
            $pattern
        );

        Logger::info("Overconfidence flag created", [
            'flag_id' => $flagId,
            'attempt_id' => $attempt['id'],
            'z_score' => round($adjustedZScore, 2),
            'flag_level' => $flagLevel,
        ]);

        return true;
    }

    /**
     * 문제별 통계 계산
     */
    private function calculateQuestionStatistics()
    {
        Logger::debug("Calculating question statistics");

        $questions = $this->db->select("SELECT id FROM questions");

        foreach ($questions as $question) {
            $stats = $this->db->selectOne("
                SELECT
                    COUNT(*) as sample_count,
                    AVG(time_spent_seconds) as avg_time,
                    STDDEV(time_spent_seconds) as std_dev_time
                FROM attempts
                WHERE question_id = ?
                    AND time_spent_seconds > 0
            ", [$question['id']]);

            if ($stats && $stats['sample_count'] > 0) {
                $this->db->update("
                    UPDATE questions
                    SET
                        avg_time_seconds = ?,
                        std_dev_time = ?,
                        sample_count = ?
                    WHERE id = ?
                ", [
                    round($stats['avg_time']),
                    round($stats['std_dev_time'], 2),
                    $stats['sample_count'],
                    $question['id']
                ]);
            }
        }
    }

    /**
     * 아직 분석되지 않은 시도 가져오기
     *
     * @return array 시도 목록
     */
    private function getUnanalyzedAttempts()
    {
        return $this->db->select("
            SELECT a.*
            FROM attempts a
            LEFT JOIN overconfidence_flags f ON a.id = f.attempt_id
            WHERE f.id IS NULL
                AND a.time_spent_seconds > 0
            ORDER BY a.created_at DESC
            LIMIT 10000
        ");
    }

    /**
     * Z-score에 따른 플래그 레벨 결정
     *
     * @param float $zScore Z-score 값
     * @return string|null 플래그 레벨 (null = 정상)
     */
    private function determineFlagLevel($zScore)
    {
        if ($zScore < $this->thresholds['danger']) {
            return 'danger';
        } elseif ($zScore < $this->thresholds['warning']) {
            return 'warning';
        } elseif ($zScore < $this->thresholds['caution']) {
            return 'caution';
        }

        return null; // 정상 범위
    }

    /**
     * 연속 빠른 풀이 패턴 감지
     *
     * @param int $studentId 학생 ID
     * @param int $quizId 퀴즈 ID
     * @return int 연속 횟수
     */
    private function detectConsecutiveFastPattern($studentId, $quizId)
    {
        // 최근 N개 시도에서 과신 오류 발생 횟수 확인
        $recentFlags = $this->db->selectOne("
            SELECT COUNT(*) as count
            FROM overconfidence_flags
            WHERE student_id = ?
                AND quiz_id = ?
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ", [$studentId, $quizId]);

        return $recentFlags ? $recentFlags['count'] : 0;
    }

    /**
     * 패턴 분석
     *
     * @param array $attempt 시도 기록
     * @param int $consecutiveCount 연속 횟수
     * @return string 패턴 유형
     */
    private function detectPattern($attempt, $consecutiveCount)
    {
        if ($consecutiveCount >= $this->config['consecutive_fast_threshold']) {
            return 'consecutive_fast';
        }

        if ($attempt['is_correct']) {
            return 'fast_correct';
        } else {
            return 'fast_incorrect';
        }
    }

    /**
     * 과신 오류 플래그 생성
     *
     * @param array $attempt 시도 기록
     * @param int $avgTime 평균 시간
     * @param float $stdDev 표준편차
     * @param float $zScore Z-score
     * @param string $flagLevel 플래그 레벨
     * @param int $consecutiveCount 연속 횟수
     * @param string $pattern 패턴
     * @return int 플래그 ID
     */
    private function createFlag(
        $attempt,
        $avgTime,
        $stdDev,
        $zScore,
        $flagLevel,
        $consecutiveCount,
        $pattern
    ) {
        return $this->db->insertArray('overconfidence_flags', [
            'attempt_id' => $attempt['id'],
            'student_id' => $attempt['student_id'],
            'question_id' => $attempt['question_id'],
            'quiz_id' => $attempt['quiz_id'],
            'time_spent_seconds' => $attempt['time_spent_seconds'],
            'avg_time_seconds' => $avgTime,
            'std_dev_time' => $stdDev,
            'z_score' => round($zScore, 4),
            'flag_level' => $flagLevel,
            'is_correct' => $attempt['is_correct'],
            'consecutive_fast_count' => $consecutiveCount + 1,
            'pattern_detected' => $pattern,
        ]);
    }

    /**
     * 특정 학생의 과신 오류 통계
     *
     * @param int $studentId 학생 ID
     * @return array 통계 정보
     */
    public function getStudentStats($studentId)
    {
        return $this->db->selectOne("
            SELECT
                COUNT(*) as total_flags,
                SUM(CASE WHEN flag_level = 'caution' THEN 1 ELSE 0 END) as caution_count,
                SUM(CASE WHEN flag_level = 'warning' THEN 1 ELSE 0 END) as warning_count,
                SUM(CASE WHEN flag_level = 'danger' THEN 1 ELSE 0 END) as danger_count,
                AVG(z_score) as avg_z_score,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as fast_correct,
                SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as fast_incorrect
            FROM overconfidence_flags
            WHERE student_id = ?
        ", [$studentId]);
    }

    /**
     * 퀴즈별 과신 오류 통계
     *
     * @param int $quizId 퀴즈 ID
     * @return array 통계 정보
     */
    public function getQuizStats($quizId)
    {
        return $this->db->selectOne("
            SELECT
                COUNT(DISTINCT student_id) as affected_students,
                COUNT(*) as total_flags,
                SUM(CASE WHEN flag_level = 'danger' THEN 1 ELSE 0 END) as danger_count,
                AVG(z_score) as avg_z_score
            FROM overconfidence_flags
            WHERE quiz_id = ?
        ", [$quizId]);
    }

    /**
     * 최근 플래그 목록
     *
     * @param int $limit 제한 개수
     * @return array 플래그 목록
     */
    public function getRecentFlags($limit = 50)
    {
        return $this->db->select("
            SELECT * FROM v_overconfidence_summary
            ORDER BY created_at DESC
            LIMIT ?
        ", [$limit]);
    }
}
