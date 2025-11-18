<?php
/**
 * Session Management API
 */

require_once __DIR__ . '/../../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use StressReset\SessionManager;
use StressReset\StressDetector;

try {
    $sessionManager = new SessionManager();
    $stressDetector = new StressDetector();

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($method) {
        case 'POST':
            // Start new session
            if (!isset($input['moodle_user_id'])) {
                throw new Exception('moodle_user_id is required');
            }

            $result = $sessionManager->startSession(
                $input['moodle_user_id'],
                $input['moodle_course_id'] ?? null
            );

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $result,
            ]);
            break;

        case 'GET':
            // Get active session or session stats
            if (isset($_GET['moodle_user_id'])) {
                $session = $sessionManager->getActiveSession($_GET['moodle_user_id']);

                if (!$session) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'No active session found',
                    ]);
                    exit;
                }

                // Get detailed stats
                $stats = $sessionManager->getSessionStats($session['id']);

                echo json_encode([
                    'success' => true,
                    'data' => array_merge($session, ['stats' => $stats]),
                ]);
            } elseif (isset($_GET['session_id'])) {
                $stats = $sessionManager->getSessionStats($_GET['session_id']);

                if (!$stats) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Session not found',
                    ]);
                    exit;
                }

                echo json_encode([
                    'success' => true,
                    'data' => $stats,
                ]);
            } else {
                throw new Exception('moodle_user_id or session_id required');
            }
            break;

        case 'PUT':
            // Update session (heartbeat)
            if (!isset($input['session_id'])) {
                throw new Exception('session_id is required');
            }

            $sessionManager->updateHeartbeat($input['session_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Session updated',
            ]);
            break;

        case 'DELETE':
            // End session
            if (!isset($_GET['session_id'])) {
                throw new Exception('session_id is required');
            }

            $sessionManager->endSession($_GET['session_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Session ended',
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Method not allowed',
            ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
