<?php
/**
 * Dashboard Data API
 * Provides comprehensive data for dashboards
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/focus_tracker.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Only GET method allowed");
    }

    $userId = $_GET['user_id'] ?? null;
    $daysBack = (int)($_GET['days'] ?? 30);

    if (!$userId) {
        throw new Exception("user_id is required");
    }

    $db = Database::getInstance();
    $tracker = new FocusTracker();

    // Get user info
    $user = $db->fetchOne(
        "SELECT * FROM fh_users WHERE id = :id",
        ['id' => $userId]
    );

    if (!$user) {
        throw new Exception("User not found");
    }

    // Get statistics
    $stats = $tracker->getUserStats($userId, $daysBack);

    // Get recent highlights
    $highlights = $tracker->getUserHighlights($userId, 10, 0);

    // Get daily focus scores for chart
    $startDate = date('Y-m-d', strtotime("-$daysBack days"));
    $dailyScores = $db->fetchAll(
        "SELECT
            DATE(session_start) as date,
            AVG(focus_score) as avg_score,
            COUNT(*) as session_count,
            SUM(duration_seconds) as total_duration
        FROM fh_focus_sessions
        WHERE user_id = :user_id AND DATE(session_start) >= :start_date
        GROUP BY DATE(session_start)
        ORDER BY date ASC",
        ['user_id' => $userId, 'start_date' => $startDate]
    );

    // Get course breakdown
    $courseBreakdown = $db->fetchAll(
        "SELECT
            c.course_name,
            c.course_shortname,
            COUNT(*) as session_count,
            AVG(s.focus_score) as avg_focus_score,
            SUM(s.duration_seconds) as total_duration,
            SUM(CASE WHEN s.is_highlight = 1 THEN 1 ELSE 0 END) as highlight_count
        FROM fh_focus_sessions s
        LEFT JOIN fh_courses c ON s.moodle_course_id = c.moodle_course_id
        WHERE s.user_id = :user_id AND s.session_start >= :start_date
        GROUP BY s.moodle_course_id, c.course_name, c.course_shortname
        ORDER BY total_duration DESC",
        ['user_id' => $userId, 'start_date' => $startDate]
    );

    // Get recent sessions (all, not just highlights)
    $recentSessions = $db->fetchAll(
        "SELECT s.*, c.course_name, c.course_shortname
        FROM fh_focus_sessions s
        LEFT JOIN fh_courses c ON s.moodle_course_id = c.moodle_course_id
        WHERE s.user_id = :user_id
        ORDER BY s.session_start DESC
        LIMIT 20",
        ['user_id' => $userId]
    );

    echo json_encode([
        'success' => true,
        'user' => $user,
        'stats' => $stats,
        'highlights' => $highlights,
        'daily_scores' => $dailyScores,
        'course_breakdown' => $courseBreakdown,
        'recent_sessions' => $recentSessions
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
