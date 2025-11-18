<?php
/**
 * Stress Detection Engine
 * Analyzes user activity patterns and study time to detect stress/over-engagement
 */

namespace StressReset;

class StressDetector
{
    private $db;
    private $config;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->config = require __DIR__ . '/../config/stress_detection.php';
    }

    /**
     * Calculate current stress score for a session
     */
    public function calculateStressScore($sessionId)
    {
        $session = $this->getSessionData($sessionId);

        if (!$session) {
            throw new \Exception('Session not found');
        }

        // Calculate individual component scores
        $timeScore = $this->calculateTimeScore($session);
        $clickScore = $this->calculateClickScore($sessionId);
        $typingScore = $this->calculateTypingScore($sessionId);

        // Calculate weighted combined score
        $weights = $this->config['weights'];
        $combinedScore = (
            $timeScore * $weights['time_factor'] +
            $clickScore * $weights['click_factor'] +
            $typingScore * $weights['typing_factor']
        );

        // Save the scores
        $scoreId = $this->db->insert('stress_scores', [
            'session_id' => $sessionId,
            'time_score' => $timeScore,
            'click_score' => $clickScore,
            'typing_score' => $typingScore,
            'combined_score' => $combinedScore,
        ]);

        return [
            'score_id' => $scoreId,
            'time_score' => $timeScore,
            'click_score' => $clickScore,
            'typing_score' => $typingScore,
            'combined_score' => $combinedScore,
            'threshold' => $this->config['stress_score_threshold'],
            'should_trigger' => $combinedScore >= $this->config['stress_score_threshold'],
        ];
    }

    /**
     * Calculate time-based stress score (0-100)
     */
    private function calculateTimeScore($session)
    {
        $startTime = strtotime($session['session_start']);
        $currentTime = time();
        $minutesElapsed = ($currentTime - $startTime) / 60;

        $threshold = $this->config['time_threshold_minutes'];

        if ($minutesElapsed < $threshold) {
            // Linear scale: 0 to 100 as we approach threshold
            return ($minutesElapsed / $threshold) * 100;
        } else {
            // Cap at 100
            return 100;
        }
    }

    /**
     * Calculate click-based stress score (0-100)
     */
    private function calculateClickScore($sessionId)
    {
        $windowMinutes = $this->config['pattern_window_minutes'];
        $cutoffTime = date('Y-m-d H:i:s', strtotime("-{$windowMinutes} minutes"));

        $sql = "
            SELECT SUM(activity_count) as total_clicks
            FROM activity_tracking
            WHERE session_id = :session_id
            AND activity_type = 'click'
            AND timestamp >= :cutoff_time
        ";

        $result = $this->db->fetchOne($sql, [
            ':session_id' => $sessionId,
            ':cutoff_time' => $cutoffTime,
        ]);

        $totalClicks = $result['total_clicks'] ?? 0;
        $clicksPerMinute = $totalClicks / $windowMinutes;

        $threshold = $this->config['click_rate_threshold'];

        if ($clicksPerMinute < $threshold) {
            return ($clicksPerMinute / $threshold) * 100;
        } else {
            return 100;
        }
    }

    /**
     * Calculate typing-based stress score (0-100)
     */
    private function calculateTypingScore($sessionId)
    {
        $windowMinutes = $this->config['pattern_window_minutes'];
        $cutoffTime = date('Y-m-d H:i:s', strtotime("-{$windowMinutes} minutes"));

        $sql = "
            SELECT SUM(activity_count) as total_keypresses
            FROM activity_tracking
            WHERE session_id = :session_id
            AND activity_type = 'keypress'
            AND timestamp >= :cutoff_time
        ";

        $result = $this->db->fetchOne($sql, [
            ':session_id' => $sessionId,
            ':cutoff_time' => $cutoffTime,
        ]);

        $totalKeypresses = $result['total_keypresses'] ?? 0;
        $charsPerMinute = $totalKeypresses / $windowMinutes;

        $threshold = $this->config['typing_speed_threshold'];

        if ($charsPerMinute < $threshold) {
            return ($charsPerMinute / $threshold) * 100;
        } else {
            return 100;
        }
    }

    /**
     * Check if reset should be triggered
     */
    public function shouldTriggerReset($sessionId)
    {
        // Check cooldown period
        if ($this->isInCooldown($sessionId)) {
            return [
                'should_trigger' => false,
                'reason' => 'in_cooldown',
            ];
        }

        $scoreData = $this->calculateStressScore($sessionId);

        if ($scoreData['should_trigger']) {
            return [
                'should_trigger' => true,
                'score_data' => $scoreData,
                'reason' => 'stress_threshold_exceeded',
            ];
        }

        return [
            'should_trigger' => false,
            'score_data' => $scoreData,
            'reason' => 'below_threshold',
        ];
    }

    /**
     * Check if session is in cooldown period
     */
    private function isInCooldown($sessionId)
    {
        $cooldownMinutes = $this->config['reset_cooldown_minutes'];
        $cutoffTime = date('Y-m-d H:i:s', strtotime("-{$cooldownMinutes} minutes"));

        $sql = "
            SELECT COUNT(*) as recent_resets
            FROM reset_events
            WHERE session_id = :session_id
            AND created_at >= :cutoff_time
        ";

        $result = $this->db->fetchOne($sql, [
            ':session_id' => $sessionId,
            ':cutoff_time' => $cutoffTime,
        ]);

        return ($result['recent_resets'] ?? 0) > 0;
    }

    /**
     * Get session data
     */
    private function getSessionData($sessionId)
    {
        $sql = "SELECT * FROM learning_sessions WHERE id = :id AND is_active = 1";
        return $this->db->fetchOne($sql, [':id' => $sessionId]);
    }

    /**
     * Record activity event
     */
    public function recordActivity($sessionId, $activityType, $count = 1, $metadata = null)
    {
        $data = [
            'session_id' => $sessionId,
            'activity_type' => $activityType,
            'activity_count' => $count,
        ];

        if ($metadata !== null) {
            $data['metadata'] = json_encode($metadata);
        }

        return $this->db->insert('activity_tracking', $data);
    }
}
