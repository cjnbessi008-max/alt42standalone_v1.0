<?php
/**
 * Dashboard API
 * Provides analytics and insights for cognitive recovery
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../models/ActivitySession.php';
require_once __DIR__ . '/../models/ActivityEvent.php';
require_once __DIR__ . '/../models/CognitiveRecovery.php';

// Get request parameters
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'session_stats':
            $sessionId = $_GET['session_id'] ?? null;
            if (!$sessionId) {
                throw new Exception('session_id parameter required');
            }
            $response = getSessionStats($sessionId);
            break;

        case 'user_patterns':
            $userId = $_GET['user_id'] ?? null;
            $days = $_GET['days'] ?? 30;
            if (!$userId) {
                throw new Exception('user_id parameter required');
            }
            $response = getUserPatterns($userId, $days);
            break;

        case 'recovery_insights':
            $sessionId = $_GET['session_id'] ?? null;
            if (!$sessionId) {
                throw new Exception('session_id parameter required');
            }
            $response = getRecoveryInsights($sessionId);
            break;

        case 'activity_timeline':
            $sessionId = $_GET['session_id'] ?? null;
            if (!$sessionId) {
                throw new Exception('session_id parameter required');
            }
            $response = getActivityTimeline($sessionId);
            break;

        case 'user_dashboard':
            $userId = $_GET['user_id'] ?? null;
            if (!$userId) {
                throw new Exception('user_id parameter required');
            }
            $response = getUserDashboard($userId);
            break;

        case 'realtime_status':
            $sessionToken = $_GET['session_token'] ?? null;
            if (!$sessionToken) {
                throw new Exception('session_token parameter required');
            }
            $response = getRealtimeStatus($sessionToken);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action: ' . $action]);
            exit();
    }

    echo json_encode($response);

} catch (Exception $e) {
    error_log("Dashboard API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get comprehensive session statistics
 */
function getSessionStats($sessionId) {
    $session = new ActivitySession();
    $stats = $session->getSessionStats($sessionId);

    if (!$stats) {
        http_response_code(404);
        return ['error' => 'Session not found'];
    }

    // Get event breakdown
    $activityEvent = new ActivityEvent();
    $eventBreakdown = $activityEvent->getEventCountByType($sessionId);

    // Get recovery stats
    $recovery = new CognitiveRecovery();
    $recoveryStats = $recovery->getSessionRecoveryStats($sessionId);

    return [
        'success' => true,
        'session' => $stats,
        'event_breakdown' => $eventBreakdown,
        'recovery_stats' => $recoveryStats
    ];
}

/**
 * Get user's cognitive patterns over time
 */
function getUserPatterns($userId, $days) {
    $recovery = new CognitiveRecovery();
    $patterns = $recovery->getUserRecoveryPatterns($userId, $days);

    // Get user's session history
    $db = new Database();
    $conn = $db->getConnection();

    $query = "SELECT
                DATE(started_at) as date,
                COUNT(*) as session_count,
                AVG(total_duration) as avg_duration,
                SUM(total_duration) as total_duration
              FROM activity_sessions
              WHERE user_id = :user_id
                AND started_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
              GROUP BY DATE(started_at)
              ORDER BY date DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':days', $days);
    $stmt->execute();
    $sessionHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate trends
    $totalSessions = array_sum(array_column($sessionHistory, 'session_count'));
    $totalLearningTime = array_sum(array_column($sessionHistory, 'total_duration'));
    $avgSessionLength = $totalSessions > 0 ? $totalLearningTime / $totalSessions : 0;

    return [
        'success' => true,
        'user_id' => $userId,
        'period_days' => $days,
        'recovery_patterns' => $patterns,
        'session_history' => $sessionHistory,
        'summary' => [
            'total_sessions' => $totalSessions,
            'total_learning_time_seconds' => $totalLearningTime,
            'total_learning_time_hours' => round($totalLearningTime / 3600, 2),
            'average_session_length_minutes' => round($avgSessionLength / 60, 2)
        ]
    ];
}

/**
 * Get recovery insights for a session
 */
function getRecoveryInsights($sessionId) {
    $recovery = new CognitiveRecovery();
    $insights = $recovery->getRecoveryInsights($sessionId);

    // Get all recovery periods with details
    $recoveryPeriods = $recovery->getBySession($sessionId);

    return [
        'success' => true,
        'session_id' => $sessionId,
        'insights' => $insights,
        'recovery_periods' => $recoveryPeriods
    ];
}

/**
 * Get activity timeline for visualization
 */
function getActivityTimeline($sessionId) {
    $activityEvent = new ActivityEvent();
    $intensity = $activityEvent->calculateActivityIntensity($sessionId);

    $recovery = new CognitiveRecovery();
    $recoveryPeriods = $recovery->getBySession($sessionId);

    // Get session info
    $session = new ActivitySession();
    $db = new Database();
    $conn = $db->getConnection();

    $query = "SELECT * FROM activity_sessions WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $sessionId);
    $stmt->execute();
    $sessionInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    return [
        'success' => true,
        'session_info' => $sessionInfo,
        'activity_intensity' => $intensity,
        'recovery_periods' => $recoveryPeriods,
        'timeline_visualization' => generateTimelineData($intensity, $recoveryPeriods)
    ];
}

/**
 * Get comprehensive user dashboard
 */
function getUserDashboard($userId) {
    $db = new Database();
    $conn = $db->getConnection();

    // Get active session
    $session = new ActivitySession();
    $activeSessions = $session->getUserActiveSessions($userId);

    // Get recent sessions (last 7 days)
    $query = "SELECT
                s.*,
                COUNT(DISTINCT e.id) as total_events,
                COUNT(DISTINCT r.id) as recovery_periods
              FROM activity_sessions s
              LEFT JOIN activity_events e ON s.id = e.session_id
              LEFT JOIN cognitive_recovery_periods r ON s.id = r.session_id
              WHERE s.user_id = :user_id
                AND s.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              GROUP BY s.id
              ORDER BY s.started_at DESC
              LIMIT 10";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $recentSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get user patterns
    $recovery = new CognitiveRecovery();
    $patterns = $recovery->getUserRecoveryPatterns($userId, 30);

    // Get today's stats
    $query = "SELECT
                COUNT(DISTINCT s.id) as sessions_today,
                SUM(s.total_duration) as learning_time_today,
                COUNT(DISTINCT r.id) as recovery_periods_today
              FROM activity_sessions s
              LEFT JOIN cognitive_recovery_periods r ON s.id = r.session_id
              WHERE s.user_id = :user_id
                AND DATE(s.started_at) = CURDATE()";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $todayStats = $stmt->fetch(PDO::FETCH_ASSOC);

    return [
        'success' => true,
        'user_id' => $userId,
        'active_sessions' => $activeSessions,
        'recent_sessions' => $recentSessions,
        'recovery_patterns' => $patterns,
        'today_stats' => $todayStats,
        'recommendations' => generateUserRecommendations($patterns, $todayStats)
    ];
}

/**
 * Get real-time session status
 */
function getRealtimeStatus($sessionToken) {
    $session = new ActivitySession();

    if (!$session->getByToken($sessionToken)) {
        http_response_code(404);
        return ['error' => 'Session not found or inactive'];
    }

    // Get last event
    $activityEvent = new ActivityEvent();
    $lastEvent = $activityEvent->getLastEvent($session->id);

    // Calculate time since last activity
    $timeSinceLastActivity = null;
    if ($lastEvent) {
        $lastEventTime = strtotime($lastEvent['event_timestamp']);
        $timeSinceLastActivity = time() - $lastEventTime;
    }

    // Determine current state
    $currentState = 'active';
    if ($timeSinceLastActivity) {
        if ($timeSinceLastActivity >= CognitiveRecovery::DROPOUT_THRESHOLD) {
            $currentState = 'potential_dropout';
        } elseif ($timeSinceLastActivity >= CognitiveRecovery::COGNITIVE_RECOVERY_MIN) {
            $currentState = 'cognitive_recovery';
        } elseif ($timeSinceLastActivity >= CognitiveRecovery::MICRO_BREAK_MAX) {
            $currentState = 'micro_break';
        }
    }

    // Get session stats
    $sessionStats = $session->getSessionStats($session->id);

    return [
        'success' => true,
        'session_id' => $session->id,
        'is_active' => (bool)$session->is_active,
        'current_state' => $currentState,
        'time_since_last_activity' => $timeSinceLastActivity,
        'total_duration' => $session->total_duration,
        'session_stats' => $sessionStats
    ];
}

/**
 * Generate timeline visualization data
 */
function generateTimelineData($intensityData, $recoveryPeriods) {
    $timeline = [];

    foreach ($intensityData as $minute) {
        $timeline[] = [
            'timestamp' => $minute['minute'],
            'type' => 'activity',
            'intensity' => calculateIntensityScore($minute),
            'events' => $minute['total_events']
        ];
    }

    foreach ($recoveryPeriods as $period) {
        $timeline[] = [
            'timestamp' => $period['started_at'],
            'type' => 'recovery',
            'recovery_type' => $period['recovery_type'],
            'duration' => $period['duration'],
            'is_beneficial' => $period['is_beneficial']
        ];
    }

    // Sort by timestamp
    usort($timeline, function($a, $b) {
        return strtotime($a['timestamp']) - strtotime($b['timestamp']);
    });

    return $timeline;
}

/**
 * Calculate intensity score (0-100)
 */
function calculateIntensityScore($minuteData) {
    $mouseWeight = 0.2;
    $clickWeight = 3.0;
    $keypressWeight = 2.0;
    $scrollWeight = 1.0;

    $score = ($minuteData['mouse_events'] * $mouseWeight) +
             ($minuteData['click_events'] * $clickWeight) +
             ($minuteData['keypress_events'] * $keypressWeight) +
             ($minuteData['scroll_events'] * $scrollWeight);

    // Normalize to 0-100 scale (assuming max 100 events per minute)
    $normalized = min(100, ($score / 100) * 100);

    return round($normalized, 2);
}

/**
 * Generate personalized recommendations
 */
function generateUserRecommendations($patterns, $todayStats) {
    $recommendations = [];

    // Check learning time today
    $learningTimeMinutes = ($todayStats['learning_time_today'] ?? 0) / 60;

    if ($learningTimeMinutes < 30) {
        $recommendations[] = [
            'type' => 'motivation',
            'priority' => 'high',
            'message' => '오늘은 아직 학습 시간이 부족해요.',
            'suggestion' => '목표 학습 시간을 설정하고 조금씩 늘려가 보세요.'
        ];
    } elseif ($learningTimeMinutes > 120) {
        $recommendations[] = [
            'type' => 'health',
            'priority' => 'medium',
            'message' => '오늘 많이 공부하셨네요! 적절한 휴식도 중요합니다.',
            'suggestion' => '20-30분마다 5분 정도 휴식을 취하세요.'
        ];
    }

    // Analyze recovery patterns
    foreach ($patterns as $pattern) {
        if ($pattern['recovery_type'] === 'cognitive_recovery') {
            $beneficialRate = $pattern['beneficial_count'] / max(1, $pattern['total_count']);

            if ($beneficialRate > 0.7) {
                $recommendations[] = [
                    'type' => 'success',
                    'priority' => 'low',
                    'message' => '학습 패턴이 매우 좋습니다!',
                    'suggestion' => '현재의 학습 리듬을 계속 유지하세요.'
                ];
            }
        }
    }

    if (empty($recommendations)) {
        $recommendations[] = [
            'type' => 'info',
            'priority' => 'low',
            'message' => '학습 데이터를 수집하고 있습니다.',
            'suggestion' => '더 정확한 분석을 위해 꾸준히 학습해 주세요.'
        ];
    }

    return $recommendations;
}
