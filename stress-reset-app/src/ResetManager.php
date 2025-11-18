<?php
/**
 * Reset Event Manager
 * Handles triggering and logging of reset light effects
 */

namespace StressReset;

class ResetManager
{
    private $db;
    private $config;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->config = require __DIR__ . '/../config/light_effect.php';
    }

    /**
     * Trigger a reset event
     */
    public function triggerReset($sessionId, $stressScoreId, $reason = 'stress_threshold')
    {
        $eventId = $this->db->insert('reset_events', [
            'session_id' => $sessionId,
            'stress_score_id' => $stressScoreId,
            'trigger_reason' => $reason,
            'effect_type' => 'light_gradient',
            'effect_duration_seconds' => $this->config['duration_seconds'],
        ]);

        // Log the event
        $this->logEvent($sessionId, 'reset_triggered', [
            'event_id' => $eventId,
            'reason' => $reason,
            'stress_score_id' => $stressScoreId,
        ]);

        return [
            'event_id' => $eventId,
            'effect_config' => $this->getEffectConfig(),
        ];
    }

    /**
     * Get effect configuration for frontend
     */
    public function getEffectConfig()
    {
        return [
            'duration_seconds' => $this->config['duration_seconds'],
            'color_sequence' => $this->config['color_sequence'],
            'transition_easing' => $this->config['transition_easing'],
            'opacity_start' => $this->config['opacity_start'],
            'opacity_end' => $this->config['opacity_end'],
            'blur_amount' => $this->config['blur_amount'],
            'overlay_z_index' => $this->config['overlay_z_index'],
            'show_message' => $this->config['show_message'],
            'message_text' => $this->config['message_text'],
            'message_duration_seconds' => $this->config['message_duration_seconds'],
            'play_sound' => $this->config['play_sound'],
            'sound_file' => $this->config['sound_file'],
            'sound_volume' => $this->config['sound_volume'],
        ];
    }

    /**
     * Acknowledge reset event (user saw it)
     */
    public function acknowledgeReset($eventId)
    {
        return $this->db->update(
            'reset_events',
            [
                'user_acknowledged' => 1,
                'acknowledged_at' => date('Y-m-d H:i:s'),
            ],
            'id = :id',
            [':id' => $eventId]
        );
    }

    /**
     * Get recent reset events for session
     */
    public function getRecentResets($sessionId, $limit = 10)
    {
        $sql = "
            SELECT re.*, ss.combined_score
            FROM reset_events re
            LEFT JOIN stress_scores ss ON re.stress_score_id = ss.id
            WHERE re.session_id = :session_id
            ORDER BY re.created_at DESC
            LIMIT :limit
        ";

        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->bindValue(':session_id', $sessionId, \PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Log system event
     */
    private function logEvent($sessionId, $message, $context = [])
    {
        $session = $this->db->fetchOne(
            'SELECT user_id FROM learning_sessions WHERE id = :id',
            [':id' => $sessionId]
        );

        $this->db->insert('system_logs', [
            'log_level' => 'info',
            'message' => $message,
            'context' => json_encode($context),
            'user_id' => $session['user_id'] ?? null,
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Get reset statistics for analytics
     */
    public function getResetStats($userId, $dateFrom = null, $dateTo = null)
    {
        $dateFrom = $dateFrom ?? date('Y-m-d', strtotime('-30 days'));
        $dateTo = $dateTo ?? date('Y-m-d');

        $sql = "
            SELECT
                DATE(re.created_at) as date,
                COUNT(*) as reset_count,
                AVG(ss.combined_score) as avg_stress_score,
                MAX(ss.combined_score) as max_stress_score
            FROM reset_events re
            INNER JOIN learning_sessions ls ON re.session_id = ls.id
            LEFT JOIN stress_scores ss ON re.stress_score_id = ss.id
            WHERE ls.user_id = :user_id
            AND DATE(re.created_at) BETWEEN :date_from AND :date_to
            GROUP BY DATE(re.created_at)
            ORDER BY date DESC
        ";

        return $this->db->fetchAll($sql, [
            ':user_id' => $userId,
            ':date_from' => $dateFrom,
            ':date_to' => $dateTo,
        ]);
    }
}
