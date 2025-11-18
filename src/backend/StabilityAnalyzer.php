&lt;?php
/**
 * Concept Stability Analyzer
 * Detects unstable understanding even when students get correct answers
 */

require_once __DIR__ . '/Database.php';

class StabilityAnalyzer {
    private $db;

    // Configuration thresholds
    private $STABILITY_THRESHOLD = 60;      // Below this = unstable
    private $HIGH_TIME_MULTIPLIER = 2.0;    // Taking 2x average time = suspicious
    private $REGRESSION_PENALTY = 15;       // Points deducted per regression
    private $INCONSISTENCY_PENALTY = 10;    // Points deducted for time variance
    private $MULTIPLE_ATTEMPT_PENALTY = 5;  // Points per retry needed

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Calculate stability score for a student-concept pair
     * Returns score 0-100 (higher = more stable understanding)
     */
    public function calculateStabilityScore($studentId, $conceptId) {
        // Get all responses for this student-concept combination
        $responses = $this->getConceptResponses($studentId, $conceptId);

        if (empty($responses)) {
            return 50; // Neutral score if no data
        }

        $score = 100; // Start with perfect score

        // Metric 1: Accuracy rate (baseline)
        $accuracyRate = $this->calculateAccuracy($responses);
        if ($accuracyRate < 100) {
            $score -= (100 - $accuracyRate) * 0.3; // Reduce based on errors
        }

        // Metric 2: Time consistency (INSTABILITY INDICATOR)
        $timeVariance = $this->calculateTimeVariance($responses);
        if ($timeVariance > 30) { // High variance = inconsistent understanding
            $score -= $this->INCONSISTENCY_PENALTY;
        }

        // Metric 3: Excessive time on correct answers (INSTABILITY INDICATOR)
        $excessiveTimeRate = $this->calculateExcessiveTimeRate($responses);
        $score -= $excessiveTimeRate * 20;

        // Metric 4: Multiple attempts needed (INSTABILITY INDICATOR)
        $multipleAttemptRate = $this->calculateMultipleAttemptRate($responses);
        $score -= $multipleAttemptRate * $this->MULTIPLE_ATTEMPT_PENALTY;

        // Metric 5: Regression detection (CRITICAL INSTABILITY INDICATOR)
        $regressionCount = $this->detectRegressions($responses);
        $score -= $regressionCount * $this->REGRESSION_PENALTY;

        // Metric 6: Low confidence on correct answers (INSTABILITY INDICATOR)
        $lowConfidenceRate = $this->calculateLowConfidenceRate($responses);
        $score -= $lowConfidenceRate * 15;

        // Ensure score is in valid range
        $score = max(0, min(100, $score));

        return round($score, 2);
    }

    /**
     * Update stability metrics for a student-concept pair
     */
    public function updateStability($studentId, $conceptId) {
        $responses = $this->getConceptResponses($studentId, $conceptId);

        if (empty($responses)) {
            return;
        }

        $totalAttempts = count($responses);
        $correctAttempts = count(array_filter($responses, function($r) {
            return $r['is_correct'] == 1;
        }));

        $accuracyRate = ($correctAttempts / $totalAttempts) * 100;
        $avgTime = $this->calculateAverageTime($responses);
        $timeVariance = $this->calculateTimeVariance($responses);
        $multipleAttemptRate = $this->calculateMultipleAttemptRate($responses);
        $regressionCount = $this->detectRegressions($responses);
        $stabilityScore = $this->calculateStabilityScore($studentId, $conceptId);

        // Determine recommended action
        $recommendedAction = $this->getRecommendedAction($stabilityScore, $accuracyRate);

        // Get last response timestamp
        $lastResponseAt = max(array_column($responses, 'responded_at'));

        // Insert or update stability record
        $sql = "
            INSERT INTO concept_stability (
                student_id, concept_id, total_attempts, correct_attempts,
                accuracy_rate, avg_time_spent, time_variance,
                multiple_attempts_rate, recent_regression_count,
                stability_score, needs_review, recommended_action,
                last_response_at, last_calculated_at
            ) VALUES (
                :student_id, :concept_id, :total_attempts, :correct_attempts,
                :accuracy_rate, :avg_time_spent, :time_variance,
                :multiple_attempts_rate, :recent_regression_count,
                :stability_score, :needs_review, :recommended_action,
                :last_response_at, NOW()
            )
            ON DUPLICATE KEY UPDATE
                total_attempts = :total_attempts,
                correct_attempts = :correct_attempts,
                accuracy_rate = :accuracy_rate,
                avg_time_spent = :avg_time_spent,
                time_variance = :time_variance,
                multiple_attempts_rate = :multiple_attempts_rate,
                recent_regression_count = :recent_regression_count,
                stability_score = :stability_score,
                needs_review = :needs_review,
                recommended_action = :recommended_action,
                last_response_at = :last_response_at,
                last_calculated_at = NOW()
        ";

        $this->db->execute($sql, [
            ':student_id' => $studentId,
            ':concept_id' => $conceptId,
            ':total_attempts' => $totalAttempts,
            ':correct_attempts' => $correctAttempts,
            ':accuracy_rate' => $accuracyRate,
            ':avg_time_spent' => $avgTime,
            ':time_variance' => $timeVariance,
            ':multiple_attempts_rate' => $multipleAttemptRate,
            ':recent_regression_count' => $regressionCount,
            ':stability_score' => $stabilityScore,
            ':needs_review' => $stabilityScore < $this->STABILITY_THRESHOLD ? 1 : 0,
            ':recommended_action' => $recommendedAction,
            ':last_response_at' => $lastResponseAt
        ]);
    }

    /**
     * Get all unstable concepts for a student
     */
    public function getUnstableConcepts($studentId) {
        $sql = "
            SELECT
                cs.*,
                c.name as concept_name,
                c.description as concept_description
            FROM concept_stability cs
            JOIN concepts c ON cs.concept_id = c.id
            WHERE cs.student_id = :student_id
              AND cs.is_unstable = 1
            ORDER BY cs.stability_score ASC
        ";

        return $this->db->fetchAll($sql, [':student_id' => $studentId]);
    }

    /**
     * Get all students with unstable understanding of a concept
     */
    public function getStudentsWithUnstableConcept($conceptId) {
        $sql = "
            SELECT
                cs.*,
                s.name as student_name,
                s.grade_level
            FROM concept_stability cs
            JOIN students s ON cs.student_id = s.id
            WHERE cs.concept_id = :concept_id
              AND cs.is_unstable = 1
            ORDER BY cs.stability_score ASC
        ";

        return $this->db->fetchAll($sql, [':concept_id' => $conceptId]);
    }

    // ========================================
    // Private Helper Methods
    // ========================================

    private function getConceptResponses($studentId, $conceptId) {
        $sql = "
            SELECT sr.*
            FROM student_responses sr
            JOIN problem_concepts pc ON sr.problem_id = pc.problem_id
            WHERE sr.student_id = :student_id
              AND pc.concept_id = :concept_id
            ORDER BY sr.responded_at ASC
        ";

        return $this->db->fetchAll($sql, [
            ':student_id' => $studentId,
            ':concept_id' => $conceptId
        ]);
    }

    private function calculateAccuracy($responses) {
        if (empty($responses)) return 0;

        $correct = count(array_filter($responses, function($r) {
            return $r['is_correct'] == 1;
        }));

        return ($correct / count($responses)) * 100;
    }

    private function calculateAverageTime($responses) {
        $times = array_filter(array_column($responses, 'time_spent_seconds'));
        if (empty($times)) return null;

        return array_sum($times) / count($times);
    }

    private function calculateTimeVariance($responses) {
        $times = array_filter(array_column($responses, 'time_spent_seconds'));
        if (count($times) < 2) return 0;

        $avg = array_sum($times) / count($times);
        $variance = array_sum(array_map(function($t) use ($avg) {
            return pow($t - $avg, 2);
        }, $times)) / count($times);

        return sqrt($variance); // Return standard deviation
    }

    private function calculateExcessiveTimeRate($responses) {
        if (empty($responses)) return 0;

        $avgTime = $this->calculateAverageTime($responses);
        if (!$avgTime) return 0;

        $threshold = $avgTime * $this->HIGH_TIME_MULTIPLIER;

        $excessive = count(array_filter($responses, function($r) use ($threshold) {
            return $r['is_correct'] == 1 &&
                   $r['time_spent_seconds'] > $threshold;
        }));

        return $excessive / count($responses);
    }

    private function calculateMultipleAttemptRate($responses) {
        if (empty($responses)) return 0;

        $multipleAttempts = count(array_filter($responses, function($r) {
            return $r['attempt_number'] > 1;
        }));

        return ($multipleAttempts / count($responses)) * 100;
    }

    private function detectRegressions($responses) {
        if (count($responses) < 2) return 0;

        $regressionCount = 0;
        $recentCorrect = [];

        foreach ($responses as $response) {
            $problemId = $response['problem_id'];

            // If we've seen this problem before and got it correct
            if (isset($recentCorrect[$problemId]) && $recentCorrect[$problemId]) {
                // But now we got it wrong = REGRESSION
                if ($response['is_correct'] == 0) {
                    $regressionCount++;
                }
            }

            // Update history
            $recentCorrect[$problemId] = $response['is_correct'] == 1;
        }

        return $regressionCount;
    }

    private function calculateLowConfidenceRate($responses) {
        $withConfidence = array_filter($responses, function($r) {
            return $r['confidence_level'] !== null && $r['is_correct'] == 1;
        });

        if (empty($withConfidence)) return 0;

        $lowConfidence = count(array_filter($withConfidence, function($r) {
            return $r['confidence_level'] <= 2; // 1-2 on 5-point scale
        }));

        return $lowConfidence / count($withConfidence);
    }

    private function getRecommendedAction($stabilityScore, $accuracyRate) {
        if ($stabilityScore < 40) {
            return 'intensive_review';
        } elseif ($stabilityScore < 60) {
            return 'guided_practice';
        } elseif ($accuracyRate < 80) {
            return 'additional_practice';
        } else {
            return 'monitor';
        }
    }
}
