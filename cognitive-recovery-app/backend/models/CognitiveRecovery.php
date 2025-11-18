<?php
/**
 * Cognitive Recovery Model
 * Detects and manages cognitive recovery periods
 */

require_once __DIR__ . '/../config/database.php';

class CognitiveRecovery {
    private $db;
    private $table_name = "cognitive_recovery_periods";

    // Recovery type thresholds (in seconds)
    const MICRO_BREAK_MAX = 10;
    const COGNITIVE_RECOVERY_MIN = 10;
    const COGNITIVE_RECOVERY_MAX = 60;
    const EXTENDED_PAUSE_MIN = 60;
    const DROPOUT_THRESHOLD = 300;

    public $id;
    public $session_id;
    public $started_at;
    public $ended_at;
    public $duration;
    public $recovery_type;
    public $pre_activity_intensity;
    public $post_activity_intensity;
    public $context_data;
    public $is_beneficial;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Create a new recovery period
     * @return int|false
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  (session_id, started_at, ended_at, duration, recovery_type,
                   pre_activity_intensity, post_activity_intensity, context_data)
                  VALUES (:session_id, :started_at, :ended_at, :duration, :recovery_type,
                          :pre_activity_intensity, :post_activity_intensity, :context_data)";

        $stmt = $this->db->prepare($query);

        // Bind values
        $stmt->bindParam(':session_id', $this->session_id);
        $stmt->bindParam(':started_at', $this->started_at);
        $stmt->bindParam(':ended_at', $this->ended_at);
        $stmt->bindParam(':duration', $this->duration);
        $stmt->bindParam(':recovery_type', $this->recovery_type);
        $stmt->bindParam(':pre_activity_intensity', $this->pre_activity_intensity);
        $stmt->bindParam(':post_activity_intensity', $this->post_activity_intensity);
        $stmt->bindParam(':context_data', $this->context_data);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return $this->id;
        }

        return false;
    }

    /**
     * Classify recovery type based on duration
     * @param int $durationSeconds
     * @return string
     */
    public static function classifyRecoveryType($durationSeconds) {
        if ($durationSeconds <= self::MICRO_BREAK_MAX) {
            return 'micro_break';
        } elseif ($durationSeconds >= self::COGNITIVE_RECOVERY_MIN &&
                  $durationSeconds <= self::COGNITIVE_RECOVERY_MAX) {
            return 'cognitive_recovery';
        } elseif ($durationSeconds > self::COGNITIVE_RECOVERY_MAX &&
                  $durationSeconds < self::DROPOUT_THRESHOLD) {
            return 'extended_pause';
        } else {
            return 'potential_dropout';
        }
    }

    /**
     * Detect and create recovery periods from activity gaps
     * @param int $sessionId
     * @param array $gaps Array of inactivity gaps
     * @return int Number of recovery periods created
     */
    public function detectAndCreateRecoveryPeriods($sessionId, $gaps) {
        $created = 0;

        foreach ($gaps as $gap) {
            $duration = $gap['gap_duration'];
            $recoveryType = self::classifyRecoveryType($duration);

            // Calculate activity intensity before and after gap
            $preIntensity = $this->calculateIntensityBeforeTime($sessionId, $gap['gap_start'], 60);
            $postIntensity = $this->calculateIntensityAfterTime($sessionId, $gap['gap_end'], 60);

            $recovery = new CognitiveRecovery();
            $recovery->session_id = $sessionId;
            $recovery->started_at = $gap['gap_start'];
            $recovery->ended_at = $gap['gap_end'];
            $recovery->duration = $duration;
            $recovery->recovery_type = $recoveryType;
            $recovery->pre_activity_intensity = $preIntensity;
            $recovery->post_activity_intensity = $postIntensity;
            $recovery->context_data = json_encode([
                'gap_detected' => true,
                'auto_classified' => true
            ]);

            if ($recovery->create()) {
                $created++;
            }
        }

        return $created;
    }

    /**
     * Get recovery periods for a session
     * @param int $sessionId
     * @return array
     */
    public function getBySession($sessionId) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE session_id = :session_id
                  ORDER BY started_at ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get recovery statistics for a session
     * @param int $sessionId
     * @return array
     */
    public function getSessionRecoveryStats($sessionId) {
        $query = "SELECT
                    recovery_type,
                    COUNT(*) as count,
                    AVG(duration) as avg_duration,
                    MIN(duration) as min_duration,
                    MAX(duration) as max_duration,
                    AVG(pre_activity_intensity) as avg_pre_intensity,
                    AVG(post_activity_intensity) as avg_post_intensity
                  FROM " . $this->table_name . "
                  WHERE session_id = :session_id
                  GROUP BY recovery_type";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get user's recovery patterns
     * @param int $userId
     * @param int $days Number of days to analyze
     * @return array
     */
    public function getUserRecoveryPatterns($userId, $days = 30) {
        $query = "SELECT
                    r.recovery_type,
                    COUNT(*) as total_count,
                    AVG(r.duration) as avg_duration,
                    AVG(r.post_activity_intensity - r.pre_activity_intensity) as avg_intensity_change,
                    COUNT(CASE WHEN r.is_beneficial = 1 THEN 1 END) as beneficial_count
                  FROM " . $this->table_name . " r
                  INNER JOIN activity_sessions s ON r.session_id = s.id
                  WHERE s.user_id = :user_id
                    AND r.started_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
                  GROUP BY r.recovery_type";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':days', $days);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate activity intensity before a specific time
     * @param int $sessionId
     * @param string $timestamp
     * @param int $windowSeconds
     * @return float
     */
    private function calculateIntensityBeforeTime($sessionId, $timestamp, $windowSeconds) {
        $query = "SELECT COUNT(*) as event_count
                  FROM activity_events
                  WHERE session_id = :session_id
                    AND event_timestamp BETWEEN
                        DATE_SUB(:timestamp, INTERVAL :window SECOND) AND :timestamp";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':timestamp', $timestamp);
        $stmt->bindParam(':window', $windowSeconds);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $eventCount = $result['event_count'] ?? 0;

        // Events per minute
        return ($eventCount / $windowSeconds) * 60;
    }

    /**
     * Calculate activity intensity after a specific time
     * @param int $sessionId
     * @param string $timestamp
     * @param int $windowSeconds
     * @return float
     */
    private function calculateIntensityAfterTime($sessionId, $timestamp, $windowSeconds) {
        $query = "SELECT COUNT(*) as event_count
                  FROM activity_events
                  WHERE session_id = :session_id
                    AND event_timestamp BETWEEN
                        :timestamp AND DATE_ADD(:timestamp, INTERVAL :window SECOND)";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':timestamp', $timestamp);
        $stmt->bindParam(':window', $windowSeconds);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $eventCount = $result['event_count'] ?? 0;

        // Events per minute
        return ($eventCount / $windowSeconds) * 60;
    }

    /**
     * Analyze if recovery was beneficial
     * @return bool
     */
    public function analyzeBeneficial() {
        // Recovery is beneficial if:
        // 1. Post-activity intensity is higher than pre-activity
        // 2. Duration is within optimal range (10-60 seconds)
        // 3. Not a dropout

        $intensityImproved = $this->post_activity_intensity > $this->pre_activity_intensity;
        $optimalDuration = $this->duration >= self::COGNITIVE_RECOVERY_MIN &&
                          $this->duration <= self::COGNITIVE_RECOVERY_MAX;
        $notDropout = $this->recovery_type !== 'potential_dropout';

        $this->is_beneficial = $intensityImproved && $optimalDuration && $notDropout;

        // Update database
        $query = "UPDATE " . $this->table_name . "
                  SET is_beneficial = :is_beneficial
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':is_beneficial', $this->is_beneficial, PDO::PARAM_BOOL);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        return $this->is_beneficial;
    }

    /**
     * Get cognitive recovery insights for dashboard
     * @param int $sessionId
     * @return array
     */
    public function getRecoveryInsights($sessionId) {
        $stats = $this->getSessionRecoveryStats($sessionId);

        $insights = [
            'total_recovery_periods' => 0,
            'cognitive_recovery_count' => 0,
            'beneficial_recovery_count' => 0,
            'average_recovery_duration' => 0,
            'recovery_efficiency' => 0,
            'recommendations' => []
        ];

        foreach ($stats as $stat) {
            $insights['total_recovery_periods'] += $stat['count'];

            if ($stat['recovery_type'] === 'cognitive_recovery') {
                $insights['cognitive_recovery_count'] = $stat['count'];
                $insights['average_recovery_duration'] = round($stat['avg_duration'], 2);
            }
        }

        // Get beneficial count
        $query = "SELECT COUNT(*) as beneficial_count
                  FROM " . $this->table_name . "
                  WHERE session_id = :session_id AND is_beneficial = 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $insights['beneficial_recovery_count'] = $result['beneficial_count'] ?? 0;

        // Calculate efficiency
        if ($insights['total_recovery_periods'] > 0) {
            $insights['recovery_efficiency'] = round(
                ($insights['beneficial_recovery_count'] / $insights['total_recovery_periods']) * 100,
                2
            );
        }

        // Generate recommendations
        $insights['recommendations'] = $this->generateRecommendations($stats);

        return $insights;
    }

    /**
     * Generate personalized recommendations
     * @param array $stats
     * @return array
     */
    private function generateRecommendations($stats) {
        $recommendations = [];

        foreach ($stats as $stat) {
            if ($stat['recovery_type'] === 'potential_dropout' && $stat['count'] > 2) {
                $recommendations[] = [
                    'type' => 'warning',
                    'message' => '잠깐 쉬는 시간이 너무 길어지고 있어요. 5분 이상 자리를 비우면 집중력이 떨어질 수 있습니다.',
                    'suggestion' => '긴 휴식은 학습 세션 사이에 계획적으로 갖는 것이 좋습니다.'
                ];
            }

            if ($stat['recovery_type'] === 'cognitive_recovery') {
                $avgDuration = $stat['avg_duration'];

                if ($avgDuration < 15) {
                    $recommendations[] = [
                        'type' => 'info',
                        'message' => '짧은 멍때림이 자주 발생하고 있네요.',
                        'suggestion' => '15-30초 정도의 짧은 휴식이 학습에 도움이 됩니다.'
                    ];
                } elseif ($avgDuration >= 15 && $avgDuration <= 45) {
                    $recommendations[] = [
                        'type' => 'success',
                        'message' => '완벽한 인지 회복 패턴입니다! 적절한 휴식을 취하고 계세요.',
                        'suggestion' => '현재의 학습 리듬을 유지하세요.'
                    ];
                } else {
                    $recommendations[] = [
                        'type' => 'info',
                        'message' => '멍때림 시간이 조금 길어지고 있어요.',
                        'suggestion' => '45초 이상 쉴 때는 의도적으로 휴식을 취하는 것이 좋습니다.'
                    ];
                }
            }
        }

        if (empty($recommendations)) {
            $recommendations[] = [
                'type' => 'info',
                'message' => '학습 패턴을 분석하고 있습니다.',
                'suggestion' => '더 정확한 분석을 위해 계속 학습해 주세요.'
            ];
        }

        return $recommendations;
    }

    /**
     * Update context data
     * @param int $recoveryId
     * @param array $contextData
     * @return bool
     */
    public function updateContext($recoveryId, $contextData) {
        $query = "UPDATE " . $this->table_name . "
                  SET context_data = :context_data
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $contextJson = json_encode($contextData);
        $stmt->bindParam(':context_data', $contextJson);
        $stmt->bindParam(':id', $recoveryId);

        return $stmt->execute();
    }
}
