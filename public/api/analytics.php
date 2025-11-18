<?php
/**
 * Analytics API
 * Provides session analytics and statistics
 */

header('Content-Type: application/json');
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = auth()->requireAuth();

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $action = $_GET['action'] ?? 'session_summary';

    switch ($action) {
        case 'session_summary':
            getSessionSummary($user);
            break;

        case 'focus_timeline':
            getFocusTimeline($user);
            break;

        case 'user_statistics':
            getUserStatistics($user);
            break;

        case 'difficulty_analysis':
            getDifficultyAnalysis($user);
            break;

        case 'class_overview':
            getClassOverview($user);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get comprehensive session summary
 */
function getSessionSummary($user) {
    $sessionId = $_GET['session_id'] ?? null;

    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id is required']);
        return;
    }

    // Verify access
    $session = db()->fetchOne(
        "SELECT * FROM learning_sessions WHERE id = ?",
        [$sessionId]
    );

    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Session not found']);
        return;
    }

    if ($session['user_id'] != $user['user_id'] && !in_array($user['role'], ['teacher', 'admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        return;
    }

    // Get session scores
    $scores = db()->fetchOne(
        "SELECT * FROM session_scores WHERE session_id = ?",
        [$sessionId]
    );

    // Get problem attempts
    $attempts = db()->fetchAll(
        "SELECT pa.*, p.title, p.difficulty_level, p.problem_type
         FROM problem_attempts pa
         JOIN problems p ON pa.problem_id = p.id
         WHERE pa.session_id = ?
         ORDER BY pa.started_at ASC",
        [$sessionId]
    );

    // Get focus metrics summary
    $focusMetrics = db()->fetchAll(
        "SELECT metric_type, AVG(metric_value) as avg_value, MIN(metric_value) as min_value,
                MAX(metric_value) as max_value
         FROM focus_metrics
         WHERE session_id = ?
         GROUP BY metric_type",
        [$sessionId]
    );

    $metricsMap = [];
    foreach ($focusMetrics as $metric) {
        $metricsMap[$metric['metric_type']] = [
            'avg' => round($metric['avg_value'], 2),
            'min' => round($metric['min_value'], 2),
            'max' => round($metric['max_value'], 2)
        ];
    }

    echo json_encode([
        'session' => $session,
        'scores' => $scores,
        'attempts' => $attempts,
        'focus_metrics' => $metricsMap,
        'summary' => [
            'duration_minutes' => round($session['duration_seconds'] / 60, 1),
            'problems_attempted' => $session['problems_attempted'],
            'accuracy_rate' => $scores['accuracy_rate'] ?? 0,
            'final_score' => $scores['final_score'] ?? 0
        ]
    ]);
}

/**
 * Get focus timeline data for visualization
 */
function getFocusTimeline($user) {
    $sessionId = $_GET['session_id'] ?? null;
    $attemptId = $_GET['attempt_id'] ?? null;

    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id is required']);
        return;
    }

    // Verify access
    $session = db()->fetchOne(
        "SELECT user_id FROM learning_sessions WHERE id = ?",
        [$sessionId]
    );

    if (!$session || ($session['user_id'] != $user['user_id'] && !in_array($user['role'], ['teacher', 'admin']))) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        return;
    }

    // Get attention scores over time
    $sql = "SELECT
                DATE_FORMAT(window_start, '%Y-%m-%d %H:%i:%s') as time,
                metric_value as score
            FROM focus_metrics
            WHERE session_id = ? AND metric_type = 'attention_score'";
    $params = [$sessionId];

    if ($attemptId) {
        $sql .= " AND attempt_id = ?";
        $params[] = $attemptId;
    }

    $sql .= " ORDER BY window_start ASC";

    $timeline = db()->fetchAll($sql, $params);

    echo json_encode([
        'timeline' => $timeline,
        'count' => count($timeline)
    ]);
}

/**
 * Get user statistics
 */
function getUserStatistics($user) {
    $userId = $_GET['user_id'] ?? $user['user_id'];

    // Verify access
    if ($userId != $user['user_id'] && !in_array($user['role'], ['teacher', 'admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        return;
    }

    // Use the view we created
    $stats = db()->fetchOne(
        "SELECT * FROM user_statistics WHERE user_id = ?",
        [$userId]
    );

    if (!$stats) {
        echo json_encode([
            'user_id' => $userId,
            'total_sessions' => 0,
            'total_problems_attempted' => 0,
            'total_problems_correct' => 0,
            'average_final_score' => 0,
            'average_focus_score' => 0,
            'average_stability_score' => 0,
            'total_learning_time_seconds' => 0
        ]);
        return;
    }

    // Get recent sessions
    $recentSessions = db()->fetchAll(
        "SELECT ls.id, ls.started_at, ls.duration_seconds,
                ss.final_score, ss.focus_score, ss.accuracy_rate
         FROM learning_sessions ls
         LEFT JOIN session_scores ss ON ls.id = ss.session_id
         WHERE ls.user_id = ? AND ls.session_status = 'completed'
         ORDER BY ls.started_at DESC
         LIMIT 10",
        [$userId]
    );

    // Get difficulty breakdown
    $difficultyStats = db()->fetchAll(
        "SELECT p.difficulty_level,
                COUNT(pa.id) as attempts,
                SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) as correct,
                AVG(pa.score) as avg_score
         FROM problem_attempts pa
         JOIN problems p ON pa.problem_id = p.id
         WHERE pa.user_id = ?
         GROUP BY p.difficulty_level
         ORDER BY p.difficulty_level",
        [$userId]
    );

    echo json_encode([
        'statistics' => $stats,
        'recent_sessions' => $recentSessions,
        'difficulty_breakdown' => $difficultyStats
    ]);
}

/**
 * Get difficulty-specific analysis
 */
function getDifficultyAnalysis($user) {
    $userId = $_GET['user_id'] ?? $user['user_id'];

    // Verify access
    if ($userId != $user['user_id'] && !in_array($user['role'], ['teacher', 'admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        return;
    }

    // Get performance by difficulty level
    $analysis = db()->fetchAll(
        "SELECT
            p.difficulty_level,
            COUNT(DISTINCT pa.session_id) as sessions_with_this_difficulty,
            COUNT(pa.id) as total_attempts,
            SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
            AVG(pa.score) as avg_score,
            AVG(pa.time_spent_seconds) as avg_time_seconds,
            AVG(fm.metric_value) as avg_focus_score
        FROM problem_attempts pa
        JOIN problems p ON pa.problem_id = p.id
        LEFT JOIN focus_metrics fm ON pa.id = fm.attempt_id AND fm.metric_type = 'attention_score'
        WHERE pa.user_id = ?
        GROUP BY p.difficulty_level
        ORDER BY p.difficulty_level",
        [$userId]
    );

    foreach ($analysis as &$item) {
        $item['accuracy_rate'] = $item['total_attempts'] > 0
            ? round(($item['correct_attempts'] / $item['total_attempts']) * 100, 2)
            : 0;
        $item['avg_score'] = round($item['avg_score'], 2);
        $item['avg_focus_score'] = round($item['avg_focus_score'], 2);
        $item['avg_time_minutes'] = round($item['avg_time_seconds'] / 60, 2);
    }

    echo json_encode([
        'difficulty_analysis' => $analysis
    ]);
}

/**
 * Get class overview (teachers only)
 */
function getClassOverview($user) {
    // Require teacher or admin role
    if (!in_array($user['role'], ['teacher', 'admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden - Teachers/Admins only']);
        return;
    }

    // Get all students
    $students = db()->fetchAll(
        "SELECT * FROM user_statistics WHERE role = 'student' ORDER BY username"
    );

    // Get recent activity
    $recentActivity = db()->fetchAll(
        "SELECT u.username, u.full_name, ls.started_at, ls.duration_seconds,
                ss.final_score, ss.focus_score
         FROM learning_sessions ls
         JOIN users u ON ls.user_id = u.id
         LEFT JOIN session_scores ss ON ls.id = ss.session_id
         WHERE ls.session_status = 'completed'
         ORDER BY ls.started_at DESC
         LIMIT 50"
    );

    // Get overall class statistics
    $classStats = db()->fetchOne(
        "SELECT
            COUNT(DISTINCT u.id) as total_students,
            COUNT(DISTINCT ls.id) as total_sessions,
            SUM(ls.problems_attempted) as total_problems,
            AVG(ss.final_score) as avg_final_score,
            AVG(ss.focus_score) as avg_focus_score,
            AVG(ss.accuracy_rate) as avg_accuracy_rate
         FROM users u
         LEFT JOIN learning_sessions ls ON u.id = ls.user_id AND ls.session_status = 'completed'
         LEFT JOIN session_scores ss ON ls.id = ss.session_id
         WHERE u.role = 'student'"
    );

    echo json_encode([
        'students' => $students,
        'recent_activity' => $recentActivity,
        'class_statistics' => $classStats
    ]);
}
