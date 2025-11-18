<?php
/**
 * DMN Drift Calculator Service
 *
 * Calculates DMN (Default Mode Network) drift metrics based on:
 * - Response time patterns
 * - Accuracy trends
 * - Interaction patterns
 * - Focus and engagement indicators
 */

class DmnDriftCalculator {
    private $db;

    // Weight factors for DMN drift score calculation
    const WEIGHT_RESPONSE_TIME = 0.25;
    const WEIGHT_ACCURACY = 0.30;
    const WEIGHT_INTERACTION = 0.20;
    const WEIGHT_FOCUS = 0.15;
    const WEIGHT_IDLE = 0.10;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Calculate DMN drift metrics for a given session and time window
     *
     * @param int $sessionId
     * @param string $windowStart
     * @param string $windowEnd
     * @return array
     */
    public function calculateDriftMetrics($sessionId, $windowStart = null, $windowEnd = null) {
        // Default to last 5 minutes if not specified
        if (!$windowEnd) {
            $windowEnd = date('Y-m-d H:i:s');
        }
        if (!$windowStart) {
            $windowStart = date('Y-m-d H:i:s', strtotime('-5 minutes', strtotime($windowEnd)));
        }

        $metrics = [
            'session_id' => $sessionId,
            'time_window_start' => $windowStart,
            'time_window_end' => $windowEnd,
            'student_id' => $this->getStudentIdFromSession($sessionId)
        ];

        // Calculate individual components
        $metrics = array_merge($metrics, $this->calculateResponseTimeMetrics($sessionId, $windowStart, $windowEnd));
        $metrics = array_merge($metrics, $this->calculateAccuracyMetrics($sessionId, $windowStart, $windowEnd));
        $metrics = array_merge($metrics, $this->calculateInteractionMetrics($sessionId, $windowStart, $windowEnd));
        $metrics = array_merge($metrics, $this->calculateFocusMetrics($sessionId, $windowStart, $windowEnd));
        $metrics = array_merge($metrics, $this->calculateIdleMetrics($sessionId, $windowStart, $windowEnd));

        // Calculate composite DMN drift score
        $driftScore = $this->calculateCompositeDriftScore($metrics);
        $metrics['dmn_drift_score'] = $driftScore;
        $metrics['drift_level'] = $this->getDriftLevel($driftScore);

        // Determine if intervention is needed
        $metrics['intervention_needed'] = $driftScore >= 60; // High threshold
        $metrics['recommended_action'] = $this->getRecommendedAction($metrics);

        return $metrics;
    }

    /**
     * Calculate response time metrics
     */
    private function calculateResponseTimeMetrics($sessionId, $start, $end) {
        $query = "
            SELECT
                AVG(response_time_seconds) * 1000 as avg_response_time_ms,
                VARIANCE(response_time_seconds) * 1000000 as response_time_variance,
                COUNT(*) as attempt_count
            FROM problem_attempts
            WHERE session_id = :session_id
            AND attempted_at BETWEEN :start AND :end
            AND response_time_seconds IS NOT NULL
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $start,
            'end' => $end
        ]);

        $result = $stmt->fetch();

        // Calculate trend (compare to previous window)
        $trend = $this->calculateResponseTimeTrend($sessionId, $start);

        return [
            'avg_response_time_ms' => round($result['avg_response_time_ms'] ?? 0, 2),
            'response_time_variance' => round($result['response_time_variance'] ?? 0, 2),
            'response_time_trend' => round($trend, 2)
        ];
    }

    /**
     * Calculate accuracy metrics
     */
    private function calculateAccuracyMetrics($sessionId, $start, $end) {
        $query = "
            SELECT
                AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as accuracy_rate,
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts
            FROM problem_attempts
            WHERE session_id = :session_id
            AND attempted_at BETWEEN :start AND :end
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $start,
            'end' => $end
        ]);

        $result = $stmt->fetch();

        // Calculate trend
        $trend = $this->calculateAccuracyTrend($sessionId, $start);

        return [
            'accuracy_rate' => round($result['accuracy_rate'] ?? 0, 2),
            'accuracy_trend' => round($trend, 2)
        ];
    }

    /**
     * Calculate interaction pattern metrics
     */
    private function calculateInteractionMetrics($sessionId, $start, $end) {
        $query = "
            SELECT
                COUNT(*) as total_events,
                COUNT(CASE WHEN event_type = 'click' THEN 1 END) as click_count,
                COUNT(CASE WHEN event_type = 'scroll' THEN 1 END) as scroll_count,
                COUNT(CASE WHEN event_type = 'mouse_move' THEN 1 END) as mouse_move_count
            FROM interaction_events
            WHERE session_id = :session_id
            AND timestamp BETWEEN :start AND :end
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $start,
            'end' => $end
        ]);

        $result = $stmt->fetch();

        // Calculate duration in minutes
        $duration = (strtotime($end) - strtotime($start)) / 60;
        $duration = max($duration, 0.1); // Avoid division by zero

        $clickFrequency = $result['click_count'] / $duration;

        // Calculate pattern irregularity (simplified)
        $patternIrregularity = $this->calculatePatternIrregularity($sessionId, $start, $end);

        return [
            'click_frequency' => round($clickFrequency, 2),
            'click_pattern_irregularity' => round($patternIrregularity, 2),
            'scroll_activity_score' => round($result['scroll_count'] / max($duration, 1), 2)
        ];
    }

    /**
     * Calculate focus metrics (tab switches, focus loss)
     */
    private function calculateFocusMetrics($sessionId, $start, $end) {
        $query = "
            SELECT
                COUNT(CASE WHEN event_type = 'focus_loss' THEN 1 END) as focus_loss_count,
                COUNT(CASE WHEN event_type = 'focus_gain' THEN 1 END) as focus_gain_count
            FROM interaction_events
            WHERE session_id = :session_id
            AND timestamp BETWEEN :start AND :end
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $start,
            'end' => $end
        ]);

        $result = $stmt->fetch();

        return [
            'focus_loss_count' => $result['focus_loss_count'] ?? 0,
            'tab_switch_count' => $result['focus_loss_count'] ?? 0 // Simplified
        ];
    }

    /**
     * Calculate idle time metrics
     */
    private function calculateIdleMetrics($sessionId, $start, $end) {
        $query = "
            SELECT
                COUNT(CASE WHEN event_type = 'idle_start' THEN 1 END) as idle_event_count,
                SUM(CASE
                    WHEN event_type = 'idle_start'
                    THEN COALESCE(JSON_EXTRACT(event_data, '$.duration'), 0)
                    ELSE 0
                END) as total_idle_seconds
            FROM interaction_events
            WHERE session_id = :session_id
            AND timestamp BETWEEN :start AND :end
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $start,
            'end' => $end
        ]);

        $result = $stmt->fetch();

        return [
            'idle_time_seconds' => intval($result['total_idle_seconds'] ?? 0),
            'idle_event_count' => intval($result['idle_event_count'] ?? 0)
        ];
    }

    /**
     * Calculate composite DMN drift score (0-100)
     * Higher score = more drift (less engaged)
     */
    private function calculateCompositeDriftScore($metrics) {
        $score = 0;

        // 1. Response Time Component (0-100)
        // Slower responses and high variance indicate drift
        $avgResponseMs = $metrics['avg_response_time_ms'] ?? 0;
        $responseScore = min(100, ($avgResponseMs / 50)); // Normalize to 0-100
        if ($metrics['response_time_trend'] > 0) {
            $responseScore += min(20, $metrics['response_time_trend']); // Getting slower is bad
        }
        $responseScore = min(100, $responseScore);

        // 2. Accuracy Component (0-100)
        // Lower accuracy and declining trend indicate drift
        $accuracyRate = $metrics['accuracy_rate'] ?? 100;
        $accuracyScore = 100 - $accuracyRate; // Invert: low accuracy = high drift
        if ($metrics['accuracy_trend'] < 0) {
            $accuracyScore += abs($metrics['accuracy_trend']); // Getting worse is bad
        }
        $accuracyScore = min(100, $accuracyScore);

        // 3. Interaction Component (0-100)
        // Low interaction frequency suggests disengagement
        $clickFreq = $metrics['click_frequency'] ?? 0;
        $interactionScore = max(0, 100 - ($clickFreq * 10)); // Lower clicks = higher drift
        $interactionScore += $metrics['click_pattern_irregularity'] ?? 0;
        $interactionScore = min(100, $interactionScore);

        // 4. Focus Component (0-100)
        // Frequent focus loss indicates drift
        $focusLoss = $metrics['focus_loss_count'] ?? 0;
        $focusScore = min(100, $focusLoss * 20); // Each loss adds 20 points

        // 5. Idle Component (0-100)
        // High idle time indicates drift
        $idleSeconds = $metrics['idle_time_seconds'] ?? 0;
        $idleScore = min(100, ($idleSeconds / 3)); // 300 seconds = max score

        // Weighted composite score
        $score = (
            ($responseScore * self::WEIGHT_RESPONSE_TIME) +
            ($accuracyScore * self::WEIGHT_ACCURACY) +
            ($interactionScore * self::WEIGHT_INTERACTION) +
            ($focusScore * self::WEIGHT_FOCUS) +
            ($idleScore * self::WEIGHT_IDLE)
        );

        return min(100, max(0, $score));
    }

    /**
     * Determine drift level based on score
     */
    private function getDriftLevel($score) {
        if ($score >= 80) return 'critical';
        if ($score >= 60) return 'high';
        if ($score >= 40) return 'moderate';
        return 'low';
    }

    /**
     * Get recommended action based on metrics
     */
    private function getRecommendedAction($metrics) {
        $score = $metrics['dmn_drift_score'];
        $actions = [];

        if ($score >= 80) {
            $actions[] = "Critical: Suggest immediate break";
            $actions[] = "Consider ending session";
        } elseif ($score >= 60) {
            $actions[] = "High drift detected: Recommend 5-minute break";
            if ($metrics['accuracy_rate'] < 50) {
                $actions[] = "Lower difficulty level";
            }
        } elseif ($score >= 40) {
            $actions[] = "Moderate drift: Send encouragement message";
            if ($metrics['focus_loss_count'] > 3) {
                $actions[] = "Remind to minimize distractions";
            }
        }

        if ($metrics['idle_time_seconds'] > 60) {
            $actions[] = "Extended idle time: Check if student needs help";
        }

        return implode("; ", $actions);
    }

    /**
     * Calculate response time trend compared to previous window
     */
    private function calculateResponseTimeTrend($sessionId, $currentStart) {
        // Get average from previous window
        $windowDuration = 300; // 5 minutes in seconds
        $prevStart = date('Y-m-d H:i:s', strtotime($currentStart) - $windowDuration);
        $prevEnd = $currentStart;

        $query = "
            SELECT AVG(response_time_seconds) as avg_time
            FROM problem_attempts
            WHERE session_id = :session_id
            AND attempted_at BETWEEN :start AND :end
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $prevStart,
            'end' => $prevEnd
        ]);

        $prevAvg = $stmt->fetchColumn() ?? 0;

        // Calculate current average
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $currentStart,
            'end' => date('Y-m-d H:i:s')
        ]);

        $currentAvg = $stmt->fetchColumn() ?? 0;

        if ($prevAvg == 0) return 0;

        // Return percentage change
        return (($currentAvg - $prevAvg) / $prevAvg) * 100;
    }

    /**
     * Calculate accuracy trend
     */
    private function calculateAccuracyTrend($sessionId, $currentStart) {
        $windowDuration = 300;
        $prevStart = date('Y-m-d H:i:s', strtotime($currentStart) - $windowDuration);
        $prevEnd = $currentStart;

        $query = "
            SELECT AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as accuracy
            FROM problem_attempts
            WHERE session_id = :session_id
            AND attempted_at BETWEEN :start AND :end
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $prevStart,
            'end' => $prevEnd
        ]);

        $prevAccuracy = $stmt->fetchColumn() ?? 0;

        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $currentStart,
            'end' => date('Y-m-d H:i:s')
        ]);

        $currentAccuracy = $stmt->fetchColumn() ?? 0;

        // Return absolute change in percentage points
        return $currentAccuracy - $prevAccuracy;
    }

    /**
     * Calculate pattern irregularity (simplified standard deviation of click intervals)
     */
    private function calculatePatternIrregularity($sessionId, $start, $end) {
        $query = "
            SELECT UNIX_TIMESTAMP(timestamp) as ts
            FROM interaction_events
            WHERE session_id = :session_id
            AND event_type = 'click'
            AND timestamp BETWEEN :start AND :end
            ORDER BY timestamp
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'session_id' => $sessionId,
            'start' => $start,
            'end' => $end
        ]);

        $timestamps = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($timestamps) < 2) return 0;

        // Calculate intervals between clicks
        $intervals = [];
        for ($i = 1; $i < count($timestamps); $i++) {
            $intervals[] = $timestamps[$i] - $timestamps[$i-1];
        }

        // Calculate standard deviation
        $mean = array_sum($intervals) / count($intervals);
        $variance = 0;
        foreach ($intervals as $interval) {
            $variance += pow($interval - $mean, 2);
        }
        $variance /= count($intervals);
        $stdDev = sqrt($variance);

        // Normalize to 0-100 scale (high irregularity = high drift)
        return min(100, ($stdDev / 2));
    }

    /**
     * Get student ID from session
     */
    private function getStudentIdFromSession($sessionId) {
        $query = "SELECT student_id FROM learning_sessions WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['id' => $sessionId]);
        return $stmt->fetchColumn();
    }

    /**
     * Save calculated metrics to database
     */
    public function saveMetrics($metrics) {
        $query = "
            INSERT INTO dmn_drift_metrics (
                session_id, student_id, time_window_start, time_window_end,
                avg_response_time_ms, response_time_variance, response_time_trend,
                accuracy_rate, accuracy_trend,
                click_frequency, click_pattern_irregularity,
                idle_time_seconds, idle_event_count,
                focus_loss_count, tab_switch_count,
                scroll_activity_score,
                dmn_drift_score, drift_level,
                intervention_needed, recommended_action
            ) VALUES (
                :session_id, :student_id, :time_window_start, :time_window_end,
                :avg_response_time_ms, :response_time_variance, :response_time_trend,
                :accuracy_rate, :accuracy_trend,
                :click_frequency, :click_pattern_irregularity,
                :idle_time_seconds, :idle_event_count,
                :focus_loss_count, :tab_switch_count,
                :scroll_activity_score,
                :dmn_drift_score, :drift_level,
                :intervention_needed, :recommended_action
            )
        ";

        $stmt = $this->db->prepare($query);
        return $stmt->execute($metrics);
    }
}
