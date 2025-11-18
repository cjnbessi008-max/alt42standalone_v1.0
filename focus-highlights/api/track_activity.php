<?php
/**
 * Activity Tracking API
 * Records user activities and manages focus sessions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/focus_tracker.php';

session_start();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST method allowed");
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception("Invalid JSON input");
    }

    $action = $input['action'] ?? null;
    $userId = $input['user_id'] ?? null;
    $courseId = $input['course_id'] ?? null;

    if (!$action || !$userId || !$courseId) {
        throw new Exception("Missing required parameters: action, user_id, course_id");
    }

    $tracker = new FocusTracker();

    switch ($action) {
        case 'start_session':
            $activityId = $input['activity_id'] ?? null;
            $sessionId = $tracker->createSession($userId, $courseId, $activityId);

            // Store session ID in session
            $_SESSION['current_session_id'] = $sessionId;

            echo json_encode([
                'success' => true,
                'session_id' => $sessionId,
                'message' => 'Session started'
            ]);
            break;

        case 'log_activity':
            $sessionId = $input['session_id'] ?? $_SESSION['current_session_id'] ?? null;

            if (!$sessionId) {
                throw new Exception("No active session");
            }

            $activityType = $input['activity_type'] ?? null;
            $activityData = $input['activity_data'] ?? [];

            if (!$activityType) {
                throw new Exception("Missing activity_type");
            }

            $logId = $tracker->logActivity($sessionId, $userId, $activityType, $activityData);

            echo json_encode([
                'success' => true,
                'log_id' => $logId,
                'message' => 'Activity logged'
            ]);
            break;

        case 'end_session':
            $sessionId = $input['session_id'] ?? $_SESSION['current_session_id'] ?? null;

            if (!$sessionId) {
                throw new Exception("No active session");
            }

            $result = $tracker->endSession($sessionId);

            // Clear session
            unset($_SESSION['current_session_id']);

            echo json_encode([
                'success' => true,
                'result' => $result,
                'message' => 'Session ended'
            ]);
            break;

        default:
            throw new Exception("Invalid action: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
