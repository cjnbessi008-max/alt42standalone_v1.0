<?php
/**
 * Activity Tracking API
 * Receives and stores user activity events
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../models/ActivitySession.php';
require_once __DIR__ . '/../models/ActivityEvent.php';
require_once __DIR__ . '/../models/CognitiveRecovery.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

$action = $input['action'] ?? '';

try {
    switch ($action) {
        case 'start_session':
            $response = startSession($input);
            break;

        case 'end_session':
            $response = endSession($input);
            break;

        case 'track_events':
            $response = trackEvents($input);
            break;

        case 'heartbeat':
            $response = sessionHeartbeat($input);
            break;

        case 'detect_recovery':
            $response = detectRecovery($input);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action: ' . $action]);
            exit();
    }

    echo json_encode($response);

} catch (Exception $e) {
    error_log("Track API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}

/**
 * Start a new learning session
 */
function startSession($input) {
    $userId = $input['user_id'] ?? null;
    $courseId = $input['course_id'] ?? null;
    $moduleId = $input['module_id'] ?? null;

    if (!$userId) {
        http_response_code(400);
        return ['error' => 'user_id is required'];
    }

    // End any existing active sessions for this user
    $session = new ActivitySession();
    $session->endUserActiveSessions($userId);

    // Create new session
    $newSession = new ActivitySession();
    $newSession->user_id = $userId;
    $newSession->course_id = $courseId;
    $newSession->module_id = $moduleId;

    $sessionId = $newSession->create();

    if ($sessionId) {
        return [
            'success' => true,
            'session_id' => $sessionId,
            'session_token' => $newSession->session_token,
            'message' => 'Session started successfully'
        ];
    } else {
        http_response_code(500);
        return ['error' => 'Failed to create session'];
    }
}

/**
 * End a learning session
 */
function endSession($input) {
    $sessionToken = $input['session_token'] ?? null;

    if (!$sessionToken) {
        http_response_code(400);
        return ['error' => 'session_token is required'];
    }

    $session = new ActivitySession();

    if (!$session->getByToken($sessionToken)) {
        http_response_code(404);
        return ['error' => 'Session not found'];
    }

    if ($session->end()) {
        return [
            'success' => true,
            'message' => 'Session ended successfully',
            'total_duration' => $session->total_duration
        ];
    } else {
        http_response_code(500);
        return ['error' => 'Failed to end session'];
    }
}

/**
 * Track activity events
 */
function trackEvents($input) {
    $sessionToken = $input['session_token'] ?? null;
    $events = $input['events'] ?? [];

    if (!$sessionToken) {
        http_response_code(400);
        return ['error' => 'session_token is required'];
    }

    if (empty($events)) {
        http_response_code(400);
        return ['error' => 'events array is required'];
    }

    // Get session
    $session = new ActivitySession();
    if (!$session->getByToken($sessionToken)) {
        http_response_code(404);
        return ['error' => 'Session not found or inactive'];
    }

    // Prepare events for batch insert
    $preparedEvents = [];
    foreach ($events as $event) {
        $preparedEvents[] = [
            'session_id' => $session->id,
            'event_type' => $event['type'] ?? 'unknown',
            'event_timestamp' => $event['timestamp'] ?? date('Y-m-d H:i:s.u'),
            'metadata' => $event['metadata'] ?? []
        ];
    }

    // Batch insert events
    $activityEvent = new ActivityEvent();
    $success = $activityEvent->batchCreate($preparedEvents);

    if ($success) {
        return [
            'success' => true,
            'events_tracked' => count($preparedEvents),
            'message' => 'Events tracked successfully'
        ];
    } else {
        http_response_code(500);
        return ['error' => 'Failed to track events'];
    }
}

/**
 * Session heartbeat to keep session alive
 */
function sessionHeartbeat($input) {
    $sessionToken = $input['session_token'] ?? null;

    if (!$sessionToken) {
        http_response_code(400);
        return ['error' => 'session_token is required'];
    }

    $session = new ActivitySession();
    if (!$session->getByToken($sessionToken)) {
        http_response_code(404);
        return ['error' => 'Session not found or inactive'];
    }

    if ($session->updateHeartbeat()) {
        return [
            'success' => true,
            'session_id' => $session->id,
            'is_active' => true,
            'total_duration' => $session->total_duration
        ];
    } else {
        http_response_code(500);
        return ['error' => 'Failed to update heartbeat'];
    }
}

/**
 * Detect and create recovery periods
 */
function detectRecovery($input) {
    $sessionToken = $input['session_token'] ?? null;
    $minGapSeconds = $input['min_gap_seconds'] ?? 10;

    if (!$sessionToken) {
        http_response_code(400);
        return ['error' => 'session_token is required'];
    }

    $session = new ActivitySession();
    if (!$session->getByToken($sessionToken)) {
        http_response_code(404);
        return ['error' => 'Session not found'];
    }

    // Detect inactivity gaps
    $activityEvent = new ActivityEvent();
    $gaps = $activityEvent->detectInactivityGaps($session->id, $minGapSeconds);

    // Create recovery periods
    $recovery = new CognitiveRecovery();
    $created = $recovery->detectAndCreateRecoveryPeriods($session->id, $gaps);

    // Get insights
    $insights = $recovery->getRecoveryInsights($session->id);

    return [
        'success' => true,
        'gaps_detected' => count($gaps),
        'recovery_periods_created' => $created,
        'insights' => $insights
    ];
}
