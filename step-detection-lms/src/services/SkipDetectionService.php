<?php
/**
 * Skip Detection Service
 * 단계 건너뛰기 탐지 알고리즘
 */

class SkipDetectionService {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Run all detection algorithms on a solution
     *
     * @param int $solutionId
     * @return array Detection results
     */
    public function analyzeSkipDetection($solutionId) {
        $detections = [];

        // Get solution and step submissions
        $solution = $this->getSolutionData($solutionId);

        if (!$solution || empty($solution['step_submissions'])) {
            return $detections;
        }

        // Run detection algorithms
        $detections[] = $this->detectTimeAnomaly($solution);
        $detections[] = $this->detectLogicalInconsistency($solution);
        $detections[] = $this->detectSequenceViolation($solution);
        $detections[] = $this->detectHintDependency($solution);

        // Filter out null detections
        $detections = array_filter($detections);

        // Save detections to database
        foreach ($detections as $detection) {
            $this->saveDetection($solutionId, $detection);
        }

        // Update student trust profile
        $this->updateStudentTrustProfile($solution['student_id'], $detections);

        return $detections;
    }

    /**
     * Detect time anomalies (too fast completion)
     */
    private function detectTimeAnomaly($solution) {
        $problemId = $solution['problem_id'];
        $totalTime = $solution['total_time_seconds'];

        // Get average time for this problem
        $avgTime = $this->getAverageProblemTime($problemId);

        if (!$avgTime) {
            return null; // Not enough data
        }

        $threshold = $avgTime * TIME_ANOMALY_THRESHOLD;
        $speedRatio = $totalTime / $avgTime;

        // Too fast detection
        if ($totalTime < $threshold) {
            // Check if all steps were completed uniformly fast
            $isUniform = $this->checkUniformTiming($solution['step_submissions']);

            $severity = 'medium';
            $confidence = 70;

            if ($speedRatio < 0.3) {
                $severity = 'critical';
                $confidence = 95;
            } elseif ($speedRatio < 0.5) {
                $severity = 'high';
                $confidence = 85;
            }

            if ($isUniform) {
                $confidence += 10;
            }

            return [
                'type' => 'time_anomaly',
                'severity' => $severity,
                'confidence' => min($confidence, 100),
                'description' => sprintf(
                    '평균 소요 시간 대비 %.0f%% 빠른 완료. %s',
                    (1 - $speedRatio) * 100,
                    $isUniform ? '모든 단계를 균일한 속도로 완료하여 의심됨.' : ''
                ),
                'affected_steps' => $this->getAnomalousSteps($solution['step_submissions']),
                'evidence' => [
                    'avg_time_expected' => $avgTime,
                    'actual_time' => $totalTime,
                    'speed_ratio' => round($speedRatio, 2),
                    'uniform_timing' => $isUniform
                ]
            ];
        }

        return null;
    }

    /**
     * Detect logical inconsistencies between steps
     */
    private function detectLogicalInconsistency($solution) {
        $submissions = $solution['step_submissions'];
        $inconsistencies = [];

        for ($i = 0; $i < count($submissions) - 1; $i++) {
            $current = $submissions[$i];
            $next = $submissions[$i + 1];

            // Check if current step's output matches next step's expected input
            if (!$this->validateStepConnection($current, $next, $solution['problem_type'])) {
                $inconsistencies[] = [
                    'step_from' => $current['step_id'],
                    'step_to' => $next['step_id'],
                    'reason' => 'Output does not match next input'
                ];
            }
        }

        if (count($inconsistencies) > 0) {
            $severity = count($inconsistencies) >= 2 ? 'high' : 'medium';
            $confidence = min(70 + (count($inconsistencies) * 10), 95);

            return [
                'type' => 'logical_inconsistency',
                'severity' => $severity,
                'confidence' => $confidence,
                'description' => sprintf(
                    '%d개의 단계에서 논리적 연결 불일치 발견. 이전 단계의 출력과 다음 단계의 입력이 일치하지 않음.',
                    count($inconsistencies)
                ),
                'affected_steps' => array_unique(array_merge(
                    array_column($inconsistencies, 'step_from'),
                    array_column($inconsistencies, 'step_to')
                )),
                'evidence' => [
                    'inconsistencies' => $inconsistencies,
                    'total_count' => count($inconsistencies)
                ]
            ];
        }

        return null;
    }

    /**
     * Detect sequence violations (skipping required steps)
     */
    private function detectSequenceViolation($solution) {
        $submissions = $solution['step_submissions'];
        $requiredSteps = $this->getRequiredSteps($solution['problem_id']);

        $completedSteps = array_unique(array_column($submissions, 'step_id'));
        $missingSteps = array_diff($requiredSteps, $completedSteps);

        if (count($missingSteps) > 0) {
            $severity = count($missingSteps) >= 2 ? 'critical' : 'high';

            return [
                'type' => 'sequence_violation',
                'severity' => $severity,
                'confidence' => 90,
                'description' => sprintf(
                    '%d개의 필수 단계를 건너뛰고 최종 답안으로 점프. 정상적인 풀이 과정이 아님.',
                    count($missingSteps)
                ),
                'affected_steps' => array_values($missingSteps),
                'evidence' => [
                    'required_steps' => $requiredSteps,
                    'completed_steps' => $completedSteps,
                    'missing_steps' => array_values($missingSteps)
                ]
            ];
        }

        return null;
    }

    /**
     * Detect hint dependency (excessive hint usage)
     */
    private function detectHintDependency($solution) {
        $submissions = $solution['step_submissions'];
        $totalSteps = count($submissions);
        $hintUsedCount = 0;
        $immediateAnswers = 0;

        foreach ($submissions as $submission) {
            if ($submission['hint_used']) {
                $hintUsedCount++;

                // Check if answered immediately after hint (< 15 seconds)
                if ($submission['hint_viewed_at'] && $submission['time_spent_seconds'] < 15) {
                    $immediateAnswers++;
                }
            }
        }

        $hintRatio = $totalSteps > 0 ? $hintUsedCount / $totalSteps : 0;

        if ($hintRatio >= HINT_DEPENDENCY_THRESHOLD) {
            $severity = 'medium';
            $confidence = 60 + ($hintRatio * 20);

            if ($immediateAnswers >= ($hintUsedCount * 0.8)) {
                $severity = 'high';
                $confidence += 15;
                $description = sprintf(
                    '%d개 단계 중 %d개에서 힌트 사용. 힌트 확인 후 즉시 정답 입력하여 독립적 문제 해결 능력 부족 의심.',
                    $totalSteps,
                    $hintUsedCount
                );
            } else {
                $description = sprintf(
                    '%d개 단계 중 %d개에서 힌트 사용 (%.0f%%). 힌트 의존도가 높음.',
                    $totalSteps,
                    $hintUsedCount,
                    $hintRatio * 100
                );
            }

            return [
                'type' => 'hint_dependency',
                'severity' => $severity,
                'confidence' => min($confidence, 95),
                'description' => $description,
                'affected_steps' => array_column(
                    array_filter($submissions, function($s) { return $s['hint_used']; }),
                    'step_id'
                ),
                'evidence' => [
                    'total_steps' => $totalSteps,
                    'hint_used_count' => $hintUsedCount,
                    'immediate_answers' => $immediateAnswers,
                    'hint_ratio' => round($hintRatio, 2)
                ]
            ];
        }

        return null;
    }

    /**
     * Calculate overall trust score for a solution
     */
    public function calculateTrustScore($solutionId) {
        $detections = $this->getDetectionsBySolution($solutionId);

        $score = 100;

        foreach ($detections as $detection) {
            $penalty = 0;

            switch ($detection['severity']) {
                case 'critical':
                    $penalty = 40;
                    break;
                case 'high':
                    $penalty = 25;
                    break;
                case 'medium':
                    $penalty = 15;
                    break;
                case 'low':
                    $penalty = 5;
                    break;
            }

            // Adjust penalty by confidence
            $penalty = $penalty * ($detection['confidence_score'] / 100);

            $score -= $penalty;
        }

        return max(0, min(100, $score));
    }

    // ========== Helper Methods ==========

    private function getSolutionData($solutionId) {
        $sql = "SELECT ss.*, p.problem_type_id,
                       (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                           'step_id', step_id,
                           'step_order', ps.step_order,
                           'student_input', student_input,
                           'is_correct', is_correct,
                           'time_spent_seconds', time_spent_seconds,
                           'hint_used', hint_used,
                           'hint_viewed_at', hint_viewed_at
                       ))
                       FROM step_submissions sub
                       LEFT JOIN problem_steps ps ON sub.step_id = ps.id
                       WHERE sub.solution_id = ss.id
                       ORDER BY ps.step_order) as step_submissions
                FROM student_solutions ss
                LEFT JOIN problems p ON ss.problem_id = p.id
                WHERE ss.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $solutionId]);
        $result = $stmt->fetch();

        if ($result && $result['step_submissions']) {
            $result['step_submissions'] = json_decode($result['step_submissions'], true);
        }

        return $result;
    }

    private function getAverageProblemTime($problemId) {
        $sql = "SELECT AVG(total_time_seconds) as avg_time
                FROM student_solutions
                WHERE problem_id = :problem_id
                  AND status = 'submitted'
                  AND total_time_seconds IS NOT NULL
                  AND total_time_seconds > 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':problem_id' => $problemId]);
        $result = $stmt->fetch();

        return $result['avg_time'] ? (float)$result['avg_time'] : null;
    }

    private function checkUniformTiming($submissions) {
        if (count($submissions) < 3) {
            return false;
        }

        $times = array_column($submissions, 'time_spent_seconds');
        $avg = array_sum($times) / count($times);
        $variance = 0;

        foreach ($times as $time) {
            $variance += pow($time - $avg, 2);
        }

        $variance /= count($times);
        $stdDev = sqrt($variance);

        // If standard deviation is very small, timing is uniform
        $coefficientOfVariation = $avg > 0 ? ($stdDev / $avg) : 0;

        return $coefficientOfVariation < 0.3; // Less than 30% variation
    }

    private function getAnomalousSteps($submissions) {
        $expectedTimes = [];

        foreach ($submissions as $submission) {
            if ($submission['time_spent_seconds'] < 10) { // Less than 10 seconds
                $expectedTimes[] = $submission['step_id'];
            }
        }

        return $expectedTimes;
    }

    private function validateStepConnection($currentStep, $nextStep, $problemType) {
        // This would contain problem-type-specific validation logic
        // For now, we'll do a simple check
        // In production, this should be more sophisticated

        return true; // Simplified for MVP
    }

    private function getRequiredSteps($problemId) {
        $sql = "SELECT id FROM problem_steps WHERE problem_id = :problem_id AND is_required = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':problem_id' => $problemId]);

        return array_column($stmt->fetchAll(), 'id');
    }

    private function saveDetection($solutionId, $detection) {
        $sql = "INSERT INTO skip_detections (solution_id, detection_type, severity, confidence_score,
                                             description, affected_steps, evidence_data)
                VALUES (:solution_id, :detection_type, :severity, :confidence_score,
                        :description, :affected_steps, :evidence_data)";

        $stmt = $this->db->prepare($sql);

        $params = [
            ':solution_id' => $solutionId,
            ':detection_type' => $detection['type'],
            ':severity' => $detection['severity'],
            ':confidence_score' => $detection['confidence'],
            ':description' => $detection['description'],
            ':affected_steps' => json_encode($detection['affected_steps']),
            ':evidence_data' => json_encode($detection['evidence'])
        ];

        $stmt->execute($params);
    }

    private function getDetectionsBySolution($solutionId) {
        $sql = "SELECT * FROM skip_detections WHERE solution_id = :solution_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':solution_id' => $solutionId]);

        return $stmt->fetchAll();
    }

    private function updateStudentTrustProfile($studentId, $detections) {
        $counts = [
            'time_anomaly' => 0,
            'logical_inconsistency' => 0,
            'sequence_violation' => 0,
            'hint_dependency' => 0
        ];

        foreach ($detections as $detection) {
            if (isset($counts[$detection['type']])) {
                $counts[$detection['type']]++;
            }
        }

        $sql = "INSERT INTO student_trust_profiles (student_id, total_solutions, suspicious_solutions,
                                                     time_anomaly_count, logical_inconsistency_count,
                                                     sequence_violation_count, hint_dependency_count)
                VALUES (:student_id, 1, :suspicious, :time_anomaly, :logical_inconsistency,
                        :sequence_violation, :hint_dependency)
                ON DUPLICATE KEY UPDATE
                    total_solutions = total_solutions + 1,
                    suspicious_solutions = suspicious_solutions + :suspicious,
                    time_anomaly_count = time_anomaly_count + :time_anomaly,
                    logical_inconsistency_count = logical_inconsistency_count + :logical_inconsistency,
                    sequence_violation_count = sequence_violation_count + :sequence_violation,
                    hint_dependency_count = hint_dependency_count + :hint_dependency,
                    overall_trust_score = (
                        SELECT 100 - (suspicious_solutions * 100.0 / total_solutions * 0.5)
                        FROM student_trust_profiles
                        WHERE student_id = :student_id
                    )";

        $stmt = $this->db->prepare($sql);

        $params = [
            ':student_id' => $studentId,
            ':suspicious' => count($detections) > 0 ? 1 : 0,
            ':time_anomaly' => $counts['time_anomaly'],
            ':logical_inconsistency' => $counts['logical_inconsistency'],
            ':sequence_violation' => $counts['sequence_violation'],
            ':hint_dependency' => $counts['hint_dependency']
        ];

        $stmt->execute($params);
    }
}
