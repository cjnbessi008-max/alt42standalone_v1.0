<?php
/**
 * Learning Sessions API Endpoint
 * Manages student learning sessions and progress tracking
 */

require_once __DIR__ . '/../config/database.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

try {
    switch ($method) {
        case 'POST':
            handleCreateSession($pdo);
            break;
        case 'GET':
            handleGetSession($pdo);
            break;
        case 'PUT':
            handleUpdateSession($pdo);
            break;
        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    errorResponse($e->getMessage(), 500);
}

/**
 * Create a new learning session
 */
function handleCreateSession($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id'])) {
        errorResponse('user_id is required', 400);
    }

    try {
        $sessionId = generateSessionId();

        $stmt = $pdo->prepare("
            INSERT INTO learning_sessions
            (session_id, user_id, moodle_course_id, moodle_user_id)
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([
            $sessionId,
            $input['user_id'],
            $input['moodle_course_id'] ?? null,
            $input['moodle_user_id'] ?? null
        ]);

        successResponse([
            'session_id' => $sessionId,
            'start_time' => date('Y-m-d H:i:s')
        ], 'Session created successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

/**
 * Get session information
 */
function handleGetSession($pdo) {
    $sessionId = isset($_GET['session_id']) ? $_GET['session_id'] : null;
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    if (!$sessionId && !$userId) {
        errorResponse('session_id or user_id is required', 400);
    }

    try {
        if ($sessionId) {
            $stmt = $pdo->prepare("
                SELECT * FROM learning_sessions
                WHERE session_id = ?
            ");
            $stmt->execute([$sessionId]);
            $session = $stmt->fetch();

            if (!$session) {
                errorResponse('Session not found', 404);
            }

            // Decode JSON field
            if ($session['properties_learned']) {
                $session['properties_learned'] = json_decode($session['properties_learned'], true);
            }

            successResponse($session, 'Session retrieved successfully');
        } else {
            // Get all sessions for user
            $stmt = $pdo->prepare("
                SELECT * FROM learning_sessions
                WHERE user_id = ?
                ORDER BY start_time DESC
                LIMIT 50
            ");
            $stmt->execute([$userId]);
            $sessions = $stmt->fetchAll();

            foreach ($sessions as &$session) {
                if ($session['properties_learned']) {
                    $session['properties_learned'] = json_decode($session['properties_learned'], true);
                }
            }

            successResponse($sessions, 'Sessions retrieved successfully');
        }
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

/**
 * Update session (end session, update progress)
 */
function handleUpdateSession($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['session_id'])) {
        errorResponse('session_id is required', 400);
    }

    try {
        $updates = [];
        $params = [];

        if (isset($input['end_session']) && $input['end_session']) {
            $updates[] = "end_time = NOW()";
        }

        if (isset($input['completion_percentage'])) {
            $updates[] = "completion_percentage = ?";
            $params[] = floatval($input['completion_percentage']);
        }

        if (isset($input['properties_learned'])) {
            $updates[] = "properties_learned = ?";
            $params[] = json_encode($input['properties_learned']);
        }

        if (empty($updates)) {
            errorResponse('No valid fields to update', 400);
        }

        $params[] = $input['session_id'];

        $sql = "UPDATE learning_sessions SET " . implode(', ', $updates) . " WHERE session_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        successResponse(null, 'Session updated successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
    return 'session_' . uniqid() . '_' . bin2hex(random_bytes(8));
}
