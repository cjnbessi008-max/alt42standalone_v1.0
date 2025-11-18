<?php
/**
 * Attention Analysis API
 *
 * Endpoints:
 * - GET /api/attention.php?session_id=xxx - Get attention analysis for session
 * - GET /api/attention.php?user_id=xxx&course_id=xxx - Get user/course statistics
 * - GET /api/attention.php/alerts?session_id=xxx - Get alerts for session
 * - GET /api/attention.php/summary?user_id=xxx&date=YYYY-MM-DD - Get daily summary
 */

require_once __DIR__ . '/BaseAPI.php';

class AttentionAPI extends BaseAPI {

    public function handleRequest() {
        $action = $_GET['action'] ?? 'analysis';

        switch ($action) {
            case 'analysis':
                return $this->getAttentionAnalysis();
            case 'alerts':
                return $this->getAlerts();
            case 'summary':
                return $this->getDailySummary();
            case 'statistics':
                return $this->getUserStatistics();
            default:
                $this->sendError('Invalid action', 400);
        }
    }

    /**
     * Get attention analysis for session
     *
     * GET /api/attention.php?session_id=xxx
     */
    private function getAttentionAnalysis() {
        $sessionID = $this->getParam('session_id');

        if (!$this->validateSessionID($sessionID)) {
            $this->sendError('Invalid session ID', 400);
        }

        try {
            // Get session details
            $session = $this->db->fetchOne(
                'SELECT * FROM tracking_sessions WHERE session_id = ?',
                [$sessionID]
            );

            if (!$session) {
                $this->sendError('Session not found', 404);
            }

            // Get all metrics for this session
            $metrics = $this->db->fetchAll(
                'SELECT * FROM attention_metrics
                 WHERE session_id = ?
                 ORDER BY window_start ASC',
                [$sessionID]
            );

            // Get alerts
            $alerts = $this->db->fetchAll(
                'SELECT * FROM attention_alerts
                 WHERE session_id = ?
                 ORDER BY detected_at DESC',
                [$sessionID]
            );

            // Calculate overall statistics
            $stats = $this->calculateOverallStats($metrics, $alerts);

            // Generate attention timeline
            $timeline = $this->generateAttentionTimeline($metrics);

            // Get recommendations
            $recommendations = $this->generateRecommendations($stats, $alerts);

            $this->sendSuccess([
                'session' => $session,
                'statistics' => $stats,
                'timeline' => $timeline,
                'metrics' => $metrics,
                'alerts' => [
                    'total' => count($alerts),
                    'critical' => count(array_filter($alerts, fn($a) => $a['severity'] === 'critical')),
                    'warning' => count(array_filter($alerts, fn($a) => $a['severity'] === 'warning')),
                    'items' => $alerts
                ],
                'recommendations' => $recommendations
            ]);

        } catch (Exception $e) {
            $this->sendError('Failed to retrieve attention analysis: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get alerts for session
     *
     * GET /api/attention.php?action=alerts&session_id=xxx&severity=warning
     */
    private function getAlerts() {
        $sessionID = $this->getParam('session_id');
        $severity = $this->getParam('severity');
        $acknowledged = $this->getParam('acknowledged');

        if ($sessionID && !$this->validateSessionID($sessionID)) {
            $this->sendError('Invalid session ID', 400);
        }

        try {
            $conditions = [];
            $params = [];

            if ($sessionID) {
                $conditions[] = 'session_id = ?';
                $params[] = $sessionID;
            }

            if ($severity && in_array($severity, ['info', 'warning', 'critical'])) {
                $conditions[] = 'severity = ?';
                $params[] = $severity;
            }

            if ($acknowledged !== null) {
                $conditions[] = 'acknowledged = ?';
                $params[] = (int)$acknowledged;
            }

            $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

            $alerts = $this->db->fetchAll(
                "SELECT * FROM attention_alerts
                 $whereClause
                 ORDER BY detected_at DESC
                 LIMIT 100",
                $params
            );

            $this->sendSuccess([
                'alerts' => $alerts,
                'count' => count($alerts)
            ]);

        } catch (Exception $e) {
            $this->sendError('Failed to retrieve alerts: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get daily summary for user
     *
     * GET /api/attention.php?action=summary&user_id=xxx&date=YYYY-MM-DD
     */
    private function getDailySummary() {
        $userID = $this->getParam('user_id');
        $courseID = $this->getParam('course_id');
        $date = $this->getParam('date', date('Y-m-d'));

        if (!$userID) {
            $this->sendError('user_id is required', 400);
        }

        try {
            $conditions = ['user_id = ?', 'date = ?'];
            $params = [$userID, $date];

            if ($courseID) {
                $conditions[] = 'course_id = ?';
                $params[] = $courseID;
            }

            $summary = $this->db->fetchOne(
                'SELECT * FROM analytics_summary
                 WHERE ' . implode(' AND ', $conditions),
                $params
            );

            if (!$summary) {
                // Generate summary if not exists
                $this->generateDailySummary($date);

                $summary = $this->db->fetchOne(
                    'SELECT * FROM analytics_summary
                     WHERE ' . implode(' AND ', $conditions),
                    $params
                );
            }

            $this->sendSuccess([
                'summary' => $summary ?? [
                    'user_id' => $userID,
                    'course_id' => $courseID,
                    'date' => $date,
                    'total_sessions' => 0,
                    'message' => 'No data available for this date'
                ]
            ]);

        } catch (Exception $e) {
            $this->sendError('Failed to retrieve daily summary: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user statistics
     *
     * GET /api/attention.php?action=statistics&user_id=xxx&course_id=xxx&days=7
     */
    private function getUserStatistics() {
        $userID = $this->getParam('user_id');
        $courseID = $this->getParam('course_id');
        $days = min((int)$this->getParam('days', 7), 90);

        if (!$userID) {
            $this->sendError('user_id is required', 400);
        }

        try {
            $conditions = ['user_id = ?'];
            $params = [$userID];

            if ($courseID) {
                $conditions[] = 'course_id = ?';
                $params[] = $courseID;
            }

            // Get statistics from view
            $stats = $this->db->fetchOne(
                'SELECT * FROM v_user_attention_stats
                 WHERE ' . implode(' AND ', $conditions),
                $params
            );

            // Get daily summaries
            $dailySummaries = $this->db->fetchAll(
                'SELECT * FROM analytics_summary
                 WHERE user_id = ?
                   AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                 ORDER BY date DESC',
                [$userID, $days]
            );

            // Get recent sessions
            $recentSessions = $this->db->fetchAll(
                'SELECT * FROM tracking_sessions
                 WHERE user_id = ?
                   AND started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                 ORDER BY started_at DESC
                 LIMIT 20',
                [$userID, $days]
            );

            $this->sendSuccess([
                'user_id' => $userID,
                'course_id' => $courseID,
                'period_days' => $days,
                'overall_statistics' => $stats ?? [],
                'daily_summaries' => $dailySummaries,
                'recent_sessions' => $recentSessions
            ]);

        } catch (Exception $e) {
            $this->sendError('Failed to retrieve user statistics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Calculate overall statistics from metrics
     */
    private function calculateOverallStats($metrics, $alerts) {
        if (empty($metrics)) {
            return [
                'avg_attention_score' => 0,
                'max_attention_score' => 0,
                'min_attention_score' => 0,
                'total_windows' => 0
            ];
        }

        $scores = array_column($metrics, 'attention_score');
        $blinkRates = array_column($metrics, 'blink_rate');
        $gazeRatios = array_column($metrics, 'gaze_on_screen_ratio');

        $highCount = count(array_filter($metrics, fn($m) => $m['attention_level'] === 'high'));
        $mediumCount = count(array_filter($metrics, fn($m) => $m['attention_level'] === 'medium'));
        $lowCount = count(array_filter($metrics, fn($m) => $m['attention_level'] === 'low'));
        $criticalCount = count(array_filter($metrics, fn($m) => $m['attention_level'] === 'critical'));

        return [
            'avg_attention_score' => round(array_sum($scores) / count($scores), 2),
            'max_attention_score' => round(max($scores), 2),
            'min_attention_score' => round(min($scores), 2),
            'avg_blink_rate' => round(array_sum($blinkRates) / count($blinkRates), 2),
            'avg_gaze_on_screen' => round(array_sum($gazeRatios) / count($gazeRatios), 4),
            'total_windows' => count($metrics),
            'attention_distribution' => [
                'high' => $highCount,
                'medium' => $mediumCount,
                'low' => $lowCount,
                'critical' => $criticalCount,
            ],
            'attention_percentages' => [
                'high' => round($highCount / count($metrics) * 100, 1),
                'medium' => round($mediumCount / count($metrics) * 100, 1),
                'low' => round($lowCount / count($metrics) * 100, 1),
                'critical' => round($criticalCount / count($metrics) * 100, 1),
            ]
        ];
    }

    /**
     * Generate attention timeline
     */
    private function generateAttentionTimeline($metrics) {
        return array_map(function($m) {
            return [
                'timestamp' => $m['window_start'],
                'attention_score' => (float)$m['attention_score'],
                'attention_level' => $m['attention_level'],
                'blink_rate' => (float)$m['blink_rate'],
                'gaze_on_screen' => (float)$m['gaze_on_screen_ratio']
            ];
        }, $metrics);
    }

    /**
     * Generate recommendations based on analysis
     */
    private function generateRecommendations($stats, $alerts) {
        $recommendations = [];

        // Check average attention score
        if ($stats['avg_attention_score'] < 60) {
            $recommendations[] = [
                'type' => 'low_attention',
                'priority' => 'high',
                'message' => '전반적인 집중도가 낮습니다. 학습 환경을 개선하거나 짧은 휴식을 취해보세요.',
                'suggestion' => '20분 학습 후 5분 휴식하는 포모도로 기법을 시도해보세요.'
            ];
        }

        // Check blink rate
        if (isset($stats['avg_blink_rate'])) {
            if ($stats['avg_blink_rate'] > 30) {
                $recommendations[] = [
                    'type' => 'excessive_blinking',
                    'priority' => 'medium',
                    'message' => '눈 깜빡임이 과도합니다. 피로나 스트레스 신호일 수 있습니다.',
                    'suggestion' => '화면 밝기를 조정하고, 눈을 자주 쉬어주세요.'
                ];
            } elseif ($stats['avg_blink_rate'] < 10) {
                $recommendations[] = [
                    'type' => 'insufficient_blinking',
                    'priority' => 'medium',
                    'message' => '눈 깜빡임이 부족합니다. 안구 건조증을 유발할 수 있습니다.',
                    'suggestion' => '의식적으로 눈을 깜빡이고, 인공눈물 사용을 고려하세요.'
                ];
            }
        }

        // Check gaze away
        if (isset($stats['avg_gaze_on_screen']) && $stats['avg_gaze_on_screen'] < 0.7) {
            $recommendations[] = [
                'type' => 'frequent_distraction',
                'priority' => 'high',
                'message' => '화면 밖을 자주 보고 있습니다. 주의가 분산되고 있을 수 있습니다.',
                'suggestion' => '학습 공간의 방해 요소를 제거하고, 집중할 수 있는 환경을 만드세요.'
            ];
        }

        // Check critical alerts
        $criticalAlerts = array_filter($alerts, fn($a) => $a['severity'] === 'critical');
        if (count($criticalAlerts) > 5) {
            $recommendations[] = [
                'type' => 'multiple_critical_alerts',
                'priority' => 'critical',
                'message' => '심각한 집중 이탈이 여러 번 감지되었습니다.',
                'suggestion' => '지금은 학습에 적합한 상태가 아닐 수 있습니다. 충분한 휴식을 취하세요.'
            ];
        }

        // Positive feedback
        if ($stats['avg_attention_score'] >= 80) {
            $recommendations[] = [
                'type' => 'high_attention',
                'priority' => 'info',
                'message' => '훌륭합니다! 높은 집중도를 유지하고 있습니다.',
                'suggestion' => '현재의 학습 패턴을 유지하되, 장시간 학습 시 적절한 휴식도 잊지 마세요.'
            ];
        }

        return $recommendations;
    }

    /**
     * Generate daily summary
     */
    private function generateDailySummary($date) {
        try {
            $this->db->query('CALL sp_generate_daily_summary(?)', [$date]);
        } catch (Exception $e) {
            error_log('Failed to generate daily summary: ' . $e->getMessage());
        }
    }
}

// Handle request
$api = new AttentionAPI();
$api->handleRequest();
