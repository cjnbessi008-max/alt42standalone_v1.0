<?php
/**
 * Recovery Metrics Calculation
 * Calculates cognitive recovery metrics from pre/post rest assessments
 */

class RecoveryMetrics {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Calculate recovery metrics for a rest session
     * @param int $restSessionId Rest session ID
     * @return array Recovery metrics
     */
    public function calculateRecovery($restSessionId) {
        // Get pre and post assessments
        $assessments = $this->getRestAssessments($restSessionId);

        if (!$assessments['pre_rest'] || !$assessments['post_rest']) {
            throw new Exception('Both pre and post rest assessments are required');
        }

        $pre = $assessments['pre_rest'];
        $post = $assessments['post_rest'];

        // Calculate score-based metrics
        $scoreChange = $post['normalized_score'] - $pre['normalized_score'];
        $scoreRecoveryRate = $pre['normalized_score'] > 0
            ? ($scoreChange / $pre['normalized_score']) * 100
            : 0;

        // Calculate accuracy metrics
        $accuracyChange = $post['accuracy_rate'] - $pre['accuracy_rate'];
        $accuracyRecoveryRate = $pre['accuracy_rate'] > 0
            ? ($accuracyChange / $pre['accuracy_rate']) * 100
            : 0;

        // Calculate reaction time metrics (lower is better)
        $reactionTimeImprovement = $pre['reaction_time_avg'] - $post['reaction_time_avg'];
        $reactionTimeRecoveryRate = $pre['reaction_time_avg'] > 0
            ? ($reactionTimeImprovement / $pre['reaction_time_avg']) * 100
            : 0;

        // Calculate overall recovery score (weighted average)
        $overallRecoveryScore = $this->calculateOverallScore(
            $scoreRecoveryRate,
            $accuracyRecoveryRate,
            $reactionTimeRecoveryRate
        );

        // Determine recovery category
        $recoveryCategory = $this->categorizeRecovery($overallRecoveryScore);

        // Get rest session data
        $sessionSql = "SELECT actual_duration FROM rest_sessions WHERE id = :id";
        $stmt = $this->db->prepare($sessionSql);
        $stmt->execute([':id' => $restSessionId]);
        $session = $stmt->fetch();
        $restDuration = $session['actual_duration'] ?? 0;

        // Calculate rest effectiveness (score improvement per minute of rest)
        $restMinutes = $restDuration / 60;
        $restEffectiveness = $restMinutes > 0
            ? $overallRecoveryScore / $restMinutes
            : 0;

        // Calculate consistency score (based on variation in reaction times)
        $consistencyScore = $this->calculateConsistency($post['id']);

        // Calculate fatigue indicator (negative recovery = more fatigue)
        $fatigueIndicator = max(0, -$overallRecoveryScore);

        // Prepare metadata
        $metadata = [
            'pre_assessment' => [
                'score' => $pre['normalized_score'],
                'accuracy' => $pre['accuracy_rate'],
                'reaction_time' => $pre['reaction_time_avg']
            ],
            'post_assessment' => [
                'score' => $post['normalized_score'],
                'accuracy' => $post['accuracy_rate'],
                'reaction_time' => $post['reaction_time_avg']
            ],
            'calculation_timestamp' => date('Y-m-d H:i:s')
        ];

        // Insert recovery metrics
        $sql = "INSERT INTO recovery_metrics (
                    rest_session_id, user_id, pre_assessment_id, post_assessment_id,
                    score_recovery_rate, score_change,
                    accuracy_recovery_rate, accuracy_change,
                    reaction_time_improvement, reaction_time_recovery_rate,
                    overall_recovery_score, recovery_category,
                    rest_duration, rest_effectiveness_score,
                    consistency_score, fatigue_indicator,
                    calculation_metadata
                ) VALUES (
                    :rest_session_id, :user_id, :pre_id, :post_id,
                    :score_recovery, :score_change,
                    :accuracy_recovery, :accuracy_change,
                    :rt_improvement, :rt_recovery,
                    :overall_score, :category,
                    :rest_duration, :rest_effectiveness,
                    :consistency, :fatigue,
                    :metadata
                )";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':rest_session_id' => $restSessionId,
            ':user_id' => $pre['user_id'],
            ':pre_id' => $pre['id'],
            ':post_id' => $post['id'],
            ':score_recovery' => $scoreRecoveryRate,
            ':score_change' => $scoreChange,
            ':accuracy_recovery' => $accuracyRecoveryRate,
            ':accuracy_change' => $accuracyChange,
            ':rt_improvement' => $reactionTimeImprovement,
            ':rt_recovery' => $reactionTimeRecoveryRate,
            ':overall_score' => $overallRecoveryScore,
            ':category' => $recoveryCategory,
            ':rest_duration' => $restDuration,
            ':rest_effectiveness' => $restEffectiveness,
            ':consistency' => $consistencyScore,
            ':fatigue' => $fatigueIndicator,
            ':metadata' => json_encode($metadata)
        ]);

        $metricsId = $this->db->lastInsertId();

        return [
            'id' => $metricsId,
            'rest_session_id' => $restSessionId,
            'score_recovery_rate' => $scoreRecoveryRate,
            'accuracy_recovery_rate' => $accuracyRecoveryRate,
            'reaction_time_improvement' => $reactionTimeImprovement,
            'overall_recovery_score' => $overallRecoveryScore,
            'recovery_category' => $recoveryCategory,
            'rest_effectiveness' => $restEffectiveness,
            'consistency_score' => $consistencyScore,
            'fatigue_indicator' => $fatigueIndicator
        ];
    }

    /**
     * Get pre and post rest assessments
     * @param int $restSessionId
     * @return array
     */
    private function getRestAssessments($restSessionId) {
        $sql = "SELECT * FROM cognitive_assessments
                WHERE rest_session_id = :session_id
                AND assessment_timing IN ('pre_rest', 'post_rest')
                AND status = 'completed'";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':session_id' => $restSessionId]);
        $assessments = $stmt->fetchAll();

        $result = ['pre_rest' => null, 'post_rest' => null];

        foreach ($assessments as $assessment) {
            $result[$assessment['assessment_timing']] = $assessment;
        }

        return $result;
    }

    /**
     * Calculate overall recovery score (weighted average)
     * @param float $scoreRecovery
     * @param float $accuracyRecovery
     * @param float $reactionTimeRecovery
     * @return float
     */
    private function calculateOverallScore($scoreRecovery, $accuracyRecovery, $reactionTimeRecovery) {
        // Weights: score 40%, accuracy 30%, reaction time 30%
        $weights = [
            'score' => 0.4,
            'accuracy' => 0.3,
            'reaction_time' => 0.3
        ];

        $overallScore = (
            $scoreRecovery * $weights['score'] +
            $accuracyRecovery * $weights['accuracy'] +
            $reactionTimeRecovery * $weights['reaction_time']
        );

        return round($overallScore, 2);
    }

    /**
     * Categorize recovery based on overall score
     * @param float $score
     * @return string
     */
    private function categorizeRecovery($score) {
        if ($score >= RECOVERY_EXCELLENT) {
            return 'excellent';
        } elseif ($score >= RECOVERY_GOOD) {
            return 'good';
        } elseif ($score >= RECOVERY_MODERATE) {
            return 'moderate';
        } elseif ($score >= RECOVERY_POOR) {
            return 'poor';
        } else {
            return 'declined';
        }
    }

    /**
     * Calculate consistency score from response variations
     * @param int $assessmentId
     * @return float
     */
    private function calculateConsistency($assessmentId) {
        $sql = "SELECT reaction_time FROM assessment_responses
                WHERE assessment_id = :id
                ORDER BY response_timestamp";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $assessmentId]);
        $times = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($times) < 2) {
            return 100; // Perfect consistency if only one response
        }

        // Calculate coefficient of variation
        $mean = array_sum($times) / count($times);
        $variance = 0;
        foreach ($times as $time) {
            $variance += pow($time - $mean, 2);
        }
        $variance /= count($times);
        $stdDev = sqrt($variance);

        $cv = $mean > 0 ? ($stdDev / $mean) * 100 : 0;

        // Convert to consistency score (lower CV = higher consistency)
        // CV of 0% = 100 consistency, CV of 100% = 0 consistency
        $consistencyScore = max(0, 100 - $cv);

        return round($consistencyScore, 2);
    }

    /**
     * Get recovery metrics for a session
     * @param int $restSessionId
     * @return array|null
     */
    public function getMetrics($restSessionId) {
        $sql = "SELECT * FROM recovery_metrics WHERE rest_session_id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $restSessionId]);
        return $stmt->fetch();
    }

    /**
     * Get user's recovery history
     * @param int $userId
     * @param int $limit
     * @return array
     */
    public function getUserRecoveryHistory($userId, $limit = 50) {
        $sql = "SELECT rm.*, rs.start_time, rs.actual_duration
                FROM recovery_metrics rm
                JOIN rest_sessions rs ON rm.rest_session_id = rs.id
                WHERE rm.user_id = :user_id
                ORDER BY rm.calculated_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get average recovery metrics for a user
     * @param int $userId
     * @return array
     */
    public function getUserAverageRecovery($userId) {
        $sql = "SELECT
                    AVG(overall_recovery_score) as avg_recovery,
                    AVG(rest_effectiveness_score) as avg_effectiveness,
                    AVG(consistency_score) as avg_consistency,
                    COUNT(*) as total_sessions
                FROM recovery_metrics
                WHERE user_id = :user_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetch();
    }
}
