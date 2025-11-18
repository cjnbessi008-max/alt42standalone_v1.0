<?php
/**
 * Focus Events API
 * Handles focus tracking event recording and retrieval
 */

header('Content-Type: application/json');
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = auth()->requireAuth();

try {
    switch ($method) {
        case 'POST':
            recordEvents($user);
            break;

        case 'GET':
            getEvents($user);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Record focus tracking events (batch)
 */
function recordEvents($user) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['session_id']) || !isset($input['events'])) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id and events are required']);
        return;
    }

    $sessionId = $input['session_id'];
    $events = $input['events'];

    // Verify session belongs to user
    $session = db()->fetchOne(
        "SELECT id, user_id FROM learning_sessions WHERE id = ?",
        [$sessionId]
    );

    if (!$session || $session['user_id'] != $user['user_id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid session']);
        return;
    }

    // Insert events in batch
    $insertedCount = 0;
    $db = db()->getConnection();

    try {
        $db->beginTransaction();

        $sql = "INSERT INTO focus_events (session_id, attempt_id, event_type, event_timestamp, event_data)
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $db->prepare($sql);

        foreach ($events as $event) {
            $eventTimestamp = isset($event['timestamp'])
                ? date('Y-m-d H:i:s', $event['timestamp'] / 1000)
                : date('Y-m-d H:i:s');

            $stmt->execute([
                $sessionId,
                $event['attempt_id'] ?? null,
                $event['type'],
                $eventTimestamp,
                json_encode($event['data'] ?? [])
            ]);

            $insertedCount++;
        }

        $db->commit();

        // Calculate focus metrics asynchronously (or in background)
        calculateFocusMetrics($sessionId, $input['attempt_id'] ?? null);

        echo json_encode([
            'success' => true,
            'inserted_count' => $insertedCount
        ]);

    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * Get focus events for a session
 */
function getEvents($user) {
    $sessionId = $_GET['session_id'] ?? null;
    $attemptId = $_GET['attempt_id'] ?? null;

    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id is required']);
        return;
    }

    // Verify session belongs to user or user is teacher/admin
    $session = db()->fetchOne(
        "SELECT id, user_id FROM learning_sessions WHERE id = ?",
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

    $sql = "SELECT event_type, event_timestamp, event_data
            FROM focus_events
            WHERE session_id = ?";
    $params = [$sessionId];

    if ($attemptId) {
        $sql .= " AND attempt_id = ?";
        $params[] = $attemptId;
    }

    $sql .= " ORDER BY event_timestamp ASC";

    $events = db()->fetchAll($sql, $params);

    foreach ($events as &$event) {
        $event['event_data'] = json_decode($event['event_data'], true);
    }

    echo json_encode([
        'events' => $events,
        'count' => count($events)
    ]);
}

/**
 * Calculate focus metrics from events
 */
function calculateFocusMetrics($sessionId, $attemptId = null) {
    $config = require __DIR__ . '/config.php';
    $idleThreshold = $config['focus']['idle_threshold_seconds'];

    // Get all events for this session/attempt
    $sql = "SELECT event_type, UNIX_TIMESTAMP(event_timestamp) as timestamp, event_data
            FROM focus_events
            WHERE session_id = ?";
    $params = [$sessionId];

    if ($attemptId) {
        $sql .= " AND attempt_id = ?";
        $params[] = $attemptId;
    }

    $sql .= " ORDER BY event_timestamp ASC";

    $events = db()->fetchAll($sql, $params);

    if (empty($events)) {
        return;
    }

    // Calculate metrics
    $metrics = analyzeEvents($events, $idleThreshold);

    // Get time window
    $windowStart = date('Y-m-d H:i:s', $events[0]['timestamp']);
    $windowEnd = date('Y-m-d H:i:s', $events[count($events) - 1]['timestamp']);

    // Get difficulty level
    $difficulty = null;
    if ($attemptId) {
        $attempt = db()->fetchOne(
            "SELECT p.difficulty_level
             FROM problem_attempts pa
             JOIN problems p ON pa.problem_id = p.id
             WHERE pa.id = ?",
            [$attemptId]
        );
        $difficulty = $attempt['difficulty_level'] ?? null;
    }

    // Insert/update metrics
    $metricTypes = [
        'attention_score' => $metrics['attention_score'],
        'stability_index' => $metrics['stability_index'],
        'activity_ratio' => $metrics['activity_ratio'],
        'idle_time' => $metrics['total_idle_time'],
        'interaction_count' => $metrics['interaction_count'],
        'focus_duration' => $metrics['total_focus_time']
    ];

    foreach ($metricTypes as $type => $value) {
        db()->insert('focus_metrics', [
            'session_id' => $sessionId,
            'attempt_id' => $attemptId,
            'metric_type' => $type,
            'metric_value' => $value,
            'window_start' => $windowStart,
            'window_end' => $windowEnd,
            'difficulty_level' => $difficulty
        ]);
    }
}

/**
 * Analyze events and calculate metrics
 */
function analyzeEvents($events, $idleThreshold) {
    $totalTime = 0;
    $focusTime = 0;
    $idleTime = 0;
    $interactionCount = 0;
    $focusPeriods = [];
    $currentFocusStart = null;
    $isFocused = true;
    $lastEventTime = null;

    foreach ($events as $event) {
        $timestamp = $event['timestamp'];

        if ($lastEventTime !== null) {
            $gap = $timestamp - $lastEventTime;

            // If gap is too large, mark as idle
            if ($gap > $idleThreshold) {
                $idleTime += $gap;
                if ($currentFocusStart !== null) {
                    $focusPeriods[] = $lastEventTime - $currentFocusStart;
                    $currentFocusStart = null;
                }
                $isFocused = false;
            } else {
                if (!$isFocused) {
                    $currentFocusStart = $timestamp;
                    $isFocused = true;
                }
            }
        } else {
            $currentFocusStart = $timestamp;
        }

        // Count interactions
        if (in_array($event['event_type'], ['mouse_click', 'keyboard_input', 'scroll'])) {
            $interactionCount++;
        }

        // Track focus/blur
        if ($event['event_type'] === 'page_blur') {
            $isFocused = false;
            if ($currentFocusStart !== null) {
                $focusPeriods[] = $timestamp - $currentFocusStart;
                $currentFocusStart = null;
            }
        } elseif ($event['event_type'] === 'page_focus') {
            $currentFocusStart = $timestamp;
            $isFocused = true;
        }

        $lastEventTime = $timestamp;
    }

    // Close final focus period
    if ($currentFocusStart !== null && $lastEventTime !== null) {
        $focusPeriods[] = $lastEventTime - $currentFocusStart;
    }

    $totalTime = $lastEventTime - $events[0]['timestamp'];
    $focusTime = array_sum($focusPeriods);
    $activityRatio = $totalTime > 0 ? $focusTime / $totalTime : 0;

    // Calculate attention score (0-100)
    $attentionScore = $activityRatio * 100;

    // Calculate stability index (inverse of variance in focus periods)
    $stabilityIndex = 0;
    if (count($focusPeriods) > 1) {
        $variance = calculateVariance($focusPeriods);
        $stabilityIndex = $variance > 0 ? min(100, 100 / (1 + $variance / 100)) : 100;
    } else {
        $stabilityIndex = count($focusPeriods) === 1 ? 100 : 0;
    }

    return [
        'attention_score' => round($attentionScore, 2),
        'stability_index' => round($stabilityIndex, 2),
        'activity_ratio' => round($activityRatio, 4),
        'total_focus_time' => $focusTime,
        'total_idle_time' => $idleTime,
        'interaction_count' => $interactionCount,
        'focus_periods' => $focusPeriods
    ];
}

/**
 * Calculate variance
 */
function calculateVariance($values) {
    $count = count($values);
    if ($count === 0) return 0;

    $mean = array_sum($values) / $count;
    $sumSquares = 0;

    foreach ($values as $value) {
        $sumSquares += pow($value - $mean, 2);
    }

    return $sumSquares / $count;
}
