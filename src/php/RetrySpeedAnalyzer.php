<?php
/**
 * Retry Speed Analyzer
 * PHP 7.1.9 Compatible
 *
 * Purpose: Analyze student retry attempts and calculate speed improvements
 * Answers the question: "Can I do this problem faster if I solve it again?"
 */

namespace AltEducation\Analytics;

use PDO;
use PDOException;
use Exception;

class RetrySpeedAnalyzer
{
    private $db;

    /**
     * Constructor
     *
     * @param PDO $db Database connection
     */
    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * 새로운 시도 기록
     *
     * @param array $attemptData Attempt data
     * @return string Attempt UUID
     */
    public function recordAttempt(array $attemptData)
    {
        $requiredFields = ['student_id', 'problem_id', 'student_answer', 'is_correct', 'time_spent_seconds', 'started_at', 'completed_at'];

        foreach ($requiredFields as $field) {
            if (!isset($attemptData[$field])) {
                throw new Exception("Missing required field: {$field}");
            }
        }

        try {
            // 현재 시도 횟수 확인
            $stmt = $this->db->prepare(
                "SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt
                 FROM student_attempts
                 WHERE student_id = ? AND problem_id = ?"
            );
            $stmt->execute([$attemptData['student_id'], $attemptData['problem_id']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $attemptNumber = $result['next_attempt'];

            // UUID 생성
            $attemptId = $this->generateUUID();

            // 시도 기록 삽입
            $stmt = $this->db->prepare(
                "INSERT INTO student_attempts
                 (id, student_id, problem_id, attempt_number, student_answer, is_correct,
                  time_spent_seconds, started_at, completed_at, interaction_data, moodle_activity_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );

            $stmt->execute([
                $attemptId,
                $attemptData['student_id'],
                $attemptData['problem_id'],
                $attemptNumber,
                json_encode($attemptData['student_answer']),
                $attemptData['is_correct'] ? 1 : 0,
                $attemptData['time_spent_seconds'],
                $attemptData['started_at'],
                $attemptData['completed_at'],
                isset($attemptData['interaction_data']) ? json_encode($attemptData['interaction_data']) : null,
                $attemptData['moodle_activity_id'] ?? null
            ]);

            // 트리거가 자동으로 분석을 수행하지만, 명시적으로도 호출 가능
            if ($attemptNumber > 1) {
                $this->analyzeRetrySpeed($attemptData['student_id'], $attemptData['problem_id']);
            }

            return $attemptId;

        } catch (PDOException $e) {
            error_log("Failed to record attempt: " . $e->getMessage());
            throw new Exception("Failed to record attempt");
        }
    }

    /**
     * 재시도 속도 분석
     *
     * @param string $studentId Student UUID
     * @param string $problemId Problem UUID
     * @return array|null Analysis results or null if less than 2 attempts
     */
    public function analyzeRetrySpeed($studentId, $problemId)
    {
        try {
            // 모든 시도 가져오기
            $stmt = $this->db->prepare(
                "SELECT id, attempt_number, time_spent_seconds, is_correct, completed_at
                 FROM student_attempts
                 WHERE student_id = ? AND problem_id = ?
                 ORDER BY attempt_number ASC"
            );
            $stmt->execute([$studentId, $problemId]);
            $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($attempts) < 2) {
                return null; // 분석하기에 시도 횟수 부족
            }

            $firstAttempt = $attempts[0];
            $latestAttempt = end($attempts);

            // 시간 개선 계산
            $timeDiff = $firstAttempt['time_spent_seconds'] - $latestAttempt['time_spent_seconds'];
            $improvementPercentage = ($timeDiff / $firstAttempt['time_spent_seconds']) * 100;

            // 정답 횟수 계산
            $correctAttempts = array_filter($attempts, function($a) {
                return $a['is_correct'] == 1;
            });

            // 개선 여부 판단
            $isImproving = $improvementPercentage > 0;

            // 분석 결과 저장
            $analysisId = $this->generateUUID();

            $stmt = $this->db->prepare(
                "INSERT INTO retry_speed_analysis
                 (id, student_id, problem_id, first_attempt_id, latest_attempt_id,
                  first_attempt_time, latest_attempt_time, time_improvement_seconds,
                  improvement_percentage, total_attempts, correct_attempts, is_improving)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                  latest_attempt_id = VALUES(latest_attempt_id),
                  latest_attempt_time = VALUES(latest_attempt_time),
                  time_improvement_seconds = VALUES(time_improvement_seconds),
                  improvement_percentage = VALUES(improvement_percentage),
                  total_attempts = VALUES(total_attempts),
                  correct_attempts = VALUES(correct_attempts),
                  is_improving = VALUES(is_improving),
                  last_analyzed_at = CURRENT_TIMESTAMP"
            );

            $stmt->execute([
                $analysisId,
                $studentId,
                $problemId,
                $firstAttempt['id'],
                $latestAttempt['id'],
                $firstAttempt['time_spent_seconds'],
                $latestAttempt['time_spent_seconds'],
                $timeDiff,
                round($improvementPercentage, 2),
                count($attempts),
                count($correctAttempts),
                $isImproving ? 1 : 0
            ]);

            return [
                'student_id' => $studentId,
                'problem_id' => $problemId,
                'total_attempts' => count($attempts),
                'correct_attempts' => count($correctAttempts),
                'first_attempt_time' => $firstAttempt['time_spent_seconds'],
                'latest_attempt_time' => $latestAttempt['time_spent_seconds'],
                'time_improvement_seconds' => $timeDiff,
                'improvement_percentage' => round($improvementPercentage, 2),
                'is_improving' => $isImproving,
                'improvement_level' => $this->getImprovementLevel($improvementPercentage)
            ];

        } catch (PDOException $e) {
            error_log("Failed to analyze retry speed: " . $e->getMessage());
            throw new Exception("Failed to analyze retry speed");
        }
    }

    /**
     * 개선 수준 판단
     *
     * @param float $improvementPercentage Improvement percentage
     * @return string Improvement level
     */
    private function getImprovementLevel($improvementPercentage)
    {
        if ($improvementPercentage >= 30) {
            return 'Excellent'; // 탁월한 개선
        } elseif ($improvementPercentage >= 15) {
            return 'Good'; // 좋은 개선
        } elseif ($improvementPercentage >= 5) {
            return 'Fair'; // 보통 개선
        } elseif ($improvementPercentage < 0) {
            return 'Slower'; // 느려짐
        } else {
            return 'No Change'; // 변화 없음
        }
    }

    /**
     * 학생의 전체 재시도 개선 현황 조회
     *
     * @param string $studentId Student UUID
     * @param string|null $moduleId Optional module filter
     * @return array List of retry improvements
     */
    public function getStudentRetryImprovements($studentId, $moduleId = null)
    {
        try {
            $sql = "SELECT * FROM v_student_retry_improvement WHERE student_id = ?";
            $params = [$studentId];

            if ($moduleId !== null) {
                $sql .= " AND module_id = ?";
                $params[] = $moduleId;
            }

            $sql .= " ORDER BY last_analyzed_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            error_log("Failed to get retry improvements: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 재시도 속도 피드백 생성 (한국어)
     *
     * @param array $analysis Analysis results
     * @return string Korean feedback message
     */
    public function generateKoreanFeedback(array $analysis)
    {
        $improvement = $analysis['improvement_percentage'];
        $timeSaved = abs($analysis['time_improvement_seconds']);
        $attempts = $analysis['total_attempts'];
        $correctAttempts = $analysis['correct_attempts'];

        $messages = [];

        // 시도 횟수 피드백
        if ($attempts == 2) {
            $messages[] = "이 문제를 두 번째 풀었어요!";
        } else {
            $messages[] = "이 문제를 {$attempts}번 풀었어요!";
        }

        // 속도 개선 피드백
        if ($improvement >= 30) {
            $messages[] = "🎉 놀라워요! 첫 시도보다 {$timeSaved}초나 빨라졌어요! ({$improvement}% 개선)";
            $messages[] = "문제를 정말 잘 이해하고 있네요!";
        } elseif ($improvement >= 15) {
            $messages[] = "👍 잘했어요! {$timeSaved}초 더 빨라졌어요! ({$improvement}% 개선)";
            $messages[] = "연습할수록 더 빨라지고 있어요!";
        } elseif ($improvement >= 5) {
            $messages[] = "좋아요! {$timeSaved}초 빨라졌어요. ({$improvement}% 개선)";
            $messages[] = "계속 연습하면 더 빨라질 거예요!";
        } elseif ($improvement > -5) {
            $messages[] = "비슷한 시간이 걸렸어요.";
            $messages[] = "문제를 신중하게 풀고 있네요!";
        } else {
            $messages[] = "이번에는 더 오래 걸렸어요. ({$timeSaved}초 더 걸림)";
            $messages[] = "괜찮아요! 정확하게 푸는 게 더 중요해요.";
        }

        // 정답률 피드백
        $accuracy = ($correctAttempts / $attempts) * 100;
        if ($accuracy == 100) {
            $messages[] = "✨ 모든 시도에서 정답을 맞혔어요!";
        } elseif ($accuracy >= 70) {
            $messages[] = "{$attempts}번 중 {$correctAttempts}번 맞혔어요. 잘하고 있어요!";
        } else {
            $messages[] = "더 연습하면 정답률도 높아질 거예요!";
        }

        return implode("\n", $messages);
    }

    /**
     * 재시도 권장 여부 판단
     *
     * @param string $studentId Student UUID
     * @param string $problemId Problem UUID
     * @return array Recommendation data
     */
    public function shouldRetry($studentId, $problemId)
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT attempt_number, is_correct, time_spent_seconds
                 FROM student_attempts
                 WHERE student_id = ? AND problem_id = ?
                 ORDER BY attempt_number DESC
                 LIMIT 1"
            );
            $stmt->execute([$studentId, $problemId]);
            $lastAttempt = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$lastAttempt) {
                return [
                    'should_retry' => false,
                    'reason' => 'no_attempts',
                    'message' => '아직 이 문제를 풀지 않았어요.'
                ];
            }

            // 이미 정답이고 빠른 시간에 푼 경우
            if ($lastAttempt['is_correct'] && $lastAttempt['time_spent_seconds'] < 30) {
                return [
                    'should_retry' => false,
                    'reason' => 'already_mastered',
                    'message' => '이미 이 문제를 완벽하게 이해했어요! 다른 문제에 도전해보세요.'
                ];
            }

            // 틀렸거나 느린 경우 재시도 권장
            if (!$lastAttempt['is_correct']) {
                return [
                    'should_retry' => true,
                    'reason' => 'incorrect',
                    'message' => '다시 한 번 도전해볼까요? 이번엔 더 잘할 수 있을 거예요!'
                ];
            }

            // 정답이지만 시간이 오래 걸린 경우
            if ($lastAttempt['time_spent_seconds'] > 60) {
                return [
                    'should_retry' => true,
                    'reason' => 'slow',
                    'message' => '정답이에요! 다시 풀어서 더 빨리 풀 수 있는지 확인해볼까요?'
                ];
            }

            // 분석 데이터 확인
            $stmt = $this->db->prepare(
                "SELECT is_improving, improvement_percentage, total_attempts
                 FROM retry_speed_analysis
                 WHERE student_id = ? AND problem_id = ?"
            );
            $stmt->execute([$studentId, $problemId]);
            $analysis = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($analysis && $analysis['is_improving'] && $analysis['total_attempts'] < 5) {
                return [
                    'should_retry' => true,
                    'reason' => 'improving',
                    'message' => '점점 더 빨라지고 있어요! 한 번 더 도전해볼까요?'
                ];
            }

            return [
                'should_retry' => false,
                'reason' => 'sufficient_practice',
                'message' => '이 문제는 충분히 연습했어요. 다음 문제로 넘어가도 좋아요!'
            ];

        } catch (PDOException $e) {
            error_log("Failed to determine retry recommendation: " . $e->getMessage());
            return [
                'should_retry' => false,
                'reason' => 'error',
                'message' => '재시도 분석 중 오류가 발생했어요.'
            ];
        }
    }

    /**
     * 학생 진행상황 업데이트
     *
     * @param string $studentId Student UUID
     * @param string $moduleId Module UUID
     * @return void
     */
    public function updateStudentProgress($studentId, $moduleId)
    {
        try {
            // 모듈의 전체 통계 계산
            $stmt = $this->db->prepare(
                "SELECT
                    COUNT(DISTINCT sa.problem_id) AS problems_attempted,
                    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS problems_correct,
                    COUNT(CASE WHEN sa.attempt_number > 1 THEN 1 END) AS problems_retried,
                    AVG(sa.time_spent_seconds) AS avg_time,
                    AVG(rsa.improvement_percentage) AS avg_improvement
                 FROM student_attempts sa
                 LEFT JOIN problems p ON sa.problem_id = p.id
                 LEFT JOIN retry_speed_analysis rsa ON sa.student_id = rsa.student_id AND sa.problem_id = rsa.problem_id
                 WHERE sa.student_id = ? AND p.module_id = ?"
            );
            $stmt->execute([$studentId, $moduleId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // 진행률 계산 (모듈의 전체 문제 수 대비)
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) AS total_problems FROM problems WHERE module_id = ?"
            );
            $stmt->execute([$moduleId]);
            $totalProblems = $stmt->fetch(PDO::FETCH_ASSOC)['total_problems'];

            $progressPercentage = $totalProblems > 0
                ? ($stats['problems_attempted'] / $totalProblems) * 100
                : 0;

            // 진행상황 업데이트
            $stmt = $this->db->prepare(
                "INSERT INTO student_progress
                 (id, student_id, module_id, problems_attempted, problems_correct, problems_retried,
                  average_time_seconds, average_improvement_percentage, progress_percentage, started_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE
                  problems_attempted = VALUES(problems_attempted),
                  problems_correct = VALUES(problems_correct),
                  problems_retried = VALUES(problems_retried),
                  average_time_seconds = VALUES(average_time_seconds),
                  average_improvement_percentage = VALUES(average_improvement_percentage),
                  progress_percentage = VALUES(progress_percentage),
                  last_activity_at = NOW()"
            );

            $stmt->execute([
                $this->generateUUID(),
                $studentId,
                $moduleId,
                $stats['problems_attempted'] ?? 0,
                $stats['problems_correct'] ?? 0,
                $stats['problems_retried'] ?? 0,
                $stats['avg_time'] ?? null,
                $stats['avg_improvement'] ?? null,
                round($progressPercentage, 2)
            ]);

        } catch (PDOException $e) {
            error_log("Failed to update student progress: " . $e->getMessage());
        }
    }

    /**
     * UUID 생성 (PHP 7.1 호환)
     *
     * @return string
     */
    private function generateUUID()
    {
        $data = random_bytes(16);

        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
