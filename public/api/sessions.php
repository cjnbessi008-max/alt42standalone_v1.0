<?php
/**
 * Learning Sessions API
 * Handles session creation, updates, and retrieval
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
            createSession($user);
            break;

        case 'PUT':
            updateSession($user);
            break;

        case 'GET':
            getSessions($user);
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
 * Create new learning session
 */
function createSession($user) {
    $input = json_decode(file_get_contents('php://input'), true);

    $targetDifficulty = $input['target_difficulty'] ?? 1;
    if ($targetDifficulty < 1 || $targetDifficulty > 5) {
        http_response_code(400);
        echo json_encode(['error' => 'Difficulty must be between 1 and 5']);
        return;
    }

    $sessionUuid = generateUUID();
    $deviceInfo = [
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
        'screen_width' => $input['device_info']['screen_width'] ?? null,
        'screen_height' => $input['device_info']['screen_height'] ?? null,
    ];

    $sessionId = db()->insert('learning_sessions', [
        'user_id' => $user['user_id'],
        'session_uuid' => $sessionUuid,
        'target_difficulty' => $targetDifficulty,
        'device_info' => json_encode($deviceInfo)
    ]);

    // Log session start
    db()->insert('system_logs', [
        'log_level' => 'INFO',
        'user_id' => $user['user_id'],
        'session_id' => $sessionId,
        'action' => 'session_start',
        'message' => 'Learning session started',
        'context' => json_encode(['difficulty' => $targetDifficulty]),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'session_id' => $sessionId,
        'session_uuid' => $sessionUuid,
        'started_at' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Update session (usually to end it)
 */
function updateSession($user) {
    $input = json_decode(file_get_contents('php://input'), true);

    $sessionId = $input['session_id'] ?? null;
    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'session_id is required']);
        return;
    }

    // Verify session belongs to user
    $session = db()->fetchOne(
        "SELECT id, user_id, started_at FROM learning_sessions WHERE id = ?",
        [$sessionId]
    );

    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Session not found']);
        return;
    }

    if ($session['user_id'] != $user['user_id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        return;
    }

    // Calculate duration
    $startTime = strtotime($session['started_at']);
    $endTime = time();
    $duration = $endTime - $startTime;

    // Update session
    db()->update('learning_sessions', [
        'ended_at' => date('Y-m-d H:i:s', $endTime),
        'duration_seconds' => $duration,
        'session_status' => $input['status'] ?? 'completed'
    ], 'id = ?', [$sessionId]);

    // Calculate session scores
    db()->query("CALL calculate_session_score(?)", [$sessionId]);

    // Get final scores
    $scores = db()->fetchOne(
        "SELECT * FROM session_scores WHERE session_id = ?",
        [$sessionId]
    );

    // Log session end
    db()->insert('system_logs', [
        'log_level' => 'INFO',
        'user_id' => $user['user_id'],
        'session_id' => $sessionId,
        'action' => 'session_end',
        'message' => 'Learning session ended',
        'context' => json_encode([
            'duration' => $duration,
            'final_score' => $scores['final_score'] ?? 0
        ]),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null
    ]);

    echo json_encode([
        'success' => true,
        'session_id' => $sessionId,
        'duration_seconds' => $duration,
        'scores' => $scores
    ]);
}

/**
 * Get user's sessions
 */
function getSessions($user) {
    $userId = $_GET['user_id'] ?? $user['user_id'];

    // Only allow users to see their own sessions unless they're a teacher/admin
    if ($userId != $user['user_id'] && !in_array($user['role'], ['teacher', 'admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        return;
    }

    $limit = min($_GET['limit'] ?? 20, 100);
    $offset = $_GET['offset'] ?? 0;
    $sessionId = $_GET['session_id'] ?? null;

    if ($sessionId) {
        // Get specific session with scores
        $sql = "SELECT ls.*, ss.*
                FROM learning_sessions ls
                LEFT JOIN session_scores ss ON ls.id = ss.session_id
                WHERE ls.id = ? AND ls.user_id = ?";

        $session = db()->fetchOne($sql, [$sessionId, $userId]);

        if (!$session) {
            http_response_code(404);
            echo json_encode(['error' => 'Session not found']);
            return;
        }

        echo json_encode(['session' => $session]);
    } else {
        // Get list of sessions
        $sql = "SELECT ls.*, ss.final_score, ss.focus_score, ss.accuracy_rate
                FROM learning_sessions ls
                LEFT JOIN session_scores ss ON ls.id = ss.session_id
                WHERE ls.user_id = ?
                ORDER BY ls.started_at DESC
                LIMIT ? OFFSET ?";

        $sessions = db()->fetchAll($sql, [$userId, $limit, $offset]);

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM learning_sessions WHERE user_id = ?";
        $count = db()->fetchOne($countSql, [$userId]);

        echo json_encode([
            'sessions' => $sessions,
            'total' => $count['total'],
            'limit' => $limit,
            'offset' => $offset
        ]);
    }
}

/**
 * Generate UUID v4
 */
function generateUUID() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
